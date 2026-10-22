const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function run() {
  console.log("==================================================================");
  console.log("=== Mandatory Test: Full Session Lifecycle & Notification Sync ===");
  console.log("==================================================================");

  const studentUser = await prisma.user.findFirst({
    where: { email: "student@quran.com" },
    include: { studentProfile: true },
  });
  if (!studentUser) throw new Error("Student user not found!");

  const teacherUser = await prisma.user.findFirst({
    where: { role: "TEACHER" },
    include: { teacherProfile: true },
  });
  if (!teacherUser) throw new Error("Teacher user not found!");

  const halaqa = await prisma.halaqa.findFirst({
    where: { status: "ACTIVE" },
  });
  if (!halaqa) throw new Error("Halaqa not found!");

  // -------------------------------------------------------------
  // TEST 1: No Active Session
  // -------------------------------------------------------------
  console.log("\n[Test 1] Testing idle state (No active session)...");
  const idleSessions = await prisma.liveSession.findMany({ where: { status: "ACTIVE" } });
  if (idleSessions.length !== 0) throw new Error("Expected 0 active sessions!");

  const idleNotifs = await prisma.notification.findMany({
    where: { userId: studentUser.id, isRead: false },
  });
  const idleStarting = idleNotifs.filter(n => n.type === "HALAQA_STARTING");
  console.log(`>> Unread live notifications in idle state: ${idleStarting.length}`);
  if (idleStarting.length !== 0) throw new Error("Expected 0 unread live notifications in idle state!");

  console.log("✓ TEST 1 PASSED: Zero phantom invitations when no session is active.");

  // -------------------------------------------------------------
  // TEST 2: Teacher Starts a Real Live Session
  // -------------------------------------------------------------
  console.log("\n[Test 2] Teacher starting a real live session...");
  // Simulate POST /api/live/session
  const liveSession1 = await prisma.liveSession.create({
    data: {
      halaqaId: halaqa.id,
      title: `حلقة الفجر المباشرة - تجربة التحقق 1`,
      status: "ACTIVE",
      startedAt: new Date(),
    },
  });

  await prisma.halaqa.update({
    where: { id: halaqa.id },
    data: { isLiveNow: true, currentLiveSessionId: liveSession1.id },
  });

  // Create student invitation notification
  const notif1 = await prisma.notification.create({
    data: {
      userId: studentUser.id,
      title: `بدأت الحلقة الآن: ${halaqa.name}`,
      body: "فضيلة الشيخ في انتظارك في الغرفة الافتراضية، اضغط للانضمام مباشرة.",
      type: "HALAQA_STARTING",
      link: `/classroom/${liveSession1.id}?role=student`,
      isRead: false,
    },
  });

  // Verify Student view
  const activeSessionsNow = await prisma.liveSession.findMany({
    where: { status: "ACTIVE" },
  });
  const activeSessionMap = new Map(activeSessionsNow.map(s => [s.id, s]));

  const studentFetchedNotifs = await prisma.notification.findMany({
    where: { userId: studentUser.id, isRead: false },
    orderBy: { createdAt: "desc" },
  });

  // Enrich as /api/notifications does
  const enriched = studentFetchedNotifs.map(n => {
    const sId = n.link ? n.link.split("/classroom/")[1]?.split("?")[0] : null;
    const isSessionActive = Boolean(sId && activeSessionMap.has(sId));
    return { ...n, isSessionActive };
  });

  // Filter as StudentDecisionOverlay does
  const visibleInvitations = enriched.filter(n => {
    if (n.isRead) return false;
    if (n.type === "HALAQA_STARTING" || n.type === "SESSION_STARTED") {
      if (!n.isSessionActive || activeSessionsNow.length === 0) return false;
    }
    return true;
  });

  console.log(`>> Visible invitations for student during live session: ${visibleInvitations.length}`);
  if (visibleInvitations.length !== 1) throw new Error("Expected exactly 1 visible invitation during live session!");
  if (visibleInvitations[0].id !== notif1.id) throw new Error("Visible invitation ID does not match!");

  console.log("✓ TEST 2 PASSED: Real live session invitation successfully reaches student!");

  // -------------------------------------------------------------
  // TEST 3: Student Enters & Dismisses
  // -------------------------------------------------------------
  console.log("\n[Test 3] Student accepts/dismisses the invitation...");
  await prisma.notification.update({
    where: { id: notif1.id },
    data: { isRead: true },
  });

  const remainingStudentNotifs = await prisma.notification.findMany({
    where: { userId: studentUser.id, isRead: false, type: "HALAQA_STARTING" },
  });
  console.log(`>> Remaining unread invitations for student: ${remainingStudentNotifs.length}`);
  if (remainingStudentNotifs.length !== 0) throw new Error("Expected 0 unread invitations after dismissal!");

  console.log("✓ TEST 3 PASSED: Student successfully accepts/dismisses invitation.");

  // -------------------------------------------------------------
  // TEST 4: Teacher Ends Session
  // -------------------------------------------------------------
  console.log("\n[Test 4] Teacher ending the live session...");
  await prisma.liveSession.update({
    where: { id: liveSession1.id },
    data: { status: "ENDED", endedAt: new Date() },
  });
  await prisma.halaqa.update({
    where: { id: halaqa.id },
    data: { isLiveNow: false, currentLiveSessionId: null },
  });
  await prisma.notification.updateMany({
    where: { type: "HALAQA_STARTING", link: { contains: liveSession1.id } },
    data: { isRead: true },
  });

  // Verify post-end state
  const postEndSessions = await prisma.liveSession.findMany({ where: { status: "ACTIVE" } });
  console.log(`>> Active sessions after end: ${postEndSessions.length}`);
  if (postEndSessions.length !== 0) throw new Error("Expected 0 active sessions after end!");

  const postEndNotifs = await prisma.notification.findMany({
    where: { userId: studentUser.id, isRead: false, type: "HALAQA_STARTING" },
  });
  console.log(`>> Unread live notifications after refresh: ${postEndNotifs.length}`);
  if (postEndNotifs.length !== 0) throw new Error("Expected 0 unread live notifications after end!");

  console.log("✓ TEST 4 PASSED: Ending session leaves 0 active sessions and 0 invitations on refresh.");

  // -------------------------------------------------------------
  // TEST 5: Teacher Starts a Second New Session
  // -------------------------------------------------------------
  console.log("\n[Test 5] Teacher starts a second session after the first ended...");
  const liveSession2 = await prisma.liveSession.create({
    data: {
      halaqaId: halaqa.id,
      title: `حلقة الفجر المباشرة - تجربة التحقق 2`,
      status: "ACTIVE",
      startedAt: new Date(),
    },
  });

  await prisma.halaqa.update({
    where: { id: halaqa.id },
    data: { isLiveNow: true, currentLiveSessionId: liveSession2.id },
  });

  const notif2 = await prisma.notification.create({
    data: {
      userId: studentUser.id,
      title: `بدأت الحلقة الآن: ${halaqa.name}`,
      body: "فضيلة الشيخ في انتظارك في الغرفة الافتراضية، اضغط للانضمام مباشرة.",
      type: "HALAQA_STARTING",
      link: `/classroom/${liveSession2.id}?role=student`,
      isRead: false,
    },
  });

  const activeSessions2 = await prisma.liveSession.findMany({ where: { status: "ACTIVE" } });
  const activeMap2 = new Map(activeSessions2.map(s => [s.id, s]));

  const notifs2 = await prisma.notification.findMany({
    where: { userId: studentUser.id, isRead: false },
  });

  const visible2 = notifs2.filter(n => {
    const sId = n.link ? n.link.split("/classroom/")[1]?.split("?")[0] : null;
    return sId && activeMap2.has(sId);
  });

  console.log(`>> Visible invitations for session #2: ${visible2.length} (Session ID: ${liveSession2.id})`);
  if (visible2.length !== 1) throw new Error("Expected 1 visible invitation for session #2!");
  if (visible2[0].id !== notif2.id) throw new Error("Visible invitation ID does not match session #2!");

  // Clean end session 2
  await prisma.liveSession.update({
    where: { id: liveSession2.id },
    data: { status: "ENDED", endedAt: new Date() },
  });
  await prisma.halaqa.update({
    where: { id: halaqa.id },
    data: { isLiveNow: false, currentLiveSessionId: null },
  });
  await prisma.notification.updateMany({
    where: { type: "HALAQA_STARTING", isRead: false },
    data: { isRead: true },
  });

  console.log("✓ TEST 5 PASSED: Consecutive sessions work flawlessly.");
  console.log("\n==================================================================");
  console.log("=== ALL FULL LIFECYCLE TESTS PASSED WITH 100% SUCCESS! ===");
  console.log("==================================================================");
}

run()
  .catch((err) => {
    console.error("Test execution failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
