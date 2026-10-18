"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useRealtime } from "@/components/providers/AppProviders";
import { CalendarDays, Users, Video, Clock, Plus, CheckCircle2, Send, XCircle, Eye, UserPlus, Lock, ShieldCheck } from "lucide-react";

export default function StudentHalaqatPage() {
  const { lastEvent } = useRealtime();
  const [halaqat, setHalaqat] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestModal, setRequestModal] = useState<{ isOpen: boolean; halaqa: any | null }>({
    isOpen: false,
    halaqa: null,
  });
  const [requestNotes, setRequestNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
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
        lastEvent.type === "JOIN_REQUEST_APPROVED" ||
        lastEvent.type === "JOIN_REQUEST_REJECTED"
      ) {
        fetchHalaqat();
      }
    }
  }, [lastEvent]);

  const handleSendJoinRequest = async () => {
    if (!requestModal.halaqa) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/student/join-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          halaqaId: requestModal.halaqa.id,
          notes: requestNotes,
        }),
      });

      if (res.ok) {
        setSuccessMsg(`تم إرسال طلب الانضمام إلى ${requestModal.halaqa.name} بنجاح!`);
        setRequestModal({ isOpen: false, halaqa: null });
        setRequestNotes("");
        setTimeout(() => setSuccessMsg(""), 4000);
      } else {
        const d = await res.json();
        alert(d.error || "فشل إرسال الطلب");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
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
                      <span className="font-bold">{h.teacher?.user?.name || "الشيخ المنشاوي"}</span>
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

                <div className="pt-2 flex flex-col gap-2">
                  {h.studentStatus === "ENROLLED" ? (
                    <div className="flex items-center gap-2">
                      {/* 1. Enter Room Button (دخول الحلقة) - Only for approved students */}
                      <button
                        onClick={() =>
                          (window.location.href = `/classroom/${
                            h.currentLiveSessionId || h.id
                          }?role=student`)
                        }
                        className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2.5 rounded-xl shadow-sm transition active:scale-95"
                        title="دخول قاعة الحلقة الآن (طالب معتمد ومقبول)"
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>دخول الحلقة (معتمد)</span>
                      </button>

                      {/* 2. Follow / Track (متابعة الحلقة) */}
                      <button
                        onClick={() =>
                          (window.location.href = `/student/mushaf`)
                        }
                        className="flex-1 flex items-center justify-center gap-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30 font-bold text-xs py-2.5 rounded-xl transition"
                        title="متابعة المصحف وورد الحفظ"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>متابعة الحلقة</span>
                      </button>
                    </div>
                  ) : h.studentStatus === "PENDING" ? (
                    <div className="space-y-2">
                      <div className="w-full flex items-center justify-center gap-2 bg-amber-500/15 border border-amber-500/30 text-amber-800 dark:text-amber-300 font-bold text-xs py-2.5 rounded-xl">
                        <Clock className="w-4 h-4 text-amber-600 animate-spin" />
                        <span>طلبك قيد مراجعة واعتماد الشيخ ⏳</span>
                      </div>
                      <button
                        onClick={() => (window.location.href = `/student/mushaf`)}
                        className="w-full flex items-center justify-center gap-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs py-2 rounded-xl transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>متابعة الورد القرآني</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <button
                        onClick={() => setRequestModal({ isOpen: true, halaqa: h })}
                        className="w-full flex items-center justify-center gap-1.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs py-2.5 rounded-xl shadow-xs transition active:scale-95"
                        title="تقديم طلب انضمام مشروط بموافقة وقبول فضيلة الشيخ"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>طلب انضمام (مشروط بموافقة الشيخ)</span>
                      </button>
                      <button
                        onClick={() => (window.location.href = `/student/mushaf`)}
                        className="w-full flex items-center justify-center gap-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs py-2 rounded-xl transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>متابعة تفاصيل الحلقة</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal: Join Request */}
        {requestModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-sm text-slate-900 dark:text-slate-100">
                  طلب الانضمام إلى: {requestModal.halaqa?.name}
                </h3>
                <button
                  onClick={() => setRequestModal({ isOpen: false, halaqa: null })}
                  className="text-slate-400"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                  رسالة أو نبذة للمعلم عن مستواك القرآني:
                </label>
                <textarea
                  rows={3}
                  value={requestNotes}
                  onChange={(e) => setRequestNotes(e.target.value)}
                  placeholder="مثال: أحفظ جزء عم وأود البدء في سورة البقرة، ملتزم بمواعيد الفجر إن شاء الله..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setRequestModal({ isOpen: false, halaqa: null })}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleSendJoinRequest}
                  disabled={submitting}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-5 py-2 rounded-xl shadow"
                >
                  {submitting ? "جارٍ الإرسال..." : "إرسال طلب الانضمام"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
