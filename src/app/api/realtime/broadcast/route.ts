import { NextResponse } from "next/server";
import { realtimeHub } from "@/lib/realtime";

export async function POST(req: Request) {
  try {
    const { channel = "global", event } = await req.json();
    if (!event || !event.type) {
      return NextResponse.json({ error: "الحدث غير صالح" }, { status: 400 });
    }

    realtimeHub.broadcast(channel, event);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Broadcast error:", error);
    return NextResponse.json({ error: "فشل بث الحدث" }, { status: 500 });
  }
}
