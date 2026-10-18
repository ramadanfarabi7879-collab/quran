import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "غير مصرح لغير مدير المنصة" }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      include: {
        teacherProfile: { include: { halaqat: true } },
        studentProfile: { include: { enrollments: { include: { halaqa: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });

    const stats = {
      totalUsers: users.length,
      teachersCount: users.filter((u) => u.role === "TEACHER").length,
      studentsCount: users.filter((u) => u.role === "STUDENT").length,
      activeHalaqat: await prisma.halaqa.count({ where: { status: "ACTIVE" } }),
    };

    return NextResponse.json({ users, stats });
  } catch (error) {
    console.error("Get admin users error:", error);
    return NextResponse.json({ error: "فشل استرداد بيانات المستخدمين" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }

    const { action, userId, isActive, role } = await req.json();

    if (action === "TOGGLE_ACTIVE") {
      await prisma.user.update({
        where: { id: userId },
        data: { isActive },
      });
      return NextResponse.json({ success: true });
    }

    if (action === "CHANGE_ROLE") {
      await prisma.user.update({
        where: { id: userId },
        data: { role },
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "إجراء غير معروف" }, { status: 400 });
  } catch (error) {
    console.error("Admin user action error:", error);
    return NextResponse.json({ error: "فشل تنفيذ الإجراء" }, { status: 500 });
  }
}
