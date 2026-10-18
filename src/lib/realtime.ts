import { RealtimeEvent, MushafState } from "@/types";

type Listener = (event: RealtimeEvent) => void;

class RealtimeHub {
  private listeners: Map<string, Set<Listener>> = new Map();
  private sessionStates: Map<string, MushafState> = new Map();

  subscribe(channel: string, listener: Listener): () => void {
    if (!this.listeners.has(channel)) {
      this.listeners.set(channel, new Set());
    }
    this.listeners.get(channel)!.add(listener);

    return () => {
      const set = this.listeners.get(channel);
      if (set) {
        set.delete(listener);
        if (set.size === 0) {
          this.listeners.delete(channel);
        }
      }
    };
  }

  broadcast(channel: string, event: Omit<RealtimeEvent, "timestamp" | "channel">) {
    const fullEvent: RealtimeEvent = {
      ...event,
      channel,
      timestamp: Date.now(),
    };

    // If channel-specific
    const channelListeners = this.listeners.get(channel);
    if (channelListeners) {
      channelListeners.forEach((fn) => {
        try {
          fn(fullEvent);
        } catch (e) {
          console.error("Listener error:", e);
        }
      });
    }

    // Also notify global listeners
    if (channel !== "global") {
      const globalListeners = this.listeners.get("global");
      if (globalListeners) {
        globalListeners.forEach((fn) => {
          try {
            fn(fullEvent);
          } catch (e) {
            console.error("Global listener error:", e);
          }
        });
      }
    }
  }

  setMushafState(sessionId: string, state: MushafState) {
    this.sessionStates.set(sessionId, state);
    this.broadcast(`session-${sessionId}`, {
      type: "MUSHAF_STATE_UPDATED",
      payload: state,
    });
  }

  getMushafState(sessionId: string): MushafState {
    const existing = this.sessionStates.get(sessionId);
    if (existing) return existing;

    const defaultState: MushafState = {
      sessionId,
      mode: "VIEW",
      currentSurah: 1,
      currentPage: 1,
      currentAyah: 1,
      allowFreeNavigation: false,
      highlightedAyahs: [],
      lockedAt: null,
    };
    this.sessionStates.set(sessionId, defaultState);
    return defaultState;
  }
}

// Global singleton
const globalHub = globalThis as unknown as { __realtimeHub?: RealtimeHub };
export const realtimeHub = globalHub.__realtimeHub ?? new RealtimeHub();
if (process.env.NODE_ENV !== "production") {
  globalHub.__realtimeHub = realtimeHub;
}
