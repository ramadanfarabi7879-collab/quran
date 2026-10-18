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
  UserCheck,
  CheckCircle2,
  Bell,
  Clock,
  Sparkles,
  ShieldCheck,
  UserPlus,
} from "lucide-react";
import { playHalaqaStartSound, playTeacherJoinAlertSound, playStudentApprovedSound } from "@/lib/sound";

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

  // Sheikh Real-time Floating Join Request Notification
  const [teacherJoinToast, setTeacherJoinToast] = useState<{
    visible: boolean;
    requestId?: string;
    sessionId?: string;
    halaqaId?: string;
    halaqaName?: string;
    studentId?: string;
    studentName?: string;
    studentAvatar?: string;
    time?: string;
    isAccepting?: boolean;
    accepted?: boolean;
  } | null>(null);

  // Sheikh Real-time Floating New Student Registration Toast
  const [newStudentToast, setNewStudentToast] = useState<{
    visible: boolean;
    studentUserId?: string;
    studentName?: string;
    phone?: string;
    time?: string;
    isApproving?: boolean;
    approved?: boolean;
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

    // 2. Student clicked "طلب انضمام" -> Alert Teacher immediately!
    if (lastEvent.type === "SESSION_JOIN_REQUESTED" || lastEvent.type === "JOIN_REQUEST_SUBMITTED") {
      const p = lastEvent.payload;
      if (isTeacher) {
        playTeacherJoinAlertSound();
        setTeacherJoinToast({
          visible: true,
          requestId: p.requestId,
          sessionId: p.sessionId,
          halaqaId: p.halaqaId,
          halaqaName: p.halaqaName || "الحلقة القرآنية",
          studentId: p.studentId,
          studentName: p.studentName || "طالب العلم",
          studentAvatar: p.studentAvatar,
          time: p.time || new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }),
          isAccepting: false,
          accepted: false,
        });
      }
    }

    // 3. Sheikh clicked "قبول ودخول" -> Alert Student screen immediately!
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

    // 4. New Student Registered -> Alert Teacher immediately!
    if (lastEvent.type === "STUDENT_REGISTRATION_SUBMITTED") {
      const p = lastEvent.payload;
      if (isTeacher) {
        playTeacherJoinAlertSound();
        setNewStudentToast({
          visible: true,
          studentUserId: p.studentId || p.studentUserId,
          studentName: p.studentName || "طالب جديد",
          phone: p.phone,
          time: p.time || new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }),
          isApproving: false,
          approved: false,
        });
      }
    }
    // 5. Session ended -> Dismiss student live modal immediately
    if (lastEvent.type === "HALAQA_LIVE_ENDED") {
      setLiveModal(null);
    }
  }, [lastEvent, isStudent, isTeacher]);

  // Sheikh 1-Click Accept Session Join
  const handleTeacher1ClickAccept = async () => {
    if (!teacherJoinToast) return;
    setTeacherJoinToast((prev) => (prev ? { ...prev, isAccepting: true } : null));
    try {
      const res = await fetch("/api/teacher/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ACCEPT_JOIN_SESSION",
          sessionId: teacherJoinToast.sessionId,
          halaqaId: teacherJoinToast.halaqaId,
          studentId: teacherJoinToast.studentId,
          requestId: teacherJoinToast.requestId,
        }),
      });

      if (res.ok) {
        setTeacherJoinToast((prev) => (prev ? { ...prev, isAccepting: false, accepted: true } : null));
        setTimeout(() => setTeacherJoinToast(null), 3000);
      } else {
        alert("فشل تأكيد القبول");
        setTeacherJoinToast((prev) => (prev ? { ...prev, isAccepting: false } : null));
      }
    } catch {
      setTeacherJoinToast((prev) => (prev ? { ...prev, isAccepting: false } : null));
    }
  };

  // Sheikh 1-Click Approve New Student Registration
  const handleTeacher1ClickApproveStudent = async () => {
    if (!newStudentToast?.studentUserId) return;
    setNewStudentToast((prev) => (prev ? { ...prev, isApproving: true } : null));
    try {
      const res = await fetch("/api/teacher/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "APPROVE_STUDENT_REGISTRATION",
          studentUserId: newStudentToast.studentUserId,
        }),
      });
      if (res.ok) {
        setNewStudentToast((prev) => (prev ? { ...prev, isApproving: false, approved: true } : null));
        setTimeout(() => setNewStudentToast(null), 3500);
      } else {
        alert("فشل تفعيل الحساب");
        setNewStudentToast((prev) => (prev ? { ...prev, isApproving: false } : null));
      }
    } catch {
      setNewStudentToast((prev) => (prev ? { ...prev, isApproving: false } : null));
    }
  };

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
    const interval = setInterval(checkActive, 4000);
    return () => clearInterval(interval);
  }, [isStudent, dismissedSessionIds]);

  return (
    <div
      className={`flex flex-col bg-slate-50 dark:bg-slate-950 pb-16 md:pb-0 ${
        pathname.includes("/mushaf") ? "h-screen overflow-hidden" : "min-h-screen"
      }`}
    >
      {/* 1. Sheikh Real-Time Floating Join Request Alert with 1-Click Accept */}
      {teacherJoinToast?.visible && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-lg w-[92%] sm:w-full animate-in slide-in-from-top-4 duration-300">
          <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950 text-white rounded-3xl p-4 sm:p-5 shadow-2xl border-2 border-emerald-500/70 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src={
                    teacherJoinToast.studentAvatar ||
                    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150"
                  }
                  alt={teacherJoinToast.studentName}
                  className="w-11 h-11 rounded-2xl object-cover ring-2 ring-emerald-400"
                />
                <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-950 flex items-center justify-center">
                  <Bell className="w-2.5 h-2.5 text-white" />
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black text-amber-300 uppercase tracking-wider block">
                  🔔 طلب انضمام للحلقة الآن
                </span>
                <h4 className="font-black text-sm text-white">
                  الطالب: {teacherJoinToast.studentName}
                </h4>
                <p className="text-[11px] text-slate-300">
                  يرغب في الانضمام إلى: {teacherJoinToast.halaqaName}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {teacherJoinToast.accepted ? (
                <div className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>تم القبول والدخول ✅</span>
                </div>
              ) : (
                <>
                  <button
                    onClick={handleTeacher1ClickAccept}
                    disabled={teacherJoinToast.isAccepting}
                    className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl shadow-lg transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>{teacherJoinToast.isAccepting ? "جارٍ القبول..." : "قبول ودخول ✅"}</span>
                  </button>
                  <button
                    onClick={() => setTeacherJoinToast(null)}
                    className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition"
                    title="تجاهل"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. Sheikh Real-Time Floating New Student Registration Toast with 1-Click Approve */}
      {newStudentToast?.visible && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-lg w-[92%] sm:w-full animate-in slide-in-from-top-4 duration-300">
          <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950 text-white rounded-3xl p-4 sm:p-5 shadow-2xl border-2 border-amber-400/80 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center shrink-0">
                <UserPlus className="w-6 h-6 text-amber-300" />
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black text-amber-300 uppercase tracking-wider block">
                  ✨ طلب تسجيل طالب جديد على المنصة
                </span>
                <h4 className="font-black text-sm text-white">
                  الطالب: {newStudentToast.studentName}
                </h4>
                <p className="text-[11px] text-slate-300 font-mono">
                  {newStudentToast.phone ? `الجوال: ${newStudentToast.phone}` : "بانتظار اعتماد فضيلتكم وتفعيل الحساب"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {newStudentToast.approved ? (
                <div className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>تم اعتماد الحساب بنجاح ✅</span>
                </div>
              ) : (
                <>
                  <button
                    onClick={handleTeacher1ClickApproveStudent}
                    disabled={newStudentToast.isApproving}
                    className="flex items-center gap-1.5 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl shadow-lg transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{newStudentToast.isApproving ? "جارٍ التفعيل..." : "اعتماد الحساب ✅"}</span>
                  </button>
                  <button
                    onClick={() => setNewStudentToast(null)}
                    className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition"
                    title="تجاهل"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

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
