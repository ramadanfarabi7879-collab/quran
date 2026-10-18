import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { realtimeHub } from "@/lib/realtime";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "يجب تسجيل الدخول أولاً" }, { status: 401 });
    }

    const { halaqaId, notes } = await req.json();

    let studentProfileId = user.studentProfile?.id;
    if (!studentProfileId) {
      // Create student profile if not exists
      const newProfile = await prisma.studentProfile.create({
        data: {
          userId: user.id,
          studentNumber: `STU-${Math.floor(1000 + Math.random() * 9000)}`,
        },
      });
      studentProfileId = newProfile.id;
    }

    // Check existing
    const existing = await prisma.joinRequest.findFirst({
      where: {
        halaqaId,
        studentId: studentProfileId,
        status: "PENDING",
      },
    });

    if (existing) {
      return NextResponse.json({ error: "لديك طلب انضمام قيد المراجعة لهذه الحلقة مسبقاً" }, { status: 400 });
    }

    const request = await prisma.joinRequest.create({
      data: {
        halaqaId,
        studentId: studentProfileId,
        status: "PENDING",
        notes,
      },
      include: {
        halaqa: { include: { teacher: { include: { user: true } } } },
      },
    });

    // Notify teacher
    await prisma.notification.create({
      data: {
        userId: request.halaqa.teacher.user.id,
        title: "طلب انضمام جديد لحلقة تحفيظ",
        body: `قدم الطالب ${user.name} طلباً للانضمام إلى: ${request.halaqa.name}.`,
        type: "JOIN_REQUEST",
        link: "/teacher/students?tab=requests",
      },
    });

    // Publish realtime event
    realtimeHub.broadcast("global", {
      type: "JOIN_REQUEST_SUBMITTED",
      payload: {
        requestId: request.id,
        halaqaId,
        halaqaName: request.halaqa.name,
        studentName: user.name,
      },
    });

    return NextResponse.json({ success: true, request });
  } catch (error) {
    console.error("Join request error:", error);
    return NextResponse.json({ error: "فشل إرسال طلب الانضمام" }, { status: 500 });
  }
}
