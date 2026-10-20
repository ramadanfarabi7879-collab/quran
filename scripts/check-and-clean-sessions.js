const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const activeSessions = await prisma.liveSession.findMany({
    where: { status: "ACTIVE" },
  });
  console.log("Current active sessions:", activeSessions.length);
  for (const s of activeSessions) {
    console.log(`- ID: ${s.id}, Title: ${s.title}, Started: ${s.startedAt}`);
  }

  // End all stale sessions so that the platform starts in a clean idle state
  const updated = await prisma.liveSession.updateMany({
    where: { status: "ACTIVE" },
    data: { status: "ENDED", endedAt: new Date() },
  });
  console.log("Cleaned up ended sessions count:", updated.count);

  await prisma.halaqa.updateMany({
    data: { isLiveNow: false, currentLiveSessionId: null },
  });
  console.log("Reset halaqat isLiveNow to false");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
