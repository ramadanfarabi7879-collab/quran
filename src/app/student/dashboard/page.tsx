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
  const [sessionAuthStatus, setSessionAuthStatus] = useState<string>("NO_ACTIVE_SESSION");
  const [loading, setLoading] = useState(true);

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
          setSessionAuthStatus(d.authorizationStatus || "NEEDS_REQUEST");
        } else {
          setActiveSession(null);
          setSessionAuthStatus("NO_ACTIVE_SESSION");
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
        // 1. Play Islamic notification chime
        playHalaqaStartSound();

        // 2. Update active session state for persistent banner
        setActiveSession({
          id: payload?.sessionId,
          title: payload?.title,
          halaqa: { name: payload?.halaqaName || "حلقة الفجر لتحفيظ القرآن" },
          status: "ACTIVE",
        });
        setSessionAuthStatus("AUTHORIZED");
      } else if (lastEvent.type === "HALAQA_LIVE_ENDED") {
        setActiveSession(null);
        setSessionAuthStatus("NO_ACTIVE_SESSION");
      } else if (lastEvent.type === "SESSION_JOIN_REJECTED") {
        setSessionAuthStatus("NEEDS_REQUEST");
        fetchData();
      } else if (lastEvent.type === "SESSION_JOIN_RESCHEDULED") {
        setSessionAuthStatus("NEEDS_REQUEST");
        fetchData();
      } else if (
        lastEvent.type === "SCHEDULE_UPDATED" ||
        lastEvent.type === "SESSION_JOIN_APPROVED" ||
        lastEvent.type === "JOIN_REQUEST_APPROVED"
      ) {
        if (lastEvent.type === "SESSION_JOIN_APPROVED" || lastEvent.type === "JOIN_REQUEST_APPROVED") {
          const targetSessionId = lastEvent.payload?.sessionId || activeSession?.id;
          if (targetSessionId) {
            window.location.href = `/classroom/${targetSessionId}?role=student`;
            return;
          }
          setSessionAuthStatus("AUTHORIZED");
        }
        fetchData();
      }
    }
  }, [lastEvent, activeSession]);

  // Active fallback polling when student is pending approval (every 2s)
  useEffect(() => {
    if (sessionAuthStatus !== "PENDING_APPROVAL") return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/live/session");
        if (res.ok) {
          const d = await res.json();
          if (d.isAuthorized && d.session?.id) {
            window.location.href = `/classroom/${d.session.id}?role=student`;
          }
        }
      } catch {}
    }, 2000);
    return () => clearInterval(interval);
  }, [sessionAuthStatus]);

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
        setSessionAuthStatus("PENDING_APPROVAL");
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
    currentJuz: 0,
    totalMemorizedAyahs: 0,
  };
  const recentEvaluation = evaluations[0];
  const pendingAssignments = assignments.slice(0, 2);

  const approvedHalaqat = halaqat.filter((h: any) => h.isApprovedBySheikh || h.studentStatus === "ENROLLED");
  const hasApprovedHalaqa = approvedHalaqat.length > 0;
  const pendingHalaqat = halaqat.filter((h: any) => h.studentStatus === "PENDING");
  const hasPendingHalaqa = pendingHalaqat.length > 0;

  const isActiveSessionApproved = activeSession && sessionAuthStatus === "AUTHORIZED";
  const isActiveSessionPending = activeSession && sessionAuthStatus === "PENDING_APPROVAL";

  return (
    <AppShell>
      <div className="space-y-6">
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
              {user?.name || "طالب العلم"}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-lg leading-relaxed">
              وفقك الله لحفظ كتابه العزيز. يمكنك متابعة واجباتك وحضور حلقاتك والمصحف من هنا.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Single Dynamic Action Button in Hero */}
            {activeSession ? (
              isActiveSessionApproved ? (
                <Link
                  href={`/classroom/${activeSession.id}?role=student`}
                  className="flex items-center gap-2 bg-gradient-to-r from-amber-400 to-gold-accent hover:from-amber-300 text-slate-950 font-black px-4 py-2.5 rounded-2xl text-xs shadow-lg shadow-amber-950/20 transition-transform hover:scale-105 active:scale-95"
                  title="متابعة الحلقة (طالب معتمد ومقبول)"
                >
                  <Video className="w-4 h-4" />
                  <span>متابعة الحلقة 🎥</span>
                </Link>
              ) : isActiveSessionPending ? (
                <div
                  className="flex items-center gap-2 bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold px-4 py-2.5 rounded-2xl text-xs shadow"
                  title="طلب الانضمام قيد المراجعة لدى فضيلة الشيخ"
                >
                  <Clock className="w-4 h-4 text-amber-400 animate-spin" />
                  <span>في انتظار قبول الشيخ ⏳</span>
                </div>
              ) : (
                <button
                  onClick={() => handleStudent1ClickJoin(activeSession.id, activeSession.halaqaId)}
                  disabled={requestingSession}
                  className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white font-bold px-4 py-2.5 rounded-2xl text-xs shadow transition active:scale-95 disabled:opacity-50"
                  title="طلب الانضمام إلى الحلقة المباشرة"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{requestingSession ? "جارٍ إرسال الطلب..." : "طلب انضمام"}</span>
                </button>
              )
            ) : (
              <Link
                href="/student/my-halaqat"
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold px-4 py-2.5 rounded-2xl text-xs border border-white/10 transition"
              >
                <CalendarDays className="w-4 h-4 text-emerald-300" />
                <span>حلقاتي القرآنية</span>
              </Link>
            )}

            {/* Mushaf Direct Access */}
            <Link
              href="/student/mushaf"
              className="flex items-center gap-1.5 bg-slate-800/80 hover:bg-slate-700/80 text-amber-300 font-bold px-3.5 py-2.5 rounded-2xl border border-amber-400/30 text-xs shadow transition"
            >
              <BookOpen className="w-4 h-4 text-gold-accent" />
              <span>المصحف الرقمي</span>
            </Link>

            {/* 5. Sound Chime */}
            <button
              onClick={() => playHalaqaStartSound()}
              className="p-2.5 rounded-2xl bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 hover:text-white border border-slate-700 text-xs transition"
              title="فحص نغمة التنبيه الصوتي"
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
              {profile?.currentJuz ? `الجزء ${profile.currentJuz}` : "—"}
            </span>
            <span className="text-[11px] text-slate-500 block mt-1">
              {profile?.currentJuz ? "مقرر الحفظ الجاري" : "لم يُحدد بعد"}
            </span>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-xs font-bold text-slate-400 block mb-1">إجمالي الآيات المحفوظة</span>
            <span className="text-2xl font-black text-islamic-800 dark:text-emerald-400">
              {profile?.totalMemorizedAyahs ? `${profile.totalMemorizedAyahs} آية` : "٠ آية"}
            </span>
            <span className="text-[11px] text-emerald-600 font-semibold block mt-1">
              {profile?.totalMemorizedAyahs ? "موثقة من المعلم" : "في انتظار بدء التسميع"}
            </span>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-xs font-bold text-slate-400 block mb-1">آخر تقييم تسميع</span>
            <span className="text-2xl font-black text-amber-500">
              {recentEvaluation ? `${recentEvaluation.score}%` : "—"}
            </span>
            <span className="text-[11px] text-amber-600 font-semibold block mt-1">
              {recentEvaluation?.gradeLabel || "لا يوجد تقييم بعد"}
            </span>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-xs font-bold text-slate-400 block mb-1">نسبة الالتزام بالحضور</span>
            <span className="text-2xl font-black text-purple-600">
              {evaluations.length > 0 ? "١٠٠%" : "—"}
            </span>
            <span className="text-[11px] text-purple-600 font-semibold block mt-1">
              {evaluations.length > 0 ? "منتظم وملتزم" : "في انتظار الحضور"}
            </span>
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
              {pendingAssignments.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  لا توجد واجبات أو تكليفات مستحقة حالياً.
                </div>
              ) : (
                pendingAssignments.map((a) => (
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
                ))
              )}
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

            {hasApprovedHalaqa ? (
              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50/50 to-amber-50/30 dark:from-slate-800/60 dark:to-emerald-950/20 border border-emerald-100 dark:border-slate-800 space-y-3">
                <div className="flex items-center gap-3">
                  {approvedHalaqat[0].teacher?.user?.avatar ? (
                    <img
                      src={approvedHalaqat[0].teacher.user.avatar}
                      alt="Teacher"
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-emerald-500/30"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-2xl bg-islamic-800 text-gold-accent flex items-center justify-center font-black text-base shadow ring-2 ring-emerald-500/30">
                      {approvedHalaqat[0].teacher?.user?.name?.[0] || "م"}
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                      {approvedHalaqat[0].teacher?.user?.name || "معلم ومقرئ الحلقة"}
                    </h3>
                    <span className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold block">
                      {approvedHalaqat[0].name}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                  <div className="flex justify-between">
                    <span>الأيام:</span>
                    <span className="font-bold">{approvedHalaqat[0].scheduleDays || "مجدولة"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>الوقت:</span>
                    <span className="font-bold font-mono">{approvedHalaqat[0].startTime} - {approvedHalaqat[0].endTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>المستوى:</span>
                    <span className="font-bold text-emerald-600">{approvedHalaqat[0].level || "عام"}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200/60 dark:border-slate-700/60">
                  {approvedHalaqat[0].isLiveNow ? (
                    <Link
                      href={`/classroom/${approvedHalaqat[0].currentLiveSessionId || approvedHalaqat[0].id}?role=student`}
                      className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 text-slate-950 font-black text-xs py-3 rounded-2xl shadow-md transition-transform hover:scale-102 active:scale-98 animate-pulse"
                      title="بث مباشر منعقد الآن - انقر للمتابعة"
                    >
                      <Video className="w-4 h-4" />
                      <span>متابعة البث المباشر الآن 🎥</span>
                    </Link>
                  ) : (
                    <div className="w-full flex items-center justify-between text-xs py-2.5 px-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 font-bold border border-slate-200/60 dark:border-slate-700/60">
                      <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                        <Clock className="w-3.5 h-3.5 text-amber-500" />
                        موعد الحلقة: {approvedHalaqat[0].startTime}
                      </span>
                      <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium">
                        مجدولة 📅
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ) : hasPendingHalaqa ? (
              <div className="p-6 text-center space-y-3 bg-amber-50/50 dark:bg-amber-950/20 rounded-2xl border border-amber-200 dark:border-amber-900/50">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 flex items-center justify-center">
                  <Clock className="w-6 h-6 animate-spin" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-amber-900 dark:text-amber-200">
                    طلبك قيد موافقة واعتماد الشيخ ⏳
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-1">
                    تم إرسال طلب انضمامك إلى {pendingHalaqat[0]?.name || "الحلقة"}، وسيصلك إشعار فوري عند الاعتماد.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center space-y-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
                  <CalendarDays className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200">
                    لم تنضم إلى حلقة بعد
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-1">
                    يمكنك استعراض الحلقات المتاحة وتقديم طلب انضمام لبدء رحلتك في الحفظ والمدارسة.
                  </p>
                </div>
                <Link
                  href="/student/my-halaqat"
                  className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-xl shadow transition"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>تصفح الحلقات القرآنية</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
