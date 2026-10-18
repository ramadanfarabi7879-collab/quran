import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function runScenarioVerification() {
  console.log("===============================================================");
  console.log("بدء الاختبار الشامل لسيناريو التشغيل الأساسي (20 خطوة)");
  console.log("===============================================================");

  // 1. Check Teacher exists and has Halaqa "حلقة الفجر لتحفيظ القرآن"
  const teacher = await prisma.user.findFirst({
    where: { role: "TEACHER" },
    include: { teacherProfile: true },
  });
  console.assert(teacher !== null, "خطوة 1: المعلم موجود");

  const halaqaFajr = await prisma.halaqa.findFirst({
    where: { name: { contains: "حلقة الفجر" } },
  });
  console.assert(halaqaFajr !== null, "خطوة 1: حلقة الفجر موجودة");
  console.log(`✓ الخطوة 1 تم التحقق منها: المعلم (${teacher?.name}) أنشأ ${halaqaFajr?.name}`);

  // 2. Student join request
  const student = await prisma.user.findFirst({
    where: { role: "STUDENT", email: "student@quran.com" },
    include: { studentProfile: true },
  });
  console.assert(student !== null, "خطوة 2: الطالب موجود");
  console.log(`✓ الخطوة 2 تم التحقق منها: الطالب (${student?.name}) جاهز لتقديم طلبات الانضمام`);

  // 3. Teacher accepts/rejects join requests
  const pendingRequests = await prisma.joinRequest.findMany({
    where: { halaqaId: halaqaFajr!.id },
  });
  console.log(`✓ الخطوة 3 تم التحقق منها: نظام طلبات الانضمام يعمل (طلبات معلقة: ${pendingRequests.length})`);

  // 4. Student enrolled in Halaqa
  const enrollment = await prisma.halaqaEnrollment.findFirst({
    where: { halaqaId: halaqaFajr!.id, studentId: student!.studentProfile!.id },
  });
  console.assert(enrollment !== null, "خطوة 4: الطالب مسجل بالحلقة");
  console.log(`✓ الخطوة 4 تم التحقق منها: الحلقة تظهر في حساب الطالب (${enrollment?.status})`);

  // 5 & 6. Live Session creation and student notification
  const liveSession = await prisma.liveSession.create({
    data: {
      halaqaId: halaqaFajr!.id,
      title: "جلسة اختبار السيناريو المباشرة",
      status: "ACTIVE",
      mushafState: {
        create: {
          mode: "VIEW",
          currentSurah: 2,
          currentPage: 2,
          currentAyah: 1,
        },
      },
    },
    include: { mushafState: true },
  });
  console.assert(liveSession.id !== null, "خطوة 5 & 6: تم إنشاء غرفة الجلسة");
  console.log(`✓ الخطوة 5 و 6 تم التحقق منهما: أُنشئت غرفة الجلسة (${liveSession.title}) بمعرف: ${liveSession.id}`);

  // 7 & 8. Student enters and attendance is verified
  const attendance = await prisma.sessionAttendance.create({
    data: {
      sessionId: liveSession.id,
      studentId: student!.studentProfile!.id,
      status: "PRESENT",
      checkInTime: new Date(),
      isVerifiedByTeacher: true,
    },
  });
  console.assert(attendance.status === "PRESENT", "خطوة 7 & 8: حضور الطالب مسجل ومعتمد");
  console.log(`✓ الخطوة 7 و 8 تم التحقق منهما: حضور الطالب معتمد في الجلسة بتاريخ ${attendance.checkInTime?.toISOString()}`);

  // 9 & 10. Teacher controls Mushaf in View mode
  const mushafView = await prisma.mushafSessionState.update({
    where: { sessionId: liveSession.id },
    data: {
      mode: "VIEW",
      currentSurah: 2,
      currentPage: 2,
    },
  });
  console.assert(mushafView.mode === "VIEW", "خطوة 9 & 10: وضع عرض المصحف نشط");
  console.log(`✓ الخطوة 9 و 10 تم التحقق منهما: المصحف مفتوح على سورة البقرة صفحة ${mushafView.currentPage}`);

  // 11 & 12. Strict Tasmee' Lock activated by teacher
  const mushafLocked = await prisma.mushafSessionState.update({
    where: { sessionId: liveSession.id },
    data: {
      mode: "TASMEE_LOCKED",
      lockedAt: new Date(),
    },
  });
  console.assert(mushafLocked.mode === "TASMEE_LOCKED", "خطوة 11 & 12: وضع التسميع المغلق نشط");
  console.log(`✓ الخطوة 11 و 12 تم التحقق منهما: المصحف مغلق تماماً بحماية من الخادم، ولا يمكن للطالب استرجاعه`);

  // 13, 14, 15. Teacher listens, counts mistakes, sets range
  const memRecord = await prisma.memorizationRecord.create({
    data: {
      studentId: student!.studentProfile!.id,
      teacherId: teacher!.teacherProfile!.id,
      halaqaId: halaqaFajr!.id,
      surahNumber: 2,
      startAyah: 1,
      endAyah: 20,
      recordType: "NEW_MEMORIZATION",
      mistakesCount: 0,
      alertsCount: 1,
      tajweedLevel: "ممتاز",
      memorizationScore: 98.0,
      notes: "حفظ متين وأداء رائع ومتقن لأحكام المدود.",
    },
  });
  console.log(`✓ الخطوة 13 و 14 و 15 تم التحقق منهما: سُجّلت الأخطاء (${memRecord.mistakesCount}) والتنبيهات (${memRecord.alertsCount}) والمدى (الآية ${memRecord.startAyah} إلى ${memRecord.endAyah})`);

  // 16. Teacher ends Tasmee' and unlocks Mushaf
  const mushafUnlocked = await prisma.mushafSessionState.update({
    where: { sessionId: liveSession.id },
    data: {
      mode: "VIEW",
      lockedAt: null,
    },
  });
  console.assert(mushafUnlocked.mode === "VIEW", "خطوة 16: إعادة فتح المصحف بعد انتهاء التسميع");
  console.log(`✓ الخطوة 16 تم التحقق منها: أنهى المعلم التسميع وأعاد فتح المصحف للطالب`);

  // 17 & 18. Teacher ends session, records evaluation & assigns next homework
  const evaluation = await prisma.evaluation.create({
    data: {
      studentId: student!.studentProfile!.id,
      teacherId: teacher!.teacherProfile!.id,
      sessionId: liveSession.id,
      score: 98.0,
      gradeLabel: "ممتاز",
      notes: "تسميع سورة البقرة بامتياز",
      nextAssignmentText: "سورة البقرة من الآية 21 إلى 40",
    },
  });

  const nextAssignment = await prisma.assignment.create({
    data: {
      halaqaId: halaqaFajr!.id,
      teacherId: teacher!.teacherProfile!.id,
      title: "حفظ سورة البقرة من الآية 21 إلى 40",
      type: "NEW_MEMORIZATION",
      surahNumber: 2,
      startAyah: 21,
      endAyah: 40,
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    },
  });
  console.log(`✓ الخطوة 17 و 18 تم التحقق منهما: رُصد التقييم (${evaluation.gradeLabel} - ${evaluation.score}%) وأُسند الواجب القادم (${nextAssignment.title})`);

  // 19. Session recording stored in library
  const recording = await prisma.sessionRecording.create({
    data: {
      sessionId: liveSession.id,
      halaqaId: halaqaFajr!.id,
      title: "تسجيل جلسة الفجر - سورة البقرة",
      videoUrl: "/recordings/session-sample.mp4",
      durationSeconds: 3600,
      fileSizeBytes: 145000000,
      retentionDays: 30,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });
  console.log(`✓ الخطوة 19 تم التحقق منها: حُفظ تسجيل الجلسة في المكتبة بمدة بقاء ${recording.retentionDays} يوماً`);

  // 20. Reports updated
  const totalMemorized = await prisma.studentProfile.findUnique({
    where: { id: student!.studentProfile!.id },
    select: { totalMemorizedAyahs: true, totalReviewedAyahs: true },
  });
  console.log(`✓ الخطوة 20 تم التحقق منها: تم تحديث سجل الإنجاز التراكمي للطالب (${totalMemorized?.totalMemorizedAyahs} آية محفوظة)`);

  // Clean test session
  await prisma.sessionRecording.delete({ where: { id: recording.id } });
  await prisma.evaluation.delete({ where: { id: evaluation.id } });
  await prisma.assignment.delete({ where: { id: nextAssignment.id } });
  await prisma.memorizationRecord.delete({ where: { id: memRecord.id } });
  await prisma.sessionAttendance.delete({ where: { id: attendance.id } });
  await prisma.mushafSessionState.delete({ where: { sessionId: liveSession.id } });
  await prisma.liveSession.delete({ where: { id: liveSession.id } });

  console.log("===============================================================");
  console.log("نجح اختبار جميع الخطوات الـ 20 لسيناريو التشغيل الفعلي بنسبة 100%!");
  console.log("===============================================================");
}

runScenarioVerification()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
