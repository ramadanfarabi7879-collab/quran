"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
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
  const [callbacks] = useState<Map<string, Set<(e: RealtimeEvent) => void>>>(new Map());

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

  // Setup Global Realtime - polling mode for Vercel, SSE for local dev
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let pollInterval: NodeJS.Timeout | null = null;
    let isMounted = true;

    const setupRealtime = async () => {
      try {
        // Check if SSE works (returns mode:polling on Vercel)
        const testRes = await fetch("/api/realtime/stream?channel=global");
        const testData = await testRes.json().catch(() => null);

        if (testData?.mode === "polling") {
          // Vercel: use polling instead of SSE
          setConnected(true);
          pollInterval = setInterval(async () => {
            if (!isMounted) return;
            try {
              // Poll for any new events via a lightweight endpoint
              const res = await fetch("/api/realtime/poll");
              if (res.ok) {
                const data = await res.json();
                if (data.events?.length) {
                  data.events.forEach((event: RealtimeEvent) => {
                    setLastEvent(event);
                    if (event.channel && callbacks.has(event.channel)) {
                      callbacks.get(event.channel)!.forEach((cb) => cb(event));
                    }
                    if (callbacks.has("global")) {
                      callbacks.get("global")!.forEach((cb) => cb(event));
                    }
                  });
                }
              }
            } catch {}
          }, 15000); // Poll every 15 seconds
        } else {
          // Local dev: use SSE
          eventSource = new EventSource("/api/realtime/stream?channel=global");
          eventSource.onopen = () => { if (isMounted) setConnected(true); };
          eventSource.onmessage = (e) => {
            try {
              const event: RealtimeEvent = JSON.parse(e.data);
              if (isMounted) {
                setLastEvent(event);
                if (event.channel && callbacks.has(event.channel)) {
                  callbacks.get(event.channel)!.forEach((cb) => cb(event));
                }
                if (callbacks.has("global")) {
                  callbacks.get("global")!.forEach((cb) => cb(event));
                }
              }
            } catch {}
          };
          eventSource.onerror = () => {
            if (isMounted) setConnected(false);
          };
        }
      } catch {
        // Fallback: just mark as connected without realtime
        if (isMounted) setConnected(true);
      }
    };

    setupRealtime();

    return () => {
      isMounted = false;
      if (eventSource) eventSource.close();
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [callbacks]);


  const subscribe = (channel: string, callback: (event: RealtimeEvent) => void) => {
    if (!callbacks.has(channel)) {
      callbacks.set(channel, new Set());
    }
    callbacks.get(channel)!.add(callback);

    return () => {
      const set = callbacks.get(channel);
      if (set) {
        set.delete(callback);
        if (set.size === 0) callbacks.delete(channel);
      }
    };
  };

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
