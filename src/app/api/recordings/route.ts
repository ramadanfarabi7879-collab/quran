import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const halaqaId = searchParams.get("halaqaId");
    const sessionId = searchParams.get("sessionId");

    const where: any = {};
    if (halaqaId) where.halaqaId = halaqaId;
    if (sessionId) where.sessionId = sessionId;

    const recordings = await prisma.sessionRecording.findMany({
      where,
      include: {
        halaqa: true,
        session: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ recordings });
  } catch (error) {
    console.error("Get recordings error:", error);
    return NextResponse.json({ error: "فشل استرداد التسجيلات" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role === "STUDENT") {
      return NextResponse.json({ error: "غير مصرح، خاص بالمعلم فقط" }, { status: 403 });
    }

    const contentType = req.headers.get("content-type") || "";

    // Support both multipart/form-data (real file upload) and application/json
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      const sessionId = (formData.get("sessionId") as string) || "";
      const halaqaId = (formData.get("halaqaId") as string) || "";
      const title = (formData.get("title") as string) || "";
      const durationSeconds = parseInt((formData.get("durationSeconds") as string) || "0", 10);
      const recordingType = (formData.get("recordingType") as string) || "AUDIO_VIDEO";
      const retentionDays = parseInt((formData.get("retentionDays") as string) || "30", 10);

      if (!sessionId) {
        return NextResponse.json({ error: "معرف الجلسة مطلوب" }, { status: 400 });
      }

      // Resolve halaqaId if missing
      let resolvedHalaqaId = halaqaId;
      if (!resolvedHalaqaId) {
        const sess = await prisma.liveSession.findUnique({ where: { id: sessionId } });
        resolvedHalaqaId = sess?.halaqaId || "";
      }

      if (!resolvedHalaqaId) {
        const anyHalaqa = await prisma.halaqa.findFirst({ where: { status: "ACTIVE" } });
        resolvedHalaqaId = anyHalaqa?.id || "";
      }

      let videoUrl = "";
      let fileSizeBytes = 0;

      if (file && file.size > 0) {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        fileSizeBytes = buffer.length;

        const isAudio = recordingType === "AUDIO_ONLY";
        const ext = isAudio ? "webm" : "webm";
        const filename = `rec-${sessionId}-${Date.now()}.${ext}`;

        const uploadDir = path.join(process.cwd(), "public", "recordings");
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }

        const filePath = path.join(uploadDir, filename);
        fs.writeFileSync(filePath, buffer);
        videoUrl = `/recordings/${filename}`;
      } else {
        videoUrl = "/recordings/placeholder.webm";
        fileSizeBytes = 1024 * 1024;
      }

      const expiresAt = new Date(Date.now() + retentionDays * 24 * 60 * 60 * 1000);

      const recording = await prisma.sessionRecording.create({
        data: {
          sessionId,
          halaqaId: resolvedHalaqaId,
          title: title || `تسجيل ${recordingType === "AUDIO_ONLY" ? "صوتي" : "مرئي"} - ${new Date().toLocaleDateString("ar-SA")}`,
          videoUrl,
          recordingType: recordingType === "AUDIO_ONLY" ? "AUDIO_ONLY" : "AUDIO_VIDEO",
          durationSeconds: durationSeconds || 1,
          fileSizeBytes: fileSizeBytes || 500000,
          retentionDays,
          expiresAt,
          allowStudentDownload: true,
        },
      });

      return NextResponse.json({ success: true, recording });
    }

    // Fallback: JSON body
    const body = await req.json();
    const {
      sessionId,
      halaqaId,
      title,
      videoUrl,
      durationSeconds,
      fileSizeBytes,
      retentionDays,
      recordingType,
      allowStudentDownload,
    } = body;

    if (!sessionId) {
      return NextResponse.json({ error: "معرف الجلسة مطلوب" }, { status: 400 });
    }

    let resolvedHalaqaId = halaqaId;
    if (!resolvedHalaqaId) {
      const sess = await prisma.liveSession.findUnique({ where: { id: sessionId } });
      resolvedHalaqaId = sess?.halaqaId || "";
    }

    const days = Number(retentionDays) || 30;
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    const recording = await prisma.sessionRecording.create({
      data: {
        sessionId,
        halaqaId: resolvedHalaqaId,
        title: title || `تسجيل الحلقة - ${new Date().toLocaleDateString("ar-SA")}`,
        videoUrl: videoUrl || "/recordings/default.webm",
        recordingType: recordingType === "AUDIO_ONLY" ? "AUDIO_ONLY" : "AUDIO_VIDEO",
        durationSeconds: Number(durationSeconds) || 60,
        fileSizeBytes: Number(fileSizeBytes) || 1500000,
        retentionDays: days,
        expiresAt,
        allowStudentDownload: allowStudentDownload ?? true,
      },
    });

    return NextResponse.json({ success: true, recording });
  } catch (error) {
    console.error("Save recording error:", error);
    return NextResponse.json({ error: "فشل حفظ التسجيل" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role === "STUDENT") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "معرف التسجيل مطلوب" }, { status: 400 });
    }

    const rec = await prisma.sessionRecording.findUnique({ where: { id } });
    if (rec) {
      if (rec.videoUrl && rec.videoUrl.startsWith("/recordings/")) {
        const filename = path.basename(rec.videoUrl);
        const filePath = path.join(process.cwd(), "public", "recordings", filename);
        if (fs.existsSync(filePath)) {
          try { fs.unlinkSync(filePath); } catch {}
        }
      }
      await prisma.sessionRecording.delete({ where: { id } });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete recording error:", error);
    return NextResponse.json({ error: "فشل حذف التسجيل" }, { status: 500 });
  }
}
