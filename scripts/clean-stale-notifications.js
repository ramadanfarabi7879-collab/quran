const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.notification.updateMany({
    where: {
      type: "HALAQA_STARTING",
      isRead: false,
    },
    data: {
      isRead: true,
    },
  });
  console.log("Marked stale HALAQA_STARTING notifications as read:", result.count);

  // Also check if any session is active right now
  const activeSessions = await prisma.liveSession.findMany({
    where: { status: "ACTIVE" },
  });
  console.log("Active sessions:", activeSessions.length);
}

main().catch(console.error).finally(() => prisma.$disconnect());
