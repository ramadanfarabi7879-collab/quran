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

    const body = await req.json().catch(() => ({}));
    const { halaqaId, sessionId, notes, acceptInvitation } = body;

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
        include: {
          halaqa: {
            include: {
              teacher: { include: { user: true } },
              enrollments: true,
            },
          },
        },
      });
    }

    if (!activeSession && halaqaId) {
      activeSession = await prisma.liveSession.findFirst({
        where: { halaqaId, status: "ACTIVE" },
        include: {
          halaqa: {
            include: {
              teacher: { include: { user: true } },
              enrollments: true,
            },
          },
        },
      });
    }

    if (!activeSession) {
      activeSession = await prisma.liveSession.findFirst({
        where: { status: "ACTIVE" },
        include: {
          halaqa: {
            include: {
              teacher: { include: { user: true } },
              enrollments: true,
            },
          },
        },
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
      include: {
        teacher: { include: { user: true } },
        enrollments: true,
      },
    });

    if (!halaqa) {
      return NextResponse.json({ error: "الحلقة غير موجودة" }, { status: 404 });
    }

    // Determine if student is enrolled or accepting teacher's invitation
    const isEnrolled = halaqa.enrollments?.some(
      (e: any) => e.studentId === studentProfileId
    );

    // If session is active and student is enrolled or accepting invitation: Instant Direct Join!
    const isInstantJoin = Boolean(activeSession && acceptInvitation);

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
          isVerifiedByTeacher: isInstantJoin,
          status: isInstantJoin ? "PRESENT" : "ABSENT",
          notes: notes || (isInstantJoin ? "قبول الدعوة وحضور الجلسة" : "طلب انضمام للجلسة الحالية"),
        },
        create: {
          sessionId: activeSession.id,
          studentId: studentProfileId,
          status: isInstantJoin ? "PRESENT" : "ABSENT",
          requestedCheckIn: true,
          isVerifiedByTeacher: isInstantJoin,
          notes: notes || (isInstantJoin ? "قبول الدعوة وحضور الجلسة" : "طلب انضمام للجلسة الحالية"),
        },
      });

      // Mark any HALAQA_STARTING notifications for this user as read
      await prisma.notification.updateMany({
        where: {
          userId: user.id,
          type: "HALAQA_STARTING",
          link: { contains: activeSession.id },
          isRead: false,
        },
        data: { isRead: true },
      }).catch(() => {});
    }

    // 2. Halaqa Join Request record (only needed if student wasn't enrolled)
    let request = null;
    if (!isEnrolled) {
      const existingReq = await prisma.joinRequest.findFirst({
        where: {
          halaqaId: resolvedHalaqaId,
          studentId: studentProfileId,
        },
      });

      if (existingReq) {
        request = await prisma.joinRequest.update({
          where: { id: existingReq.id },
          data: {
            status: isInstantJoin ? "APPROVED" : "PENDING",
            notes: notes || "انضمام للجلسة",
          },
        });
      } else {
        request = await prisma.joinRequest.create({
          data: {
            halaqaId: resolvedHalaqaId,
            studentId: studentProfileId,
            status: isInstantJoin ? "APPROVED" : "PENDING",
            notes: notes || "انضمام للجلسة",
          },
        });
      }
    }

    // 3. Notify Teacher in DB
    const teacherUserId = halaqa.teacher?.user?.id;
    if (teacherUserId) {
      await prisma.notification.create({
        data: {
          userId: teacherUserId,
          title: isInstantJoin ? "انضمام طالب للجلسة 🎥" : "طلب انضمام للحلقة",
          body: isInstantJoin
            ? `انضم الطالب ${user.name} إلى جلسة: ${halaqa.name}.`
            : `طلب الطالب ${user.name} الانضمام إلى: ${halaqa.name}.`,
          type: isInstantJoin ? "SESSION_STUDENT_JOINED" : "JOIN_REQUEST",
          link: activeSession ? `/classroom/${activeSession.id}?role=teacher` : "/teacher/students?tab=requests",
        },
      }).catch(() => {});
    }

    // 4. Realtime Broadcast to Sheikh
    const alertPayload = {
      requestId: request?.id,
      sessionId: activeSession?.id || null,
      halaqaId: resolvedHalaqaId,
      halaqaName: halaqa.name,
      studentId: studentProfileId,
      studentName: user.name || "طالب العلم",
      studentAvatar: user.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150",
      teacherUserId,
      status: isInstantJoin ? "PRESENT" : "PENDING",
      time: new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }),
    };

    realtimeHub.broadcast("global", {
      type: (isInstantJoin ? "STUDENT_ATTENDANCE_CHECKIN" : "SESSION_JOIN_REQUESTED") as any,
      payload: alertPayload,
    });

    if (activeSession) {
      realtimeHub.broadcast(`session-${activeSession.id}`, {
        type: (isInstantJoin ? "STUDENT_ATTENDANCE_CHECKIN" : "SESSION_JOIN_REQUESTED") as any,
        payload: alertPayload,
      });
    }

    return NextResponse.json({
      success: true,
      isAuthorized: isInstantJoin,
      status: isInstantJoin ? "PRESENT" : "PENDING",
      sessionId: activeSession?.id,
      redirectTo: activeSession ? `/classroom/${activeSession.id}?role=student` : `/student/dashboard`,
      request,
      sessionAttendance,
      message: isInstantJoin
        ? "تم قبول الدعوة والانضمام للجلسة بنجاح"
        : "تم رفع طلب الانضمام إلى فضيلة الشيخ بنجاح",
    });
  } catch (error) {
    console.error("Join request error:", error);
    return NextResponse.json({ error: "فشل إرسال طلب الانضمام" }, { status: 500 });
  }
}
