"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/components/providers/AppProviders";
import { playStudentApprovedSound, playScheduleAlertSound } from "@/lib/sound";
import {
  Bell,
  CheckCircle2,
  Calendar,
  XCircle,
  X,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

interface StudentNotification {
  id: string;
  title: string;
  body: string;
  type: string;
  link?: string | null;
  createdAt: string;
}

export function StudentDecisionOverlay() {
  const { user } = useAuth();
  const isStudent = user?.role === "STUDENT";

  const [activeNotification, setActiveNotification] = useState<StudentNotification | null>(null);
  const seenIdsRef = React.useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!isStudent) return;

    let isMounted = true;
    const fetchNotifications = async () => {
      try {
        const res = await fetch("/api/notifications");
        if (!res.ok || !isMounted) return;
        const data = await res.json();
        const unread = (data.notifications || []).filter(
          (n: any) => !n.isRead && !seenIdsRef.current.has(n.id)
        );

        if (unread.length > 0 && !activeNotification) {
          const latest = unread[0];
          seenIdsRef.current.add(latest.id);
          setActiveNotification(latest);

          if (latest.type === "ACCOUNT_APPROVED" || latest.type === "SESSION_APPROVED") {
            playStudentApprovedSound();
          } else if (latest.type === "SCHEDULE_UPDATED") {
            playScheduleAlertSound();
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
  }, [isStudent, activeNotification]);

  const handleDismiss = async () => {
    if (!activeNotification) return;
    const id = activeNotification.id;
    setActiveNotification(null);

    try {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: id }),
      });
    } catch {}
  };

  if (!isStudent || !activeNotification) return null;

  const isApproved = activeNotification.type === "ACCOUNT_APPROVED" || activeNotification.type === "SESSION_APPROVED";
  const isRescheduled = activeNotification.type === "SCHEDULE_UPDATED";
  const isRejected = activeNotification.type === "REGISTRATION_REJECTED" || activeNotification.type === "SESSION_REJECTED";

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[99999] w-[95%] max-w-md animate-in slide-in-from-top-6 duration-300 drop-shadow-2xl">
      <div
        className={`text-white rounded-3xl p-4 sm:p-5 border-2 shadow-[0_20px_50px_rgba(0,0,0,0.85)] relative overflow-hidden backdrop-blur-xl ${
          isApproved
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
                isApproved ? "bg-emerald-400" : isRescheduled ? "bg-amber-400" : "bg-red-400"
              }`}
            />
            <span className="text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 text-white">
              <Bell className="w-3.5 h-3.5 text-amber-300" />
              إشعار جديد من فضيلة الشيخ
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
                isApproved
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30"
                  : isRescheduled
                  ? "bg-amber-500/20 text-amber-300 border border-amber-400/30"
                  : "bg-red-500/20 text-red-300 border border-red-400/30"
              }`}
            >
              {isApproved ? (
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
            {activeNotification.link && (
              <Link
                href={activeNotification.link}
                onClick={handleDismiss}
                className="px-4 py-2 rounded-xl text-xs font-black bg-white text-slate-950 hover:bg-slate-200 transition flex items-center gap-1 shadow"
              >
                <span>الانتقال للحلقة / الجدول</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            )}

            <button
              onClick={handleDismiss}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white transition"
            >
              حسناً، تم الفهم
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
