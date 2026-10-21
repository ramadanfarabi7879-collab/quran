const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function runSignalingTests() {
  console.log("=== Testing WebRTC Signaling & Concurrency Rigorously ===");
  const testSession1 = "test-session-1-" + Date.now();
  const testSession2 = "test-session-2-" + Date.now();

  try {
    // 1. Test Concurrent Writes (ICE candidate burst)
    console.log("1. Testing 20 concurrent ICE candidates in session 1...");
    const burstPromises = [];
    for (let i = 0; i < 20; i++) {
      burstPromises.push(
        prisma.classroomSignal.create({
          data: {
            sessionId: testSession1,
            senderRole: "student",
            senderName: "طالب العلم",
            senderClientId: "student-client-1",
            targetClientId: "teacher-client-1",
            signalType: "ICE_CANDIDATE",
            data: JSON.stringify({ candidate: `candidate:burst-${i}`, sdpMLineIndex: 0 }),
          },
        })
      );
    }

    const createdBurst = await Promise.all(burstPromises);
    console.log(`✓ All 20 signals inserted atomically. Unique IDs: ${new Set(createdBurst.map(s => s.id)).size}/20`);
    if (new Set(createdBurst.map(s => s.id)).size !== 20) {
      throw new Error("Duplicate or lost IDs during concurrent write burst!");
    }

    // 2. Test Session Isolation (Session 2 vs Session 1)
    console.log("2. Testing session isolation...");
    await prisma.classroomSignal.create({
      data: {
        sessionId: testSession2,
        senderRole: "teacher",
        senderName: "معلم حلقة أخرى",
        senderClientId: "other-teacher",
        targetClientId: null,
        signalType: "OFFER",
        data: JSON.stringify({ sdp: "dummy-offer-session2" }),
      },
    });

    const session1Signals = await prisma.classroomSignal.findMany({
      where: { sessionId: testSession1 },
    });
    const session2Signals = await prisma.classroomSignal.findMany({
      where: { sessionId: testSession2 },
    });

    console.log(`✓ Session 1 has ${session1Signals.length} signals (expected 20)`);
    console.log(`✓ Session 2 has ${session2Signals.length} signals (expected 1)`);
    if (session1Signals.length !== 20 || session2Signals.length !== 1) {
      throw new Error("Session isolation failed! Signals leaked across sessions.");
    }

    // 3. Test Targeting (Teacher vs Student 1 vs Student 2)
    console.log("3. Testing client targeting and broadcast...");
    await prisma.classroomSignal.create({
      data: {
        sessionId: testSession1,
        senderRole: "teacher",
        senderName: "الشيخ",
        senderClientId: "teacher-client-1",
        targetClientId: "student-client-1", // Targeted specifically to student 1
        signalType: "OFFER",
        data: JSON.stringify({ sdp: "offer-for-student-1" }),
      },
    });

    // Query as student 1
    const student1View = await prisma.classroomSignal.findMany({
      where: {
        sessionId: testSession1,
        senderClientId: { not: "student-client-1" },
        OR: [
          { targetClientId: null },
          { targetClientId: "" },
          { targetClientId: "student-client-1" },
        ],
      },
    });

    // Query as student 2 (should NOT see the offer meant for student 1)
    const student2View = await prisma.classroomSignal.findMany({
      where: {
        sessionId: testSession1,
        senderClientId: { not: "student-client-2" },
        OR: [
          { targetClientId: null },
          { targetClientId: "" },
          { targetClientId: "student-client-2" },
        ],
      },
    });

    const student1HasOffer = student1View.some(s => s.signalType === "OFFER");
    const student2HasOffer = student2View.some(s => s.signalType === "OFFER");

    console.log(`✓ Student 1 sees targeted offer: ${student1HasOffer}`);
    console.log(`✓ Student 2 sees targeted offer: ${student2HasOffer} (expected false)`);

    if (!student1HasOffer || student2HasOffer) {
      throw new Error("Targeting failed! Offer delivered to wrong client or leaked.");
    }

    // 4. Test Since Parameter Tracking
    console.log("4. Testing sequential 'since' querying...");
    const firstHalf = await prisma.classroomSignal.findMany({
      where: { sessionId: testSession1 },
      orderBy: { id: "asc" },
      take: 10,
    });
    const lastId = firstHalf[firstHalf.length - 1].id;

    const secondHalf = await prisma.classroomSignal.findMany({
      where: { sessionId: testSession1, id: { gt: lastId } },
      orderBy: { id: "asc" },
    });

    console.log(`✓ Queried since=${lastId}: got ${secondHalf.length} remaining signals.`);
    if (secondHalf.length !== 11) { // 20 burst + 1 offer = 21 total. 21 - 10 = 11.
      throw new Error(`Since parameter test failed: expected 11 signals, got ${secondHalf.length}`);
    }

    console.log(">>> ALL SIGNALING UNIT TESTS PASSED SUCCESSFULLY! <<<");
  } finally {
    // Cleanup test data
    await prisma.classroomSignal.deleteMany({
      where: { sessionId: { in: [testSession1, testSession2] } },
    });
    await prisma.$disconnect();
  }
}

runSignalingTests().catch(err => {
  console.error("Signaling test error:", err);
  process.exit(1);
});
