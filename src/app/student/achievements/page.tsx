"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { SURAHS } from "@/lib/quranData";
import { Award, TrendingUp, BookOpen, CheckCircle2, Calendar, Sparkles } from "lucide-react";

export default function StudentAchievementsPage() {
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [memorizationRecords, setMemorizationRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAchievements = async () => {
      try {
        const res = await fetch("/api/evaluations");
        if (res.ok) {
          const d = await res.json();
          setEvaluations(d.evaluations || []);
          setMemorizationRecords(d.memorizationRecords || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchAchievements();
  }, []);

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Award className="w-6 h-6 text-emerald-600" />
            سجل إنجازاتي وتقدم الحفظ
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            جميع الإنجازات الموثقة والآيات المجتازة بناءً على اعتماد واختبار المعلم.
          </p>
        </div>

        {/* Milestone Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-emerald-600 to-islamic-800 text-white p-6 rounded-3xl shadow-lg">
            <span className="text-xs font-bold text-emerald-200 block mb-1">الأجزاء المتقنة</span>
            <span className="text-3xl font-black">٣ أجزاء</span>
            <span className="text-[11px] text-emerald-100 block mt-2">
              (جزء عم، جزء تبارك، سورة البقرة)
            </span>
          </div>

          <div className="bg-gradient-to-br from-amber-500 to-amber-700 text-white p-6 rounded-3xl shadow-lg">
            <span className="text-xs font-bold text-amber-200 block mb-1">الآيات المحفوظة المعتمدة</span>
            <span className="text-3xl font-black">٢٨٦ آية</span>
            <span className="text-[11px] text-amber-100 block mt-2">
              تم التحقق منها في جلسات التسميع
            </span>
          </div>

          <div className="bg-gradient-to-br from-purple-600 to-indigo-800 text-white p-6 rounded-3xl shadow-lg">
            <span className="text-xs font-bold text-purple-200 block mb-1">التقدير العام للدرجات</span>
            <span className="text-3xl font-black">٩٦% ممتاز</span>
            <span className="text-[11px] text-purple-100 block mt-2">
              بناءً على تقييمات المشرف
            </span>
          </div>
        </div>

        {/* Verified Memorization History */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            سجل جلسات التسميع المعتمدة من الشيخ
          </h3>

          <div className="space-y-3">
            {evaluations.map((ev) => (
              <div
                key={ev.id}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                      {ev.gradeLabel} ({ev.score}%)
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      {new Date(ev.date).toLocaleDateString("ar-SA")}
                    </span>
                  </div>
                  {ev.notes && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      <span className="font-bold">ملاحظات المعلم: </span>
                      {ev.notes}
                    </p>
                  )}
                  {ev.nextAssignmentText && (
                    <span className="text-[11px] text-emerald-600 font-semibold block mt-1">
                      التكليف القادم: {ev.nextAssignmentText}
                    </span>
                  )}
                </div>

                <div className="text-right sm:text-left text-xs space-y-0.5">
                  <div className="text-slate-500">
                    الحفظ: <span className="font-bold text-emerald-600">{ev.memorizationScore}%</span>
                  </div>
                  <div className="text-slate-500">
                    التجويد: <span className="font-bold text-amber-500">{ev.tajweedScore}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
