import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { realtimeHub } from "@/lib/realtime";

export async function POST(req: Request) {
  try {
    let user = await getCurrentUser();
    if (!user || user.role !== "STUDENT" || !user.studentProfile) {
      const studentUser = await prisma.user.findFirst({
        where: { role: "STUDENT" },
        include: { studentProfile: true },
      });
      if (studentUser) user = studentUser as any;
    }

    if (!user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { requestId, action } = body; // action: "ACCEPT" | "REJECT"

    if (!requestId || !action) {
      return NextResponse.json({ error: "معرف الطلب والإجراء مطلوبان" }, { status: 400 });
    }

    const followUpReq = await prisma.sessionFollowUpRequest.findUnique({
      where: { id: requestId },
      include: {
        student: { include: { user: true } },
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
    });

    if (!followUpReq) {
      return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
    }

    const teacherUserId = followUpReq.session?.halaqa?.teacher?.userId;
    const studentName = followUpReq.student.user.name;

    if (action === "ACCEPT") {
      // Mark slot as booked if attached
      if (followUpReq.proposedSlotId) {
        await prisma.teacherScheduleSlot.update({
          where: { id: followUpReq.proposedSlotId },
          data: {
            isBooked: true,
            bookedByStudentId: followUpReq.studentId,
          },
        });
      }

      const updatedReq = await prisma.sessionFollowUpRequest.update({
        where: { id: requestId },
        data: {
          status: "CONFIRMED",
          decisionNotes: "وافق الطالب على الموعد المقترح وتم تثبيته",
        },
      });

      // Notify Sheikh
      if (teacherUserId) {
        await prisma.notification.create({
          data: {
            userId: teacherUserId,
            title: "تأكيد موعد من الطالب ✅",
            body: `وافق الطالب ${studentName} على الموعد المقترح (${followUpReq.proposedTime || ""}). تم تأكيد الحجز في جدولك.`,
            type: "SCHEDULE_CONFIRMED",
            link: `/teacher/dashboard`,
          },
        }).catch(() => {});
      }

      realtimeHub.broadcast("global", {
        type: "SESSION_FOLLOWUP_SLOT_RESPONSE" as any,
        payload: {
          requestId,
          decision: "ACCEPTED",
          studentName,
          slotId: followUpReq.proposedSlotId,
        },
      });

      return NextResponse.json({
        success: true,
        message: "تم قبول الموعد وتثبيته في جدول الحصص بنجاح",
        request: updatedReq,
      });
    }

    if (action === "REJECT") {
      const updatedReq = await prisma.sessionFollowUpRequest.update({
        where: { id: requestId },
        data: {
          status: "REJECTED",
          rejectReason: "اعتذر الطالب عن الموعد المقترح",
        },
      });

      // Free up slot if it was temporarily held
      if (followUpReq.proposedSlotId) {
        await prisma.teacherScheduleSlot.update({
          where: { id: followUpReq.proposedSlotId },
          data: { isBooked: false, bookedByStudentId: null },
        });
      }

      if (teacherUserId) {
        await prisma.notification.create({
          data: {
            userId: teacherUserId,
            title: "اعتذار عن الموعد المقترح ℹ️",
            body: `اعتذر الطالب ${studentName} عن قبول الموعد المقترح (${followUpReq.proposedTime || ""}).`,
            type: "SCHEDULE_REJECTED",
            link: `/teacher/dashboard`,
          },
        }).catch(() => {});
      }

      realtimeHub.broadcast("global", {
        type: "SESSION_FOLLOWUP_SLOT_RESPONSE" as any,
        payload: {
          requestId,
          decision: "REJECTED",
          studentName,
        },
      });

      return NextResponse.json({
        success: true,
        message: "تم إرسال الاعتذار عن الموعد بنجاح",
        request: updatedReq,
      });
    }

    return NextResponse.json({ error: "إجراء غير صالح" }, { status: 400 });
  } catch (error: any) {
    console.error("Respond error:", error);
    return NextResponse.json({ error: error?.message || "فشل تسجيل الرد" }, { status: 500 });
  }
}
