import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface SignalingMessage {
  id: number;
  senderRole: string;
  senderName: string;
  senderClientId?: string;
  signalType: string;
  data: any;
  timestamp: number;
}

interface SignalingQueue {
  messages: SignalingMessage[];
}

const globalForSignaling = globalThis as unknown as {
  signalingQueues?: Map<string, SignalingQueue>;
  signalingMessageCounter?: number;
};

const queues = globalForSignaling.signalingQueues ?? new Map<string, SignalingQueue>();
if (!globalForSignaling.signalingQueues) {
  globalForSignaling.signalingQueues = queues;
}

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
  const { searchParams } = new URL(req.url);
  const rawSessionId = searchParams.get("sessionId");
  const role = searchParams.get("role");
  const clientId = searchParams.get("clientId");
  const since = parseInt(searchParams.get("since") || "0", 10);

  const sessionId = await resolveSessionKey(rawSessionId);

  let queue = queues.get(sessionId);
  if (!queue && queues.size === 1) {
    // If only one room queue exists, reuse it to avoid mismatch
    queue = queues.values().next().value;
  }

  if (!queue) {
    return NextResponse.json({ messages: [], latestId: since, sessionId });
  }

  // Filter messages:
  // 1. Must be newer than 'since'
  // 2. Must not be from the same client
  // 3. Must be from the opposing role if role is specified
  const newMessages = queue.messages.filter((m) => {
    if (m.id <= since) return false;
    if (clientId && m.senderClientId && m.senderClientId === clientId) return false;
    if (role && m.senderRole && m.senderRole === role) return false;
    return true;
  });

  const latestId = queue.messages.length > 0 ? queue.messages[queue.messages.length - 1].id : since;

  return NextResponse.json({ messages: newMessages, latestId, sessionId });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { sessionId: rawSessionId, signalType, senderRole, senderName, senderClientId, data } = body;

    if (!signalType || !senderRole) {
      return NextResponse.json({ error: "بيانات الإشارة غير مكتملة" }, { status: 400 });
    }

    const sessionId = await resolveSessionKey(rawSessionId);

    if (!queues.has(sessionId)) {
      queues.set(sessionId, { messages: [] });
    }

    const queue = queues.get(sessionId)!;
    globalForSignaling.signalingMessageCounter = (globalForSignaling.signalingMessageCounter || 0) + 1;
    const msgId = globalForSignaling.signalingMessageCounter;

    const msg: SignalingMessage = {
      id: msgId,
      senderRole,
      senderName: senderName || "",
      senderClientId: senderClientId || "",
      signalType,
      data,
      timestamp: Date.now(),
    };

    queue.messages.push(msg);

    // Keep only last 150 messages to prevent memory growth
    if (queue.messages.length > 150) {
      queue.messages = queue.messages.slice(-150);
    }

    return NextResponse.json({ success: true, messageId: msgId, sessionId });
  } catch (error) {
    console.error("Signaling error:", error);
    return NextResponse.json({ error: "فشل إرسال الإشارة" }, { status: 500 });
  }
}
