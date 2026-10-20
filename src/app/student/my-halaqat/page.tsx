"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useRealtime } from "@/components/providers/AppProviders";
import { CalendarDays, Users, Video, Clock, Plus, CheckCircle2, Send, XCircle, Eye, UserPlus, Lock, ShieldCheck } from "lucide-react";

export default function StudentHalaqatPage() {
  const { lastEvent } = useRealtime();
  const [halaqat, setHalaqat] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestingHalaqaId, setRequestingHalaqaId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState("");

  const fetchHalaqat = async () => {
    try {
      const res = await fetch("/api/teacher/halaqat");
      if (res.ok) {
        const d = await res.json();
        setHalaqat(d.halaqat || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHalaqat();
  }, []);

  // Realtime listener for approval updates
  useEffect(() => {
    if (lastEvent) {
      if (
        lastEvent.type === "SCHEDULE_UPDATED" ||
        lastEvent.type === "SESSION_JOIN_APPROVED" ||
        lastEvent.type === "JOIN_REQUEST_APPROVED" ||
        lastEvent.type === "JOIN_REQUEST_REJECTED"
      ) {
        fetchHalaqat();
      }
    }
  }, [lastEvent]);

  const handleDirectJoin = async (h: any) => {
    setRequestingHalaqaId(h.id);
    try {
      const res = await fetch("/api/student/join-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          halaqaId: h.id,
          sessionId: h.currentLiveSessionId,
        }),
      });

      if (res.ok) {
        setSuccessMsg(`تم رفع طلب الانضمام إلى: ${h.name} لفضيلة الشيخ بنجاح، وهو قيد المراجعة والاعتماد.`);
        fetchHalaqat();
        setTimeout(() => setSuccessMsg(""), 4000);
      } else {
        const d = await res.json();
        alert(d.error || "فشل إرسال الطلب");
      }
    } catch (e) {
      console.error(e);
      alert("حدث خطأ أثناء إرسال الطلب");
    } finally {
      setRequestingHalaqaId(null);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-emerald-600" />
            حلقاتي القرآنية وجداول المواعيد
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            الحلقات المسجل بها، ومواعيد الانعقاد المباشر، وتقديم طلبات الانضمام لحلقات جديدة.
          </p>
        </div>

        {successMsg && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-2xl flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            {successMsg}
          </div>
        )}

        {/* Halaqat Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {halaqat.map((h) => {
            const isLive = h.isLiveNow;

            return (
              <div
                key={h.id}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-1 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      {h.studentStatus === "ENROLLED" ? (
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          طالب معتمد ومقبول
                        </span>
                      ) : h.studentStatus === "PENDING" ? (
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-600 animate-spin" />
                          في انتظار موافقة الشيخ
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 flex items-center gap-1">
                          <Lock className="w-3 h-3 text-amber-500" />
                          مشروطة بموافقة الشيخ
                        </span>
                      )}
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {h.level}
                      </span>
                    </div>

                    {isLive && (
                      <span className="text-[10px] font-bold text-red-500 bg-red-50 dark:bg-red-950/40 px-2 py-0.5 rounded-full animate-pulse flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        منعقدة الآن
                      </span>
                    )}
                  </div>

                  <h3 className="font-black text-base text-slate-900 dark:text-slate-100">
                    {h.name}
                  </h3>

                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                    {h.description || "حلقة تعليمية مخصصة للحفظ والمدارسة."}
                  </p>

                  <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex justify-between">
                      <span className="text-slate-400">المعلم:</span>
                      <span className="font-bold">{h.teacher?.user?.name || "معلم ومقرئ الحلقة"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">المواعيد:</span>
                      <span className="font-semibold">{h.scheduleDays}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">الوقت:</span>
                      <span className="font-mono font-semibold">{h.startTime} - {h.endTime}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  {h.studentStatus === "ENROLLED" ? (
                    h.isLiveNow ? (
                      <button
                        onClick={() =>
                          (window.location.href = `/classroom/${
                            h.currentLiveSessionId || h.id
                          }?role=student`)
                        }
                        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 text-slate-950 font-black text-xs py-3 rounded-2xl shadow-md transition-transform hover:scale-102 active:scale-98 animate-pulse"
                        title="بث مباشر منعقد الآن - انقر للمتابعة"
                      >
                        <Video className="w-4 h-4" />
                        <span>متابعة البث المباشر الآن 🎥</span>
                      </button>
                    ) : (
                      <div className="w-full flex items-center justify-between text-xs py-2.5 px-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 font-bold border border-slate-200/60 dark:border-slate-700/60">
                        <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                          <Clock className="w-3.5 h-3.5 text-amber-500" />
                          موعد الانعقاد: {h.startTime}
                        </span>
                        <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium">
                          مجدولة 📅
                        </span>
                      </div>
                    )
                  ) : h.studentStatus === "PENDING" ? (
                    <div className="w-full flex items-center justify-center gap-2 bg-amber-500/15 border border-amber-500/30 text-amber-800 dark:text-amber-300 font-bold text-xs py-3 rounded-2xl">
                      <Clock className="w-4 h-4 text-amber-600 animate-spin" />
                      <span>في انتظار قبول الشيخ ⏳</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleDirectJoin(h)}
                      disabled={requestingHalaqaId === h.id}
                      className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white font-black text-xs py-3 rounded-2xl shadow transition-transform hover:scale-102 active:scale-98 disabled:opacity-50"
                      title="طلب الانضمام إلى الحلقة"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>{requestingHalaqaId === h.id ? "جارٍ إرسال الطلب للشيخ..." : "طلب انضمام"}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
