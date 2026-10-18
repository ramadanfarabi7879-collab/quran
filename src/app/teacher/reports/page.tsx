"use client";

import React, { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { BarChart3, TrendingUp, Users, CheckCircle2, Award, Printer } from "lucide-react";

export default function TeacherReportsPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 no-print">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-emerald-600" />
              التقارير والإحصائيات التحليلية
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              مؤشرات الأداء الأكاديمي، ونسب الالتزام والتسميع، ومعدلات إتمام الأجزاء القرآنية.
            </p>
          </div>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 bg-islamic-800 hover:bg-islamic-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow transition"
          >
            <Printer className="w-4 h-4" />
            طباعة تقرير الإنجاز
          </button>
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-xs font-bold text-slate-400 block mb-1">متوسط درجات التسميع</span>
            <span className="text-3xl font-black text-emerald-600">٩٥.٤%</span>
            <span className="text-[11px] text-emerald-600 font-semibold block mt-1">تقدير عام ممتاز</span>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-xs font-bold text-slate-400 block mb-1">معدل الحضور والانضباط</span>
            <span className="text-3xl font-black text-amber-500">٩٦.٢%</span>
            <span className="text-[11px] text-slate-500 block mt-1">نسبة التزام مرتفعة</span>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-xs font-bold text-slate-400 block mb-1">إجمالي الآيات المتقنة</span>
            <span className="text-3xl font-black text-islamic-800 dark:text-emerald-400">٨٧٧ آية</span>
            <span className="text-[11px] text-slate-500 block mt-1">موثقة بسجلات التسميع</span>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-xs font-bold text-slate-400 block mb-1">جلسات الفيديو المنعقدة</span>
            <span className="text-3xl font-black text-blue-600">٢٤ جلسة</span>
            <span className="text-[11px] text-slate-500 block mt-1">خلال الشهر الحالي</span>
          </div>
        </div>

        {/* Memorization Progress Overview */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            توزيع الطلاب حسب الأجزاء المحفوظة
          </h3>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-slate-700 dark:text-slate-300">الطلاب الخاتمون (٣٠ جزءاً)</span>
                <span className="text-emerald-600 font-mono">١٠% (طالبان)</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div className="bg-emerald-600 h-full rounded-full" style={{ width: "10%" }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-slate-700 dark:text-slate-300">أكثر من ١٠ أجزاء</span>
                <span className="text-emerald-600 font-mono">٣٥% (٧ طلاب)</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div className="bg-islamic-700 h-full rounded-full" style={{ width: "35%" }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-slate-700 dark:text-slate-300">من ٣ إلى ٩ أجزاء</span>
                <span className="text-emerald-600 font-mono">٤٠% (٨ طلاب)</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full" style={{ width: "40%" }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-slate-700 dark:text-slate-300">جزء عم وتبارك (المبتدئون)</span>
                <span className="text-emerald-600 font-mono">١٥% (٣ طلاب)</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div className="bg-blue-500 h-full rounded-full" style={{ width: "15%" }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
