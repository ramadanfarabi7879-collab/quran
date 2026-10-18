"use client";

import React, { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";
import { useAuth, useRealtime } from "@/components/providers/AppProviders";
import { playHalaqaStartSound } from "@/lib/sound";
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
} from "lucide-react";

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
  } | null>(null);

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

  // Realtime notification listener: plays sound and pops up modal for student
  useEffect(() => {
    if (lastEvent && lastEvent.type === "HALAQA_LIVE_STARTED") {
      const payload = lastEvent.payload;
      if (isStudent) {
        playHalaqaStartSound();
        setLiveModal({
          open: true,
          sessionId: payload?.sessionId,
          halaqaName: payload?.halaqaName || "حلقة الفجر والتحفيظ والتجويد",
          teacherName: payload?.teacherName || "الشيخ أحمد المنشاوي",
          title: payload?.title,
        });
      }
    }
  }, [lastEvent, isStudent]);

  // Fallback 3-second check for active live sessions for student
  useEffect(() => {
    if (!isStudent) return;

    let dismissedSessionId = "";

    const checkActive = async () => {
      try {
        const res = await fetch("/api/live/session");
        if (res.ok) {
          const data = await res.json();
          if (data.session && data.session.status === "ACTIVE") {
            const sess = data.session;
            if (sess.id !== dismissedSessionId && (!liveModal || !liveModal.open)) {
              setLiveModal((prev) => {
                if (prev?.open && prev.sessionId === sess.id) return prev;
                // If not open yet, play sound and open modal
                playHalaqaStartSound();
                return {
                  open: true,
                  sessionId: sess.id,
                  halaqaName: sess.halaqa?.name || "حلقة الفجر والتحفيظ والتجويد",
                  teacherName: sess.halaqa?.teacher?.user?.name || "الشيخ أحمد المنشاوي",
                  title: sess.title,
                };
              });
            }
          }
        }
      } catch {}
    };

    checkActive();
    const interval = setInterval(checkActive, 3500);
    return () => clearInterval(interval);
  }, [isStudent, liveModal]);

  return (
    <div
      className={`flex flex-col bg-slate-50 dark:bg-slate-950 pb-16 md:pb-0 ${
        pathname.includes("/mushaf") ? "h-screen overflow-hidden" : "min-h-screen"
      }`}
    >
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

      {/* Mobile Bottom Navigation Bar (Sticky Thumb Access on Phones) */}
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
            {/* Close button */}
            <button
              onClick={() => setLiveModal(null)}
              className="absolute top-4 left-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Glowing Icon */}
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

            <div className="flex flex-col gap-2.5">
              <Link
                href={`/classroom/${liveModal.sessionId}?role=student`}
                onClick={() => setLiveModal(null)}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm shadow-lg shadow-emerald-600/30 transition active:scale-95 flex items-center justify-center gap-2"
              >
                <Video className="w-4 h-4" />
                انضم الآن للغرفة الافتراضية
              </Link>

              <button
                onClick={() => setLiveModal(null)}
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
