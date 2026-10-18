"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { CheckSquare, Clock, CheckCircle2, AlertCircle, Calendar } from "lucide-react";

export default function StudentAttendancePage() {
  const [attendances, setAttendances] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({ commitmentRate: 100, present: 0, absent: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyAttendance = async () => {
      try {
        const res = await fetch("/api/teacher/attendance");
        if (res.ok) {
          const d = await res.json();
          setAttendances(d.attendances || []);
          if (d.stats) setStats(d.stats);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchMyAttendance();
  }, []);

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-emerald-600" />
            سجل الحضور والغياب للطالب
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            متابعة أيام الحضور المسجلة، وأوقات الدخول، واعتمادات المعلم لجلسات التحفيظ.
          </p>
        </div>

        {/* Commitment Badge */}
        <div className="bg-gradient-to-r from-emerald-600 to-islamic-800 text-white p-6 rounded-3xl shadow-lg flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-emerald-200 block mb-1">نسبة الالتزام العامة</span>
            <span className="text-3xl font-black">{stats.commitmentRate || 100}%</span>
            <span className="text-xs text-emerald-100 block mt-1">
              مواظبة ممتازة على مواعيد الحلقة القرآنية
            </span>
          </div>

          <div className="w-16 h-16 rounded-full border-4 border-amber-400/80 flex items-center justify-center font-black text-xl text-amber-300">
            {stats.commitmentRate || 100}%
          </div>
        </div>

        {/* Attendance Records */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-600" />
            سجل الجلسات السابقة
          </h3>

          <div className="space-y-3">
            {attendances.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                لا توجد سجلات حضور مسجلة حتى الآن
              </div>
            ) : (
              attendances.map((a) => (
                <div
                  key={a.id}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <span className="font-bold text-xs text-slate-900 dark:text-slate-100 block">
                      {a.session?.halaqa?.name || "حلقة الفجر"}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono block">
                      وقت الدخول:{" "}
                      {a.checkInTime
                        ? new Date(a.checkInTime).toLocaleString("ar-SA")
                        : "حضور مسجل من المعلم"}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        a.status === "PRESENT"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                          : a.status === "LATE"
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                          : "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300"
                      }`}
                    >
                      {a.status === "PRESENT" ? "حاضر" : a.status === "LATE" ? "متأخر" : "غائب"}
                    </span>

                    {a.isVerifiedByTeacher && (
                      <span className="text-emerald-600 text-xs font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> معتمد
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
