import { NextResponse } from "next/server";
import { realtimeHub } from "@/lib/realtime";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const since = parseInt(searchParams.get("since") || "0", 10);
    const channel = searchParams.get("channel") || "global";

    // 1. Get recent buffered in-memory events
    const memoryEvents = realtimeHub.getRecentEvents(since, channel);

    // 2. Also check if an active live session exists in DB that started recently
    let activeSessionEvent = null;
    try {
      const activeSession = await prisma.liveSession.findFirst({
        where: { status: "ACTIVE" },
        include: {
          halaqa: {
            include: {
              teacher: { include: { user: true } },
            },
          },
        },
        orderBy: { startedAt: "desc" },
      });

      if (activeSession) {
        const sessionStartTime = activeSession.startedAt.getTime();
        // If the session started after `since` or within the last 2 minutes
        const isFresh = since === 0 || sessionStartTime > since || (Date.now() - sessionStartTime < 120000);
        const hasLiveStarted = memoryEvents.some(
          (e) => e.type === "HALAQA_LIVE_STARTED" && (e.payload as any)?.sessionId === activeSession.id
        );

        if (isFresh && !hasLiveStarted) {
          activeSessionEvent = {
            type: "HALAQA_LIVE_STARTED",
            channel: "global",
            timestamp: sessionStartTime,
            payload: {
              sessionId: activeSession.id,
              halaqaId: activeSession.halaqaId,
              title: activeSession.title,
              halaqaName: activeSession.halaqa?.name || "حلقة القرآن الكريم",
              teacherName: activeSession.halaqa?.teacher?.user?.name || "معلم الحلقة",
            },
          };
        }
      }
    } catch {}

    const allEvents = activeSessionEvent ? [activeSessionEvent, ...memoryEvents] : memoryEvents;

    return NextResponse.json({
      events: allEvents,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("Realtime poll error:", error);
    return NextResponse.json({ events: [], timestamp: Date.now() });
  }
}
