"use client";

import React, { useState, useEffect } from "react";
import { useAuth, useRealtime } from "@/components/providers/AppProviders";
import { playStudentApprovedSound, playScheduleAlertSound, playHalaqaStartSound } from "@/lib/sound";
import {
  Bell,
  CheckCircle2,
  Calendar,
  XCircle,
  X,
  ExternalLink,
  Video,
  Radio,
} from "lucide-react";
import Link from "next/link";

interface StudentNotification {
  id: string;
  title: string;
  body: string;
  type: string;
  link?: string | null;
  createdAt: string;
  isSessionActive?: boolean;
  sessionData?: any;
}

const DECISION_TYPES = new Set([
  "ACCOUNT_APPROVED",
  "SESSION_APPROVED",
  "JOIN_REQUEST_APPROVED",
  "SCHEDULE_UPDATED",
  "REGISTRATION_REJECTED",
  "JOIN_REQUEST_DECIDED",
  "SESSION_REJECTED",
  "JOIN_REQUEST_REJECTED",
  "HALAQA_STARTING",
  "SESSION_STARTED",
]);

export function StudentDecisionOverlay() {
  const { user } = useAuth();
  const { lastEvent } = useRealtime();

  const isTeacherPath = typeof window !== "undefined" && (window.location.pathname.startsWith("/teacher") || window.location.search.includes("role=teacher"));
  const isStudent = (user?.role !== "TEACHER" && user?.role !== "ADMIN" && !isTeacherPath);

  const [activeNotification, setActiveNotification] = useState<StudentNotification | null>(null);
  const [joining, setJoining] = useState(false);
  const seenIdsRef = React.useRef<Set<string>>(new Set());

  // Listen to instant real-time events to immediately dismiss live session invitations when session ends
  useEffect(() => {
    if (lastEvent?.type === "HALAQA_LIVE_ENDED") {
      if (activeNotification?.type === "HALAQA_STARTING" || activeNotification?.type === "SESSION_STARTED") {
        setActiveNotification(null);
      }
    }
  }, [lastEvent, activeNotification]);

  // PeerJS Direct Instant Listener for Real-Time Sheikh Decisions (<50ms)
  useEffect(() => {
    let isDisposed = false;
    let peerInstance: any = null;

    const setupStudentHub = async () => {
      try {
        if (typeof window === "undefined") return;
        const storedPhone = localStorage.getItem("lastStudentPhone") || "";
        const storedUserId = localStorage.getItem("lastStudentUserId") || "";
        const targetId = user?.id || user?.phone || storedUserId || storedPhone;
        if (!targetId) return;

        if (!(window as any).Peer) {
          await new Promise((resolve) => {
            const script = document.createElement("script");
            script.src = "https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js";
            script.async = true;
            script.onload = resolve;
            script.onerror = resolve;
            document.body.appendChild(script);
          });
        }

        const PeerClass = (window as any).Peer;
        if (!PeerClass || isDisposed) return;

        const cleanKey = targetId.replace(/[^a-zA-Z0-9_-]/g, "");
        const peerId = `quran-student-hub-${cleanKey}`;

        peerInstance = new PeerClass(peerId, { debug: 0 });

        peerInstance.on("connection", (conn: any) => {
          conn.on("data", (data: any) => {
            if (!data) return;

            if (data.decision === "ACCEPTED") {
              setActiveNotification({
                id: `dec-${Date.now()}`,
                type: "ACCOUNT_APPROVED",
                title: "مبارك! تم اعتماد وقبول طلبك 🎉",
                body: `يسرنا إبلاغك بموافقة فضيلة الشيخ على طلبك وتسكينك في: ${data.halaqaName || "حلقة القرآن الكريم"}. يمكنك الآن مباشرة الحفظ والتسميع.`,
                link: "/student/dashboard",
                createdAt: new Date().toISOString(),
              });
              playStudentApprovedSound();
            } else if (data.decision === "RESCHEDULED") {
              setActiveNotification({
                id: `dec-${Date.now()}`,
                type: "SCHEDULE_UPDATED",
                title: "تم تحديد موعد جديد من فضيلة الشيخ ⏳",
                body: `حدد فضيلة الشيخ موعد جلستك: ${data.scheduledTime || "الموعد المقترح"}. ${data.comment ? `ملاحظات الشيخ: "${data.comment}"` : ""}`,
                link: "/student/dashboard",
                createdAt: new Date().toISOString(),
              });
              playScheduleAlertSound();
            } else if (data.decision === "REJECTED") {
              setActiveNotification({
                id: `dec-${Date.now()}`,
                type: "REGISTRATION_REJECTED",
                title: "اعتذار الشيخ عن قبول الطلب",
                body: `نعتذر منك: ${data.reason || "تعذر قبول الطلب في الوقت الحالي"}. نسأل الله لك التوفيق والبركة.`,
                link: "/",
                createdAt: new Date().toISOString(),
              });
            }
          });
        });

        peerInstance.on("error", () => {});
      } catch (err) {
        console.warn("Student hub peer notice:", err);
      }
    };

    setupStudentHub();

    return () => {
      isDisposed = true;
      if (peerInstance && !peerInstance.destroyed) {
        try { peerInstance.destroy(); } catch {}
      }
    };
  }, [user]);

  useEffect(() => {
    if (!isStudent) return;

    let isMounted = true;
    const fetchNotifications = async () => {
      try {
        const storedPhone = typeof window !== "undefined" ? localStorage.getItem("lastStudentPhone") || "" : "";
        const storedUserId = typeof window !== "undefined" ? localStorage.getItem("lastStudentUserId") || "" : "";
        const queryParam = user?.id
          ? `?userId=${encodeURIComponent(user.id)}`
          : storedUserId
          ? `?userId=${encodeURIComponent(storedUserId)}`
          : storedPhone
          ? `?phone=${encodeURIComponent(storedPhone)}`
          : "";

        const res = await fetch(`/api/notifications${queryParam}`);
        if (!res.ok || !isMounted) return;
        const data = await res.json();
        const unread = (data.notifications || []).filter((n: any) => {
          if (n.isRead) return false;
          if (seenIdsRef.current.has(n.id)) return false;
          if (typeof window !== "undefined" && localStorage.getItem(`dismissed_notif_${n.id}`)) return false;
          if (!DECISION_TYPES.has(n.type)) return false;

          // CRITICAL: Live session invitations MUST have a genuinely active live session right now!
          if (n.type === "HALAQA_STARTING" || n.type === "SESSION_STARTED") {
            if (!n.isSessionActive || !data.activeLiveSession) {
              return false;
            }
          }
          return true;
        });

        // If currently showing a live session notification, but the session is no longer active, dismiss immediately
        if (activeNotification && (activeNotification.type === "HALAQA_STARTING" || activeNotification.type === "SESSION_STARTED")) {
          const matching = (data.notifications || []).find((n: any) => n.id === activeNotification.id);
          if (!matching?.isSessionActive || !data.activeLiveSession) {
            setActiveNotification(null);
          }
        }

        if (unread.length > 0 && !activeNotification) {
          const latest = unread[0];
          seenIdsRef.current.add(latest.id);
          setActiveNotification(latest);

          if (latest.type === "ACCOUNT_APPROVED" || latest.type === "SESSION_APPROVED") {
            playStudentApprovedSound();
          } else if (latest.type === "SCHEDULE_UPDATED") {
            playScheduleAlertSound();
          } else if (latest.type === "HALAQA_STARTING" || latest.type === "SESSION_STARTED") {
            playHalaqaStartSound();
          }
        }
      } catch {}
    };

    fetchNotifications();
    const timer = setInterval(fetchNotifications, 1200);
    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, [isStudent, activeNotification, user]);

  const handleDismiss = async () => {
    if (!activeNotification) return;
    const id = activeNotification.id;
    if (typeof window !== "undefined") {
      localStorage.setItem(`dismissed_notif_${id}`, "true");
    }
    seenIdsRef.current.add(id);
    setActiveNotification(null);

    try {
      const storedPhone = typeof window !== "undefined" ? localStorage.getItem("lastStudentPhone") || "" : "";
      const storedUserId = typeof window !== "undefined" ? localStorage.getItem("lastStudentUserId") || "" : "";
      const queryParam = user?.id
        ? `?userId=${encodeURIComponent(user.id)}`
        : storedUserId
        ? `?userId=${encodeURIComponent(storedUserId)}`
        : storedPhone
        ? `?phone=${encodeURIComponent(storedPhone)}`
        : "";

      await fetch(`/api/notifications${queryParam}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: id }),
      });
    } catch {}
  };

  const handleAcceptLiveSession = async () => {
    if (!activeNotification || joining) return;
    setJoining(true);

    try {
      // Extract sessionId from notification link if available
      let sessionId = "";
      if (activeNotification.link) {
        const match = activeNotification.link.match(/\/classroom\/([^/?]+)/);
        if (match) sessionId = match[1];
      }

      // Mark acceptance in backend
      await fetch("/api/student/join-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: sessionId || "auto",
          acceptInvitation: true,
        }),
      }).catch(() => {});

      // Dismiss locally and in DB
      await handleDismiss();

      // Direct instant navigation to classroom!
      const targetUrl = activeNotification.link || `/classroom/${sessionId}?role=student`;
      window.location.href = targetUrl;
    } catch (e) {
      console.error(e);
      // Fallback direct navigate
      if (activeNotification.link) {
        window.location.href = activeNotification.link;
      }
    } finally {
      setJoining(false);
    }
  };

  if (!isStudent || !activeNotification) return null;

  const isLiveStarting = activeNotification.type === "HALAQA_STARTING" || activeNotification.type === "SESSION_STARTED";
  const isApproved = activeNotification.type === "ACCOUNT_APPROVED" || activeNotification.type === "SESSION_APPROVED" || activeNotification.type === "JOIN_REQUEST_APPROVED";
  const isRescheduled = activeNotification.type === "SCHEDULE_UPDATED";
  const isRejected = activeNotification.type === "REGISTRATION_REJECTED" || activeNotification.type === "SESSION_REJECTED" || activeNotification.type === "JOIN_REQUEST_DECIDED" || activeNotification.type === "JOIN_REQUEST_REJECTED";

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[99999] w-[95%] max-w-md animate-in slide-in-from-top-6 duration-300 drop-shadow-2xl">
      <div
        className={`text-white rounded-3xl p-4 sm:p-5 border-2 shadow-[0_20px_50px_rgba(0,0,0,0.85)] relative overflow-hidden backdrop-blur-xl ${
          isLiveStarting
            ? "bg-gradient-to-br from-slate-950 via-emerald-950 to-teal-950 border-amber-400 ring-2 ring-amber-400/30"
            : isApproved
            ? "bg-gradient-to-br from-slate-950 via-emerald-950 to-teal-950 border-emerald-400"
            : isRescheduled
            ? "bg-gradient-to-br from-slate-950 via-amber-950 to-orange-950 border-amber-400"
            : isRejected
            ? "bg-gradient-to-br from-slate-950 via-red-950 to-rose-950 border-red-500"
            : "bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 border-emerald-500"
        }`}
      >
        <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full animate-ping ${
                isLiveStarting
                  ? "bg-red-500"
                  : isApproved
                  ? "bg-emerald-400"
                  : isRescheduled
                  ? "bg-amber-400"
                  : "bg-red-400"
              }`}
            />
            <span className="text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 text-white">
              {isLiveStarting ? (
                <>
                  <Radio className="w-3.5 h-3.5 text-red-400 animate-pulse" />
                  <span>دعوة لحضور الجلسة المباشرة الآن</span>
                </>
              ) : (
                <>
                  <Bell className="w-3.5 h-3.5 text-amber-300" />
                  <span>إشعار جديد من فضيلة الشيخ</span>
                </>
              )}
            </span>
          </div>

          <button
            onClick={handleDismiss}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition"
            title="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${
                isLiveStarting
                  ? "bg-gradient-to-br from-amber-500 to-emerald-600 text-slate-950 font-black shadow-amber-500/20"
                  : isApproved
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30"
                  : isRescheduled
                  ? "bg-amber-500/20 text-amber-300 border border-amber-400/30"
                  : "bg-red-500/20 text-red-300 border border-red-400/30"
              }`}
            >
              {isLiveStarting ? (
                <Video className="w-6 h-6 text-white" />
              ) : isApproved ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              ) : isRescheduled ? (
                <Calendar className="w-6 h-6 text-amber-400" />
              ) : (
                <XCircle className="w-6 h-6 text-red-400" />
              )}
            </div>

            <div className="flex-1 min-w-0 text-right">
              <h4 className="text-sm font-black text-white">{activeNotification.title}</h4>
              <p className="text-xs text-slate-200 mt-1 leading-relaxed">{activeNotification.body}</p>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-white/10">
            {isLiveStarting ? (
              <button
                onClick={handleAcceptLiveSession}
                disabled={joining}
                className="px-5 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-amber-400 to-gold-accent hover:from-amber-300 text-slate-950 transition flex items-center gap-1.5 shadow-lg active:scale-95 disabled:opacity-50"
              >
                <Video className="w-4 h-4" />
                <span>{joining ? "جارٍ الدخول..." : "قبول ودخول الجلسة 🎥"}</span>
              </button>
            ) : activeNotification.link?.includes("/classroom/") ? (
              <Link
                href={activeNotification.link}
                onClick={handleDismiss}
                className="px-5 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-950 transition flex items-center gap-1.5 shadow-lg active:scale-95"
              >
                <Video className="w-4 h-4" />
                <span>دخول الحلقة الآن 🎥</span>
              </Link>
            ) : activeNotification.link ? (
              <Link
                href={activeNotification.link}
                onClick={handleDismiss}
                className="px-4 py-2 rounded-xl text-xs font-black bg-white text-slate-950 hover:bg-slate-200 transition flex items-center gap-1 shadow"
              >
                <span>الانتقال للحلقة / الجدول</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            ) : null}

            <button
              onClick={handleDismiss}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white transition"
            >
              {isLiveStarting ? "تذكير لاحقاً" : "حسناً، تم الفهم"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
