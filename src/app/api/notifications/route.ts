import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

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
      return NextResponse.json({ notifications: [], activeLiveSession: null });
    }

    // 1. Fetch user notifications
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 30,
    });

    // 2. Query active live sessions in a single optimized query
    const activeSessions = await prisma.liveSession.findMany({
      where: { status: "ACTIVE" },
      include: {
        halaqa: {
          include: {
            teacher: { include: { user: true } },
          },
        },
      },
    });
    const activeSessionMap = new Map(activeSessions.map((s) => [s.id, s]));

    // 3. Enrich notifications with live status without discarding historical records
    const enrichedNotifications = notifications.map((n) => {
      let isSessionActive = false;
      let sessionData = null;

      if (n.type === "HALAQA_STARTING" || n.type === "SESSION_STARTED") {
        const targetSessionId = n.link ? n.link.split("/classroom/")[1]?.split("?")[0] : null;
        if (targetSessionId && activeSessionMap.has(targetSessionId)) {
          isSessionActive = true;
          const sess = activeSessionMap.get(targetSessionId)!;
          sessionData = {
            id: sess.id,
            title: sess.title,
            halaqaName: sess.halaqa?.name,
            teacherName: sess.halaqa?.teacher?.user?.name,
          };
        }
      }

      return {
        ...n,
        isSessionActive,
        sessionData,
      };
    });

    // Auto-mark any stale live session notifications whose sessions already ended as read
    const endedNotifIds = enrichedNotifications
      .filter((n) => (n.type === "HALAQA_STARTING" || n.type === "SESSION_STARTED") && !n.isRead && !n.isSessionActive)
      .map((n) => n.id);

    if (endedNotifIds.length > 0) {
      await prisma.notification.updateMany({
        where: { id: { in: endedNotifIds } },
        data: { isRead: true },
      }).catch(() => {});
    }

    // Ensure student receives active live session invitation if one is currently active
    if (activeSessions.length > 0) {
      const currentActive = activeSessions[0];
      const hasUnreadLive = enrichedNotifications.some(
        (n) => (n.type === "HALAQA_STARTING" || n.type === "SESSION_STARTED") &&
               n.link?.includes(currentActive.id) && !n.isRead
      );

      if (!hasUnreadLive) {
        const newNotif = await prisma.notification.create({
          data: {
            userId,
            title: `بدأت الحلقة الآن: ${currentActive.halaqa?.name || currentActive.title}`,
            body: `فضيلة ${currentActive.halaqa?.teacher?.user?.name || "الشيخ"} في انتظارك في الغرفة الافتراضية، اضغط للانضمام مباشرة.`,
            type: "HALAQA_STARTING",
            link: `/classroom/${currentActive.id}?role=student`,
            isRead: false,
          },
        }).catch(() => null);

        if (newNotif) {
          enrichedNotifications.unshift({
            ...newNotif,
            isSessionActive: true,
            sessionData: {
              id: currentActive.id,
              title: currentActive.title,
              halaqaName: currentActive.halaqa?.name,
              teacherName: currentActive.halaqa?.teacher?.user?.name,
            },
          });
        }
      }
    }

    // Determine the most relevant active live session for this user
    const firstActive = activeSessions.length > 0 ? activeSessions[0] : null;

    return NextResponse.json({
      notifications: enrichedNotifications,
      activeLiveSession: firstActive
        ? {
            id: firstActive.id,
            title: firstActive.title,
            halaqaName: firstActive.halaqa?.name || "حلقة القرآن الكريم",
            teacherName: firstActive.halaqa?.teacher?.user?.name || "معلم ومقرئ الحلقة",
          }
        : null,
    });
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
