import { NextResponse } from "next/server";

interface SignalingQueue {
  messages: Array<{
    id: number;
    senderRole: string;
    senderName: string;
    signalType: string;
    data: any;
    timestamp: number;
  }>;
}

const queues = new Map<string, SignalingQueue>();
let messageCounter = 0;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId");
  const role = searchParams.get("role");
  const since = parseInt(searchParams.get("since") || "0", 10);

  if (!sessionId) {
    return NextResponse.json({ error: "sessionId مطلوب" }, { status: 400 });
  }

  const queue = queues.get(sessionId);
  if (!queue) {
    return NextResponse.json({ messages: [], latestId: since });
  }

  // Filter messages intended for this role (sent by the OTHER role)
  // and newer than 'since'
  const newMessages = queue.messages.filter(
    (m) => m.id > since && m.senderRole !== role
  );

  const latestId = queue.messages.length > 0 ? queue.messages[queue.messages.length - 1].id : since;

  return NextResponse.json({ messages: newMessages, latestId });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { sessionId, signalType, senderRole, senderName, data } = body;

    if (!sessionId || !signalType || !senderRole) {
      return NextResponse.json({ error: "بيانات الإشارة غير مكتملة" }, { status: 400 });
    }

    if (!queues.has(sessionId)) {
      queues.set(sessionId, { messages: [] });
    }

    const queue = queues.get(sessionId)!;
    messageCounter++;

    const msg = {
      id: messageCounter,
      senderRole,
      senderName: senderName || "",
      signalType,
      data,
      timestamp: Date.now(),
    };

    queue.messages.push(msg);

    // Keep only last 100 messages to prevent memory leak
    if (queue.messages.length > 100) {
      queue.messages = queue.messages.slice(-100);
    }

    return NextResponse.json({ success: true, messageId: messageCounter });
  } catch (error) {
    console.error("Signaling error:", error);
    return NextResponse.json({ error: "فشل إرسال الإشارة" }, { status: 500 });
  }
}
