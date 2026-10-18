import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    const { searchParams } = new URL(req.url);
    let studentId = searchParams.get("studentId");
    const halaqaId = searchParams.get("halaqaId");

    if (!studentId && user?.role === "STUDENT" && user.studentProfile) {
      studentId = user.studentProfile.id;
    }

    const where: any = {};
    if (studentId) where.studentId = studentId;

    const evaluations = await prisma.evaluation.findMany({
      where,
      include: {
        student: { include: { user: true } },
        teacher: { include: { user: true } },
      },
      orderBy: { date: "desc" },
    });

    const memorizationRecords = await prisma.memorizationRecord.findMany({
      where,
      include: {
        student: { include: { user: true } },
        halaqa: true,
      },
      orderBy: { date: "desc" },
    });

    return NextResponse.json({ evaluations, memorizationRecords });
  } catch (error) {
    console.error("Get evaluations error:", error);
    return NextResponse.json({ error: "فشل استرداد التقييمات" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role === "STUDENT") {
      return NextResponse.json({ error: "غير مصرح للمعلم فقط" }, { status: 403 });
    }

    const body = await req.json();
    const {
      studentId,
      halaqaId,
      sessionId,
      surahNumber,
      startAyah,
      endAyah,
      recordType,
      mistakesCount,
      alertsCount,
      tajweedLevel,
      memorizationScore,
      tajweedScore,
      notes,
      nextAssignmentText,
    } = body;

    if (!studentId) {
      return NextResponse.json({ error: "معرف الطالب مطلوب" }, { status: 400 });
    }

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

    const memScore = Number(memorizationScore) || 100;
    const tajScore = Number(tajweedScore) || 100;
    const totalScore = Math.round((memScore * 0.6 + tajScore * 0.4) * 10) / 10;

    let gradeLabel = "ممتاز";
    if (totalScore < 70) gradeLabel = "يحتاج مراجعة";
    else if (totalScore < 80) gradeLabel = "جيد";
    else if (totalScore < 90) gradeLabel = "جيد جداً";

    // 1. Create Evaluation
    const evaluation = await prisma.evaluation.create({
      data: {
        studentId,
        teacherId: teacherProfileId,
        sessionId: sessionId || null,
        score: totalScore,
        gradeLabel,
        memorizationScore: memScore,
        tajweedScore: tajScore,
        notes,
        nextAssignmentText,
      },
      include: {
        student: { include: { user: true } },
      },
    });

    // 2. Create Memorization Record if Surah was specified
    let memRecord = null;
    if (surahNumber && halaqaId) {
      const ayahDiff = Math.max(1, (Number(endAyah) || 1) - (Number(startAyah) || 1) + 1);

      memRecord = await prisma.memorizationRecord.create({
        data: {
          studentId,
          teacherId: teacherProfileId,
          halaqaId,
          surahNumber: Number(surahNumber),
          startAyah: Number(startAyah) || 1,
          endAyah: Number(endAyah) || 1,
          recordType: recordType || "NEW_MEMORIZATION",
          mistakesCount: Number(mistakesCount) || 0,
          alertsCount: Number(alertsCount) || 0,
          tajweedLevel: tajweedLevel || "ممتاز",
          memorizationScore: memScore,
          notes,
        },
      });

      // Update student profile stats based on confirmed teacher achievement
      if (recordType === "NEW_MEMORIZATION") {
        await prisma.studentProfile.update({
          where: { id: studentId },
          data: {
            totalMemorizedAyahs: { increment: ayahDiff },
          },
        });
      } else {
        await prisma.studentProfile.update({
          where: { id: studentId },
          data: {
            totalReviewedAyahs: { increment: ayahDiff },
          },
        });
      }
    }

    // Notify Student
    await prisma.notification.create({
      data: {
        userId: evaluation.student.user.id,
        title: `تقييم جديد (${gradeLabel} - ${totalScore}%)`,
        body: `رصد المعلم تقييماً لجلسة التسميع الأخيرة: ${notes || "بارك الله فيك"}`,
        type: "EVALUATION_NEW",
        link: "/student/achievements",
      },
    });

    return NextResponse.json({ success: true, evaluation, memRecord });
  } catch (error) {
    console.error("Create evaluation error:", error);
    return NextResponse.json({ error: "فشل حفظ التقييم" }, { status: 500 });
  }
}
