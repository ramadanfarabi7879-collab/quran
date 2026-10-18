"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import {
  CheckSquare,
  FileSpreadsheet,
  Printer,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Filter,
} from "lucide-react";

export default function TeacherAttendancePage() {
  const [attendances, setAttendances] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({
    total: 0,
    present: 0,
    late: 0,
    excused: 0,
    absent: 0,
    commitmentRate: 100,
  });
  const [halaqat, setHalaqat] = useState<any[]>([]);
  const [selectedHalaqa, setSelectedHalaqa] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);

  const fetchAttendance = async () => {
    try {
      const url =
        selectedHalaqa === "ALL"
          ? "/api/teacher/attendance"
          : `/api/teacher/attendance?halaqaId=${selectedHalaqa}`;
      const [resA, resH] = await Promise.all([fetch(url), fetch("/api/teacher/halaqat")]);

      if (resA.ok) {
        const d = await resA.json();
        setAttendances(d.attendances || []);
        if (d.stats) setStats(d.stats);
      }
      if (resH.ok) {
        const d = await resH.json();
        setHalaqat(d.halaqat || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [selectedHalaqa]);

  const handleUpdateStatus = async (sessionId: string, studentId: string, status: string) => {
    try {
      const res = await fetch("/api/teacher/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          studentId,
          status,
        }),
      });
      if (res.ok) {
        fetchAttendance();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleExportCSV = () => {
    const headers = ["الطالب", "الرقم التعريفي", "الحلقة", "الجلسة", "الحالة", "وقت الدخول", "الاعتماد"];
    const rows = filteredAttendances.map((a) => [
      a.student?.user?.name || "طالب",
      a.student?.studentNumber || "",
      a.session?.halaqa?.name || "",
      a.session?.title || "",
      a.status === "PRESENT"
        ? "حاضر"
        : a.status === "LATE"
        ? "متأخر"
        : a.status === "EXCUSED"
        ? "بعذر"
        : "غائب",
      a.checkInTime ? new Date(a.checkInTime).toLocaleString("ar-SA") : "لم يدخل",
      a.isVerifiedByTeacher ? "معتمد" : "قيد الاعتماد",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `تقرير_حضور_القرآن_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintPDF = () => {
    window.print();
  };

  const filteredAttendances = attendances.filter((a) => {
    return statusFilter === "ALL" || a.status === statusFilter;
  });

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Top Header & Export Buttons */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 no-print">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <CheckSquare className="w-6 h-6 text-emerald-600" />
              سجل الحضور والغياب والالتزام
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              متابعة دقيقة لأوقات دخول الطلاب، اعتماد الحضور الفعلي، وحساب نسب الالتزام.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-emerald-600 font-bold text-xs px-3.5 py-2 rounded-xl shadow-sm transition"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              تصدير Excel (CSV)
            </button>
            <button
              onClick={handlePrintPDF}
              className="flex items-center gap-1.5 bg-islamic-800 hover:bg-islamic-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow transition"
            >
              <Printer className="w-4 h-4" />
              طباعة التقرير (PDF)
            </button>
          </div>
        </div>

        {/* Commitment Rate Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 no-print">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-[11px] font-bold text-slate-500 block mb-1">نسبة الالتزام</span>
            <span className="text-2xl font-black text-emerald-600">
              {stats.commitmentRate || 95}%
            </span>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-[11px] font-bold text-slate-500 block mb-1">حاضر</span>
            <span className="text-2xl font-black text-emerald-600">{stats.present || 0}</span>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-[11px] font-bold text-slate-500 block mb-1">متأخر</span>
            <span className="text-2xl font-black text-amber-500">{stats.late || 0}</span>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-[11px] font-bold text-slate-500 block mb-1">غياب بعذر</span>
            <span className="text-2xl font-black text-blue-500">{stats.excused || 0}</span>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-[11px] font-bold text-slate-500 block mb-1">غائب</span>
            <span className="text-2xl font-black text-red-500">{stats.absent || 0}</span>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-sm no-print">
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 font-bold flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> تصفية:
            </span>
            <select
              value={selectedHalaqa}
              onChange={(e) => setSelectedHalaqa(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-200"
            >
              <option value="ALL">جميع الحلقات</option>
              {halaqat.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-200"
            >
              <option value="ALL">جميع الحالات</option>
              <option value="PRESENT">حاضر</option>
              <option value="LATE">متأخر</option>
              <option value="EXCUSED">غياب بعذر</option>
              <option value="ABSENT">غائب</option>
            </select>
          </div>

          <div className="text-xs text-slate-400">
            إجمالي السجلات المعروضة: {filteredAttendances.length}
          </div>
        </div>

        {/* Printable & Screen Attendance Table */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
              سجل تفاصيل الحضور وتاريخ تسجيل الدخول
            </span>
            <span className="text-[11px] text-slate-400">
              {new Date().toLocaleDateString("ar-SA", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50/80 dark:bg-slate-800/40 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3.5">الطالب</th>
                  <th className="p-3.5">الحلقة</th>
                  <th className="p-3.5">وقت الدخول الفعلي</th>
                  <th className="p-3.5">الحالة</th>
                  <th className="p-3.5">الاعتماد</th>
                  <th className="p-3.5 text-center no-print">تعديل الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {filteredAttendances.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      لا توجد سجلات حضور مسجلة حالياً
                    </td>
                  </tr>
                ) : (
                  filteredAttendances.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          <img
                            src={
                              a.student?.user?.avatar ||
                              "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=150"
                            }
                            alt=""
                            className="w-7 h-7 rounded-full object-cover"
                          />
                          <div>
                            <span className="font-bold text-slate-900 dark:text-slate-100 block">
                              {a.student?.user?.name}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {a.student?.studentNumber}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5 font-bold text-slate-800 dark:text-slate-200">
                        {a.session?.halaqa?.name || "حلقة الفجر"}
                      </td>
                      <td className="p-3.5 text-slate-600 dark:text-slate-300">
                        {a.checkInTime ? (
                          <div className="flex items-center gap-1 font-mono text-[11px]">
                            <Clock className="w-3.5 h-3.5 text-emerald-500" />
                            {new Date(a.checkInTime).toLocaleTimeString("ar-SA", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">لم يسجل دخول</span>
                        )}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            a.status === "PRESENT"
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                              : a.status === "LATE"
                              ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
                              : a.status === "EXCUSED"
                              ? "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400"
                              : "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400"
                          }`}
                        >
                          {a.status === "PRESENT"
                            ? "حاضر"
                            : a.status === "LATE"
                            ? "متأخر"
                            : a.status === "EXCUSED"
                            ? "بعذر"
                            : "غائب"}
                        </span>
                      </td>
                      <td className="p-3.5">
                        {a.isVerifiedByTeacher ? (
                          <span className="text-emerald-600 font-semibold flex items-center gap-1 text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            معتمد من المعلم
                          </span>
                        ) : (
                          <span className="text-amber-500 font-semibold flex items-center gap-1 text-[11px]">
                            <AlertCircle className="w-3.5 h-3.5" />
                            طلب تسجيل من الطالب
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 no-print text-center">
                        <div className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg">
                          <button
                            onClick={() => handleUpdateStatus(a.sessionId, a.studentId, "PRESENT")}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                              a.status === "PRESENT" ? "bg-emerald-600 text-white" : "hover:text-emerald-600"
                            }`}
                          >
                            حضور
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(a.sessionId, a.studentId, "LATE")}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                              a.status === "LATE" ? "bg-amber-500 text-white" : "hover:text-amber-600"
                            }`}
                          >
                            تأخير
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(a.sessionId, a.studentId, "EXCUSED")}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                              a.status === "EXCUSED" ? "bg-blue-600 text-white" : "hover:text-blue-600"
                            }`}
                          >
                            عذر
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(a.sessionId, a.studentId, "ABSENT")}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                              a.status === "ABSENT" ? "bg-red-600 text-white" : "hover:text-red-600"
                            }`}
                          >
                            غياب
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
