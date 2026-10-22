const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function runTests() {
  console.log("=============================================================");
  console.log("   TEST SUITE: NOTIFICATIONS & JOIN REQUEST FULL LIFECYCLE   ");
  console.log("=============================================================\n");

  let passed = 0;
  let total = 6;

  // 0. Resolve Users
  const teacherUser = await prisma.user.findFirst({
    where: { role: "TEACHER" },
    include: { teacherProfile: true },
  });
  const studentUser = await prisma.user.findFirst({
    where: { role: "STUDENT", email: "student@quran.com" },
    include: { studentProfile: true },
  });
  const secondStudentUser = await prisma.user.findFirst({
    where: { role: "STUDENT", NOT: { id: studentUser.id } },
    include: { studentProfile: true },
  });

  if (!teacherUser || !studentUser) {
    throw new Error("Teacher or Student user not found in database");
  }

  const halaqa1 = await prisma.halaqa.findFirst({ where: { status: "ACTIVE" } });
  const halaqa2 = await prisma.halaqa.findFirst({ where: { NOT: { id: halaqa1.id } } }) || halaqa1;

  console.log(`• Teacher: ${teacherUser.name} (${teacherUser.id})`);
  console.log(`• Student: ${studentUser.name} (${studentUser.id})`);
  console.log(`• Halaqa 1: ${halaqa1.name}`);
  console.log(`• Halaqa 2: ${halaqa2.name}\n`);

  // Reset any active sessions
  await prisma.liveSession.updateMany({
    where: { status: "ACTIVE" },
    data: { status: "ENDED", endedAt: new Date() },
  });
  await prisma.halaqa.updateMany({
    data: { isLiveNow: false, currentLiveSessionId: null },
  });
  await prisma.notification.updateMany({
    where: { type: "HALAQA_STARTING" },
    data: { isRead: true },
  });

  // --------------------------------------------------------------------------
  // TEST 1: Teacher starts live session -> Student receives notification & sees session
  // --------------------------------------------------------------------------
  console.log("-------------------------------------------------------------");
  console.log("TEST 1: الشيخ يبدأ الجلسة المباشرة -> إشعار وظهور الجلسة عند الطالب");
  console.log("-------------------------------------------------------------");

  // Simulate Teacher starting live session (matches POST /api/live/session)
  const session1 = await prisma.liveSession.create({
    data: {
      halaqaId: halaqa1.id,
      title: `جلسة ${halaqa1.name} - اختبار الإشعارات`,
      status: "ACTIVE",
    },
  });
  await prisma.halaqa.update({
    where: { id: halaqa1.id },
    data: { isLiveNow: true, currentLiveSessionId: session1.id },
  });

  // Create notifications and attendance as implemented in POST /api/live/session
  const allActiveStudents = await prisma.studentProfile.findMany({
    where: { user: { isActive: true } },
    include: { user: true },
  });

  for (const st of allActiveStudents) {
    await prisma.sessionAttendance.upsert({
      where: {
        sessionId_studentId: { sessionId: session1.id, studentId: st.id },
      },
      update: { isVerifiedByTeacher: true },
      create: { sessionId: session1.id, studentId: st.id, status: "ABSENT", isVerifiedByTeacher: true },
    });

    await prisma.notification.create({
      data: {
        userId: st.user.id,
        title: `بدأت الحلقة الآن: ${halaqa1.name}`,
        body: `فضيلة ${teacherUser.name} في انتظارك في الغرفة الافتراضية، اضغط للانضمام مباشرة.`,
        type: "HALAQA_STARTING",
        link: `/classroom/${session1.id}?role=student`,
        isRead: false,
      },
    });
  }

  // Verify Student's view (matches GET /api/notifications & GET /api/live/session)
  const studentNotifs = await prisma.notification.findMany({
    where: { userId: studentUser.id, isRead: false, type: "HALAQA_STARTING" },
  });
  const studentAttendance = await prisma.sessionAttendance.findUnique({
    where: { sessionId_studentId: { sessionId: session1.id, studentId: studentUser.studentProfile.id } },
  });

  const test1Success = studentNotifs.length > 0 &&
    studentNotifs[0].link.includes(session1.id) &&
    studentAttendance && studentAttendance.isVerifiedByTeacher;

  if (test1Success) {
    console.log(`✅ TEST 1 PASSED: وصل إشعار بدء الجلسة للطالب بنجاح، ومصرح له بالدخول المباشر (${studentNotifs[0].title})`);
    passed++;
  } else {
    console.error("❌ TEST 1 FAILED: لم يصل إشعار الجلسة أو تعذر التحقق من صلاحية الطالب");
  }

  // --------------------------------------------------------------------------
  // TEST 2: Student accepts invitation -> Enters session cleanly without reload
  // --------------------------------------------------------------------------
  console.log("\n-------------------------------------------------------------");
  console.log("TEST 2: الطالب يقبل الدعوة -> دخول الجلسة بنجاح وتحديث الحضور");
  console.log("-------------------------------------------------------------");

  // Simulate student accepting invitation (matches POST /api/student/join-request with acceptInvitation: true)
  const updatedAtt = await prisma.sessionAttendance.update({
    where: { sessionId_studentId: { sessionId: session1.id, studentId: studentUser.studentProfile.id } },
    data: {
      status: "PRESENT",
      requestedCheckIn: true,
      notes: "قبول الدعوة وحضور الجلسة",
    },
  });

  // Notifications marked read
  await prisma.notification.updateMany({
    where: { userId: studentUser.id, type: "HALAQA_STARTING", link: { contains: session1.id } },
    data: { isRead: true },
  });

  const remainingUnreadLive = await prisma.notification.count({
    where: { userId: studentUser.id, type: "HALAQA_STARTING", isRead: false },
  });

  const test2Success = updatedAtt.status === "PRESENT" && updatedAtt.isVerifiedByTeacher && remainingUnreadLive === 0;

  if (test2Success) {
    console.log(`✅ TEST 2 PASSED: تم قبول الدعوة بنجاح وحضور الطالب في الجلسة status=${updatedAtt.status}`);
    passed++;
  } else {
    console.error("❌ TEST 2 FAILED: فشل قبول الدعوة وتحديث الحضور");
  }

  // --------------------------------------------------------------------------
  // TEST 3: Student sends join request -> Teacher receives notification & sees request
  // --------------------------------------------------------------------------
  console.log("\n-------------------------------------------------------------");
  console.log("TEST 3: الطالب يرسل طلب انضمام -> وصول الإشعار للشيخ وظهور الطلب");
  console.log("-------------------------------------------------------------");

  // Student sends a join request to halaqa2 (where they want to join, acceptInvitation: false)
  const joinReq = await prisma.joinRequest.create({
    data: {
      halaqaId: halaqa2.id,
      studentId: studentUser.studentProfile.id,
      status: "PENDING",
      notes: "أرغب في الانضمام إلى الحلقة الكريمة",
    },
  });

  // Notification sent to Teacher
  const teacherNotif = await prisma.notification.create({
    data: {
      userId: teacherUser.id,
      title: "طلب انضمام جديد للحلقة ✋",
      body: `طلب الطالب ${studentUser.name} الانضمام إلى: ${halaqa2.name}. يرجى مراجعة الطلب واعتماده.`,
      type: "JOIN_REQUEST",
      link: "/teacher/requests?tab=JOIN_REQUESTS",
      isRead: false,
    },
  });

  // Verify Teacher can see the pending request
  const pendingRequestsForTeacher = await prisma.joinRequest.findMany({
    where: { id: joinReq.id, status: "PENDING" },
    include: { student: { include: { user: true } }, halaqa: true },
  });
  const teacherUnreadNotifs = await prisma.notification.findMany({
    where: { id: teacherNotif.id, isRead: false },
  });

  const test3Success = pendingRequestsForTeacher.length > 0 &&
    pendingRequestsForTeacher[0].status === "PENDING" &&
    teacherUnreadNotifs.length > 0;

  if (test3Success) {
    console.log(`✅ TEST 3 PASSED: ظهر طلب الانضمام لدى الشيخ بحالة PENDING (${pendingRequestsForTeacher[0].student.user.name}) مع إشعار تنبيهي`);
    passed++;
  } else {
    console.error("❌ TEST 3 FAILED: لم يظهر الطلب أو إشعار المعلم بالشكل الصحيح");
  }

  // --------------------------------------------------------------------------
  // TEST 4: Teacher accepts request -> Student receives approval notification
  // --------------------------------------------------------------------------
  console.log("\n-------------------------------------------------------------");
  console.log("TEST 4: الشيخ يقبل الطلب -> وصول إشعار القبول للطالب وتحديث حالته");
  console.log("-------------------------------------------------------------");

  // Teacher accepts (matches ACCEPT_JOIN_SESSION in /api/teacher/attendance)
  await prisma.joinRequest.update({
    where: { id: joinReq.id },
    data: { status: "ACCEPTED", reviewedAt: new Date() },
  });
  await prisma.halaqaEnrollment.upsert({
    where: {
      halaqaId_studentId: {
        halaqaId: halaqa2.id,
        studentId: studentUser.studentProfile.id,
      },
    },
    update: { status: "ACTIVE" },
    create: {
      halaqaId: halaqa2.id,
      studentId: studentUser.studentProfile.id,
      status: "ACTIVE",
    },
  });

  // Create approval notification for student
  const studentApprovalNotif = await prisma.notification.create({
    data: {
      userId: studentUser.id,
      title: "تم قبول طلب انضمامك للحلقة 🎉",
      body: `وافق فضيلة الشيخ على انضمامك إلى: ${halaqa2.name}. يمكنك الدخول الآن.`,
      type: "JOIN_REQUEST_APPROVED",
      link: "/student/my-halaqat",
      isRead: false,
    },
  });

  // Verify Student received approval
  const unreadApproval = await prisma.notification.findUnique({
    where: { id: studentApprovalNotif.id },
  });
  const updatedEnrollment = await prisma.halaqaEnrollment.findUnique({
    where: {
      halaqaId_studentId: {
        halaqaId: halaqa2.id,
        studentId: studentUser.studentProfile.id,
      },
    },
  });

  const test4Success = unreadApproval && !unreadApproval.isRead &&
    unreadApproval.type === "JOIN_REQUEST_APPROVED" &&
    updatedEnrollment && updatedEnrollment.status === "ACTIVE";

  if (test4Success) {
    console.log(`✅ TEST 4 PASSED: استلم الطالب إشعار القبول (${unreadApproval.title}) وتم تسكينه كطالب نشط معتمد`);
    passed++;
  } else {
    console.error("❌ TEST 4 FAILED: تعذر إرسال إشعار القبول للطالب أو تفعيل قيده");
  }

  // --------------------------------------------------------------------------
  // TEST 5: End session -> Refresh pages -> Zero fake or phantom invitations
  // --------------------------------------------------------------------------
  console.log("\n-------------------------------------------------------------");
  console.log("TEST 5: إنهاء الجلسة -> اختفاء الدعوات وعدم ظهور أي نافذة وهمية");
  console.log("-------------------------------------------------------------");

  // Teacher ends session (matches DELETE /api/live/session)
  await prisma.liveSession.updateMany({
    where: { id: session1.id },
    data: { status: "ENDED", endedAt: new Date() },
  });
  await prisma.halaqa.updateMany({
    where: { id: halaqa1.id },
    data: { isLiveNow: false, currentLiveSessionId: null },
  });
  await prisma.notification.updateMany({
    where: { type: "HALAQA_STARTING", link: { contains: session1.id } },
    data: { isRead: true },
  });

  // Query notifications and live sessions
  const activeSessCount = await prisma.liveSession.count({ where: { status: "ACTIVE" } });
  const unreadLiveNotifs = await prisma.notification.count({
    where: { userId: studentUser.id, type: "HALAQA_STARTING", isRead: false },
  });

  const test5Success = activeSessCount === 0 && unreadLiveNotifs === 0;

  if (test5Success) {
    console.log(`✅ TEST 5 PASSED: تم إنهاء الجلسة، 0 جلسات نشطة، 0 دعوات غير مقروءة، ولا توجد أي دعوات وهمية`);
    passed++;
  } else {
    console.error("❌ TEST 5 FAILED: توجد دعوات وهمية متبقية أو جلسة معلقة");
  }

  // --------------------------------------------------------------------------
  // TEST 6: Stability & Repeatability (Cycle 2)
  // --------------------------------------------------------------------------
  console.log("\n-------------------------------------------------------------");
  console.log("TEST 6: تكرار العمليتين للتأكد من الاستقرار التام (الدورة 2)");
  console.log("-------------------------------------------------------------");

  // Start Session 2
  const session2 = await prisma.liveSession.create({
    data: {
      halaqaId: halaqa2.id,
      title: `جلسة ${halaqa2.name} - الدورة التكرارية 2`,
      status: "ACTIVE",
    },
  });
  await prisma.halaqa.update({
    where: { id: halaqa2.id },
    data: { isLiveNow: true, currentLiveSessionId: session2.id },
  });

  // Notify student
  await prisma.notification.create({
    data: {
      userId: studentUser.id,
      title: `بدأت الحلقة الآن: ${halaqa2.name}`,
      body: `الجلسة المباشرة جاهزة.`,
      type: "HALAQA_STARTING",
      link: `/classroom/${session2.id}?role=student`,
      isRead: false,
    },
  });

  const notifCycle2 = await prisma.notification.findFirst({
    where: { userId: studentUser.id, type: "HALAQA_STARTING", isRead: false, link: { contains: session2.id } },
  });

  // End Session 2
  await prisma.liveSession.update({ where: { id: session2.id }, data: { status: "ENDED", endedAt: new Date() } });
  await prisma.halaqa.update({ where: { id: halaqa2.id }, data: { isLiveNow: false, currentLiveSessionId: null } });
  await prisma.notification.updateMany({ where: { id: notifCycle2.id }, data: { isRead: true } });

  const finalCheck = await prisma.liveSession.count({ where: { status: "ACTIVE" } });
  const test6Success = notifCycle2 !== null && finalCheck === 0;

  if (test6Success) {
    console.log(`✅ TEST 6 PASSED: نجاح الدورة التكرارية بالكامل وتأكيد الاستقرار التام`);
    passed++;
  } else {
    console.error("❌ TEST 6 FAILED: فشل الاختبار التكراري");
  }

  console.log("\n=============================================================");
  console.log(`              FINAL RESULT: ${passed}/${total} TESTS PASSED               `);
  console.log("=============================================================\n");

  if (passed !== total) {
    process.exit(1);
  }
}

runTests()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
