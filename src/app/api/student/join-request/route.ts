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

    // Determine if student is enrolled or explicitly accepting teacher's invitation
    const isEnrolled = halaqa.enrollments?.some(
      (e: any) => e.studentId === studentProfileId
    );

    // Instant direct join only if student is explicitly accepting invitation or already enrolled
    const isInstantJoin = !!(activeSession && (acceptInvitation || isEnrolled));

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

      // Mark any HALAQA_STARTING notifications for this user as read if accepting
      if (isInstantJoin) {
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
            status: isInstantJoin ? "ACCEPTED" : "PENDING",
            notes: notes || (isInstantJoin ? "انضمام للجلسة" : "طلب انضمام للحلقة"),
            createdAt: new Date(),
            reviewedAt: isInstantJoin ? new Date() : null,
          },
        });
      } else {
        request = await prisma.joinRequest.create({
          data: {
            halaqaId: resolvedHalaqaId,
            studentId: studentProfileId,
            status: isInstantJoin ? "ACCEPTED" : "PENDING",
            notes: notes || (isInstantJoin ? "انضمام للجلسة" : "طلب انضمام للحلقة"),
            reviewedAt: isInstantJoin ? new Date() : null,
          },
        });
      }
    }

    // 3. Notify Teacher in DB
    const teacherUserId = halaqa.teacher?.user?.id || halaqa.teacher?.userId;
    const allTeachers = await prisma.user.findMany({
      where: { role: { in: ["TEACHER", "ADMIN"] } },
      select: { id: true },
    });
    const teacherUserIds = new Set<string>();
    if (teacherUserId) teacherUserIds.add(teacherUserId);
    allTeachers.forEach((t) => teacherUserIds.add(t.id));

    for (const tid of Array.from(teacherUserIds)) {
      await prisma.notification.create({
        data: {
          userId: tid,
          title: isInstantJoin ? "انضمام طالب للجلسة 🎥" : "طلب انضمام جديد للحلقة ✋",
          body: isInstantJoin
            ? `انضم الطالب ${user.name} إلى جلسة: ${halaqa.name}.`
            : `طلب الطالب ${user.name} الانضمام إلى: ${halaqa.name}. يرجى مراجعة الطلب واعتماده.`,
          type: isInstantJoin ? "SESSION_STUDENT_JOINED" : "JOIN_REQUEST",
          link: activeSession
            ? `/classroom/${activeSession.id}?role=teacher`
            : "/teacher/requests?tab=JOIN_REQUESTS",
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
      studentUserId: user.id,
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

    realtimeHub.broadcast("global", {
      type: "NEW_NOTIFICATION",
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
      redirectTo: isInstantJoin && activeSession
        ? `/classroom/${activeSession.id}?role=student`
        : `/student/dashboard`,
      request,
      sessionAttendance,
      message: isInstantJoin
        ? "تم قبول الدعوة والانضمام للجلسة بنجاح"
        : "تم رفع طلب الانضمام إلى فضيلة الشيخ بنجاح، وستتلقى إشعاراً فور الرد.",
    });
  } catch (error) {
    console.error("Join request error:", error);
    return NextResponse.json({ error: "فشل إرسال طلب الانضمام" }, { status: 500 });
  }
}
