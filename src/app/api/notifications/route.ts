import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const paramUserId = searchParams.get("userId");
    const paramPhone = searchParams.get("phone");

    let userId: string | null = null;
    const user = await getCurrentUser();
    if (user) {
      userId = user.id;
    } else if (paramUserId) {
      userId = paramUserId;
    } else if (paramPhone) {
      const u = await prisma.user.findFirst({ where: { phone: paramPhone } });
      if (u) userId = u.id;
    }

    if (!userId) {
      return NextResponse.json({ notifications: [] });
    }

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json({ notifications });
  } catch (error) {
    console.error("Get notifications error:", error);
    return NextResponse.json({ error: "فشل استرداد الإشعارات", notifications: [] }, { status: 200 });
  }
}

export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const paramUserId = searchParams.get("userId");
    const paramPhone = searchParams.get("phone");

    let userId: string | null = null;
    const user = await getCurrentUser();
    if (user) {
      userId = user.id;
    } else if (paramUserId) {
      userId = paramUserId;
    } else if (paramPhone) {
      const u = await prisma.user.findFirst({ where: { phone: paramPhone } });
      if (u) userId = u.id;
    }

    const { notificationId, markAll } = await req.json();

    if (markAll && userId) {
      await prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true },
      });
      return NextResponse.json({ success: true });
    }

    if (notificationId) {
      await prisma.notification.update({
        where: { id: notificationId },
        data: { isRead: true },
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update notifications error:", error);
    return NextResponse.json({ error: "فشل تحديث الإشعارات" }, { status: 500 });
  }
}
