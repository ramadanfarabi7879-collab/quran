import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const halaqaId = searchParams.get("halaqaId");

    const where: any = {};
    if (halaqaId) where.halaqaId = halaqaId;

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
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }

    const body = await req.json();
    const { sessionId, halaqaId, title, videoUrl, durationSeconds, fileSizeBytes, retentionDays, allowStudentDownload } = body;

    const days = Number(retentionDays) || 30;
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    const recording = await prisma.sessionRecording.create({
      data: {
        sessionId,
        halaqaId,
        title: title || `تسجيل الحلقة - ${new Date().toLocaleDateString("ar-SA")}`,
        videoUrl: videoUrl || "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        durationSeconds: Number(durationSeconds) || 3600,
        fileSizeBytes: Number(fileSizeBytes) || 120000000,
        retentionDays: days,
        expiresAt,
        allowStudentDownload: allowStudentDownload ?? false,
      },
    });

    return NextResponse.json({ success: true, recording });
  } catch (error) {
    console.error("Save recording error:", error);
    return NextResponse.json({ error: "فشل حفظ التسجيل" }, { status: 500 });
  }
}
