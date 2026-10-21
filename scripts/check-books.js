const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const books = await prisma.libraryBook.findMany();
  console.log('Books in DB:', books.length);
  books.forEach(b => console.log(`- [${b.id}] ${b.title} (${b.category}) -> ${b.fileUrl}`));
}

main().catch(console.error).finally(() => prisma.$disconnect());
