import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Lightweight polling endpoint for Vercel environments
// Returns empty events list (realtime events are ephemeral in serverless)
export async function GET() {
  return NextResponse.json({ events: [], timestamp: Date.now() });
}
