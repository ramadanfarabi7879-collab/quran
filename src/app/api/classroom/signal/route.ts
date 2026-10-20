import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Key prefix for signaling data stored in PlatformSetting
const SIG_KEY_PREFIX = "sig:";
const MAX_MESSAGES = 100;

interface SignalingMessage {
  id: number;
  senderRole: string;
  senderName: string;
  senderClientId?: string;
  signalType: string;
  data: any;
  timestamp: number;
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

async function getQueue(sessionKey: string): Promise<SignalingMessage[]> {
  try {
    const rec = await prisma.platformSetting.findUnique({
      where: { key: SIG_KEY_PREFIX + sessionKey },
    });
    if (rec?.value) {
      return JSON.parse(rec.value) as SignalingMessage[];
    }
  } catch {}
  return [];
}

async function saveQueue(sessionKey: string, messages: SignalingMessage[]): Promise<void> {
  // Keep only last MAX_MESSAGES
  const trimmed = messages.slice(-MAX_MESSAGES);
  await prisma.platformSetting.upsert({
    where: { key: SIG_KEY_PREFIX + sessionKey },
    create: { key: SIG_KEY_PREFIX + sessionKey, value: JSON.stringify(trimmed) },
    update: { value: JSON.stringify(trimmed) },
  });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const rawSessionId = searchParams.get("sessionId");
  const role = searchParams.get("role");
  const clientId = searchParams.get("clientId");
  const since = parseInt(searchParams.get("since") || "0", 10);

  const sessionId = await resolveSessionKey(rawSessionId);
  const messages = await getQueue(sessionId);

  const newMessages = messages.filter((m) => {
    if (m.id <= since) return false;
    if (clientId && m.senderClientId && m.senderClientId === clientId) return false;
    if (role && m.senderRole && m.senderRole === role) return false;
    return true;
  });

  const latestId = messages.length > 0 ? messages[messages.length - 1].id : since;

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
    const messages = await getQueue(sessionId);

    const lastId = messages.length > 0 ? messages[messages.length - 1].id : 0;
    const msgId = lastId + 1;

    const msg: SignalingMessage = {
      id: msgId,
      senderRole,
      senderName: senderName || "",
      senderClientId: senderClientId || "",
      signalType,
      data,
      timestamp: Date.now(),
    };

    messages.push(msg);
    await saveQueue(sessionId, messages);

    return NextResponse.json({ success: true, messageId: msgId, sessionId });
  } catch (error) {
    console.error("Signaling error:", error);
    return NextResponse.json({ error: "فشل إرسال الإشارة" }, { status: 500 });
  }
}
