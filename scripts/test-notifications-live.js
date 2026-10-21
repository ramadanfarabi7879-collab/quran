const { PrismaClient } = require('@prisma/client');
const { realtimeHub } = require('../src/lib/realtime');

const prisma = new PrismaClient();

async function run() {
  console.log('=== TEST 1: Notifications & Realtime Session Alert ===');

  // Find a teacher and a student
  const teacher = await prisma.user.findFirst({ where: { role: 'TEACHER' } });
  const student = await prisma.user.findFirst({ where: { role: 'STUDENT' } });

  console.log(`Teacher found: ${teacher?.name} (${teacher?.id})`);
  console.log(`Student found: ${student?.name} (${student?.id})`);

  if (!teacher || !student) {
    console.error('Missing teacher or student in DB');
    return;
  }

  // Find active or first halaqa
  const halaqa = await prisma.halaqa.findFirst({
    include: { enrollments: { include: { student: { include: { user: true } } } } }
  });
  console.log(`Halaqa: ${halaqa?.name} (${halaqa?.id}) with ${halaqa?.enrollments.length} enrollments`);

  // Simulate starting session logic
  const liveSession = await prisma.liveSession.create({
    data: {
      halaqaId: halaqa.id,
      title: `حلقة تجريبية لاختبار الإشعارات - ${Date.now()}`,
      status: 'ACTIVE',
    }
  });
  console.log(`Created liveSession: ${liveSession.id}`);

  // Create notification for student
  const notif = await prisma.notification.create({
    data: {
      userId: student.id,
      title: `بدأت الحلقة الآن: ${halaqa.name}`,
      body: `فضيلة ${teacher.name} في انتظارك في الغرفة الافتراضية.`,
      type: 'HALAQA_STARTING',
      link: `/classroom/${liveSession.id}?role=student`,
    }
  });
  console.log(`Created Notification ID: ${notif.id} for Student`);

  // Broadcast through realtimeHub
  const payload = {
    sessionId: liveSession.id,
    halaqaId: halaqa.id,
    title: liveSession.title,
    halaqaName: halaqa.name,
    teacherName: teacher.name,
  };

  const beforeBroadcast = Date.now() - 1000;
  realtimeHub.broadcast('global', {
    type: 'HALAQA_LIVE_STARTED',
    payload,
  });
  realtimeHub.broadcast('global', {
    type: 'NEW_NOTIFICATION',
    payload: { sessionId: liveSession.id },
  });

  // Verify recentEvents buffer
  const events = realtimeHub.getRecentEvents(beforeBroadcast, 'global');
  console.log(`Realtime Hub buffered events count: ${events.length}`);
  const hasLiveStarted = events.some(e => e.type === 'HALAQA_LIVE_STARTED' && e.payload?.sessionId === liveSession.id);
  const hasNewNotif = events.some(e => e.type === 'NEW_NOTIFICATION' && e.payload?.sessionId === liveSession.id);

  console.log(`-> HALAQA_LIVE_STARTED buffered: ${hasLiveStarted}`);
  console.log(`-> NEW_NOTIFICATION buffered: ${hasNewNotif}`);

  // Clean up test session
  await prisma.liveSession.delete({ where: { id: liveSession.id } });
  await prisma.notification.delete({ where: { id: notif.id } });
  console.log('Cleaned up test liveSession & notification.');

  if (hasLiveStarted && hasNewNotif) {
    console.log('>>> TEST 1 PASSED SUCCESSFULLY! <<<');
  } else {
    throw new Error('TEST 1 FAILED: Events were not buffered in realtimeHub');
  }
}

run().catch(console.error).finally(() => prisma.$disconnect());
