import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 25; // Vercel max for hobby plan

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const channel = searchParams.get("channel") || "global";

  // On Vercel, SSE long-lived connections are not supported reliably.
  // We respond with a connected event and the client will poll periodically.
  const isVercel = !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

  if (isVercel) {
    // Return a single JSON response for polling mode
    return NextResponse.json({
      type: "CONNECTED",
      channel,
      timestamp: Date.now(),
      mode: "polling",
    });
  }

  // For local dev: use true SSE streaming
  const { realtimeHub } = await import("@/lib/realtime");
  const { RealtimeEvent } = await import("@/types") as any;

  const encoder = new TextEncoder();
  let unsubscribe: (() => void) | null = null;
  let heartbeatInterval: NodeJS.Timeout | null = null;

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: "CONNECTED", channel, timestamp: Date.now() })}\n\n`)
      );

      const listener = (event: any) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        } catch (e) {}
      };

      unsubscribe = realtimeHub.subscribe(channel, listener);
      heartbeatInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: ping\n\n`));
        } catch (e) {
          if (heartbeatInterval) clearInterval(heartbeatInterval);
        }
      }, 5000);
    },
    cancel() {
      if (unsubscribe) unsubscribe();
      if (heartbeatInterval) clearInterval(heartbeatInterval);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

