"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { SURAHS } from "@/lib/quranData";
import {
  Award,
  TrendingUp,
  BookOpen,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Filter,
  User,
  Plus,
  Save,
} from "lucide-react";

export default function TeacherEvaluationsPage() {
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [memorizationRecords, setMemorizationRecords] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState("ALL");
  const [loading, setLoading] = useState(true);

  // New evaluation form modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [targetStudentId, setTargetStudentId] = useState("");
  const [surahNumber, setSurahNumber] = useState(2);
  const [startAyah, setStartAyah] = useState(1);
  const [endAyah, setEndAyah] = useState(20);
  const [recordType, setRecordType] = useState("NEW_MEMORIZATION");
  const [memorizationScore, setMemorizationScore] = useState(96);
  const [tajweedScore, setTajweedScore] = useState(94);
  const [mistakesCount, setMistakesCount] = useState(1);
  const [alertsCount, setAlertsCount] = useState(2);
  const [tajweedLevel, setTajweedLevel] = useState("ممتاز");
  const [notes, setNotes] = useState("");
  const [nextAssignmentText, setNextAssignmentText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      const [resE, resS] = await Promise.all([
        fetch("/api/evaluations"),
        fetch("/api/teacher/students"),
      ]);

      if (resE.ok) {
        const d = await resE.json();
        setEvaluations(d.evaluations || []);
        setMemorizationRecords(d.memorizationRecords || []);
      }
      if (resS.ok) {
        const d = await resS.json();
        setStudents(d.students || []);
        if (d.students?.[0]) setTargetStudentId(d.students[0].studentId);
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

  const handleCreateEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetStudentId) return;

    setSubmitting(true);
    try {
      const enrolled = students.find((s) => s.studentId === targetStudentId);
      const halaqaId = enrolled?.halaqaId || "halaqa-1";

      const res = await fetch("/api/evaluations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: targetStudentId,
          halaqaId,
          surahNumber,
          startAyah,
          endAyah,
          recordType,
          mistakesCount,
          alertsCount,
          tajweedLevel,
          memorizationScore,
          tajweedScore,
          notes,
          nextAssignmentText,
        }),
      });

      if (res.ok) {
        setShowAddModal(false);
        setNotes("");
        setNextAssignmentText("");
        fetchData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredEvaluations = evaluations.filter((e) => {
    return selectedStudentId === "ALL" || e.studentId === selectedStudentId;
  });

  const filteredRecords = memorizationRecords.filter((m) => {
    return selectedStudentId === "ALL" || m.studentId === selectedStudentId;
  });

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Award className="w-6 h-6 text-emerald-600" />
              سجل الحفظ الرقمي والتقييمات
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              متابعة دقيقة لمستوى إتقان الحفظ وأحكام التجويد، وتوثيق الأخطاء والتنبيهات المعتمدة من المعلم.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 bg-islamic-800 hover:bg-islamic-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow transition"
            >
              <Plus className="w-4 h-4" />
              رصد تقييم جديد
            </button>
          </div>
        </div>

        {/* Student Selector Filter */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              عرض سجل الطالب:
            </span>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 dark:text-slate-100"
            >
              <option value="ALL">جميع الطلاب</option>
              {students.map((s) => (
                <option key={s.studentId} value={s.studentId}>
                  {s.student?.user?.name} ({s.halaqa?.name})
                </option>
              ))}
            </select>
          </div>

          <span className="text-xs text-slate-400 font-medium">
            عدد جلسات التسميع الموثقة: {filteredRecords.length}
          </span>
        </div>

        {/* Verified Memorization Records Table */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
              سجل التسميع وإتقان الآيات المعتمد
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/40 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3.5">الطالب</th>
                  <th className="p-3.5">السورة والآيات</th>
                  <th className="p-3.5">نوع التسميع</th>
                  <th className="p-3.5">الأخطاء</th>
                  <th className="p-3.5">التنبيهات</th>
                  <th className="p-3.5">مستوى التجويد</th>
                  <th className="p-3.5">الدرجة</th>
                  <th className="p-3.5">التاريخ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      لا توجد سجلات تسميع مسجلة لهذا الطالب بعد
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((m) => {
                    const surah = SURAHS.find((s) => s.number === m.surahNumber);

                    return (
                      <tr key={m.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                        <td className="p-3.5 font-bold text-slate-900 dark:text-slate-100">
                          {m.student?.user?.name}
                        </td>
                        <td className="p-3.5 font-bold text-islamic-800 dark:text-emerald-400">
                          سورة {surah?.name || m.surahNumber} ({m.startAyah} - {m.endAyah})
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              m.recordType === "NEW_MEMORIZATION"
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                                : "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400"
                            }`}
                          >
                            {m.recordType === "NEW_MEMORIZATION" ? "حفظ جديد" : "مراجعة"}
                          </span>
                        </td>
                        <td className="p-3.5 text-red-600 font-bold">{m.mistakesCount}</td>
                        <td className="p-3.5 text-amber-600 font-bold">{m.alertsCount}</td>
                        <td className="p-3.5 font-semibold text-slate-700 dark:text-slate-300">
                          {m.tajweedLevel}
                        </td>
                        <td className="p-3.5 font-black text-emerald-600">
                          {m.memorizationScore}%
                        </td>
                        <td className="p-3.5 text-slate-500 font-mono text-[11px]">
                          {new Date(m.date).toLocaleDateString("ar-SA")}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal: Add Evaluation */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
              <h3 className="font-black text-base text-slate-900 dark:text-slate-100">
                رصد تقييم جديد لجلسة تسميع
              </h3>

              <form onSubmit={handleCreateEvaluation} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    الطالب:
                  </label>
                  <select
                    value={targetStudentId}
                    onChange={(e) => setTargetStudentId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 font-bold text-slate-900 dark:text-slate-100"
                  >
                    {students.map((s) => (
                      <option key={s.studentId} value={s.studentId}>
                        {s.student?.user?.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      السورة:
                    </label>
                    <select
                      value={surahNumber}
                      onChange={(e) => setSurahNumber(Number(e.target.value))}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 font-bold text-slate-900 dark:text-slate-100"
                    >
                      {SURAHS.map((s) => (
                        <option key={s.number} value={s.number}>
                          {s.number}. {s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      نوع التسميع:
                    </label>
                    <select
                      value={recordType}
                      onChange={(e) => setRecordType(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 font-bold text-slate-900 dark:text-slate-100"
                    >
                      <option value="NEW_MEMORIZATION">حفظ جديد</option>
                      <option value="REVIEW">مراجعة وتثبيت</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      من الآية:
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={startAyah}
                      onChange={(e) => setStartAyah(Number(e.target.value))}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      إلى الآية:
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={endAyah}
                      onChange={(e) => setEndAyah(Number(e.target.value))}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      عدد الأخطاء:
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={mistakesCount}
                      onChange={(e) => setMistakesCount(Number(e.target.value))}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-red-600 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      عدد التنبيهات:
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={alertsCount}
                      onChange={(e) => setAlertsCount(Number(e.target.value))}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-amber-600 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      درجة الحفظ:
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={memorizationScore}
                      onChange={(e) => setMemorizationScore(Number(e.target.value))}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-emerald-600 font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    ملاحظات المعلم:
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="ملاحظات حول الإتقان والوقف والابتداء..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    تكليف الحلقة القادمة:
                  </label>
                  <input
                    type="text"
                    value={nextAssignmentText}
                    onChange={(e) => setNextAssignmentText(e.target.value)}
                    placeholder="مثال: سورة البقرة من الآية 21 إلى 40..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100"
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
                    {submitting ? "جارٍ الحفظ..." : "توثيق التقييم في سجل الطالب"}
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
