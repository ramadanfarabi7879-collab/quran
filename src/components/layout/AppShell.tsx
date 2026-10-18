"use client";

import React, { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";
import { useAuth, useRealtime } from "@/components/providers/AppProviders";
import {
  LayoutDashboard,
  BookOpen,
  CalendarDays,
  FileCheck2,
  Menu,
  Video,
  Radio,
  X,
  Volume2,
  CheckCircle2,
  Clock,
  UserCheck,
  UserPlus,
} from "lucide-react";
import { playHalaqaStartSound, playStudentApprovedSound } from "@/lib/sound";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, switchUser, loading } = useAuth();
  const { lastEvent } = useRealtime();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [liveModal, setLiveModal] = useState<{
    open: boolean;
    sessionId: string;
    halaqaName: string;
    teacherName: string;
    title?: string;
    approvalStatus?: "APPROVED" | "PENDING" | "NOT_REQUESTED";
  } | null>(null);

  // Student Real-time Floating Approval Toast
  const [studentApprovalToast, setStudentApprovalToast] = useState<{
    visible: boolean;
    message: string;
    sessionId?: string;
  } | null>(null);

  const [dismissedSessionIds, setDismissedSessionIds] = useState<string[]>([]);
  const [requestingJoin, setRequestingJoin] = useState(false);

  const isStudent = user?.role === "STUDENT" || pathname.startsWith("/student");
  const isTeacher = user?.role === "TEACHER" || pathname.startsWith("/teacher");

  useEffect(() => {
    if (loading || !user) return;
    if (pathname.startsWith("/student") && user.role !== "STUDENT") {
      switchUser("STUDENT", "student@quran.com");
    } else if (pathname.startsWith("/admin") && user.role !== "ADMIN") {
      switchUser("ADMIN");
    } else if (pathname.startsWith("/teacher") && user.role !== "TEACHER") {
      switchUser("TEACHER");
    }
  }, [pathname, user, loading]);

  // Realtime notification listener
  useEffect(() => {
    if (!lastEvent) return;

    // 1. Session started
    if (lastEvent.type === "HALAQA_LIVE_STARTED") {
      const payload = lastEvent.payload;
      if (isStudent) {
        playHalaqaStartSound();
        setLiveModal({
          open: true,
          sessionId: payload?.sessionId,
          halaqaName: payload?.halaqaName || "حلقة الفجر والتحفيظ والتجويد",
          teacherName: payload?.teacherName || "الشيخ أحمد المنشاوي",
          title: payload?.title,
          approvalStatus: "NOT_REQUESTED",
        });
      }
    }

    // 2. Sheikh clicked "قبول ودخول" -> Alert Student screen immediately!
    if (lastEvent.type === "SESSION_JOIN_APPROVED" || lastEvent.type === "JOIN_REQUEST_APPROVED") {
      const p = lastEvent.payload;
      if (isStudent) {
        playStudentApprovedSound();
        setStudentApprovalToast({
          visible: true,
          message: p.message || "وافق فضيلة الشيخ على طلب انضمامك للحلقة المباركة",
          sessionId: p.sessionId,
        });
        setLiveModal((prev) => (prev ? { ...prev, approvalStatus: "APPROVED" } : null));
        setTimeout(() => setStudentApprovalToast(null), 6000);
      }
    }

    // 3. Session ended -> Dismiss student live modal immediately
    if (lastEvent.type === "HALAQA_LIVE_ENDED") {
      setLiveModal(null);
    }
  }, [lastEvent, isStudent, isTeacher]);

  // Student 1-Click Request Join Handler
  const handleStudent1ClickJoin = async (sessionId?: string) => {
    setRequestingJoin(true);
    try {
      const res = await fetch("/api/student/join-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: sessionId || liveModal?.sessionId,
        }),
      });
      if (res.ok) {
        setLiveModal((prev) => (prev ? { ...prev, approvalStatus: "PENDING" } : null));
      }
    } catch {} finally {
      setRequestingJoin(false);
    }
  };

  const handleDismissLiveModal = (sessionId?: string) => {
    if (sessionId) {
      setDismissedSessionIds((prev) => (prev.includes(sessionId) ? prev : [...prev, sessionId]));
    }
    setLiveModal(null);
  };

  // Fallback check for active live sessions for student
  useEffect(() => {
    if (!isStudent) return;

    const checkActive = async () => {
      try {
        const res = await fetch("/api/live/session");
        if (res.ok) {
          const data = await res.json();
          if (data.session && data.session.status === "ACTIVE") {
            const sess = data.session;
            const status = data.authorizationStatus === "AUTHORIZED"
              ? "APPROVED"
              : data.authorizationStatus === "PENDING_APPROVAL"
              ? "PENDING"
              : "NOT_REQUESTED";

            // If user dismissed this session, don't reopen automatically unless approved
            if (dismissedSessionIds.includes(sess.id) && status !== "APPROVED") {
              return;
            }

            setLiveModal((prev) => {
              if (prev && prev.sessionId === sess.id) {
                // Update approval status dynamically without closing
                if (prev.approvalStatus !== status) {
                  return { ...prev, approvalStatus: status };
                }
                return prev;
              }

              if (!dismissedSessionIds.includes(sess.id)) {
                return {
                  open: true,
                  sessionId: sess.id,
                  halaqaName: sess.halaqa?.name || "حلقة الفجر والتحفيظ والتجويد",
                  teacherName: sess.halaqa?.teacher?.user?.name || "الشيخ أحمد المنشاوي",
                  title: sess.title,
                  approvalStatus: status,
                };
              }
              return prev;
            });
          } else {
            // No active live session -> clear live modal immediately
            setLiveModal(null);
          }
        }
      } catch {}
    };

    checkActive();
    // Relaxed fallback check every 30 seconds to keep performance light and fast
    const interval = setInterval(checkActive, 30000);
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkActive();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [isStudent, dismissedSessionIds]);

  return (
    <div
      className={`flex flex-col bg-slate-50 dark:bg-slate-950 pb-16 md:pb-0 ${
        pathname.includes("/mushaf") ? "h-screen overflow-hidden" : "min-h-screen"
      }`}
    >

      {/* 3. Student Real-Time Floating Approval Toast */}
      {studentApprovalToast?.visible && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-[92%] sm:w-full animate-in slide-in-from-top-4 duration-300">
          <div className="bg-gradient-to-r from-emerald-700 via-emerald-800 to-teal-800 text-white rounded-3xl p-4 shadow-2xl border-2 border-emerald-300 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6 text-amber-300" />
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black text-amber-300 uppercase tracking-wider block">
                  موافقة الشيخ والاعتماد
                </span>
                <p className="text-xs font-bold text-white">
                  {studentApprovalToast.message}
                </p>
              </div>
            </div>

            {studentApprovalToast.sessionId && (
              <Link
                href={`/classroom/${studentApprovalToast.sessionId}?role=student`}
                className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs px-3.5 py-2 rounded-xl shadow transition shrink-0 flex items-center gap-1"
              >
                <Video className="w-3.5 h-3.5" />
                <span>متابعة الحلقة 🎥</span>
              </Link>
            )}
          </div>
        </div>
      )}

      <Navbar onToggleMobileMenu={() => setMobileMenuOpen((prev) => !prev)} />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar mobileOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

        <main
          className={`flex-1 ${
            pathname.includes("/mushaf")
              ? "overflow-hidden flex flex-col p-2 sm:p-4"
              : "overflow-y-auto p-3 sm:p-6 lg:p-8"
          }`}
        >
          <div
            className={`max-w-7xl mx-auto w-full ${
              pathname.includes("/mushaf") ? "flex-1 flex flex-col h-full min-h-0" : ""
            }`}
          >
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-t border-slate-200 dark:border-slate-800 flex items-center justify-around py-2 px-1 shadow-lg">
        <Link
          href={isTeacher ? "/teacher/dashboard" : "/student/dashboard"}
          className={`flex flex-col items-center gap-1 text-[11px] font-bold ${
            pathname.endsWith("/dashboard")
              ? "text-islamic-700 dark:text-emerald-400"
              : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>الرئيسية</span>
        </Link>

        <Link
          href={isTeacher ? "/teacher/mushaf" : "/student/mushaf"}
          className={`flex flex-col items-center gap-1 text-[11px] font-bold ${
            pathname.includes("/mushaf")
              ? "text-islamic-700 dark:text-emerald-400"
              : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>المصحف</span>
        </Link>

        <Link
          href={isTeacher ? "/teacher/halaqat" : "/student/my-halaqat"}
          className={`flex flex-col items-center gap-1 text-[11px] font-bold ${
            pathname.includes("halaqat")
              ? "text-islamic-700 dark:text-emerald-400"
              : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          }`}
        >
          <CalendarDays className="w-4 h-4" />
          <span>الحلقات</span>
        </Link>

        <Link
          href={isTeacher ? "/teacher/assignments" : "/student/assignments"}
          className={`flex flex-col items-center gap-1 text-[11px] font-bold ${
            pathname.includes("assignments")
              ? "text-islamic-700 dark:text-emerald-400"
              : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          }`}
        >
          <FileCheck2 className="w-4 h-4" />
          <span>الواجبات</span>
        </Link>

        <button
          onClick={() => setMobileMenuOpen(true)}
          className="flex flex-col items-center gap-1 text-[11px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
        >
          <Menu className="w-4 h-4" />
          <span>المزيد</span>
        </button>
      </nav>

      {/* Global Realtime Live Session Pop-up Modal for Students */}
      {liveModal?.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full border-2 border-emerald-500/50 shadow-2xl overflow-hidden p-6 relative text-center">
            <button
              onClick={() => handleDismissLiveModal(liveModal.sessionId)}
              className="absolute top-4 left-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center mb-4 shadow-xl ring-4 ring-emerald-400/20 animate-bounce">
              <Video className="w-8 h-8" />
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-100 dark:bg-red-950/60 border border-red-300 dark:border-red-800 rounded-full text-xs font-bold text-red-600 dark:text-red-400 mb-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              بدأت الجلسة الآن مباشر
            </div>

            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-1">
              {liveModal.halaqaName}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              المعلم <strong className="text-emerald-600 dark:text-emerald-400">{liveModal.teacherName}</strong> في انتظارك الآن في الغرفة الافتراضية
            </p>

            {/* Single Dynamic Action Button */}
            <div className="flex flex-col gap-2.5">
              {liveModal.approvalStatus === "APPROVED" ? (
                <Link
                  href={`/classroom/${liveModal.sessionId}?role=student`}
                  onClick={() => setLiveModal(null)}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-400 to-gold-accent hover:from-amber-300 text-slate-950 font-black text-sm shadow-lg transition active:scale-95 flex items-center justify-center gap-2"
                >
                  <Video className="w-4 h-4" />
                  متابعة الحلقة 🎥
                </Link>
              ) : liveModal.approvalStatus === "PENDING" ? (
                <div className="w-full py-3.5 px-4 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-800 dark:text-amber-300 font-bold text-xs flex items-center justify-center gap-2">
                  <Clock className="w-4 h-4 text-amber-600 animate-spin" />
                  في انتظار قبول الشيخ ⏳
                </div>
              ) : (
                <button
                  onClick={() => handleStudent1ClickJoin(liveModal.sessionId)}
                  disabled={requestingJoin}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white font-black text-sm shadow-lg transition active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <UserPlus className="w-4 h-4" />
                  {requestingJoin ? "جارٍ إرسال الطلب للشيخ..." : "طلب انضمام"}
                </button>
              )}

              <button
                onClick={() => handleDismissLiveModal(liveModal.sessionId)}
                className="w-full py-2.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-bold transition"
              >
                إغلاق والتذكير لاحقاً
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
