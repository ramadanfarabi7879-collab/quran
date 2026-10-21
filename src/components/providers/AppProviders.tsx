"use client";

import React, { createContext, useContext, useEffect, useState, useRef, useCallback, ReactNode } from "react";
import { CurrentUser, RealtimeEvent } from "@/types";
import { SheikhDecisionOverlay } from "@/components/notifications/SheikhDecisionOverlay";
import { StudentDecisionOverlay } from "@/components/notifications/StudentDecisionOverlay";

interface AuthContextType {
  user: CurrentUser | null;
  loading: boolean;
  switchUser: (role?: string, userId?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  switchUser: async () => {},
  logout: async () => {},
  refreshUser: async () => {},
});

interface RealtimeContextType {
  lastEvent: RealtimeEvent | null;
  connected: boolean;
  subscribe: (channel: string, callback: (event: RealtimeEvent) => void) => () => void;
}

const RealtimeContext = createContext<RealtimeContextType>({
  lastEvent: null,
  connected: false,
  subscribe: () => () => {},
});

export function AppProviders({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [lastEvent, setLastEvent] = useState<RealtimeEvent | null>(null);
  const [connected, setConnected] = useState(false);
  const callbacksRef = useRef<Map<string, Set<(e: RealtimeEvent) => void>>>(new Map());
  const processedEventKeysRef = useRef<Set<string>>(new Set());
  const lastEventTimestampRef = useRef<number>(Date.now() - 60000);

  // Dark mode init
  useEffect(() => {
    const isDark = localStorage.getItem("theme") === "dark";
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem("theme", next ? "dark" : "light");
    if (next) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const fetchUser = async () => {
    try {
      const pathname = typeof window !== "undefined" ? window.location.pathname : "";
      const isStudent = pathname.startsWith("/student");
      const isAdmin = pathname.startsWith("/admin");
      const isTeacher = pathname.startsWith("/teacher");
      const roleParam = isStudent
        ? "?role=STUDENT"
        : isAdmin
        ? "?role=ADMIN"
        : isTeacher
        ? "?role=TEACHER"
        : "";

      const res = await fetch(`/api/auth/me${roleParam}`);
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const switchUser = async (role?: string, userId?: string, redirect = false) => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/switch-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, userId }),
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        if (redirect) {
          if (data.user?.role === "STUDENT") {
            window.location.href = "/student/dashboard";
          } else if (data.user?.role === "ADMIN") {
            window.location.href = "/admin/dashboard";
          } else {
            window.location.href = "/teacher/dashboard";
          }
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    window.location.href = "/login";
  };

  // Dispatch an event to internal subscribers with de-duplication
  const dispatchEvent = useCallback((event: RealtimeEvent) => {
    const eventKey = `${event.type}-${event.timestamp}-${JSON.stringify(event.payload || "")}`;
    if (processedEventKeysRef.current.has(eventKey)) return;
    processedEventKeysRef.current.add(eventKey);

    // Keep set bounded
    if (processedEventKeysRef.current.size > 200) {
      const it = processedEventKeysRef.current.values();
      for (let i = 0; i < 50; i++) {
        const nextVal = it.next().value;
        if (nextVal !== undefined) {
          processedEventKeysRef.current.delete(nextVal);
        }
      }
    }

    if (event.timestamp > lastEventTimestampRef.current) {
      lastEventTimestampRef.current = event.timestamp;
    }

    setLastEvent(event);

    const cbs = callbacksRef.current;
    if (event.channel && cbs.has(event.channel)) {
      cbs.get(event.channel)!.forEach((cb) => {
        try { cb(event); } catch (e) { console.error(e); }
      });
    }
    if (cbs.has("global")) {
      cbs.get("global")!.forEach((cb) => {
        try { cb(event); } catch (e) { console.error(e); }
      });
    }
  }, []);

  // Poll for missed events
  const pollMissedEvents = useCallback(async () => {
    try {
      const res = await fetch(`/api/realtime/poll?since=${lastEventTimestampRef.current}&channel=global`);
      if (res.ok) {
        const data = await res.json();
        if (data.events && Array.isArray(data.events)) {
          for (const ev of data.events) {
            dispatchEvent(ev);
          }
        }
      }
    } catch {}
  }, [dispatchEvent]);

  // Setup Global Realtime (Hybrid SSE + Fast Fallback Polling)
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let pollInterval: NodeJS.Timeout | null = null;
    let isMounted = true;

    // 1. Try Native SSE
    if (typeof EventSource !== "undefined") {
      try {
        eventSource = new EventSource("/api/realtime/stream?channel=global");
        eventSource.onopen = () => {
          if (isMounted) setConnected(true);
        };
        eventSource.onmessage = (e) => {
          try {
            const event: RealtimeEvent = JSON.parse(e.data);
            if (isMounted && event) {
              dispatchEvent(event);
            }
          } catch {}
        };
        eventSource.onerror = () => {
          if (isMounted) setConnected(false);
        };
      } catch {
        if (isMounted) setConnected(false);
      }
    }

    // 2. Active Fast Fallback Polling (Every 2.5s) to guarantee zero notification delay
    pollInterval = setInterval(() => {
      if (!isMounted) return;
      pollMissedEvents();
    }, 2500);

    // 3. Instant re-fetch on window focus or internet reconnect
    const handleReconnected = () => {
      if (isMounted) {
        pollMissedEvents();
      }
    };
    window.addEventListener("focus", handleReconnected);
    window.addEventListener("online", handleReconnected);

    return () => {
      isMounted = false;
      if (eventSource) eventSource.close();
      if (pollInterval) clearInterval(pollInterval);
      window.removeEventListener("focus", handleReconnected);
      window.removeEventListener("online", handleReconnected);
    };
  }, [dispatchEvent, pollMissedEvents]);

  const subscribe = useCallback((channel: string, callback: (event: RealtimeEvent) => void) => {
    if (!callbacksRef.current.has(channel)) {
      callbacksRef.current.set(channel, new Set());
    }
    callbacksRef.current.get(channel)!.add(callback);

    return () => {
      const set = callbacksRef.current.get(channel);
      if (set) {
        set.delete(callback);
        if (set.size === 0) callbacksRef.current.delete(channel);
      }
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, switchUser, logout, refreshUser: fetchUser }}>
      <RealtimeContext.Provider value={{ lastEvent, connected, subscribe }}>
        <div className={darkMode ? "dark" : ""}>
          {children}
          <SheikhDecisionOverlay />
          <StudentDecisionOverlay />
        </div>
      </RealtimeContext.Provider>
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
export const useRealtime = () => useContext(RealtimeContext);
