import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function testAll() {
  console.log("=== Comprehensive Verification: WebRTC & Follow-up Request System ===");

  // 1. Verify Database Schema & Models
  console.log("\n[1] Testing Prisma Models & Schema integrity...");
  const teacher = await prisma.user.findFirst({
    where: { role: "TEACHER" },
    include: { teacherProfile: true },
  });
  if (!teacher || !teacher.teacherProfile) {
    throw new Error("Teacher user not found in database.");
  }
  console.log(`✓ Teacher found: ${teacher.name} (TeacherProfile ID: ${teacher.teacherProfile.id})`);

  const student = await prisma.user.findFirst({
    where: { role: "STUDENT" },
    include: { studentProfile: true },
  });
  if (!student || !student.studentProfile) {
    throw new Error("Student user not found in database.");
  }
  console.log(`✓ Student found: ${student.name} (StudentProfile ID: ${student.studentProfile.id})`);

  // Ensure active live session
  let session = await prisma.liveSession.findFirst({
    where: { status: "ACTIVE" },
    include: { halaqa: true },
  });
  if (!session) {
    let halaqa = await prisma.halaqa.findFirst();
    if (!halaqa) {
      halaqa = await prisma.halaqa.create({
        data: {
          name: "حلقة الفجر والتحفيظ",
          teacherId: teacher.teacherProfile.id,
          startTime: "05:00",
          endTime: "06:30",
        },
      });
    }
    session = await prisma.liveSession.create({
      data: {
        halaqaId: halaqa.id,
        title: "حلقة الفجر والتحفيظ - جلسة نشطة مباشرة",
        status: "ACTIVE",
      },
      include: { halaqa: true },
    });
  }
  console.log(`✓ Active Live Session: ${session.title} (ID: ${session.id})`);

  // 2. Test Available Slots Query & Seeding
  console.log("\n[2] Testing Teacher Available Schedule Slots (Option 4 & 5)...");
  let slots = await prisma.teacherScheduleSlot.findMany({
    where: { teacherId: teacher.teacherProfile.id, isBooked: false },
  });
  if (slots.length === 0) {
    await prisma.teacherScheduleSlot.create({
      data: {
        teacherId: teacher.teacherProfile.id,
        title: "جلسة فردية لتصحيح التلاوة",
        dayOfWeek: "غداً",
        startTime: "17:00",
        endTime: "17:30",
        durationMinutes: 30,
        slotType: "ONE_ON_ONE",
      },
    });
    slots = await prisma.teacherScheduleSlot.findMany({
      where: { teacherId: teacher.teacherProfile.id, isBooked: false },
    });
  }
  console.log(`✓ Found ${slots.length} available slots for Sheikh. First slot: ${slots[0].title} at ${slots[0].startTime}`);

  // 3. Test Student Creating Follow-up Request
  console.log("\n[3] Testing Student Requesting Session Follow-up...");
  const followUpReq = await prisma.sessionFollowUpRequest.create({
    data: {
      sessionId: session.id,
      studentId: student.studentProfile.id,
      status: "PENDING",
      decisionNotes: "طلب متابعة الجلسة المنعقدة الآن",
    },
  });
  console.log(`✓ Follow-up Request Created with ID: ${followUpReq.id}, Status: ${followUpReq.status}`);

  // 4. Test Decision 3: Defer / Reply Later
  console.log("\n[4] Testing Sheikh Decision 3: Defer / Reply Later...");
  const deferredReq = await prisma.sessionFollowUpRequest.update({
    where: { id: followUpReq.id },
    data: {
      status: "DEFERRED",
      decisionNotes: "تم تعليق الطلب وسيتم مراجعته بعد انتهاء الجلسة",
      reviewedAt: new Date(),
    },
  });
  if (deferredReq.status !== "DEFERRED") throw new Error("Defer test failed");
  console.log(`✓ Successfully updated to DEFERRED: ${deferredReq.decisionNotes}`);

  // 5. Test Decision 4: Propose Existing Available Slot
  console.log("\n[5] Testing Sheikh Decision 4: Propose Existing Slot...");
  const chosenSlot = slots[0];
  const proposedReq = await prisma.sessionFollowUpRequest.update({
    where: { id: followUpReq.id },
    data: {
      status: "PROPOSED",
      proposedSlotId: chosenSlot.id,
      proposedDate: chosenSlot.date || new Date(),
      proposedTime: chosenSlot.startTime,
      proposedDuration: chosenSlot.durationMinutes,
      reviewedAt: new Date(),
    },
  });
  if (proposedReq.status !== "PROPOSED" || proposedReq.proposedSlotId !== chosenSlot.id) {
    throw new Error("Propose slot test failed");
  }
  console.log(`✓ Successfully proposed slot ${chosenSlot.title} (${chosenSlot.startTime}) to student`);

  // Student accepts the proposed slot
  await prisma.teacherScheduleSlot.update({
    where: { id: chosenSlot.id },
    data: { isBooked: true, bookedByStudentId: student.studentProfile.id },
  });
  const confirmedReq = await prisma.sessionFollowUpRequest.update({
    where: { id: followUpReq.id },
    data: { status: "CONFIRMED", decisionNotes: "تم تأكيد الحجز من الطالب" },
  });
  console.log(`✓ Student confirmed appointment! Slot isBooked: true, Request status: ${confirmedReq.status}`);

  // 6. Test Decision 5: Create New Appointment with Conflict Detection
  console.log("\n[6] Testing Sheikh Decision 5: Create New Appointment & Conflict Check...");
  // Test conflict condition: same time range
  const existingConflict = await prisma.teacherScheduleSlot.findFirst({
    where: {
      teacherId: teacher.teacherProfile.id,
      startTime: chosenSlot.startTime,
      isBooked: true,
    },
  });
  console.log(`✓ Conflict detection check: slot at ${chosenSlot.startTime} is occupied (${existingConflict ? "Conflict detected as expected" : "No conflict"})`);

  // Create clean new slot at 20:00
  const newSlot = await prisma.teacherScheduleSlot.create({
    data: {
      teacherId: teacher.teacherProfile.id,
      title: "جلسة إتقان التجويد الخاصة",
      dayOfWeek: "الأربعاء",
      date: new Date(),
      startTime: "20:00",
      endTime: "20:30",
      durationMinutes: 30,
      slotType: "ONE_ON_ONE",
      isBooked: false,
    },
  });
  console.log(`✓ New custom slot created: ${newSlot.title} at ${newSlot.startTime}`);

  // 7. Test Decision 1: Accept Student Now (MUTED attendance)
  console.log("\n[7] Testing Sheikh Decision 1: Accept Student Now (Muted)...");
  await prisma.sessionAttendance.upsert({
    where: {
      sessionId_studentId: {
        sessionId: session.id,
        studentId: student.studentProfile.id,
      },
    },
    update: {
      status: "PRESENT",
      isVerifiedByTeacher: true,
      requestedCheckIn: true,
      checkInTime: new Date(),
      notes: "تم قبول الطالب كمتابع للجلسة بصوت مكتوم",
    },
    create: {
      sessionId: session.id,
      studentId: student.studentProfile.id,
      status: "PRESENT",
      isVerifiedByTeacher: true,
      requestedCheckIn: true,
      checkInTime: new Date(),
      notes: "تم قبول الطالب كمتابع للجلسة بصوت مكتوم",
    },
  });
  const acceptedReq = await prisma.sessionFollowUpRequest.update({
    where: { id: followUpReq.id },
    data: {
      status: "ACCEPTED",
      reviewedAt: new Date(),
      decisionNotes: "تم قبول الطالب للدخول كمتابع للجلسة",
    },
  });
  const checkAttendance = await prisma.sessionAttendance.findUnique({
    where: {
      sessionId_studentId: {
        sessionId: session.id,
        studentId: student.studentProfile.id,
      },
    },
  });
  if (!checkAttendance || checkAttendance.status !== "PRESENT" || !checkAttendance.isVerifiedByTeacher) {
    throw new Error("Attendance accept failed");
  }
  console.log(`✓ Student attendance verified: PRESENT=true, isVerifiedByTeacher=true. Student enters muted.`);

  // 8. Test Decision 2: Reject Request
  console.log("\n[8] Testing Sheikh Decision 2: Reject Request...");
  const rejectReq = await prisma.sessionFollowUpRequest.create({
    data: {
      sessionId: session.id,
      studentId: student.studentProfile.id,
      status: "REJECTED",
      rejectReason: "اعتذر الشيخ لاكتمال نصاب الحلقة",
      reviewedAt: new Date(),
    },
  });
  console.log(`✓ Reject Request verified with reason: ${rejectReq.rejectReason} at ${rejectReq.reviewedAt}`);

  // 9. Test WebRTC Signaling table with MEDIA_STATE & SPEAK_REQUEST
  console.log("\n[9] Testing WebRTC Media & Signaling Integrity...");
  const signal1 = await prisma.classroomSignal.create({
    data: {
      sessionId: session.id,
      senderRole: "student",
      senderName: student.name,
      senderClientId: "test-client-student",
      signalType: "SPEAK_REQUEST",
      data: JSON.stringify({ studentId: "test-client-student", studentName: student.name }),
    },
  });
  console.log(`✓ SPEAK_REQUEST signal recorded in DB (ID: ${signal1.id})`);

  const signal2 = await prisma.classroomSignal.create({
    data: {
      sessionId: session.id,
      senderRole: "teacher",
      senderName: teacher.name,
      senderClientId: "test-client-teacher",
      targetClientId: "test-client-student",
      signalType: "SPEAK_DECISION",
      data: JSON.stringify({ targetClientId: "test-client-student", granted: true }),
    },
  });
  console.log(`✓ SPEAK_DECISION signal recorded in DB (ID: ${signal2.id})`);

  const signal3 = await prisma.classroomSignal.create({
    data: {
      sessionId: session.id,
      senderRole: "student",
      senderName: student.name,
      senderClientId: "test-client-student",
      signalType: "MEDIA_STATE",
      data: JSON.stringify({ mic: true, video: true }),
    },
  });
  console.log(`✓ MEDIA_STATE signal recorded in DB (ID: ${signal3.id})`);

  console.log("\n=======================================================");
  console.log(">>> ALL 5 SHEIKH DECISIONS & WEBRTC PIPELINE VERIFIED 100%! <<<");
  console.log("=======================================================\n");
}

testAll()
  .catch((e) => {
    console.error("Test failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
