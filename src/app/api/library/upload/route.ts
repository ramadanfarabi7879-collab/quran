import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import fs from "fs";
import path from "path";
import crypto from "crypto";

const MAX_PDF_SIZE = 50 * 1024 * 1024; // 50 Megabytes
const MAX_COVER_SIZE = 5 * 1024 * 1024; // 5 Megabytes

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role === "STUDENT") {
      return NextResponse.json(
        { error: "غير مصرح لك برفع الكتب، هذه الصلاحية مخصصة للمعلمين والإدارة فقط" },
        { status: 403 }
      );
    }

    const formData = await req.formData();
    const pdfFile = formData.get("file") as File | null;
    const coverFile = formData.get("cover") as File | null;
    const title = (formData.get("title") as string)?.trim();
    const author = (formData.get("author") as string)?.trim() || "غير محدد";
    const category = (formData.get("category") as string)?.trim() || "أحكام التجويد";
    const description = (formData.get("description") as string)?.trim() || "";
    const pagesCountRaw = formData.get("pagesCount");
    const pagesCount = pagesCountRaw ? Math.max(1, parseInt(String(pagesCountRaw), 10) || 1) : 1;

    if (!title) {
      return NextResponse.json({ error: "يرجى كتابة عنوان الكتاب" }, { status: 400 });
    }

    if (!pdfFile || typeof pdfFile === "string") {
      return NextResponse.json({ error: "يرجى اختيار ملف PDF للرفع" }, { status: 400 });
    }

    // Size validation
    if (pdfFile.size > MAX_PDF_SIZE) {
      return NextResponse.json(
        { error: "حجم الملف يتجاوز الحد الأقصى المسموح به (50 ميجابايت)" },
        { status: 400 }
      );
    }

    // Name extension check
    const originalName = pdfFile.name || "book.pdf";
    if (!originalName.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json(
        { error: "صيغة الملف غير مدعومة. يجب أن يكون الملف بصيغة PDF فقط (.pdf)" },
        { status: 400 }
      );
    }

    // Convert to buffer
    const arrayBuffer = await pdfFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Magic Bytes Verification (%PDF- = 0x25 0x50 0x44 0x46 0x2D)
    const magic = buffer.subarray(0, 5).toString("utf-8");
    if (!magic.startsWith("%PDF")) {
      return NextResponse.json(
        { error: "الملف المرفوع ليس ملف PDF صالحاً أو تالفاً" },
        { status: 400 }
      );
    }

    // Prepare upload directory
    const uploadDir = path.join(process.cwd(), "public", "books", "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Generate safe unique filename
    const safeBaseName = originalName
      .replace(/\.[^/.]+$/, "")
      .replace(/[^a-zA-Z0-9_\u0600-\u06FF-]/g, "_")
      .slice(0, 40);
    const uniqueSuffix = `${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    const pdfFileName = `${safeBaseName}_${uniqueSuffix}.pdf`;
    const fullPdfPath = path.join(uploadDir, pdfFileName);

    await fs.promises.writeFile(fullPdfPath, buffer);
    const fileUrl = `/books/uploads/${pdfFileName}`;

    // Handle optional cover image
    let coverUrl = "";
    if (coverFile && typeof coverFile !== "string" && coverFile.size > 0) {
      if (coverFile.size <= MAX_COVER_SIZE) {
        const coverExt = path.extname(coverFile.name || ".png").toLowerCase();
        if ([".jpg", ".jpeg", ".png", ".webp"].includes(coverExt)) {
          const coverBuf = Buffer.from(await coverFile.arrayBuffer());
          const coverFileName = `cover_${uniqueSuffix}${coverExt}`;
          const fullCoverPath = path.join(uploadDir, coverFileName);
          await fs.promises.writeFile(fullCoverPath, coverBuf);
          coverUrl = `/books/uploads/${coverFileName}`;
        }
      }
    }

    // Default covers based on category if no custom cover was uploaded
    if (!coverUrl) {
      const categoryCovers: Record<string, string> = {
        "نور البيان": "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=400",
        "أحكام التجويد": "https://images.unsplash.com/photo-1609599006353-e629aaabfeae?auto=format&fit=crop&q=80&w=400",
        "الفقه": "https://images.unsplash.com/photo-1532012164546-f432f2e3777a?auto=format&fit=crop&q=80&w=400",
        "التفسير": "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=400",
        "العقيدة والسيرة": "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&q=80&w=400",
        "مذكرات المعلم": "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&q=80&w=400",
      };
      coverUrl = categoryCovers[category] || "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=400";
    }

    // Save to Database
    const book = await prisma.libraryBook.create({
      data: {
        title,
        author,
        category,
        description,
        fileUrl,
        coverUrl,
        pagesCount,
        fileSizeBytes: buffer.length,
        uploadedBy: user.name,
      },
    });

    return NextResponse.json({
      success: true,
      message: "تم رفع وحفظ الكتاب بنجاح",
      book,
    });
  } catch (error: any) {
    console.error("Upload library book error:", error);
    return NextResponse.json(
      { error: error?.message || "فشل رفع الكتاب للمكتبة" },
      { status: 500 }
    );
  }
}
