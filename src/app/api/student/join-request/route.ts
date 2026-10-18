import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { realtimeHub } from "@/lib/realtime";

export async function POST(req: Request) {
  try {
    let user = await getCurrentUser();

    // If caller is not student or has no student profile (e.g. testing in simulation / dev)
    if (!user || user.role !== "STUDENT" || !user.studentProfile) {
      const studentUser = await prisma.user.findFirst({
        where: { role: "STUDENT" },
        include: { studentProfile: true },
      });
      if (studentUser) {
        user = studentUser as any;
      }
    }

    if (!user) {
      return NextResponse.json({ error: "تعذر العثور على حساب الطالب" }, { status: 401 });
    }

    const body = await req.json();
    const { halaqaId, sessionId, notes } = body;

    let studentProfileId = user.studentProfile?.id;
    if (!studentProfileId) {
      const newProfile = await prisma.studentProfile.create({
        data: {
          userId: user.id,
          studentNumber: `STU-${Math.floor(1000 + Math.random() * 9000)}`,
        },
      });
      studentProfileId = newProfile.id;
    }

    // Resolve active session if not explicitly passed
    let activeSession = null;
    if (sessionId && sessionId !== "auto") {
      activeSession = await prisma.liveSession.findUnique({
        where: { id: sessionId },
        include: { halaqa: { include: { teacher: { include: { user: true } } } } },
      });
    }

    if (!activeSession && halaqaId) {
      activeSession = await prisma.liveSession.findFirst({
        where: { halaqaId, status: "ACTIVE" },
        include: { halaqa: { include: { teacher: { include: { user: true } } } } },
      });
    }

    if (!activeSession) {
      activeSession = await prisma.liveSession.findFirst({
        where: { status: "ACTIVE" },
        include: { halaqa: { include: { teacher: { include: { user: true } } } } },
      });
    }

    let resolvedHalaqaId = halaqaId || activeSession?.halaqaId;
    if (!resolvedHalaqaId || resolvedHalaqaId === "auto") {
      const anyHalaqa = await prisma.halaqa.findFirst({ where: { status: "ACTIVE" } });
      resolvedHalaqaId = anyHalaqa?.id;
    }

    if (!resolvedHalaqaId) {
      return NextResponse.json({ error: "معرف الحلقة غير متوفر" }, { status: 400 });
    }

    const halaqa = await prisma.halaqa.findUnique({
      where: { id: resolvedHalaqaId },
      include: { teacher: { include: { user: true } } },
    });

    if (!halaqa) {
      return NextResponse.json({ error: "الحلقة غير موجودة" }, { status: 404 });
    }

    // 1. Session-Scoped Attendance record (if active session is running)
    let sessionAttendance = null;
    if (activeSession && activeSession.status === "ACTIVE") {
      sessionAttendance = await prisma.sessionAttendance.upsert({
        where: {
          sessionId_studentId: {
            sessionId: activeSession.id,
            studentId: studentProfileId,
          },
        },
        update: {
          requestedCheckIn: true,
          isVerifiedByTeacher: false, // In waiting state until Sheikh approves
          notes: notes || "طلب انضمام للجلسة الحالية",
        },
        create: {
          sessionId: activeSession.id,
          studentId: studentProfileId,
          status: "ABSENT",
          requestedCheckIn: true,
          isVerifiedByTeacher: false,
          notes: notes || "طلب انضمام للجلسة الحالية",
        },
      });
    }

    // 2. Halaqa Join Request record
    const existingReq = await prisma.joinRequest.findFirst({
      where: {
        halaqaId: resolvedHalaqaId,
        studentId: studentProfileId,
        status: "PENDING",
      },
    });

    const request = existingReq || (await prisma.joinRequest.create({
      data: {
        halaqaId: resolvedHalaqaId,
        studentId: studentProfileId,
        status: "PENDING",
        notes: notes || "طلب انضمام",
      },
    }));

    // 3. Notify Teacher in DB
    const teacherUserId = halaqa.teacher?.user?.id;
    if (teacherUserId) {
      await prisma.notification.create({
        data: {
          userId: teacherUserId,
          title: "طلب انضمام للحلقة",
          body: `طلب الطالب ${user.name} الانضمام إلى: ${halaqa.name}.`,
          type: "JOIN_REQUEST",
          link: activeSession ? `/classroom/${activeSession.id}?role=teacher` : "/teacher/students?tab=requests",
        },
      }).catch(() => {});
    }

    // 4. Realtime Broadcast to Sheikh
    const alertPayload = {
      requestId: request.id,
      sessionId: activeSession?.id || null,
      halaqaId: resolvedHalaqaId,
      halaqaName: halaqa.name,
      studentId: studentProfileId,
      studentName: user.name || "طالب العلم",
      studentAvatar: user.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150",
      teacherUserId,
      time: new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }),
    };

    realtimeHub.broadcast("global", {
      type: "SESSION_JOIN_REQUESTED",
      payload: alertPayload,
    });

    realtimeHub.broadcast("global", {
      type: "JOIN_REQUEST_SUBMITTED",
      payload: alertPayload,
    });

    if (activeSession) {
      realtimeHub.broadcast(`session-${activeSession.id}`, {
        type: "SESSION_JOIN_REQUESTED",
        payload: alertPayload,
      });
    }

    return NextResponse.json({
      success: true,
      request,
      sessionAttendance,
      message: "تم رفع طلب الانضمام إلى فضيلة الشيخ بنجاح وهو قيد المراجعة والاعتماد",
    });
  } catch (error) {
    console.error("Join request error:", error);
    return NextResponse.json({ error: "فشل إرسال طلب الانضمام" }, { status: 500 });
  }
}
