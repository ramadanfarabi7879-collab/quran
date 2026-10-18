"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth, useRealtime } from "@/components/providers/AppProviders";
import { playHalaqaStartSound, playChimePing, playScheduleAlertSound } from "@/lib/sound";
import { ScheduleBoardWidget } from "@/components/schedule/ScheduleBoardWidget";
import {
  BookOpen,
  CalendarDays,
  FileCheck2,
  Award,
  Video,
  Radio,
  Clock,
  CheckCircle2,
  TrendingUp,
  Sparkles,
  ArrowUpRight,
  Bell,
  Volume2,
  XCircle,
  ExternalLink,
  Eye,
  UserPlus,
  Lock,
  ShieldCheck,
} from "lucide-react";

export default function StudentDashboard() {
  const { user } = useAuth();
  const { lastEvent } = useRealtime();

  const [halaqat, setHalaqat] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [activeSession, setActiveSession] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Realtime Live Session Pop-up Modal State
  const [liveModal, setLiveModal] = useState<{
    open: boolean;
    sessionId: string;
    halaqaName: string;
    teacherName: string;
    title?: string;
  } | null>(null);

  const fetchData = async () => {
    try {
      const [resH, resA, resE, resS] = await Promise.all([
        fetch("/api/teacher/halaqat"),
        fetch("/api/assignments"),
        fetch("/api/evaluations"),
        fetch("/api/live/session"),
      ]);

      if (resH.ok) {
        const d = await resH.json();
        setHalaqat(d.halaqat || []);
      }
      if (resA.ok) {
        const d = await resA.json();
        setAssignments(d.assignments || []);
      }
      if (resE.ok) {
        const d = await resE.json();
        setEvaluations(d.evaluations || []);
      }
      if (resS.ok) {
        const d = await resS.json();
        if (d.session && d.session.status === "ACTIVE") {
          setActiveSession(d.session);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Realtime listener for live session notifications
  useEffect(() => {
    if (lastEvent) {
      if (lastEvent.type === "HALAQA_LIVE_STARTED") {
        const payload = lastEvent.payload;
        // 1. Play the Islamic notification chime with sound synthesizer
        playHalaqaStartSound();

        // 2. Open high-impact live session modal on student's screen
        setLiveModal({
          open: true,
          sessionId: payload?.sessionId,
          halaqaName: payload?.halaqaName || "حلقة الفجر لتحفيظ القرآن",
          teacherName: payload?.teacherName || "الشيخ أحمد المنشاوي",
          title: payload?.title,
        });

        // 3. Update active session state for persistent banner
        setActiveSession({
          id: payload?.sessionId,
          title: payload?.title,
          halaqa: { name: payload?.halaqaName || "حلقة الفجر لتحفيظ القرآن" },
          status: "ACTIVE",
        });
      } else if (lastEvent.type === "HALAQA_LIVE_ENDED") {
        setActiveSession(null);
        setLiveModal(null);
      } else if (
        lastEvent.type === "SCHEDULE_UPDATED" ||
        lastEvent.type === "SESSION_JOIN_APPROVED" ||
        lastEvent.type === "JOIN_REQUEST_APPROVED"
      ) {
        fetchData();
      }
    }
  }, [lastEvent]);

  const [requestingSession, setRequestingSession] = useState(false);

  const handleStudent1ClickJoin = async (sessionId?: string, halaqaId?: string) => {
    setRequestingSession(true);
    try {
      const res = await fetch("/api/student/join-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: sessionId || activeSession?.id || "auto",
          halaqaId: halaqaId || activeSession?.halaqaId || halaqat[0]?.id,
        }),
      });
      if (res.ok) {
        alert("تم رفع طلب الانضمام إلى فضيلة الشيخ بنجاح، وطلبك قيد المراجعة والاعتماد الآن.");
        fetchData();
      } else {
        const d = await res.json();
        alert(d.error || "فشل إرسال طلب الانضمام");
      }
    } catch (e) {
      console.error(e);
      alert("حدث خطأ أثناء إرسال طلب الانضمام");
    } finally {
      setRequestingSession(false);
    }
  };

  const profile = user?.studentProfile || {
    currentJuz: 3,
    totalMemorizedAyahs: 286,
  };
  const recentEvaluation = evaluations[0];
  const pendingAssignments = assignments.slice(0, 2);

  const approvedHalaqat = halaqat.filter((h: any) => h.isApprovedBySheikh || h.studentStatus === "ENROLLED");
  const hasApprovedHalaqa = approvedHalaqat.length > 0;
  const pendingHalaqat = halaqat.filter((h: any) => h.studentStatus === "PENDING");
  const hasPendingHalaqa = pendingHalaqat.length > 0;

  const activeSessionHalaqa = halaqat.find((h: any) => h.id === activeSession?.halaqaId);
  const isActiveSessionApproved = activeSession && (
    activeSessionHalaqa ? (activeSessionHalaqa.isApprovedBySheikh || activeSessionHalaqa.studentStatus === "ENROLLED") : false
  );
  const isActiveSessionPending = activeSession && activeSessionHalaqa?.studentStatus === "PENDING";

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Realtime Live Session Pop-up Modal with Sound */}
        {liveModal?.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <div className="bg-gradient-to-b from-slate-900 via-islamic-950 to-slate-950 text-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border-2 border-amber-400/60 text-center relative overflow-hidden">
              {/* Decorative background glow */}
              <div className="absolute -top-24 -left-24 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

              {/* Live Pulsing Bell Icon */}
              <div className="relative mx-auto w-20 h-20 mb-4 flex items-center justify-center">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-60"></span>
                <div className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 flex items-center justify-center shadow-xl">
                  <Volume2 className="w-10 h-10 animate-bounce" />
                </div>
              </div>

              {/* Status Pill */}
              <div className="inline-flex items-center gap-2 bg-red-600/90 text-white text-xs font-black px-4 py-1 rounded-full uppercase tracking-wider mb-3 shadow">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                حلقة القرآن المباشرة بدأت الآن
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-white mb-2">
                {liveModal.halaqaName}
              </h2>

              <p className="text-slate-300 text-xs sm:text-sm mb-6 max-w-md mx-auto leading-relaxed">
                فضيلة <span className="font-bold text-amber-300">{liveModal.teacherName}</span> بدأ الجلسة التعليمية المباشرة وينتظرك الآن داخل الغرفة الافتراضية.
              </p>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                {isActiveSessionApproved ? (
                  <button
                    onClick={() => {
                      setLiveModal(null);
                      window.location.href = `/classroom/${liveModal.sessionId}?role=student`;
                    }}
                    className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-amber-400 to-gold-accent hover:from-amber-300 text-slate-950 font-black px-6 py-3.5 rounded-2xl text-sm shadow-xl transition-transform hover:scale-105 active:scale-95"
                  >
                    <Video className="w-5 h-5" />
                    متابعة الحلقة 🎥
                  </button>
                ) : isActiveSessionPending ? (
                  <div className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold px-6 py-3.5 rounded-2xl text-sm">
                    <Clock className="w-5 h-5 text-amber-400 animate-spin" />
                    في انتظار قبول الشيخ ⏳
                  </div>
                ) : (
                  <button
                    onClick={() => handleStudent1ClickJoin(liveModal.sessionId)}
                    disabled={requestingSession}
                    className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white font-black px-6 py-3.5 rounded-2xl text-sm shadow-xl transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
                  >
                    <UserPlus className="w-5 h-5" />
                    {requestingSession ? "جارٍ إرسال الطلب..." : "طلب انضمام"}
                  </button>
                )}

                <button
                  onClick={() => setLiveModal(null)}
                  className="w-full sm:w-auto px-5 py-3 rounded-2xl text-xs font-bold text-slate-400 hover:text-white hover:bg-white/10 transition"
                >
                  إغلاق التنبيه
                </button>
              </div>

              {/* Sound note */}
              <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
                <Bell className="w-3.5 h-3.5 text-amber-400" />
                <span>تم إطلاق رنين التنبيه الصوتي بنجاح</span>
              </div>
            </div>
          </div>
        )}

        {/* Live Halaqa Alert Banner if Teacher has started a room */}
        {activeSession && (
          <div className="bg-gradient-to-r from-emerald-600 via-islamic-800 to-emerald-700 text-white p-5 rounded-3xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-emerald-400/30 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
                <Radio className="w-6 h-6 text-amber-300" />
              </div>
              <div>
                <span className="text-amber-300 text-xs font-bold uppercase tracking-wider block">
                  الحلقة منعقدة الآن
                </span>
                <h3 className="text-lg font-black text-white">
                  {activeSession.halaqa?.name || "حلقة الفجر لتحفيظ القرآن"}
                </h3>
                <p className="text-xs text-slate-200">
                  {isActiveSessionApproved
                    ? "أنت طالب معتمد ومقبول - المعلم في انتظارك داخل القاعة"
                    : "الدخول مشروط بموافقة وقبول فضيلة الشيخ"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => playHalaqaStartSound()}
                title="إعادة سماع نغمة التنبيه"
                className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition"
              >
                <Volume2 className="w-4 h-4 text-amber-300" />
              </button>

              {/* Single Dynamic Action Button for Active Live Session */}
              {isActiveSessionApproved ? (
                <Link
                  href={`/classroom/${activeSession.id}?role=student`}
                  className="flex items-center gap-2 bg-gradient-to-r from-amber-400 to-gold-accent hover:from-amber-300 text-slate-950 font-black px-5 py-3 rounded-2xl text-xs shadow-lg transition-transform hover:scale-105"
                >
                  <Video className="w-4 h-4" />
                  متابعة الحلقة 🎥
                </Link>
              ) : isActiveSessionPending ? (
                <div className="flex items-center gap-2 bg-amber-500/20 text-amber-200 border border-amber-400/40 font-bold px-4 py-3 rounded-2xl text-xs">
                  <Clock className="w-4 h-4 text-amber-400 animate-spin" />
                  في انتظار قبول الشيخ ⏳
                </div>
              ) : (
                <button
                  onClick={() => handleStudent1ClickJoin(activeSession.id, activeSession.halaqaId)}
                  disabled={requestingSession}
                  className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 text-slate-950 font-black px-5 py-3 rounded-2xl text-xs shadow-lg transition-transform hover:scale-105 disabled:opacity-50"
                >
                  <UserPlus className="w-4 h-4" />
                  {requestingSession ? "جارٍ إرسال الطلب..." : "طلب انضمام"}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-islamic-900 via-slate-900 to-emerald-950 text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <span className="text-gold-accent text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              مرحباً بك يا طالب العلم
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              {user?.name || "عبد الرحمن العلي"}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-lg leading-relaxed">
              وفقك الله لحفظ كتابه العزيز. يمكنك متابعة واجباتك وحضور حلقاتك والمصحف من هنا.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Single Dynamic Action Button in Hero */}
            {hasApprovedHalaqa ? (
              <Link
                href={`/classroom/${approvedHalaqat[0].currentLiveSessionId || activeSession?.id || "auto"}?role=student`}
                className="flex items-center gap-2 bg-gradient-to-r from-amber-400 to-gold-accent hover:from-amber-300 text-slate-950 font-black px-4 py-2.5 rounded-2xl text-xs shadow-lg shadow-amber-950/20 transition-transform hover:scale-105 active:scale-95"
                title="متابعة الحلقة (طالب معتمد)"
              >
                <Video className="w-4 h-4" />
                <span>متابعة الحلقة 🎥</span>
              </Link>
            ) : hasPendingHalaqa ? (
              <div
                className="flex items-center gap-2 bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold px-4 py-2.5 rounded-2xl text-xs shadow"
                title="طلب الانضمام قيد المراجعة لدى فضيلة الشيخ"
              >
                <Clock className="w-4 h-4 text-amber-400 animate-spin" />
                <span>في انتظار قبول الشيخ ⏳</span>
              </div>
            ) : (
              <button
                onClick={() => handleStudent1ClickJoin(activeSession?.id, halaqat[0]?.id)}
                disabled={requestingSession}
                className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white font-bold px-4 py-2.5 rounded-2xl text-xs shadow transition active:scale-95 disabled:opacity-50"
                title="طلب الانضمام إلى الحلقة"
              >
                <UserPlus className="w-4 h-4" />
                <span>{requestingSession ? "جارٍ إرسال الطلب..." : "طلب انضمام"}</span>
              </button>
            )}

            {/* Mushaf Direct Access */}
            <Link
              href="/student/mushaf"
              className="flex items-center gap-1.5 bg-slate-800/80 hover:bg-slate-700/80 text-amber-300 font-bold px-3.5 py-2.5 rounded-2xl border border-amber-400/30 text-xs shadow transition"
            >
              <BookOpen className="w-4 h-4 text-gold-accent" />
              <span>المصحف الرقمي</span>
            </Link>

            {/* 5. Sound Chime Test */}
            <button
              onClick={() => playHalaqaStartSound()}
              className="p-2.5 rounded-2xl bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 hover:text-white border border-slate-700 text-xs transition"
              title="اختبار نغمة التنبيه الصوتي"
            >
              <Volume2 className="w-4 h-4 text-amber-400" />
            </button>
          </div>
        </div>

        {/* Quick Progress Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-xs font-bold text-slate-400 block mb-1">الجزء الحالي</span>
            <span className="text-2xl font-black text-emerald-600">
              الجزء {profile?.currentJuz || 3}
            </span>
            <span className="text-[11px] text-slate-500 block mt-1">سورة البقرة المباركة</span>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-xs font-bold text-slate-400 block mb-1">إجمالي الآيات المحفوظة</span>
            <span className="text-2xl font-black text-islamic-800 dark:text-emerald-400">
              {profile?.totalMemorizedAyahs || 286} آية
            </span>
            <span className="text-[11px] text-emerald-600 font-semibold block mt-1">
              موثقة من المعلم
            </span>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-xs font-bold text-slate-400 block mb-1">آخر تقييم تسميع</span>
            <span className="text-2xl font-black text-amber-500">
              {recentEvaluation ? `${recentEvaluation.score}%` : "٩٥%"}
            </span>
            <span className="text-[11px] text-amber-600 font-semibold block mt-1">
              {recentEvaluation?.gradeLabel || "ممتاز"}
            </span>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-xs font-bold text-slate-400 block mb-1">نسبة الالتزام بالحضور</span>
            <span className="text-2xl font-black text-purple-600">١٠٠%</span>
            <span className="text-[11px] text-purple-600 font-semibold block mt-1">منتظم وملتزم</span>
          </div>
        </div>

        {/* Realtime Schedule Board Widget for Student */}
        <ScheduleBoardWidget isTeacher={false} />

        {/* Content Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Homework due */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-emerald-600" />
                الواجبات والتكليفات المطلوبة
              </h2>
              <Link
                href="/student/assignments"
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5"
              >
                عرض الكل وتسليم التسميع
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {pendingAssignments.map((a) => (
                <div
                  key={a.id}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {a.title}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
                      مستحق
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {a.instructions || "يرجى مراعاة أحكام النون الساكنة والتنوين."}
                  </p>
                  <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
                    <span>آخر موعد: {new Date(a.dueDate).toLocaleDateString("ar-SA")}</span>
                    <Link
                      href="/student/assignments"
                      className="text-xs font-bold text-emerald-600 hover:underline"
                    >
                      تسليم التسجيل الصوتي
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Enrolled Halaqa & Teacher */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-emerald-600" />
                حلقتي ومعلمي
              </h2>
              <Link
                href="/student/my-halaqat"
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5"
              >
                تفاصيل الحلقة
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50/50 to-amber-50/30 dark:from-slate-800/60 dark:to-emerald-950/20 border border-emerald-100 dark:border-slate-800 space-y-3">
              <div className="flex items-center gap-3">
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200"
                  alt="Teacher"
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-emerald-500/30"
                />
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    الشيخ أحمد المنشاوي
                  </h3>
                  <span className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold block">
                    معلم ومقرئ حلقة الفجر المباركة
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                <div className="flex justify-between">
                  <span>الأيام:</span>
                  <span className="font-bold">السبت، الإثنين، الأربعاء</span>
                </div>
                <div className="flex justify-between">
                  <span>الوقت:</span>
                  <span className="font-bold font-mono">05:30 - 07:00 صباحاً</span>
                </div>
                <div className="flex justify-between">
                  <span>المستوى:</span>
                  <span className="font-bold text-emerald-600">متقدم (حفظ وتثبيت)</span>
                </div>
              </div>

              {/* Single Dynamic Action Button: طلب انضمام -> في انتظار قبول الشيخ ⏳ -> متابعة الحلقة 🎥 */}
              <div className="pt-3 border-t border-slate-200/60 dark:border-slate-700/60">
                {hasApprovedHalaqa ? (
                  <Link
                    href={`/classroom/${approvedHalaqat[0].currentLiveSessionId || approvedHalaqat[0].id}?role=student`}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-400 to-gold-accent hover:from-amber-300 text-slate-950 font-black text-xs py-3 rounded-2xl shadow-md transition-transform hover:scale-102 active:scale-98"
                    title="متابعة الحلقة (طالب معتمد)"
                  >
                    <Video className="w-4 h-4" />
                    <span>متابعة الحلقة 🎥</span>
                  </Link>
                ) : hasPendingHalaqa ? (
                  <div
                    className="w-full flex items-center justify-center gap-2 bg-amber-500/15 border border-amber-500/30 text-amber-800 dark:text-amber-300 font-bold text-xs py-3 rounded-2xl"
                    title="طلبك قيد موافقة الشيخ"
                  >
                    <Clock className="w-4 h-4 text-amber-600 animate-spin" />
                    <span>في انتظار قبول الشيخ ⏳</span>
                  </div>
                ) : (
                  <button
                    onClick={() => handleStudent1ClickJoin(undefined, halaqat[0]?.id)}
                    disabled={requestingSession}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white font-black text-xs py-3 rounded-2xl shadow transition-transform hover:scale-102 active:scale-98 disabled:opacity-50"
                    title="طلب الانضمام إلى الحلقة"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>{requestingSession ? "جارٍ إرسال الطلب للشيخ..." : "طلب انضمام"}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
