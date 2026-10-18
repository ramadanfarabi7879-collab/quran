import { NextResponse } from "next/server";
import { getPageSurahs } from "@/lib/quranData";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const pageStr = searchParams.get("page") || "1";
    const sessionId = searchParams.get("sessionId");
    const page = parseInt(pageStr, 10);

    const user = await getCurrentUser();

    // Strict Server-Enforced Recitation (Tasmee') Check:
    if (sessionId && user?.role === "STUDENT") {
      const mushafState = await prisma.mushafSessionState.findUnique({
        where: { sessionId },
      });

      if (mushafState && mushafState.mode === "TASMEE_LOCKED") {
        return NextResponse.json(
          {
            error: "TASMEE_LOCKED",
            locked: true,
            message:
              "وضع التسميع المغلق نشط حالياً بأمر المعلم. لا يمكن تصفح المصحف أو عرض الآيات حتى ينهي المعلم جلسة التسميع.",
          },
          { status: 403 }
        );
      }
    }

    const pages = getPageSurahs(page);
    return NextResponse.json({ page, data: pages });
  } catch (error) {
    console.error("Get Quran page error:", error);
    return NextResponse.json({ error: "فشل تحميل صفحة المصحف" }, { status: 500 });
  }
}
