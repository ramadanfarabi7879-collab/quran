import { RealtimeEvent, MushafState } from "@/types";

type Listener = (event: RealtimeEvent) => void;

class RealtimeHub {
  private listeners: Map<string, Set<Listener>> = new Map();
  private sessionStates: Map<string, MushafState> = new Map();
  private recentEvents: RealtimeEvent[] = [];
  private maxBufferedEvents = 100;

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

    // Buffer the event for polling clients
    this.recentEvents.push(fullEvent);
    if (this.recentEvents.length > this.maxBufferedEvents) {
      this.recentEvents.shift();
    }

    // Channel-specific listeners
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

    // Global listeners
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

  getRecentEvents(sinceTimestamp = 0, channel?: string): RealtimeEvent[] {
    const cutoff = sinceTimestamp > 0 ? sinceTimestamp : Date.now() - 30000;
    return this.recentEvents.filter((e) => {
      if (e.timestamp <= cutoff) return false;
      if (channel && channel !== "global" && e.channel !== channel && e.channel !== "global") {
        return false;
      }
      return true;
    });
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

// Global singleton attached to globalThis across all environments
const globalHub = globalThis as unknown as { __realtimeHub?: RealtimeHub };
export const realtimeHub = globalHub.__realtimeHub ?? new RealtimeHub();
globalHub.__realtimeHub = realtimeHub;
