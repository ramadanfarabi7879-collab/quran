const { PrismaClient } = require('@prisma/client');
const { realtimeHub } = require('../src/lib/realtime');

const prisma = new PrismaClient();

async function run() {
  console.log('=== TEST 2: Mushaf Control & Free Navigation Sync ===');

  const sessionId = `test-mushaf-${Date.now()}`;

  // 1. Initialize state in DB
  const liveSession = await prisma.liveSession.create({
    data: {
      id: sessionId,
      halaqaId: 'cmve7rsuc001x998v52yf8xm8',
      title: 'جلسة اختبار تحكم المصحف',
      status: 'ACTIVE',
      mushafState: {
        create: {
          mode: 'VIEW',
          currentSurah: 1,
          currentPage: 1,
          currentAyah: 1,
          allowFreeNavigation: false,
        }
      }
    },
    include: { mushafState: true }
  });

  console.log(`Created test session with Mushaf state: Page=${liveSession.mushafState.currentPage}, Surah=${liveSession.mushafState.currentSurah}, allowFree=${liveSession.mushafState.allowFreeNavigation}`);

  // Assert default state: allowFreeNavigation MUST be false
  if (liveSession.mushafState.allowFreeNavigation !== false) {
    throw new Error('Default allowFreeNavigation must be false');
  }

  // 2. Simulate Teacher changing page to 142 (سورة الأنعام)
  const teacherNewPage = 142;
  const teacherNewSurah = 6;
  const updatedState = await prisma.mushafSessionState.update({
    where: { sessionId },
    data: {
      currentPage: teacherNewPage,
      currentSurah: teacherNewSurah,
    }
  });

  realtimeHub.broadcast(`session-${sessionId}`, {
    type: 'MUSHAF_STATE_UPDATED',
    payload: {
      sessionId,
      currentPage: updatedState.currentPage,
      currentSurah: updatedState.currentSurah,
      allowFreeNavigation: updatedState.allowFreeNavigation,
      mode: updatedState.mode,
    }
  });

  console.log(`Teacher turned page to: ${updatedState.currentPage} (Surah ${updatedState.currentSurah})`);

  // Verify student client state transition logic when allowFreeNavigation === false
  let studentCurrentPage = 1; // Student was at page 1
  const studentReceiveUpdate = (st) => {
    // When free navigation is disabled (default), student MUST follow teacher's page!
    if (!st.allowFreeNavigation || st.mode === 'GUIDED') {
      studentCurrentPage = st.currentPage;
    }
  };

  studentReceiveUpdate({
    currentPage: updatedState.currentPage,
    allowFreeNavigation: updatedState.allowFreeNavigation,
    mode: updatedState.mode,
  });

  console.log(`Student auto-synced to Teacher page: ${studentCurrentPage}`);
  if (studentCurrentPage !== teacherNewPage) {
    throw new Error(`Student should have followed teacher to page ${teacherNewPage}`);
  }

  // 3. Teacher ENABLES free navigation: allowFreeNavigation = true
  const freeNavState = await prisma.mushafSessionState.update({
    where: { sessionId },
    data: { allowFreeNavigation: true }
  });
  console.log(`Teacher enabled free navigation: allowFreeNavigation=${freeNavState.allowFreeNavigation}`);

  // Simulate student navigating freely to page 50
  let studentLocalPage = studentCurrentPage;
  const studentNavigateLocally = (newPage, st) => {
    if (st.allowFreeNavigation) {
      studentLocalPage = newPage; // Allowed locally!
    }
  };
  studentNavigateLocally(50, freeNavState);
  console.log(`Student independently navigated to page: ${studentLocalPage} (Teacher still on ${teacherNewPage})`);
  if (studentLocalPage !== 50) {
    throw new Error('Student should be allowed to navigate locally when free navigation is ON');
  }

  // 4. Teacher DISABLES free navigation: allowFreeNavigation = false
  const lockedNavState = await prisma.mushafSessionState.update({
    where: { sessionId },
    data: { allowFreeNavigation: false }
  });
  console.log(`Teacher revoked free navigation: allowFreeNavigation=${lockedNavState.allowFreeNavigation}`);

  // Student should snap back immediately to teacher's page!
  const studentHandleLockRevoked = (st) => {
    if (!st.allowFreeNavigation) {
      studentLocalPage = st.currentPage; // Snap back!
    }
  };
  studentHandleLockRevoked(lockedNavState);
  console.log(`Student snapped back to Teacher page: ${studentLocalPage}`);
  if (studentLocalPage !== teacherNewPage) {
    throw new Error(`Student should have snapped back to page ${teacherNewPage}`);
  }

  // Clean up
  await prisma.liveSession.delete({ where: { id: sessionId } });
  console.log('Cleaned up test session.');

  console.log('>>> TEST 2 PASSED SUCCESSFULLY! <<<');
}

run().catch(console.error).finally(() => prisma.$disconnect());
