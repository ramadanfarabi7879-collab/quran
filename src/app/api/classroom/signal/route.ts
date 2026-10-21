import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function resolveSessionKey(sessionId: string | null): Promise<string> {
  if (!sessionId || sessionId === "auto") {
    try {
      const active = await prisma.liveSession.findFirst({
        where: { status: "ACTIVE" },
        orderBy: { startedAt: "desc" },
      });
      if (active) return active.id;
    } catch {}
    return "active-session";
  }
  return sessionId;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const rawSessionId = searchParams.get("sessionId");
    const role = searchParams.get("role");
    const clientId = searchParams.get("clientId") || "";
    const since = parseInt(searchParams.get("since") || "0", 10);

    const sessionId = await resolveSessionKey(rawSessionId);

    // Fetch messages after `since`, excluding messages sent by this exact client.
    // Also respect targetClientId (broadcast if targetClientId is null/empty or equals clientId)
    const records = await prisma.classroomSignal.findMany({
      where: {
        sessionId,
        id: { gt: since },
        ...(clientId ? { senderClientId: { not: clientId } } : {}),
        OR: [
          { targetClientId: null },
          { targetClientId: "" },
          ...(clientId ? [{ targetClientId: clientId }] : []),
        ],
      },
      orderBy: { id: "asc" },
      take: 100,
    });

    const messages = records.map((r) => {
      let parsedData = null;
      try {
        parsedData = r.data ? JSON.parse(r.data) : null;
      } catch {
        parsedData = r.data;
      }
      return {
        id: r.id,
        senderRole: r.senderRole,
        senderName: r.senderName,
        senderClientId: r.senderClientId,
        targetClientId: r.targetClientId,
        signalType: r.signalType,
        data: parsedData,
        timestamp: r.createdAt.getTime(),
      };
    });

    // Determine the latest ID for the session to prevent repeated scans
    const latestSignal = await prisma.classroomSignal.findFirst({
      where: { sessionId },
      orderBy: { id: "desc" },
      select: { id: true },
    });

    const latestId = latestSignal ? Math.max(latestSignal.id, since) : (records.length > 0 ? records[records.length - 1].id : since);

    return NextResponse.json({
      messages,
      latestId,
      sessionId,
      count: messages.length,
    });
  } catch (error) {
    console.error("Signaling GET error:", error);
    return NextResponse.json({ error: "فشل جلب إشارات الجلسة" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      sessionId: rawSessionId,
      signalType,
      senderRole,
      senderName,
      senderClientId,
      targetClientId,
      data,
    } = body;

    if (!signalType || !senderRole) {
      return NextResponse.json({ error: "بيانات الإشارة غير مكتملة" }, { status: 400 });
    }

    const sessionId = await resolveSessionKey(rawSessionId);

    const record = await prisma.classroomSignal.create({
      data: {
        sessionId,
        signalType,
        senderRole,
        senderName: senderName || "",
        senderClientId: senderClientId || "",
        targetClientId: targetClientId || null,
        data: JSON.stringify(data ?? null),
      },
    });

    // Opportunistic pruning: occasionally prune signals older than 2 hours or older than latest 200 in this session
    if (record.id % 20 === 0) {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      prisma.classroomSignal.deleteMany({
        where: {
          sessionId,
          createdAt: { lt: twoHoursAgo },
        },
      }).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      messageId: record.id,
      sessionId,
      signalType,
    });
  } catch (error) {
    console.error("Signaling POST error:", error);
    return NextResponse.json({ error: "فشل إرسال الإشارة" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const rawSessionId = searchParams.get("sessionId");
    const sessionId = await resolveSessionKey(rawSessionId);

    await prisma.classroomSignal.deleteMany({
      where: { sessionId },
    });

    return NextResponse.json({ success: true, message: "تم مسح إشارات الجلسة" });
  } catch (error) {
    console.error("Signaling DELETE error:", error);
    return NextResponse.json({ error: "فشل مسح إشارات الجلسة" }, { status: 500 });
  }
}
