import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const halaqaId = searchParams.get("halaqaId");

    const where: any = {};
    if (halaqaId) where.halaqaId = halaqaId;

    const assignments = await prisma.assignment.findMany({
      where,
      include: {
        halaqa: true,
        teacher: { include: { user: true } },
        submissions: {
          include: { student: { include: { user: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ assignments });
  } catch (error) {
    console.error("Get assignments error:", error);
    return NextResponse.json({ error: "فشل استرداد الواجبات" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

    const body = await req.json();
    const { action } = body;

    // 1. Submit Homework by Student
    if (action === "SUBMIT_HOMEWORK") {
      let studentProfileId = user.studentProfile?.id;
      if (!studentProfileId) {
        const studentProfile = await prisma.studentProfile.findFirst({
          where: { userId: user.id },
        });
        studentProfileId = studentProfile?.id;
      }
      if (!studentProfileId) {
        const anyStudent = await prisma.studentProfile.findFirst();
        studentProfileId = anyStudent?.id;
      }
      if (!studentProfileId) {
        return NextResponse.json({ error: "ملف الطالب غير متوفر" }, { status: 400 });
      }

      const { assignmentId, notes, audioUrl, audioDuration } = body;

      const submission = await prisma.assignmentSubmission.upsert({
        where: {
          assignmentId_studentId: {
            assignmentId,
            studentId: studentProfileId,
          },
        },
        update: {
          submittedAt: new Date(),
          notes,
          audioUrl: audioUrl || null,
          audioDuration: audioDuration || null,
          status: "SUBMITTED",
        },
        create: {
          assignmentId,
          studentId: studentProfileId,
          notes,
          audioUrl: audioUrl || null,
          audioDuration: audioDuration || null,
          status: "SUBMITTED",
        },
        include: {
          assignment: { include: { teacher: { include: { user: true } } } },
        },
      });

      // Notify Teacher
      await prisma.notification.create({
        data: {
          userId: submission.assignment.teacher.user.id,
          title: "تسليم واجب جديد",
          body: `قام الطالب ${user.name} بتسليم واجبه في: ${submission.assignment.title}.`,
          type: "ASSIGNMENT_NEW",
          link: "/teacher/assignments",
        },
      });

      return NextResponse.json({ success: true, submission });
    }

    // 2. Grade Submission by Teacher
    if (action === "GRADE_SUBMISSION") {
      if (user.role === "STUDENT") {
        return NextResponse.json({ error: "غير مصرح بالتقييم" }, { status: 403 });
      }

      const { submissionId, grade, teacherFeedback } = body;

      const submission = await prisma.assignmentSubmission.update({
        where: { id: submissionId },
        data: {
          grade: Number(grade),
          teacherFeedback,
          status: "GRADED",
        },
        include: {
          student: { include: { user: true } },
          assignment: true,
        },
      });

      // Notify Student
      await prisma.notification.create({
        data: {
          userId: submission.student.user.id,
          title: "تم تصحيح الواجب",
          body: `رصد المعلم درجتك (${grade}/100) في واجب: ${submission.assignment.title}.`,
          type: "EVALUATION_NEW",
          link: "/student/assignments",
        },
      });

      return NextResponse.json({ success: true, submission });
    }

    // 3. Create Assignment by Teacher
    if (user.role === "STUDENT") {
      return NextResponse.json({ error: "غير مصرح للمعلم فقط" }, { status: 403 });
    }

    const {
      halaqaId,
      title,
      type,
      surahNumber,
      startAyah,
      endAyah,
      dueDate,
      instructions,
      attachmentUrl,
    } = body;

    let teacherProfileId = user.teacherProfile?.id;
    if (!teacherProfileId) {
      const t = await prisma.user.findFirst({
        where: { role: "TEACHER" },
        include: { teacherProfile: true },
      });
      teacherProfileId = t?.teacherProfile?.id;
    }

    if (!teacherProfileId) {
      return NextResponse.json({ error: "ملف المعلم غير متوفر" }, { status: 400 });
    }

    const assignment = await prisma.assignment.create({
      data: {
        halaqaId,
        teacherId: teacherProfileId,
        title,
        type: type || "NEW_MEMORIZATION",
        surahNumber: surahNumber ? Number(surahNumber) : null,
        startAyah: startAyah ? Number(startAyah) : null,
        endAyah: endAyah ? Number(endAyah) : null,
        dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        instructions,
        attachmentUrl,
      },
      include: {
        halaqa: {
          include: {
            enrollments: {
              where: { status: "ACTIVE" },
              include: { student: { include: { user: true } } },
            },
          },
        },
      },
    });

    // Notify all students in the halaqa
    for (const enrollment of assignment.halaqa.enrollments) {
      await prisma.notification.create({
        data: {
          userId: enrollment.student.user.id,
          title: `تكليف جديد: ${title}`,
          body: `أضاف المعلم واجباً جديداً للحلقة يستحق التسليم في ${new Date(assignment.dueDate).toLocaleDateString("ar-SA")}.`,
          type: "ASSIGNMENT_NEW",
          link: "/student/assignments",
        },
      });
    }

    return NextResponse.json({ success: true, assignment });
  } catch (error) {
    console.error("Assignments POST error:", error);
    return NextResponse.json({ error: "فشل إنشاء أو تعديل الواجب" }, { status: 500 });
  }
}
