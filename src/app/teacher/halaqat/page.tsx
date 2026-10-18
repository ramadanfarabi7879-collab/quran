"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import {
  CalendarDays,
  Plus,
  Video,
  Users,
  Clock,
  Edit,
  CheckCircle2,
  Play,
  XCircle,
} from "lucide-react";

export default function TeacherHalaqatPage() {
  const [halaqat, setHalaqat] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [capacity, setCapacity] = useState(20);
  const [level, setLevel] = useState("متوسط");
  const [scheduleDays, setScheduleDays] = useState("السبت, الإثنين, الأربعاء");
  const [startTime, setStartTime] = useState("16:00");
  const [endTime, setEndTime] = useState("17:30");
  const [submitting, setSubmitting] = useState(false);

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

  const handleCreateHalaqa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/teacher/halaqat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          capacity,
          level,
          scheduleDays,
          startTime,
          endTime,
        }),
      });

      if (res.ok) {
        setShowAddModal(false);
        setName("");
        setDescription("");
        fetchHalaqat();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartSession = async (halaqaId: string) => {
    try {
      const res = await fetch("/api/live/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ halaqaId }),
      });
      if (res.ok) {
        const d = await res.json();
        window.location.href = `/classroom/${d.session.id}?role=teacher`;
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <CalendarDays className="w-6 h-6 text-emerald-600" />
              إدارة الحلقات القرآنية
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              إنشاء حلقات جديدة، وجدولة المواعيد المتكررة، وبدء الفصول الافتراضية المباشرة.
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 bg-islamic-800 hover:bg-islamic-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow transition"
          >
            <Plus className="w-4 h-4" />
            إنشاء حلقة جديدة
          </button>
        </div>

        {/* Halaqat Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {halaqat.map((h) => {
            const enrolledCount = h.enrollments?.length || 0;
            const isLive = h.isLiveNow;

            return (
              <div
                key={h.id}
                className={`bg-white dark:bg-slate-900 rounded-3xl border transition shadow-sm p-6 flex flex-col justify-between space-y-4 ${
                  isLive
                    ? "border-emerald-500 ring-2 ring-emerald-500/20"
                    : "border-slate-200 dark:border-slate-800"
                }`}
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      المستوى: {h.level}
                    </span>
                    {isLive ? (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-red-500 bg-red-50 dark:bg-red-950/40 px-2 py-0.5 rounded-full animate-pulse">
                        <span className="w-2 h-2 rounded-full bg-red-500" />
                        منعقدة الآن
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                        نشطة ومجدولة
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-black text-slate-900 dark:text-slate-100 leading-snug">
                    {h.name}
                  </h3>

                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {h.description || "حلقة تعليمية لتلاوة وحفظ القرآن الكريم وتجويده."}
                  </p>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <Clock className="w-3.5 h-3.5" />
                        المواعيد:
                      </span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {h.scheduleDays}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <Clock className="w-3.5 h-3.5" />
                        الوقت:
                      </span>
                      <span className="font-semibold font-mono text-slate-800 dark:text-slate-200">
                        {h.startTime} - {h.endTime}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <Users className="w-3.5 h-3.5" />
                        الطلاب:
                      </span>
                      <span className="font-bold text-emerald-600">
                        {enrolledCount} / {h.capacity} طالب
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  {isLive && h.currentLiveSessionId ? (
                    <button
                      onClick={() => (window.location.href = `/classroom/${h.currentLiveSessionId}`)}
                      className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2.5 rounded-xl shadow-md transition"
                    >
                      <Video className="w-4 h-4" />
                      دخول الغرفة النشطة
                    </button>
                  ) : (
                    <button
                      onClick={() => handleStartSession(h.id)}
                      className="w-full flex items-center justify-center gap-2 bg-islamic-800 hover:bg-islamic-700 text-white font-bold text-xs py-2.5 rounded-xl shadow-md transition"
                    >
                      <Video className="w-4 h-4" />
                      بدء جلسة فيديو الآن
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal: Create Halaqa */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-base text-slate-900 dark:text-slate-100">
                  إنشاء حلقة قرآنية جديدة
                </h3>
                <button onClick={() => setShowAddModal(false)} className="text-slate-400">
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateHalaqa} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    اسم الحلقة:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: حلقة الفجر المباركة، حلقة النور لتثبيت القرآن..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      المستوى:
                    </label>
                    <select
                      value={level}
                      onChange={(e) => setLevel(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 font-bold text-slate-900 dark:text-slate-100"
                    >
                      <option value="مبتدئ">مبتدئ (تلقين وتصحيح تلاوة)</option>
                      <option value="متوسط">متوسط (حفظ وتجويد)</option>
                      <option value="متقدم">متقدم (تثبيت ومراجعة خاتمين)</option>
                      <option value="إجازات">إجازات وقراءات</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      الطاقة الاستيعابية (الحد الأقصى):
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="50"
                      value={capacity}
                      onChange={(e) => setCapacity(Number(e.target.value))}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    أيام الانعقاد الأسبوعية:
                  </label>
                  <input
                    type="text"
                    value={scheduleDays}
                    onChange={(e) => setScheduleDays(e.target.value)}
                    placeholder="مثال: السبت, الإثنين, الأربعاء"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      وقت البداية:
                    </label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      وقت النهاية:
                    </label>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    وصف الحلقة وأهدافها:
                  </label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="اكتب نبذة عن أهداف الحلقة..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-xl text-slate-500 font-bold"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-islamic-800 hover:bg-islamic-700 text-white font-bold px-5 py-2 rounded-xl shadow"
                  >
                    {submitting ? "جارٍ الحفظ..." : "حفظ وإنشاء الحلقة"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
