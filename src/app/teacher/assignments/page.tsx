"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { SURAHS } from "@/lib/quranData";
import {
  FileCheck2,
  Plus,
  Calendar,
  CheckCircle2,
  Clock,
  AudioLines,
  MessageSquare,
  Award,
  BookOpen,
  XCircle,
} from "lucide-react";

export default function TeacherAssignmentsPage() {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [halaqat, setHalaqat] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New assignment form
  const [halaqaId, setHalaqaId] = useState("");
  const [title, setTitle] = useState("");
  const [type, setType] = useState("NEW_MEMORIZATION");
  const [surahNumber, setSurahNumber] = useState(2);
  const [startAyah, setStartAyah] = useState(1);
  const [endAyah, setEndAyah] = useState(25);
  const [dueDate, setDueDate] = useState("");
  const [instructions, setInstructions] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Grading modal
  const [gradingModal, setGradingModal] = useState<{
    isOpen: boolean;
    submissionId: string;
    studentName: string;
    notes: string;
    audioUrl?: string;
  }>({
    isOpen: false,
    submissionId: "",
    studentName: "",
    notes: "",
  });
  const [grade, setGrade] = useState(95);
  const [teacherFeedback, setTeacherFeedback] = useState("");

  const fetchData = async () => {
    try {
      const [resA, resH] = await Promise.all([
        fetch("/api/assignments"),
        fetch("/api/teacher/halaqat"),
      ]);

      if (resA.ok) {
        const d = await resA.json();
        setAssignments(d.assignments || []);
      }
      if (resH.ok) {
        const d = await resH.json();
        setHalaqat(d.halaqat || []);
        if (d.halaqat?.[0]) setHalaqaId(d.halaqat[0].id);
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

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !halaqaId) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          halaqaId,
          title,
          type,
          surahNumber,
          startAyah,
          endAyah,
          dueDate: dueDate || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          instructions,
        }),
      });

      if (res.ok) {
        setShowCreateModal(false);
        setTitle("");
        setInstructions("");
        fetchData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveGrade = async () => {
    try {
      const res = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "GRADE_SUBMISSION",
          submissionId: gradingModal.submissionId,
          grade,
          teacherFeedback,
        }),
      });

      if (res.ok) {
        setGradingModal({ isOpen: false, submissionId: "", studentName: "", notes: "" });
        setTeacherFeedback("");
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const assignmentTypeLabel = (t: string) => {
    switch (t) {
      case "NEW_MEMORIZATION":
        return "حفظ جديد";
      case "REVIEW":
        return "مراجعة وتثبيت";
      case "TAJWEED":
        return "أحكام تجويد";
      case "TILAWAH":
        return "قراءة وتصحيح";
      case "EXAM":
        return "اختبار جزء";
      default:
        return "تكليف منزلي";
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <FileCheck2 className="w-6 h-6 text-emerald-600" />
              إدارة الواجبات والتكليفات المنزلية
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              تعيين سور الحفظ والمراجعة للطلاب، والاستماع للتسجيلات الصوتية المسلمة، ورصد الدرجات والملاحظات.
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 bg-islamic-800 hover:bg-islamic-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow transition"
          >
            <Plus className="w-4 h-4" />
            إضافة واجب جديد
          </button>
        </div>

        {/* Assignments List */}
        <div className="space-y-4">
          {assignments.map((a) => {
            const submissions = a.submissions || [];

            return (
              <div
                key={a.id}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                        {assignmentTypeLabel(a.type)}
                      </span>
                      <span className="text-xs font-semibold text-slate-400">
                        {a.halaqa?.name}
                      </span>
                    </div>
                    <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                      {a.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                    <Clock className="w-4 h-4 text-amber-500" />
                    <span>تاريخ التسليم: {new Date(a.dueDate).toLocaleDateString("ar-SA")}</span>
                  </div>
                </div>

                {a.instructions && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl">
                    <span className="font-bold text-slate-800 dark:text-slate-200">التعليمات: </span>
                    {a.instructions}
                  </p>
                )}

                {/* Submissions by Students */}
                <div>
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                    تسليمات الطلاب ({submissions.length}):
                  </h4>

                  {submissions.length === 0 ? (
                    <div className="text-xs text-slate-400 italic p-4 bg-slate-50/50 dark:bg-slate-800/20 rounded-xl text-center">
                      لم يقم أي طالب بتسليم هذا الواجب بعد.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {submissions.map((sub: any) => (
                        <div
                          key={sub.id}
                          className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 gap-3"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold flex items-center justify-center text-xs shrink-0">
                              {sub.student?.user?.name?.[0] || "ط"}
                            </div>
                            <div>
                              <span className="font-bold text-xs text-slate-900 dark:text-slate-100 block">
                                {sub.student?.user?.name}
                              </span>
                              <span className="text-[10px] text-slate-400 block">
                                سُلِّم في: {new Date(sub.submittedAt).toLocaleString("ar-SA")}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            {sub.notes && (
                              <span className="text-xs text-slate-500 italic max-w-xs truncate">
                                "{sub.notes}"
                              </span>
                            )}

                            {sub.grade !== null ? (
                              <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                                الدرجة: {sub.grade}/١٠٠
                              </span>
                            ) : (
                              <button
                                onClick={() =>
                                  setGradingModal({
                                    isOpen: true,
                                    submissionId: sub.id,
                                    studentName: sub.student?.user?.name,
                                    notes: sub.notes || "",
                                    audioUrl: sub.audioUrl,
                                  })
                                }
                                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs px-3.5 py-1.5 rounded-lg shadow-sm transition"
                              >
                                تصحيح ورصد الدرجة
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal: Create Assignment */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-base text-slate-900 dark:text-slate-100">
                  إضافة تكليف أو واجب جديد
                </h3>
                <button onClick={() => setShowCreateModal(false)} className="text-slate-400">
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateAssignment} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    اختر الحلقة:
                  </label>
                  <select
                    value={halaqaId}
                    onChange={(e) => setHalaqaId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 font-bold text-slate-900 dark:text-slate-100"
                  >
                    {halaqat.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    عنوان الواجب:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: حفظ سورة البقرة من الآية 26 إلى 50"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      نوع التكليف:
                    </label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 font-bold text-slate-900 dark:text-slate-100"
                    >
                      <option value="NEW_MEMORIZATION">حفظ جديد</option>
                      <option value="REVIEW">مراجعة وتثبيت</option>
                      <option value="TAJWEED">تطبيق أحكام التجويد</option>
                      <option value="TILAWAH">قراءة وتصحيح</option>
                      <option value="EXAM">اختبار وتقييم</option>
                      <option value="FIQH">فقه وأحكام</option>
                    </select>
                  </div>

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
                </div>

                <div className="grid grid-cols-3 gap-3">
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

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      موعد التسليم:
                    </label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    تعليمات إضافية وتوجيهات للطلاب:
                  </label>
                  <textarea
                    rows={2}
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    placeholder="مثال: التركيز على غنن الإخفاء، والتسجيل الصوتي الواضح..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 rounded-xl text-slate-500 font-bold"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-islamic-800 hover:bg-islamic-700 text-white font-bold px-5 py-2 rounded-xl shadow"
                  >
                    {submitting ? "جارٍ الحفظ..." : "إرسال التكليف لجميع الطلاب"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Grade Submission */}
        {gradingModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
              <h3 className="font-black text-sm text-slate-900 dark:text-slate-100">
                تصحيح واجب الطالب: {gradingModal.studentName}
              </h3>

              {gradingModal.notes && (
                <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl italic">
                  ملاحظات الطالب: "{gradingModal.notes}"
                </p>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  الدرجة من ١٠٠:
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={grade}
                  onChange={(e) => setGrade(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-slate-100 text-center font-mono text-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  ملاحظات وتوجيهات المعلم:
                </label>
                <textarea
                  rows={3}
                  value={teacherFeedback}
                  onChange={(e) => setTeacherFeedback(e.target.value)}
                  placeholder="مثال: أحسنت وبارك الله فيك، انتبه فقط لحكم الإقلاب في الآية..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() =>
                    setGradingModal({ isOpen: false, submissionId: "", studentName: "", notes: "" })
                  }
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleSaveGrade}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-5 py-2 rounded-xl shadow"
                >
                  رصد الدرجة وإشعار الطالب
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
