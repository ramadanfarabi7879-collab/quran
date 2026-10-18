import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { realtimeHub } from "@/lib/realtime";
import { getCurrentUser } from "@/lib/auth";
import { MushafState } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId مطلوب" }, { status: 400 });
    }

    // Check if live session exists in DB
    const liveSession = await prisma.liveSession.findUnique({
      where: { id: sessionId },
    });

    if (liveSession) {
      let dbState = await prisma.mushafSessionState.findUnique({
        where: { sessionId },
      });

      if (!dbState) {
        dbState = await prisma.mushafSessionState.create({
          data: {
            sessionId,
            mode: "VIEW",
            currentSurah: 1,
            currentPage: 1,
            currentAyah: 1,
            allowFreeNavigation: false,
            highlightedAyahs: "[]",
          },
        });
      }

      let highlights: number[] = [];
      try {
        highlights = JSON.parse(dbState.highlightedAyahs);
      } catch (e) {
        highlights = [];
      }

      const state: MushafState = {
        sessionId,
        mode: dbState.mode as any,
        currentSurah: dbState.currentSurah,
        currentPage: dbState.currentPage,
        currentAyah: dbState.currentAyah,
        activeStudentId: dbState.activeStudentId,
        allowFreeNavigation: dbState.allowFreeNavigation,
        highlightedAyahs: highlights,
        lockedAt: dbState.lockedAt?.toISOString() || null,
        updatedAt: dbState.updatedAt.toISOString(),
      };

      return NextResponse.json({ state });
    }

    // Fallback: standalone / virtual session from realtime hub
    const state = realtimeHub.getMushafState(sessionId);
    return NextResponse.json({ state });
  } catch (error) {
    console.error("Get mushaf state error:", error);
    return NextResponse.json({ error: "فشل استرداد حالة المصحف" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      sessionId,
      mode,
      currentSurah,
      currentPage,
      currentAyah,
      activeStudentId,
      allowFreeNavigation,
      highlightedAyahs,
      isTeacher: bodyIsTeacher,
    } = body;

    const user = await getCurrentUser();
    const referer = req.headers.get("referer") || "";
    const isTeacherAuthorized =
      bodyIsTeacher === true ||
      referer.includes("role=teacher") ||
      referer.includes("/teacher") ||
      (user && user.role === "TEACHER");

    if (!isTeacherAuthorized) {
      return NextResponse.json(
        { error: "غير مصرح للطالب بالتحكم في أوضاع المصحف" },
        { status: 403 }
      );
    }

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId مطلوب" }, { status: 400 });
    }

    const liveSession = await prisma.liveSession.findUnique({
      where: { id: sessionId },
    });

    let newState: MushafState;

    if (liveSession) {
      const lockedAt = mode === "TASMEE_LOCKED" ? new Date() : null;

      const updated = await prisma.mushafSessionState.upsert({
        where: { sessionId },
        update: {
          ...(mode && { mode }),
          ...(currentSurah !== undefined && { currentSurah }),
          ...(currentPage !== undefined && { currentPage }),
          ...(currentAyah !== undefined && { currentAyah }),
          ...(activeStudentId !== undefined && { activeStudentId }),
          ...(allowFreeNavigation !== undefined && { allowFreeNavigation }),
          ...(highlightedAyahs !== undefined && {
            highlightedAyahs: JSON.stringify(highlightedAyahs),
          }),
          ...(mode === "TASMEE_LOCKED" ? { lockedAt } : mode ? { lockedAt: null } : {}),
        },
        create: {
          sessionId,
          mode: mode || "VIEW",
          currentSurah: currentSurah || 1,
          currentPage: currentPage || 1,
          currentAyah: currentAyah || 1,
          activeStudentId: activeStudentId || null,
          allowFreeNavigation: allowFreeNavigation ?? false,
          highlightedAyahs: JSON.stringify(highlightedAyahs || []),
          lockedAt,
        },
      });

      let parsedHighlights: number[] = [];
      try {
        parsedHighlights = JSON.parse(updated.highlightedAyahs);
      } catch {
        parsedHighlights = [];
      }

      newState = {
        sessionId,
        mode: updated.mode as any,
        currentSurah: updated.currentSurah,
        currentPage: updated.currentPage,
        currentAyah: updated.currentAyah,
        activeStudentId: updated.activeStudentId,
        allowFreeNavigation: updated.allowFreeNavigation,
        highlightedAyahs: parsedHighlights,
        lockedAt: updated.lockedAt?.toISOString() || null,
        updatedAt: updated.updatedAt.toISOString(),
      };
    } else {
      const currentState = realtimeHub.getMushafState(sessionId);
      newState = {
        sessionId,
        mode: mode || currentState.mode,
        currentSurah: currentSurah !== undefined ? currentSurah : currentState.currentSurah,
        currentPage: currentPage !== undefined ? currentPage : currentState.currentPage,
        currentAyah: currentAyah !== undefined ? currentAyah : currentState.currentAyah,
        activeStudentId: activeStudentId !== undefined ? activeStudentId : currentState.activeStudentId,
        allowFreeNavigation:
          allowFreeNavigation !== undefined ? allowFreeNavigation : currentState.allowFreeNavigation,
        highlightedAyahs: highlightedAyahs || currentState.highlightedAyahs,
        lockedAt: mode === "TASMEE_LOCKED" ? new Date().toISOString() : null,
        updatedAt: new Date().toISOString(),
      };
    }

    // Update in-memory & broadcast realtime to session channel
    realtimeHub.setMushafState(sessionId, newState);

    // Broadcast to global channel so all clients connected to global SSE receive it
    realtimeHub.broadcast("global", {
      type: "MUSHAF_STATE_UPDATED",
      payload: newState,
    });

    // Also sync and broadcast to main-halaqa-session if working in live session
    if (sessionId !== "main-halaqa-session") {
      const syncedMain = { ...newState, sessionId: "main-halaqa-session" };
      realtimeHub.setMushafState("main-halaqa-session", syncedMain);
      realtimeHub.broadcast("session-main-halaqa-session", {
        type: "MUSHAF_STATE_UPDATED",
        payload: syncedMain,
      });
    }

    return NextResponse.json({ success: true, state: newState });
  } catch (error) {
    console.error("Update mushaf state error:", error);
    return NextResponse.json({ error: "فشل تحديث حالة المصحف" }, { status: 500 });
  }
}
