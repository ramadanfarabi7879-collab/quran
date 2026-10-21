const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const { CURRICULUM_BOOKS } = require('../src/lib/booksData');

const prisma = new PrismaClient();

async function run() {
  console.log('=== TEST 3: Library Books & In-App Reader Data ===');

  // 1. Verify DB books
  const dbBooks = await prisma.libraryBook.findMany();
  console.log(`Found ${dbBooks.length} books in Database.`);
  if (dbBooks.length === 0) {
    throw new Error('Database should have books');
  }

  // 2. Verify all book PDF files exist on disk in public/books
  const booksDir = path.join(__dirname, '..', 'public', 'books');
  console.log(`Checking physical files in: ${booksDir}`);

  for (const b of dbBooks) {
    const filename = path.basename(b.fileUrl);
    const fullPath = path.join(booksDir, filename);
    const exists = fs.existsSync(fullPath);
    console.log(`- Book "${b.title}" -> ${b.fileUrl} | Exists: ${exists}`);
    if (!exists) {
      throw new Error(`Missing PDF file for book: ${b.title} at ${fullPath}`);
    }
    const stat = fs.statSync(fullPath);
    if (stat.size === 0) {
      throw new Error(`PDF file is empty for book: ${b.title}`);
    }
  }

  // 3. Verify digital curriculum chapters in CURRICULUM_BOOKS
  console.log(`CURRICULUM_BOOKS count: ${CURRICULUM_BOOKS.length}`);
  for (const cb of CURRICULUM_BOOKS) {
    console.log(`- Digital Book "${cb.title}" has ${cb.chapters.length} chapters.`);
    if (cb.chapters.length === 0) {
      throw new Error(`Digital Book "${cb.title}" has no chapters`);
    }
    for (const chap of cb.chapters) {
      if (!chap.title || !chap.content || chap.content.length === 0) {
        throw new Error(`Chapter "${chap.title}" in book "${cb.title}" has no content`);
      }
    }
  }

  console.log('>>> TEST 3 PASSED SUCCESSFULLY! <<<');
}

run().catch(console.error).finally(() => prisma.$disconnect());
