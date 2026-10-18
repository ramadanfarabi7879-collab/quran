import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { realtimeHub } from "@/lib/realtime";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role === "STUDENT") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const halaqaId = searchParams.get("halaqaId");
    const query = searchParams.get("q") || "";

    // 1. Active enrollments
    const enrollments = await prisma.halaqaEnrollment.findMany({
      where: {
        ...(halaqaId ? { halaqaId } : {}),
        status: { in: ["ACTIVE", "SUSPENDED"] },
        student: {
          user: {
            name: { contains: query },
          },
        },
      },
      include: {
        halaqa: true,
        student: {
          include: {
            user: true,
            memorizationRecords: {
              orderBy: { date: "desc" },
              take: 5,
            },
            evaluations: {
              orderBy: { date: "desc" },
              take: 5,
            },
          },
        },
      },
    });

    // 2. Trash (Deleted enrollments)
    const deletedStudents = await prisma.halaqaEnrollment.findMany({
      where: {
        ...(halaqaId ? { halaqaId } : {}),
        status: "DELETED",
      },
      include: {
        halaqa: true,
        student: {
          include: { user: true },
        },
      },
      orderBy: { deletedAt: "desc" },
    });

    // 3. Join Requests
    const joinRequests = await prisma.joinRequest.findMany({
      where: {
        ...(halaqaId ? { halaqaId } : {}),
      },
      include: {
        halaqa: true,
        student: {
          include: { user: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // 4. Pending New Student Registrations (isActive: false)
    const pendingRegistrations = await prisma.user.findMany({
      where: {
        role: "STUDENT",
        isActive: false,
      },
      include: {
        studentProfile: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      students: enrollments,
      deletedStudents,
      joinRequests,
      pendingRegistrations,
    });
  } catch (error) {
    console.error("Get students error:", error);
    return NextResponse.json({ error: "فشل استرداد قائمة الطلاب" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role === "STUDENT") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }

    const body = await req.json();
    const { action, requestId, enrollmentId, studentId, halaqaId, targetHalaqaId, reason, status } = body;

    // 1. Accept Join Request
    if (action === "ACCEPT_REQUEST") {
      const request = await prisma.joinRequest.findUnique({
        where: { id: requestId },
        include: { student: { include: { user: true } }, halaqa: true },
      });

      if (!request) {
        return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
      }

      await prisma.joinRequest.update({
        where: { id: requestId },
        data: { status: "ACCEPTED", reviewedAt: new Date() },
      });

      // Enroll student in halaqa
      await prisma.halaqaEnrollment.upsert({
        where: {
          halaqaId_studentId: {
            halaqaId: request.halaqaId,
            studentId: request.studentId,
          },
        },
        update: { status: "ACTIVE", deletedAt: null, deleteReason: null },
        create: {
          halaqaId: request.halaqaId,
          studentId: request.studentId,
          status: "ACTIVE",
        },
      });

      // If there is an active live session for this halaqa, mark session attendance as verified
      const activeSession = await prisma.liveSession.findFirst({
        where: { halaqaId: request.halaqaId, status: "ACTIVE" },
      });

      if (activeSession) {
        await prisma.sessionAttendance.upsert({
          where: {
            sessionId_studentId: {
              sessionId: activeSession.id,
              studentId: request.studentId,
            },
          },
          update: {
            status: "PRESENT",
            isVerifiedByTeacher: true,
            requestedCheckIn: true,
            checkInTime: new Date(),
          },
          create: {
            sessionId: activeSession.id,
            studentId: request.studentId,
            status: "PRESENT",
            isVerifiedByTeacher: true,
            requestedCheckIn: true,
            checkInTime: new Date(),
          },
        });

        realtimeHub.broadcast("global", {
          type: "SESSION_JOIN_APPROVED",
          payload: {
            sessionId: activeSession.id,
            halaqaId: request.halaqaId,
            studentId: request.studentId,
            studentUserId: request.student.user.id,
            studentName: request.student.user.name,
            message: `تم قبول انضمامك إلى ${request.halaqa.name} بواسطة فضيلة الشيخ`,
          },
        });
      }

      // Notification
      await prisma.notification.create({
        data: {
          userId: request.student.user.id,
          title: "تم قبول طلب انضمامك للحلقة",
          body: `مرحباً بك! قبل المعلم انضمامك إلى: ${request.halaqa.name}.`,
          type: "JOIN_REQUEST_DECIDED",
          link: activeSession ? `/classroom/${activeSession.id}?role=student` : "/student/my-halaqat",
        },
      });

      // Realtime event to notify student screen immediately
      realtimeHub.broadcast("global", {
        type: "JOIN_REQUEST_APPROVED",
        payload: {
          sessionId: activeSession?.id,
          studentId: request.studentId,
          studentUserId: request.student.user.id,
          halaqaId: request.halaqaId,
          halaqaName: request.halaqa.name,
        },
      });
      realtimeHub.broadcast("global", {
        type: "SCHEDULE_UPDATED",
        payload: {
          action: "STUDENT_APPROVED",
          message: `تم اعتماد وقبول الطالب في ${request.halaqa.name}`,
        },
      });

      return NextResponse.json({ success: true, message: "تم قبول الطالب بنجاح" });
    }

    // 2. Reject Join Request
    if (action === "REJECT_REQUEST") {
      const request = await prisma.joinRequest.findUnique({
        where: { id: requestId },
        include: { student: { include: { user: true } }, halaqa: true },
      });

      if (!request) return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });

      await prisma.joinRequest.update({
        where: { id: requestId },
        data: {
          status: "REJECTED",
          rejectReason: reason || "تم الاعتذار لاكتمال العدد",
          reviewedAt: new Date(),
        },
      });

      await prisma.notification.create({
        data: {
          userId: request.student.user.id,
          title: "تحديث بشأن طلب الانضمام",
          body: `تم الاعتذار عن قبول طلب الانضمام إلى ${request.halaqa.name}. السبب: ${reason || "اكتمال النصاب"}`,
          type: "JOIN_REQUEST_DECIDED",
          link: "/student/my-halaqat",
        },
      });

      // Realtime event
      realtimeHub.broadcast("global", {
        type: "JOIN_REQUEST_REJECTED",
        payload: {
          studentId: request.studentId,
          studentUserId: request.student.user.id,
          halaqaId: request.halaqaId,
          halaqaName: request.halaqa.name,
        },
      });

      return NextResponse.json({ success: true, message: "تم رفض الطلب" });
    }

    // 3. Suspend / Activate Student
    if (action === "SUSPEND_STUDENT") {
      await prisma.halaqaEnrollment.update({
        where: { id: enrollmentId },
        data: { status: status || "SUSPENDED" },
      });
      return NextResponse.json({ success: true });
    }

    // 4. Transfer Student between Halaqat
    if (action === "TRANSFER_STUDENT") {
      if (!targetHalaqaId) {
        return NextResponse.json({ error: "معرف الحلقة البديلة مطلوب" }, { status: 400 });
      }

      const existing = await prisma.halaqaEnrollment.findUnique({
        where: { id: enrollmentId },
      });

      if (!existing) return NextResponse.json({ error: "التسجيل غير موجود" }, { status: 404 });

      // Delete from old halaqa
      await prisma.halaqaEnrollment.delete({ where: { id: enrollmentId } });

      // Add to new halaqa
      await prisma.halaqaEnrollment.upsert({
        where: {
          halaqaId_studentId: {
            halaqaId: targetHalaqaId,
            studentId: existing.studentId,
          },
        },
        update: { status: "ACTIVE", deletedAt: null },
        create: {
          halaqaId: targetHalaqaId,
          studentId: existing.studentId,
          status: "ACTIVE",
        },
      });

      return NextResponse.json({ success: true, message: "تم نقل الطالب بنجاح" });
    }

    // 5. Soft Delete Student (Move to Trash)
    if (action === "DELETE_STUDENT") {
      await prisma.halaqaEnrollment.update({
        where: { id: enrollmentId },
        data: {
          status: "DELETED",
          deletedAt: new Date(),
          deleteReason: reason || "حذف من قِبل المعلم",
        },
      });
      return NextResponse.json({ success: true, message: "تم نقل الطالب لقائمة المحذوفين" });
    }

    // 6. Restore Student from Trash
    if (action === "RESTORE_STUDENT") {
      await prisma.halaqaEnrollment.update({
        where: { id: enrollmentId },
        data: {
          status: "ACTIVE",
          deletedAt: null,
          deleteReason: null,
        },
      });
      return NextResponse.json({ success: true, message: "تم استرجاع الطالب وإعادة تفعيله" });
    }

    // 7. Approve New Student Registration (Activate Account)
    if (action === "APPROVE_STUDENT_REGISTRATION") {
      const studentUserId = body.studentUserId;
      if (!studentUserId) {
        return NextResponse.json({ error: "معرف الطالب مطلوب" }, { status: 400 });
      }

      const updatedUser = await prisma.user.update({
        where: { id: studentUserId },
        data: { isActive: true },
        include: { studentProfile: true },
      });

      // Send DB notification to student
      try {
        await prisma.notification.create({
          data: {
            userId: studentUserId,
            title: "تم اعتماد وتفعيل حسابك بنجاح ✅",
            body: "مرحباً بك! وافق فضيلة الشيخ أحمد علي على اعتماد حسابك في الأكاديمية المباركة. يمكنك الآن الدخول ومتابعة الحلقات.",
            type: "ACCOUNT_APPROVED",
            link: "/student/dashboard",
          },
        });
      } catch (err) {
        console.error("Failed to notify approved student:", err);
      }

      // Broadcast realtime event
      realtimeHub.broadcast("global", {
        type: "STUDENT_REGISTRATION_APPROVED",
        payload: {
          studentUserId,
          studentName: updatedUser.name,
          message: "تم اعتماد وتفعيل حساب الطالب بنجاح",
        },
      });

      return NextResponse.json({ success: true, message: "تم اعتماد وتفعيل حساب الطالب بنجاح" });
    }

    // 8. Reject New Student Registration
    if (action === "REJECT_STUDENT_REGISTRATION") {
      const studentUserId = body.studentUserId;
      if (!studentUserId) {
        return NextResponse.json({ error: "معرف الطالب مطلوب" }, { status: 400 });
      }

      await prisma.user.delete({
        where: { id: studentUserId },
      });

      return NextResponse.json({ success: true, message: "تم رفض وحذف طلب التسجيل" });
    }

    return NextResponse.json({ error: "إجراء غير معروف" }, { status: 400 });
  } catch (error) {
    console.error("Student action error:", error);
    return NextResponse.json({ error: "فشل تنفيذ العملية" }, { status: 500 });
  }
}
