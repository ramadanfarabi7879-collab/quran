import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");

    const where: any = {};
    if (category) where.category = category;

    const books = await prisma.libraryBook.findMany({
      where,
      include: {
        halaqaAssignments: {
          include: { halaqa: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ books });
  } catch (error) {
    console.error("Get library error:", error);
    return NextResponse.json({ error: "فشل استرداد الكتب" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role === "STUDENT") {
      return NextResponse.json({ error: "غير مصرح للمعلم فقط" }, { status: 403 });
    }

    const body = await req.json();
    const { title, author, category, fileUrl, coverUrl, description, pagesCount, halaqaIds } = body;

    if (!title || !fileUrl) {
      return NextResponse.json({ error: "العنوان ورابط الملف مطلوبان" }, { status: 400 });
    }

    const book = await prisma.libraryBook.create({
      data: {
        title,
        author: author || "غير محدد",
        category: category || "أحكام التجويد",
        fileUrl,
        coverUrl,
        description,
        pagesCount: Number(pagesCount) || 1,
        uploadedBy: user.name,
      },
    });

    if (halaqaIds && Array.isArray(halaqaIds)) {
      for (const hId of halaqaIds) {
        await prisma.halaqaBook.create({
          data: {
            bookId: book.id,
            halaqaId: hId,
          },
        });
      }
    }

    return NextResponse.json({ success: true, book });
  } catch (error) {
    console.error("Create library book error:", error);
    return NextResponse.json({ error: "فشل إضافة الكتاب للمكتبة" }, { status: 500 });
  }
}
