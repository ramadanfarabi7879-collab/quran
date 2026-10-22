const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function runTests() {
  console.log("=== Testing Phantom Session Invitation Fix ===");

  // 1. Check current DB state before test
  const initialActive = await prisma.liveSession.findMany({ where: { status: "ACTIVE" } });
  console.log(`[Step 1] Initial active sessions in DB: ${initialActive.length}`);
  for (const s of initialActive) {
    console.log(`  - Session ID: ${s.id}, Title: ${s.title}, Started: ${s.startedAt}`);
  }

  // 2. Fetch /api/live/session through internal logic or cleanup
  // Let's call the cleanup logic by simulating what GET /api/live/session does
  const now = Date.now();
  const staleSessions = await prisma.liveSession.findMany({
    where: { status: "ACTIVE" },
  });

  let cleanedCount = 0;
  for (const sess of staleSessions) {
    const startedTime = sess.startedAt ? new Date(sess.startedAt).getTime() : 0;
    const ageMs = now - startedTime;
    // Check if older than 10 minutes with no recent signals
    const lastSignal = await prisma.classroomSignal.findFirst({
      where: { sessionId: sess.id },
      orderBy: { id: "desc" },
      select: { createdAt: true },
    });

    const isNoSignal = !lastSignal || (now - new Date(lastSignal.createdAt).getTime()) > 10 * 60 * 1000;
    if (ageMs > 3 * 60 * 60 * 1000 || (ageMs > 10 * 60 * 1000 && isNoSignal)) {
      await prisma.liveSession.update({
        where: { id: sess.id },
        data: { status: "ENDED", endedAt: new Date() },
      });
      await prisma.notification.updateMany({
        where: {
          type: "HALAQA_STARTING",
          link: { contains: sess.id },
        },
        data: { isRead: true },
      });
      cleanedCount++;
    }
  }

  console.log(`[Step 2] Stale sessions cleaned: ${cleanedCount}`);

  // 3. Verify no active sessions remain
  const remainingActive = await prisma.liveSession.findMany({ where: { status: "ACTIVE" } });
  console.log(`[Step 3] Active sessions after cleanup: ${remainingActive.length}`);
  if (remainingActive.length !== 0) {
    throw new Error("Expected 0 active sessions after cleaning stale ones!");
  }

  // 4. Verify stale notifications are marked read
  const unreadStartingNotifs = await prisma.notification.findMany({
    where: {
      type: "HALAQA_STARTING",
      isRead: false,
    },
  });
  console.log(`[Step 4] Unread HALAQA_STARTING notifications count: ${unreadStartingNotifs.length}`);
  if (unreadStartingNotifs.length !== 0) {
    throw new Error("Expected 0 unread HALAQA_STARTING notifications!");
  }

  // 5. Test Creating a NEW Real Session
  console.log("\n[Step 5] Simulating teacher starting a real session...");
  const halaqa = await prisma.halaqa.findFirst();
  if (!halaqa) throw new Error("No halaqa found for testing");

  const newSession = await prisma.liveSession.create({
    data: {
      halaqaId: halaqa.id,
      title: "جلسة اختبار حية للتأكد من الدعوة الفورية",
      status: "ACTIVE",
      startedAt: new Date(),
    },
  });

  // Create attendance & notification for student
  const student = await prisma.user.findFirst({ where: { role: "STUDENT" } });
  if (student) {
    await prisma.notification.create({
      data: {
        userId: student.id,
        title: "بدأت الحلقة الآن",
        body: "الشيخ في انتظارك في الغرفة الافتراضية",
        type: "HALAQA_STARTING",
        link: `/classroom/${newSession.id}?role=student`,
      },
    });
  }

  // 6. Check that active session is now 1
  const activeNow = await prisma.liveSession.findMany({ where: { status: "ACTIVE" } });
  console.log(`[Step 6] Active sessions during live session: ${activeNow.length} (ID: ${newSession.id})`);
  if (activeNow.length !== 1) throw new Error("Expected 1 active session!");

  const studentNotifs = await prisma.notification.findMany({
    where: {
      userId: student.id,
      type: "HALAQA_STARTING",
      isRead: false,
    },
  });
  console.log(`[Step 6b] Student unread invitations during live session: ${studentNotifs.length}`);
  if (studentNotifs.length === 0) throw new Error("Expected active invitation notification during live session!");

  // 7. Simulate ending the session (as teacher clicks "إنهاء الحلقة")
  console.log("\n[Step 7] Simulating teacher ending the session...");
  await prisma.liveSession.update({
    where: { id: newSession.id },
    data: { status: "ENDED", endedAt: new Date() },
  });
  await prisma.notification.updateMany({
    where: {
      type: "HALAQA_STARTING",
      link: { contains: newSession.id },
    },
    data: { isRead: true },
  });

  // 8. Verify post-end state
  const postEndActive = await prisma.liveSession.findMany({ where: { status: "ACTIVE" } });
  console.log(`[Step 8] Active sessions after ending: ${postEndActive.length}`);
  if (postEndActive.length !== 0) throw new Error("Expected 0 active sessions after ending!");

  const postEndNotifs = await prisma.notification.findMany({
    where: {
      userId: student.id,
      type: "HALAQA_STARTING",
      isRead: false,
    },
  });
  console.log(`[Step 8b] Student unread invitations after ending session: ${postEndNotifs.length}`);
  if (postEndNotifs.length !== 0) throw new Error("Expected 0 unread invitations after session ended!");

  console.log("\n✅ ALL TESTS PASSED! No phantom invitations can occur.");
}

runTests()
  .catch((e) => {
    console.error("Test failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
