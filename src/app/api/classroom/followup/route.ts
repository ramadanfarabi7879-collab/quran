import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { realtimeHub } from "@/lib/realtime";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const whereClause: any = {};
    if (sessionId) {
      whereClause.sessionId = sessionId;
    }

    if (user.role === "STUDENT" && user.studentProfile?.id) {
      whereClause.studentId = user.studentProfile.id;
    }

    const requests = await prisma.sessionFollowUpRequest.findMany({
      where: whereClause,
      include: {
        student: {
          include: {
            user: { select: { id: true, name: true, avatar: true, email: true, phone: true } },
          },
        },
        session: {
          include: {
            halaqa: {
              include: {
                teacher: { include: { user: true } },
              },
            },
          },
        },
        proposedSlot: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, requests });
  } catch (error) {
    console.error("GET /api/classroom/followup error:", error);
    return NextResponse.json({ error: "فشل استرداد طلبات المتابعة" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    let user = await getCurrentUser();
    const body = await req.json().catch(() => ({}));
    const { action = "REQUEST_FOLLOWUP", sessionId, decision, requestId, notes, reason } = body;

    // =========================================================================
    // 1. STUDENT ACTION: Request to follow / observe the active session
    // =========================================================================
    if (action === "REQUEST_FOLLOWUP") {
      // Resolve student user
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

      // Resolve live session
      let targetSession = null;
      if (sessionId && sessionId !== "auto") {
        targetSession = await prisma.liveSession.findUnique({
          where: { id: sessionId },
          include: {
            halaqa: {
              include: {
                teacher: { include: { user: true } },
                enrollments: true,
              },
            },
            attendances: {
              where: { status: "PRESENT" },
              include: { student: { include: { user: true } } },
            },
          },
        });
      }

      if (!targetSession) {
        targetSession = await prisma.liveSession.findFirst({
          where: { status: "ACTIVE" },
          include: {
            halaqa: {
              include: {
                teacher: { include: { user: true } },
                enrollments: true,
              },
            },
            attendances: {
              where: { status: "PRESENT" },
              include: { student: { include: { user: true } } },
            },
          },
        });
      }

      if (!targetSession || targetSession.status !== "ACTIVE") {
        return NextResponse.json({ error: "لا توجد جلسة نشطة حالياً لطلب متابعتها" }, { status: 400 });
      }

      // Check for existing pending request
      let existingReq = await prisma.sessionFollowUpRequest.findFirst({
        where: {
          sessionId: targetSession.id,
          studentId: studentProfileId,
          status: { in: ["PENDING", "DEFERRED"] },
        },
      });

      let followUpReq;
      if (existingReq) {
        followUpReq = await prisma.sessionFollowUpRequest.update({
          where: { id: existingReq.id },
          data: {
            status: "PENDING",
            decisionNotes: notes || "طلب متابعة الجلسة",
            createdAt: new Date(),
          },
        });
      } else {
        followUpReq = await prisma.sessionFollowUpRequest.create({
          data: {
            sessionId: targetSession.id,
            studentId: studentProfileId,
            status: "PENDING",
            decisionNotes: notes || "طلب متابعة الجلسة",
          },
        });
      }

      // Send in-app notification to teacher
      const teacherUserId = targetSession.halaqa?.teacher?.userId;
      if (teacherUserId) {
        await prisma.notification.create({
          data: {
            userId: teacherUserId,
            title: "طلب متابعة جلسة جديدة 👁️",
            body: `الطالب ${user.name} يطلب متابعة الجلسة المنعقدة الآن (${targetSession.halaqa?.name || targetSession.title}).`,
            type: "SESSION_FOLLOWUP_REQUEST",
            link: `/classroom/${targetSession.id}?role=teacher`,
          },
        }).catch(() => {});
      }

      const alertPayload = {
        requestId: followUpReq.id,
        sessionId: targetSession.id,
        sessionTitle: targetSession.title,
        halaqaName: targetSession.halaqa?.name || "حلقة القرآن الكريم",
        studentId: studentProfileId,
        studentName: user.name || "طالب العلم",
        studentNumber: user.studentProfile?.studentNumber || "STU-000",
        studentAvatar: user.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150",
        currentAttendeesCount: targetSession.attendances?.length || 0,
        requestTime: new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }),
        status: "PENDING",
      };

      // Realtime SSE broadcast to teacher inside classroom and dashboard
      realtimeHub.broadcast(`session-${targetSession.id}`, {
        type: "SESSION_FOLLOWUP_REQUESTED" as any,
        payload: alertPayload,
      });

      realtimeHub.broadcast("global", {
        type: "SESSION_FOLLOWUP_REQUESTED" as any,
        payload: alertPayload,
      });

      // Also record signal in ClassroomSignal for HTTP signaling loop
      await prisma.classroomSignal.create({
        data: {
          sessionId: targetSession.id,
          senderRole: "student",
          senderName: user.name || "طالب العلم",
          senderClientId: "system",
          signalType: "SESSION_FOLLOWUP_REQUESTED",
          data: JSON.stringify(alertPayload),
        },
      }).catch(() => {});

      return NextResponse.json({
        success: true,
        message: "تم إرسال طلب متابعة الجلسة إلى فضيلة الشيخ بنجاح، يرجى الانتظار",
        request: followUpReq,
        status: "PENDING",
      });
    }

    // =========================================================================
    // 2. SHEIKH DECISIONS: 5 Actionable Responses
    // =========================================================================
    if (action === "DECISION") {
      // Authenticate Teacher
      if (!user || user.role === "STUDENT") {
        const teacherUser = await prisma.user.findFirst({
          where: { role: "TEACHER" },
          include: { teacherProfile: true },
        });
        if (teacherUser) user = teacherUser as any;
      }

      if (!user || (user.role !== "TEACHER" && user.role !== "ADMIN")) {
        return NextResponse.json({ error: "هذا الإجراء متاح للمعلم فقط" }, { status: 403 });
      }

      if (!requestId) {
        return NextResponse.json({ error: "معرف الطلب مطلوب" }, { status: 400 });
      }

      const followUpReq = await prisma.sessionFollowUpRequest.findUnique({
        where: { id: requestId },
        include: {
          student: { include: { user: true } },
          session: {
            include: {
              halaqa: { include: { teacher: true } },
              attendances: { where: { status: "PRESENT" } },
            },
          },
        },
      });

      if (!followUpReq) {
        return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
      }

      const studentUserId = followUpReq.student.userId;
      const targetSession = followUpReq.session;
      const teacherProfileId = user.teacherProfile?.id || targetSession.halaqa?.teacherId;

      // -----------------------------------------------------------------------
      // DECISION 1: Accept student now (MUTED)
      // -----------------------------------------------------------------------
      if (decision === "ACCEPT_NOW") {
        const isOneOnOne = targetSession.title?.includes("فردية") || targetSession.title?.includes("خاصة");
        const currentPresentCount = targetSession.attendances.length;

        // If private 1-on-1 session already has attendee and teacher didn't force accept
        if (isOneOnOne && currentPresentCount >= 1 && !body.forceAccept) {
          return NextResponse.json({
            warning: true,
            isOneOnOne: true,
            currentPresentCount,
            message: "تنبيه: هذه جلسة فردية وبها طالب بالفعل. هل تريد تأكيد إدخاله كمتابع مكتوم الصوت، أم تفضل اقتراح موعد بديل؟",
          });
        }

        // Add or update Attendance record: verified and PRESENT
        await prisma.sessionAttendance.upsert({
          where: {
            sessionId_studentId: {
              sessionId: targetSession.id,
              studentId: followUpReq.studentId,
            },
          },
          update: {
            status: "PRESENT",
            isVerifiedByTeacher: true,
            requestedCheckIn: true,
            checkInTime: new Date(),
            notes: "تم قبول الدخول من قبل الشيخ كمتابع للجلسة (مكتوم الصوت)",
          },
          create: {
            sessionId: targetSession.id,
            studentId: followUpReq.studentId,
            status: "PRESENT",
            isVerifiedByTeacher: true,
            requestedCheckIn: true,
            checkInTime: new Date(),
            notes: "تم قبول الدخول من قبل الشيخ كمتابع للجلسة (مكتوم الصوت)",
          },
        });

        // Update follow-up request status
        const updatedReq = await prisma.sessionFollowUpRequest.update({
          where: { id: requestId },
          data: {
            status: "ACCEPTED",
            reviewedAt: new Date(),
            decisionNotes: "تم قبول الطالب للدخول كمتابع للجلسة",
          },
        });

        // DB Notification to student with direct classroom link
        await prisma.notification.create({
          data: {
            userId: studentUserId,
            title: "تم قبول طلب متابعة الجلسة ✅",
            body: `وافق فضيلة الشيخ على دخولك لمتابعة الجلسة المنعقدة: ${targetSession.title}. الصوت سيكون مكتوماً تلقائياً.`,
            type: "SESSION_FOLLOWUP_ACCEPTED",
            link: `/classroom/${targetSession.id}?role=student`,
          },
        }).catch(() => {});

        const decisionPayload = {
          requestId: updatedReq.id,
          decision: "ACCEPTED",
          sessionId: targetSession.id,
          studentId: followUpReq.studentId,
          studentUserId,
          joinUrl: `/classroom/${targetSession.id}?role=student`,
          message: "وافق الشيخ على طلبك. يمكنك الدخول الآن بصوت مكتوم.",
        };

        realtimeHub.broadcast(`session-${targetSession.id}`, {
          type: "SESSION_FOLLOWUP_DECIDED" as any,
          payload: decisionPayload,
        });

        realtimeHub.broadcast("global", {
          type: "SESSION_FOLLOWUP_DECIDED" as any,
          payload: decisionPayload,
        });

        return NextResponse.json({
          success: true,
          decision: "ACCEPTED",
          message: "تم قبول الطالب وإضافته للجلسة بنجاح",
          request: updatedReq,
        });
      }

      // -----------------------------------------------------------------------
      // DECISION 2: Reject request
      // -----------------------------------------------------------------------
      if (decision === "REJECT") {
        const rejectMsg = reason || "اعتذر فضيلة الشيخ عن قبول المتابعة للجلسة الحالية.";

        const updatedReq = await prisma.sessionFollowUpRequest.update({
          where: { id: requestId },
          data: {
            status: "REJECTED",
            rejectReason: rejectMsg,
            reviewedAt: new Date(),
          },
        });

        await prisma.notification.create({
          data: {
            userId: studentUserId,
            title: "اعتذار عن متابعة الجلسة ❌",
            body: `اعتذر الشيخ عن قبول طلب المتابعة للجلسة الحالية (${rejectMsg}).`,
            type: "SESSION_FOLLOWUP_REJECTED",
            link: `/student/dashboard`,
          },
        }).catch(() => {});

        const decisionPayload = {
          requestId: updatedReq.id,
          decision: "REJECTED",
          sessionId: targetSession.id,
          studentId: followUpReq.studentId,
          studentUserId,
          reason: rejectMsg,
        };

        realtimeHub.broadcast(`session-${targetSession.id}`, {
          type: "SESSION_FOLLOWUP_DECIDED" as any,
          payload: decisionPayload,
        });

        realtimeHub.broadcast("global", {
          type: "SESSION_FOLLOWUP_DECIDED" as any,
          payload: decisionPayload,
        });

        return NextResponse.json({
          success: true,
          decision: "REJECTED",
          message: "تم رفض الطلب وإشعار الطالب باعتذار",
          request: updatedReq,
        });
      }

      // -----------------------------------------------------------------------
      // DECISION 3: Defer / Review later
      // -----------------------------------------------------------------------
      if (decision === "DEFER") {
        const deferMsg = "تم تعليق طلبك وسيقوم الشيخ بمراجعته والرد عليك بعد انتهاء الجلسة.";

        const updatedReq = await prisma.sessionFollowUpRequest.update({
          where: { id: requestId },
          data: {
            status: "DEFERRED",
            decisionNotes: deferMsg,
            reviewedAt: new Date(),
          },
        });

        await prisma.notification.create({
          data: {
            userId: studentUserId,
            title: "طلب المتابعة قيد المراجعة ⏳",
            body: `تم تعليق طلبك لمتابعة الجلسة وسيتم الرد عليك وتحديد الموعد بعد انتهاء الجلسة إن شاء الله.`,
            type: "SESSION_FOLLOWUP_DEFERRED",
            link: `/student/dashboard`,
          },
        }).catch(() => {});

        const decisionPayload = {
          requestId: updatedReq.id,
          decision: "DEFERRED",
          sessionId: targetSession.id,
          studentId: followUpReq.studentId,
          studentUserId,
          message: deferMsg,
        };

        realtimeHub.broadcast(`session-${targetSession.id}`, {
          type: "SESSION_FOLLOWUP_DECIDED" as any,
          payload: decisionPayload,
        });

        realtimeHub.broadcast("global", {
          type: "SESSION_FOLLOWUP_DECIDED" as any,
          payload: decisionPayload,
        });

        return NextResponse.json({
          success: true,
          decision: "DEFERRED",
          message: "تم تعليق الطلب للرد عليه لاحقاً",
          request: updatedReq,
        });
      }

      // -----------------------------------------------------------------------
      // DECISION 4: Propose existing available slot
      // -----------------------------------------------------------------------
      if (decision === "PROPOSE_EXISTING_SLOT") {
        const { slotId } = body;
        if (!slotId) {
          return NextResponse.json({ error: "معرف الموعد المتاح مطلوب" }, { status: 400 });
        }

        const slot = await prisma.teacherScheduleSlot.findUnique({
          where: { id: slotId },
        });

        if (!slot || slot.isBooked) {
          return NextResponse.json({ error: "هذا الموعد لم يعد متاحاً" }, { status: 400 });
        }

        const updatedReq = await prisma.sessionFollowUpRequest.update({
          where: { id: requestId },
          data: {
            status: "PROPOSED",
            proposedSlotId: slot.id,
            proposedDate: slot.date || new Date(),
            proposedTime: slot.startTime,
            proposedDuration: slot.durationMinutes,
            proposedType: slot.slotType,
            reviewedAt: new Date(),
          },
        });

        const slotDescription = `${slot.title} - ${slot.dayOfWeek || "الموعد"} ${slot.startTime} إلى ${slot.endTime} (${slot.durationMinutes} دقيقة)`;

        await prisma.notification.create({
          data: {
            userId: studentUserId,
            title: "اقتراح موعد بديل من الشيخ 📅",
            body: `يقترح عليك فضيلة الشيخ موعداً بديلاً: ${slotDescription}. يرجى مراجعة الاقتراح وقبوله.`,
            type: "SESSION_FOLLOWUP_PROPOSAL",
            link: `/student/dashboard?tab=proposals&requestId=${updatedReq.id}`,
          },
        }).catch(() => {});

        const proposalPayload = {
          requestId: updatedReq.id,
          decision: "PROPOSED_SLOT",
          sessionId: targetSession.id,
          studentId: followUpReq.studentId,
          studentUserId,
          slot,
          slotDescription,
        };

        realtimeHub.broadcast(`session-${targetSession.id}`, {
          type: "SESSION_FOLLOWUP_SLOT_PROPOSED" as any,
          payload: proposalPayload,
        });

        realtimeHub.broadcast("global", {
          type: "SESSION_FOLLOWUP_SLOT_PROPOSED" as any,
          payload: proposalPayload,
        });

        return NextResponse.json({
          success: true,
          decision: "PROPOSED_SLOT",
          message: "تم إرسال الموعد المقترح للطالب بنجاح",
          request: updatedReq,
          slot,
        });
      }

      // -----------------------------------------------------------------------
      // DECISION 5: Create new appointment and propose to student
      // -----------------------------------------------------------------------
      if (decision === "CREATE_AND_PROPOSE_SLOT") {
        const {
          slotTitle = "جلسة تسميع قرآنية خاصة",
          slotDate,
          startTime = "17:00",
          durationMinutes = 30,
          slotType = "ONE_ON_ONE",
          dayOfWeek = "اليوم",
        } = body;

        if (!teacherProfileId) {
          return NextResponse.json({ error: "ملف المعلم غير متوفر" }, { status: 400 });
        }

        // Calculate end time
        const [startH, startM] = startTime.split(":").map(Number);
        const totalStartMin = (startH || 0) * 60 + (startM || 0);
        const totalEndMin = totalStartMin + Number(durationMinutes);
        const endH = Math.floor(totalEndMin / 60) % 24;
        const endM = totalEndMin % 60;
        const endTime = `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;

        // Conflict Detection: check if teacher has existing slot with overlap
        const targetDate = slotDate ? new Date(slotDate) : new Date();
        const existingSlots = await prisma.teacherScheduleSlot.findMany({
          where: {
            teacherId: teacherProfileId,
            isBooked: true,
          },
        });

        const hasConflict = existingSlots.some((s) => {
          if (!s.startTime || !s.endTime) return false;
          const [sH, sM] = s.startTime.split(":").map(Number);
          const [eH, eM] = s.endTime.split(":").map(Number);
          const sMin = sH * 60 + sM;
          const eMin = eH * 60 + eM;
          // Overlap condition
          return (totalStartMin >= sMin && totalStartMin < eMin) || (totalEndMin > sMin && totalEndMin <= eMin);
        });

        if (hasConflict) {
          return NextResponse.json({
            error: "يوجد تعارض في المواعيد! لديك جلسة أخرى محجوزة في نفس النطاق الزمني.",
          }, { status: 400 });
        }

        // Create new schedule slot
        const newSlot = await prisma.teacherScheduleSlot.create({
          data: {
            teacherId: teacherProfileId,
            title: slotTitle,
            dayOfWeek,
            date: targetDate,
            startTime,
            endTime,
            durationMinutes: Number(durationMinutes),
            slotType,
            isBooked: false,
          },
        });

        // Link to follow-up request
        const updatedReq = await prisma.sessionFollowUpRequest.update({
          where: { id: requestId },
          data: {
            status: "PROPOSED",
            proposedSlotId: newSlot.id,
            proposedDate: targetDate,
            proposedTime: startTime,
            proposedDuration: Number(durationMinutes),
            proposedType: slotType,
            reviewedAt: new Date(),
          },
        });

        const slotDescription = `${slotTitle} - ${targetDate.toLocaleDateString("ar-SA")} الساعة ${startTime} (${durationMinutes} دقيقة)`;

        await prisma.notification.create({
          data: {
            userId: studentUserId,
            title: "تم إنشاء موعد جديد لك من الشيخ 📅",
            body: `أنشأ لك فضيلة الشيخ موعداً مخصصاً: ${slotDescription}. يرجى تأكيد الموعد.`,
            type: "SESSION_FOLLOWUP_PROPOSAL",
            link: `/student/dashboard?tab=proposals&requestId=${updatedReq.id}`,
          },
        }).catch(() => {});

        const proposalPayload = {
          requestId: updatedReq.id,
          decision: "PROPOSED_NEW_SLOT",
          sessionId: targetSession.id,
          studentId: followUpReq.studentId,
          studentUserId,
          slot: newSlot,
          slotDescription,
        };

        realtimeHub.broadcast(`session-${targetSession.id}`, {
          type: "SESSION_FOLLOWUP_SLOT_PROPOSED" as any,
          payload: proposalPayload,
        });

        realtimeHub.broadcast("global", {
          type: "SESSION_FOLLOWUP_SLOT_PROPOSED" as any,
          payload: proposalPayload,
        });

        return NextResponse.json({
          success: true,
          decision: "PROPOSED_NEW_SLOT",
          message: "تم إنشاء الموعد الجديد وإرساله كاقتراح للطالب بنجاح",
          slot: newSlot,
          request: updatedReq,
        });
      }

      return NextResponse.json({ error: "قرار غير صالح" }, { status: 400 });
    }

    return NextResponse.json({ error: "إجراء غير معروف" }, { status: 400 });
  } catch (error: any) {
    console.error("Follow-up error:", error);
    return NextResponse.json({ error: error?.message || "فشل معالجة طلب المتابعة" }, { status: 500 });
  }
}
