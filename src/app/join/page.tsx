"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { CalendarDays, Users, Clock, Plus, CheckCircle2, XCircle } from "lucide-react";

export default function JoinHalaqaPage() {
  const [halaqat, setHalaqat] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestModal, setRequestModal] = useState<{ isOpen: boolean; halaqa: any | null }>({
    isOpen: false,
    halaqa: null,
  });
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    fetch("/api/teacher/halaqat")
      .then((r) => r.json())
      .then((d) => setHalaqat(d.halaqat || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSend = async () => {
    if (!requestModal.halaqa) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/student/join-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          halaqaId: requestModal.halaqa.id,
          notes,
        }),
      });

      if (res.ok) {
        setSuccessMsg(`تم إرسال طلب الانضمام إلى ${requestModal.halaqa.name} بنجاح!`);
        setRequestModal({ isOpen: false, halaqa: null });
        setNotes("");
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      <Navbar />
      <div className="flex-1 max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-emerald-600" />
            الحلقات القرآنية المتاحة للتسجيل
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            اختر الحلقة المناسبة لمستواك وقدم طلب انضمام للمعلم.
          </p>
        </div>

        {successMsg && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-2xl flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            {successMsg}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {halaqat.map((h) => (
            <div
              key={h.id}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {h.level}
                </span>
                <h3 className="font-black text-base text-slate-900 dark:text-slate-100">{h.name}</h3>
                <p className="text-xs text-slate-500 line-clamp-2">{h.description}</p>
                <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800">
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
                    <span className="font-mono">{h.startTime} - {h.endTime}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setRequestModal({ isOpen: true, halaqa: h })}
                className="w-full bg-islamic-800 hover:bg-islamic-700 text-white font-bold text-xs py-2.5 rounded-xl shadow transition"
              >
                تقديم طلب انضمام
              </button>
            </div>
          ))}
        </div>

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
                  ملاحظات أو نبذة للمعلم:
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="المقدار المحفوظ سابقاً، والرغبة في الالتزام..."
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
                  onClick={handleSend}
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
    </div>
  );
}
