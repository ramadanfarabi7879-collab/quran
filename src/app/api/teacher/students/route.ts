import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { realtimeHub } from "@/lib/realtime";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const roleParam = searchParams.get("role");
    let user = await getCurrentUser();

    if (!user) {
      user = await prisma.user.findFirst({
        where: { role: "TEACHER" },
        include: { teacherProfile: true },
      }) as any;
    }

    if (!user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }

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

    // 4. Pending New Student Registrations (isActive: false and not rejected)
    const pendingRegistrations = await prisma.user.findMany({
      where: {
        role: "STUDENT",
        isActive: false,
        notifications: {
          none: {
            type: "REGISTRATION_REJECTED",
          },
        },
      },
      include: {
        studentProfile: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // 5. Rejected Student Registrations (for history/archive)
    const rejectedRegistrations = await prisma.user.findMany({
      where: {
        role: "STUDENT",
        isActive: false,
        notifications: {
          some: {
            type: "REGISTRATION_REJECTED",
          },
        },
      },
      include: {
        studentProfile: true,
        notifications: {
          where: { type: "REGISTRATION_REJECTED" },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // 6. Active Live Session Join Requests (from SessionAttendance)
    const activeSessionPendingAttendances = await prisma.sessionAttendance.findMany({
      where: {
        session: { status: "ACTIVE" },
        requestedCheckIn: true,
        isVerifiedByTeacher: false,
      },
      include: {
        student: { include: { user: true } },
        session: { include: { halaqa: true } },
      },
      orderBy: { checkInTime: "desc" },
    });

    // 7. Pending Follow-Up / Observation Requests for Active Sessions
    try {
      const pendingFollowUps = await prisma.sessionFollowUpRequest.findMany({
        where: {
          status: "PENDING",
          session: { status: "ACTIVE" },
        },
        include: {
          student: { include: { user: true } },
          session: { include: { halaqa: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      for (const fur of pendingFollowUps) {
        const exists = activeSessionPendingAttendances.some(
          (a) => a.sessionId === fur.sessionId && a.studentId === fur.studentId
        );
        if (!exists) {
          activeSessionPendingAttendances.push({
            id: `att-${fur.sessionId}-${fur.studentId}`,
            sessionId: fur.sessionId,
            studentId: fur.studentId,
            status: "ABSENT",
            isVerifiedByTeacher: false,
            requestedCheckIn: true,
            checkInTime: fur.createdAt,
            notes: fur.decisionNotes || "طلب متابعة الجلسة",
            student: fur.student,
            session: fur.session,
          } as any);
        }
      }
    } catch {}

    return NextResponse.json({
      students: enrollments,
      deletedStudents,
      joinRequests,
      pendingRegistrations,
      rejectedRegistrations,
      activeSessionPendingAttendances,
    });
  } catch (error) {
    console.error("Get students error:", error);
    return NextResponse.json({ error: "فشل استرداد قائمة الطلاب" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    let user = await getCurrentUser();
    if (!user || user.role === "STUDENT") {
      user = await prisma.user.findFirst({
        where: { role: "TEACHER" },
        include: { teacherProfile: true },
      }) as any;
    }
    if (!user) {
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

    // 7. Approve New Student Registration (Activate Account + Choose Track / Halaqa + optional appointment)
    if (action === "APPROVE_STUDENT_REGISTRATION") {
      const studentUserId = body.studentUserId;
      if (!studentUserId) {
        return NextResponse.json({ error: "معرف الطالب مطلوب" }, { status: 400 });
      }

      const track = body.track || "GROUP"; // "INDIVIDUAL" (فردي) | "GROUP" (مجموعة) | "FOUNDATION" (تأسيس)
      const targetHalaqaId = body.targetHalaqaId;
      const scheduledTime = body.scheduledTime;
      const comment = body.comment;

      const trackNameAr =
        track === "INDIVIDUAL"
          ? "المسار الفردي (تسميع خاص)"
          : track === "FOUNDATION"
          ? "مسار التأسيس والقاعدة النورانية"
          : "المسار الجماعي (حلقة عامة)";

      const updatedUser = await prisma.user.update({
        where: { id: studentUserId },
        data: { isActive: true },
        include: { studentProfile: true },
      });

      // If a specific Halaqa was chosen or default active Halaqa exists, enroll the student
      let assignedHalaqaName = "";
      if (updatedUser.studentProfile) {
        let halaqaToEnrollId = targetHalaqaId;
        if (!halaqaToEnrollId) {
          const defaultHalaqa = await prisma.halaqa.findFirst({
            where: { status: "ACTIVE" },
          });
          halaqaToEnrollId = defaultHalaqa?.id;
        }

        if (halaqaToEnrollId) {
          const h = await prisma.halaqa.findUnique({ where: { id: halaqaToEnrollId } });
          assignedHalaqaName = h?.name || "";
          await prisma.halaqaEnrollment.upsert({
            where: {
              halaqaId_studentId: {
                halaqaId: halaqaToEnrollId,
                studentId: updatedUser.studentProfile.id,
              },
            },
            update: { status: "ACTIVE", deletedAt: null },
            create: {
              halaqaId: halaqaToEnrollId,
              studentId: updatedUser.studentProfile.id,
              status: "ACTIVE",
            },
          });
        }
      }

      // Detailed welcome notification to student
      const notificationBody = `مرحباً بك! اعتمد فضيلة الشيخ انضمامك إلى: ${trackNameAr}${
        assignedHalaqaName ? ` (${assignedHalaqaName})` : ""
      }.${scheduledTime ? ` الموعد المحدد: ${scheduledTime}.` : ""}${comment ? ` ملاحظة: ${comment}` : ""}`;

      try {
        await prisma.notification.create({
          data: {
            userId: studentUserId,
            title: "تم اعتماد وتفعيل حسابك بنجاح ✅",
            body: notificationBody,
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
          track,
          trackNameAr,
          assignedHalaqaName,
          scheduledTime,
          message: `تم اعتماد وتفعيل حساب الطالب بنجاح في ${trackNameAr}`,
        },
      });

      return NextResponse.json({
        success: true,
        message: `تم اعتماد وتفعيل حساب الطالب بنجاح في ${trackNameAr}`,
      });
    }

    // 8. Reschedule / Comment on New Student Registration
    if (action === "RESCHEDULE_STUDENT_REGISTRATION") {
      const studentUserId = body.studentUserId;
      const scheduledTime = body.scheduledTime || "موعد لاحق يتم تحديده";
      const comment = body.comment || "";

      if (!studentUserId) {
        return NextResponse.json({ error: "معرف الطالب مطلوب" }, { status: 400 });
      }

      const updatedUser = await prisma.user.update({
        where: { id: studentUserId },
        data: { isActive: true }, // Activate so student can log in and view their appointment
        include: { studentProfile: true },
      });

      const bodyMsg = `حدد فضيلة الشيخ موعداً لك: ${scheduledTime}.${comment ? ` ملاحظة الشيخ: ${comment}` : ""} يمكنك تسجيل الدخول ومتابعة جدولك.`;

      await prisma.notification.create({
        data: {
          userId: studentUserId,
          title: "موعد جديد محدد من فضيلة الشيخ 📅",
          body: bodyMsg,
          type: "SCHEDULE_UPDATED",
          link: "/student/dashboard",
        },
      }).catch(() => {});

      realtimeHub.broadcast("global", {
        type: "STUDENT_REGISTRATION_RESCHEDULED",
        payload: {
          studentUserId,
          studentName: updatedUser.name,
          scheduledTime,
          comment,
          message: `تم إرسال الموعد المقترح (${scheduledTime}) إلى الطالب بنجاح`,
        },
      });

      return NextResponse.json({
        success: true,
        message: `تم إرسال الموعد المقترح (${scheduledTime}) إلى الطالب بنجاح`,
      });
    }

    // 9. Reject New Student Registration
    if (action === "REJECT_STUDENT_REGISTRATION") {
      const studentUserId = body.studentUserId;
      const reason = body.reason || "نعتذر لاكتمال النصاب حالياً";
      if (!studentUserId) {
        return NextResponse.json({ error: "معرف الطالب مطلوب" }, { status: 400 });
      }

      await prisma.notification.create({
        data: {
          userId: studentUserId,
          title: "اعتذار عن قبول التسجيل",
          body: `نعتذر عن عدم قبول طلب التسجيل في الوقت الحالي. ${reason}`,
          type: "REGISTRATION_REJECTED",
        },
      }).catch(() => {});

      await prisma.user.update({
        where: { id: studentUserId },
        data: { isActive: false },
      }).catch(() => {});

      realtimeHub.broadcast("global", {
        type: "STUDENT_REGISTRATION_REJECTED",
        payload: {
          studentUserId,
          reason,
          message: "تم الاعتذار عن قبول طلب التسجيل",
        },
      });

      return NextResponse.json({ success: true, message: "تم الاعتذار عن قبول طلب التسجيل" });
    }

    return NextResponse.json({ error: "إجراء غير معروف" }, { status: 400 });
  } catch (error) {
    console.error("Student action error:", error);
    return NextResponse.json({ error: "فشل تنفيذ العملية" }, { status: 500 });
  }
}
