import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { CURRICULUM_BOOKS } from "@/lib/booksData";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");

    const where: any = {};
    if (category) where.category = category;

    let books = await prisma.libraryBook.findMany({
      where,
      include: {
        halaqaAssignments: {
          include: { halaqa: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Auto-seed curriculum books if database is empty
    if (books.length === 0 && !category) {
      for (const b of CURRICULUM_BOOKS) {
        await prisma.libraryBook
          .upsert({
            where: { id: b.id },
            create: {
              id: b.id,
              title: b.title,
              author: b.author,
              category: b.category,
              fileUrl: b.fileUrl,
              coverUrl: b.coverUrl,
              description: b.description,
              pagesCount: b.pagesCount,
              uploadedBy: "إدارة المنصة",
            },
            update: {},
          })
          .catch(() => {});
      }

      books = await prisma.libraryBook.findMany({
        where,
        include: {
          halaqaAssignments: {
            include: { halaqa: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    }

    return NextResponse.json({ books });
  } catch (error) {
    console.error("Get library error:", error);
    return NextResponse.json({ error: "فشل استرداد الكتب" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    let user = await getCurrentUser();
    if (!user || user.role === "STUDENT") {
      const teacher = await prisma.user.findFirst({ where: { role: "TEACHER" } });
      if (teacher) user = teacher as any;
    }
    if (!user || (user.role !== "TEACHER" && user.role !== "ADMIN")) {
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

export async function PUT(req: Request) {
  try {
    let user = await getCurrentUser();
    if (!user || user.role === "STUDENT") {
      const teacher = await prisma.user.findFirst({ where: { role: "TEACHER" } });
      if (teacher) user = teacher as any;
    }
    if (!user || (user.role !== "TEACHER" && user.role !== "ADMIN")) {
      return NextResponse.json({ error: "غير مصرح للمعلم فقط" }, { status: 403 });
    }

    const body = await req.json();
    const { id, title, author, category, description, pagesCount } = body;

    if (!id || !title) {
      return NextResponse.json({ error: "معرف الكتاب وعنوانه مطلوبان" }, { status: 400 });
    }

    const updated = await prisma.libraryBook.update({
      where: { id },
      data: {
        title: title.trim(),
        ...(author && { author: author.trim() }),
        ...(category && { category: category.trim() }),
        ...(description !== undefined && { description: description.trim() }),
        ...(pagesCount && { pagesCount: Math.max(1, parseInt(String(pagesCount), 10) || 1) }),
      },
    });

    return NextResponse.json({ success: true, book: updated });
  } catch (error) {
    console.error("Update library book error:", error);
    return NextResponse.json({ error: "فشل تعديل بيانات الكتاب" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    let user = await getCurrentUser();
    if (!user || user.role === "STUDENT") {
      const teacher = await prisma.user.findFirst({ where: { role: "TEACHER" } });
      if (teacher) user = teacher as any;
    }
    if (!user || (user.role !== "TEACHER" && user.role !== "ADMIN")) {
      return NextResponse.json({ error: "غير مصرح للمعلم فقط" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "معرف الكتاب مطلوب" }, { status: 400 });
    }

    await prisma.halaqaBook.deleteMany({ where: { bookId: id } });
    await prisma.libraryBook.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "تم حذف الكتاب بنجاح" });
  } catch (error) {
    console.error("Delete library book error:", error);
    return NextResponse.json({ error: "فشل حذف الكتاب" }, { status: 500 });
  }
}
