const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Updating users...");

  // Update teacher password to 123
  await prisma.user.updateMany({
    where: { role: "TEACHER" },
    data: { password: "123" }
  });

  // Update student password to 123
  await prisma.user.updateMany({
    where: { role: "STUDENT" },
    data: { password: "123" }
  });

  // Update admin password to 123
  await prisma.user.updateMany({
    where: { role: "ADMIN" },
    data: { password: "123" }
  });

  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, phone: true, password: true, role: true, isActive: true }
  });

  console.log("Current Users in DB:", JSON.stringify(users, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
