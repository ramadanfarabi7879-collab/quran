"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { CalendarDays, Users, Video, Clock, Plus, CheckCircle2, Send, XCircle } from "lucide-react";

export default function StudentHalaqatPage() {
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
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {h.level}
                    </span>
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

                <div className="pt-2">
                  {isLive && h.currentLiveSessionId ? (
                    <button
                      onClick={() => (window.location.href = `/classroom/${h.currentLiveSessionId}?role=student`)}
                      className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2.5 rounded-xl shadow transition"
                    >
                      <Video className="w-4 h-4" />
                      انضم للجلسة المباشرة
                    </button>
                  ) : (
                    <button
                      onClick={() => setRequestModal({ isOpen: true, halaqa: h })}
                      className="w-full flex items-center justify-center gap-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs py-2 rounded-xl transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      تقديم طلب انضمام للحلقة
                    </button>
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
