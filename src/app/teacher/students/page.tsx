"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import {
  Users,
  Search,
  UserCheck,
  UserX,
  ArrowRightLeft,
  PauseCircle,
  PlayCircle,
  Trash2,
  CheckCircle2,
  XCircle,
  FileText,
  BookOpen,
  Award,
} from "lucide-react";

export default function TeacherStudentsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [joinRequests, setJoinRequests] = useState<any[]>([]);
  const [halaqat, setHalaqat] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"ACTIVE" | "REQUESTS">("ACTIVE");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedHalaqaFilter, setSelectedHalaqaFilter] = useState("ALL");

  // Modals state
  const [rejectModal, setRejectModal] = useState<{ isOpen: boolean; requestId: string; name: string }>({
    isOpen: false,
    requestId: "",
    name: "",
  });
  const [rejectReason, setRejectReason] = useState("");

  const [transferModal, setTransferModal] = useState<{
    isOpen: boolean;
    enrollmentId: string;
    studentName: string;
    currentHalaqaId: string;
  }>({
    isOpen: false,
    enrollmentId: "",
    studentName: "",
    currentHalaqaId: "",
  });
  const [targetHalaqaId, setTargetHalaqaId] = useState("");

  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    enrollmentId: string;
    studentName: string;
  }>({
    isOpen: false,
    enrollmentId: "",
    studentName: "",
  });
  const [deleteReason, setDeleteReason] = useState("");

  const [studentDetailModal, setStudentDetailModal] = useState<any | null>(null);

  const fetchData = async () => {
    try {
      const [resS, resH] = await Promise.all([
        fetch("/api/teacher/students"),
        fetch("/api/teacher/halaqat"),
      ]);

      if (resS.ok) {
        const d = await resS.json();
        setStudents(d.students || []);
        setJoinRequests(d.joinRequests || []);
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
    fetchData();
  }, []);

  const handleAcceptRequest = async (requestId: string) => {
    try {
      const res = await fetch("/api/teacher/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "ACCEPT_REQUEST", requestId }),
      });
      if (res.ok) fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleConfirmReject = async () => {
    try {
      const res = await fetch("/api/teacher/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "REJECT_REQUEST",
          requestId: rejectModal.requestId,
          reason: rejectReason,
        }),
      });
      if (res.ok) {
        setRejectModal({ isOpen: false, requestId: "", name: "" });
        setRejectReason("");
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleConfirmTransfer = async () => {
    if (!targetHalaqaId) return;
    try {
      const res = await fetch("/api/teacher/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "TRANSFER_STUDENT",
          enrollmentId: transferModal.enrollmentId,
          targetHalaqaId,
        }),
      });
      if (res.ok) {
        setTransferModal({ isOpen: false, enrollmentId: "", studentName: "", currentHalaqaId: "" });
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleSuspend = async (enrollmentId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    try {
      const res = await fetch("/api/teacher/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SUSPEND_STUDENT",
          enrollmentId,
          status: nextStatus,
        }),
      });
      if (res.ok) fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      const res = await fetch("/api/teacher/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "DELETE_STUDENT",
          enrollmentId: deleteModal.enrollmentId,
          reason: deleteReason || "حذف من قِبل المعلم",
        }),
      });
      if (res.ok) {
        setDeleteModal({ isOpen: false, enrollmentId: "", studentName: "" });
        setDeleteReason("");
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.student?.user?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.student?.studentNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesHalaqa = selectedHalaqaFilter === "ALL" || s.halaqaId === selectedHalaqaFilter;
    return matchesSearch && matchesHalaqa;
  });

  const pendingRequests = joinRequests.filter((r) => r.status === "PENDING");

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header & Tabs */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Users className="w-6 h-6 text-emerald-600" />
              إدارة الطلاب وطلبات الانضمام
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              متابعة الطلاب المسجلين، نقل الطلاب بين الحلقات، ومعالجة طلبات الانضمام الجديدة.
            </p>
          </div>

          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setActiveTab("ACTIVE")}
              className={`px-4 py-2 rounded-lg transition ${
                activeTab === "ACTIVE"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              الطلاب المقيدين ({students.length})
            </button>
            <button
              onClick={() => setActiveTab("REQUESTS")}
              className={`px-4 py-2 rounded-lg transition relative ${
                activeTab === "REQUESTS"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              طلبات الانضمام ({pendingRequests.length})
              {pendingRequests.length > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              )}
            </button>
          </div>
        </div>

        {/* Tab 1: Active Enrolled Students */}
        {activeTab === "ACTIVE" && (
          <div className="space-y-4">
            {/* Filters */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-sm">
              <div className="relative flex-1 min-w-[240px]">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                <input
                  type="text"
                  placeholder="ابحث باسم الطالب أو الرقم التعريفي..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pr-9 pl-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">تصفية حسب الحلقة:</span>
                <select
                  value={selectedHalaqaFilter}
                  onChange={(e) => setSelectedHalaqaFilter(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-slate-100"
                >
                  <option value="ALL">جميع الحلقات</option>
                  {halaqat.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Students Table */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="p-3.5">الطالب</th>
                      <th className="p-3.5">الرقم التعريفي</th>
                      <th className="p-3.5">الحلقة</th>
                      <th className="p-3.5">الجزء الحالي</th>
                      <th className="p-3.5">الآيات المحفوظة</th>
                      <th className="p-3.5">الحالة</th>
                      <th className="p-3.5 text-center">الإجراءات والخيارات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-400">
                          لا يوجد طلاب يطابقون خيارات البحث
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map((enr) => (
                        <tr
                          key={enr.id}
                          className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition"
                        >
                          <td className="p-3.5">
                            <div className="flex items-center gap-2.5">
                              <img
                                src={
                                  enr.student?.user?.avatar ||
                                  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150"
                                }
                                alt={enr.student?.user?.name}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                              <div>
                                <span className="block font-bold text-slate-900 dark:text-slate-100">
                                  {enr.student?.user?.name}
                                </span>
                                <span className="block text-[10px] text-slate-400">
                                  {enr.student?.user?.email}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="p-3.5 font-mono text-slate-600 dark:text-slate-300">
                            {enr.student?.studentNumber}
                          </td>
                          <td className="p-3.5 font-bold text-slate-800 dark:text-slate-200">
                            {enr.halaqa?.name}
                          </td>
                          <td className="p-3.5 font-bold text-emerald-600">
                            الجزء {enr.student?.currentJuz || 1}
                          </td>
                          <td className="p-3.5 text-slate-600 dark:text-slate-300">
                            {enr.student?.totalMemorizedAyahs || 0} آية
                          </td>
                          <td className="p-3.5">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                enr.status === "ACTIVE"
                                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                                  : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
                              }`}
                            >
                              {enr.status === "ACTIVE" ? "نشط" : "موقوف مؤقتاً"}
                            </span>
                          </td>
                          <td className="p-3.5">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* View Educational Profile */}
                              <button
                                onClick={() => setStudentDetailModal(enr)}
                                title="عرض الملف التعليمي"
                                className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                              >
                                <FileText className="w-4 h-4" />
                              </button>

                              {/* Transfer Halaqa */}
                              <button
                                onClick={() => {
                                  setTransferModal({
                                    isOpen: true,
                                    enrollmentId: enr.id,
                                    studentName: enr.student?.user?.name,
                                    currentHalaqaId: enr.halaqaId,
                                  });
                                  const otherHalaqa = halaqat.find((h) => h.id !== enr.halaqaId);
                                  if (otherHalaqa) setTargetHalaqaId(otherHalaqa.id);
                                }}
                                title="نقل الطالب لحلقة أخرى"
                                className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                              >
                                <ArrowRightLeft className="w-4 h-4" />
                              </button>

                              {/* Suspend / Resume */}
                              <button
                                onClick={() => handleToggleSuspend(enr.id, enr.status)}
                                title={enr.status === "ACTIVE" ? "إيقاف مؤقت" : "استئناف التفعيل"}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                              >
                                {enr.status === "ACTIVE" ? (
                                  <PauseCircle className="w-4 h-4" />
                                ) : (
                                  <PlayCircle className="w-4 h-4" />
                                )}
                              </button>

                              {/* Delete (Move to Trash) */}
                              <button
                                onClick={() => {
                                  setDeleteModal({
                                    isOpen: true,
                                    enrollmentId: enr.id,
                                    studentName: enr.student?.user?.name,
                                  });
                                }}
                                title="حذف من الحلقة (نقل لقائمة المحذوفين)"
                                className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                              >
                                <Trash2 className="w-4 h-4" />
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
        )}

        {/* Tab 2: Join Requests */}
        {activeTab === "REQUESTS" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {joinRequests.map((req) => (
                <div
                  key={req.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={
                          req.student?.user?.avatar ||
                          "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=150"
                        }
                        alt={req.student?.user?.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                          {req.student?.user?.name}
                        </h3>
                        <span className="text-[11px] text-slate-500 block">
                          البريد: {req.student?.user?.email} • الهاتف: {req.student?.user?.phone || "غير محدد"}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        req.status === "PENDING"
                          ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
                          : req.status === "ACCEPTED"
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                          : "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400"
                      }`}
                    >
                      {req.status === "PENDING" ? "قيد المراجعة" : req.status === "ACCEPTED" ? "تم القبول" : "مرفوض"}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-xs space-y-1">
                    <div className="flex justify-between text-slate-600 dark:text-slate-300">
                      <span>الحلقة المطلوبة:</span>
                      <span className="font-bold text-slate-900 dark:text-slate-100">{req.halaqa?.name}</span>
                    </div>
                    {req.notes && (
                      <div className="text-slate-500 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                        <span className="font-bold text-slate-700 dark:text-slate-300">ملاحظات الطالب: </span>
                        {req.notes}
                      </div>
                    )}
                  </div>

                  {req.status === "PENDING" && (
                    <div className="flex items-center gap-2 pt-2">
                      <button
                        onClick={() => handleAcceptRequest(req.id)}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2 rounded-xl transition flex items-center justify-center gap-1 shadow-sm"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        قبول الطالب وتسكينه بالحلقة
                      </button>
                      <button
                        onClick={() => {
                          setRejectModal({
                            isOpen: true,
                            requestId: req.id,
                            name: req.student?.user?.name,
                          });
                        }}
                        className="px-4 py-2 border border-red-200 dark:border-red-900 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 text-xs font-bold rounded-xl transition"
                      >
                        رفض
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal: Rejection Reason */}
        {rejectModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
              <h3 className="font-black text-sm text-slate-900 dark:text-slate-100">
                رفض طلب انضمام: {rejectModal.name}
              </h3>
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                  سبب الرفض (سيصل للطالب في إشعار):
                </label>
                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="مثال: نعتذر لاكتمال نصاب الحلقة، أو يلزم اجتياز اختبار التلاوة أولاً..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-slate-100"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setRejectModal({ isOpen: false, requestId: "", name: "" })}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleConfirmReject}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-5 py-2 rounded-xl"
                >
                  تأكيد الرفض
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Transfer Halaqa */}
        {transferModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
              <h3 className="font-black text-sm text-slate-900 dark:text-slate-100">
                نقل الطالب: {transferModal.studentName}
              </h3>
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                  اختر الحلقة الجديدة:
                </label>
                <select
                  value={targetHalaqaId}
                  onChange={(e) => setTargetHalaqaId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-slate-100"
                >
                  {halaqat
                    .filter((h) => h.id !== transferModal.currentHalaqaId)
                    .map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name} ({h.level})
                      </option>
                    ))}
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() =>
                    setTransferModal({ isOpen: false, enrollmentId: "", studentName: "", currentHalaqaId: "" })
                  }
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleConfirmTransfer}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2 rounded-xl"
                >
                  نقل الطالب
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Delete Student (Move to Trash) */}
        {deleteModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
              <h3 className="font-black text-sm text-red-600 dark:text-red-400">
                حذف الطالب: {deleteModal.studentName} من الحلقة
              </h3>
              <p className="text-xs text-slate-500">
                سيتم نقل الطالب إلى قائمة الطلاب المحذوفين، ويمكنك استرجاعه في أي وقت دون فقدان سجل إنجازاته السابقة.
              </p>
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                  سبب الحذف:
                </label>
                <input
                  type="text"
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  placeholder="مثال: الانقطاع المتكرر، طلب ولي الأمر..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setDeleteModal({ isOpen: false, enrollmentId: "", studentName: "" })}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-5 py-2 rounded-xl"
                >
                  نقل للمحذوفين
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Student Educational Profile */}
        {studentDetailModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <img
                    src={
                      studentDetailModal.student?.user?.avatar ||
                      "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=150"
                    }
                    alt=""
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <h3 className="font-black text-base text-slate-900 dark:text-slate-100">
                      {studentDetailModal.student?.user?.name}
                    </h3>
                    <span className="text-xs text-slate-500">
                      الرقم الأكاديمي: {studentDetailModal.student?.studentNumber}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setStudentDetailModal(null)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl">
                  <span className="text-slate-400 block mb-1">الحلقة المقيد بها:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {studentDetailModal.halaqa?.name}
                  </span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl">
                  <span className="text-slate-400 block mb-1">ولي الأمر:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {studentDetailModal.student?.guardianName || "غير مسجل"} (
                    {studentDetailModal.student?.guardianPhone || "---"})
                  </span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl">
                  <span className="text-slate-400 block mb-1">الجزء الحالي:</span>
                  <span className="font-bold text-emerald-600">
                    الجزء {studentDetailModal.student?.currentJuz || 1}
                  </span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl">
                  <span className="text-slate-400 block mb-1">إجمالي الآيات المتقنة:</span>
                  <span className="font-bold text-amber-600">
                    {studentDetailModal.student?.totalMemorizedAyahs || 0} آية
                  </span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-xs text-slate-700 dark:text-slate-300 mb-2">
                  سجل التسميع الأخير:
                </h4>
                <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl text-xs space-y-1">
                  <p className="text-slate-600 dark:text-slate-300">
                    تم تسميع سورة البقرة (١ - ٢٥) بنجاح بدرجة ممتاز (٩٦%).
                  </p>
                  <span className="text-[10px] text-slate-400 block">التاريخ: قبل يومين</span>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setStudentDetailModal(null)}
                  className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-5 py-2 rounded-xl"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
