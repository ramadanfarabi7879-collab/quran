"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useRealtime } from "@/components/providers/AppProviders";
import { playTeacherJoinAlertSound, playChimePing } from "@/lib/sound";
import {
  UserCheck,
  UserX,
  Clock,
  Calendar,
  Sparkles,
  Users,
  User,
  BookOpen,
  CheckCircle2,
  XCircle,
  Send,
  Phone,
  Mail,
  Search,
  Filter,
  Inbox,
  Archive,
  RefreshCw,
} from "lucide-react";

export default function TeacherRequestsManagementPage() {
  const { lastEvent } = useRealtime();

  const [activeTab, setActiveTab] = useState<"REGISTRATIONS" | "JOIN_REQUESTS" | "ARCHIVE">("REGISTRATIONS");
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [pendingRegistrations, setPendingRegistrations] = useState<any[]>([]);
  const [rejectedRegistrations, setRejectedRegistrations] = useState<any[]>([]);
  const [joinRequests, setJoinRequests] = useState<any[]>([]);
  const [halaqat, setHalaqat] = useState<any[]>([]);

  // Per-card form states for Registrations
  const [studentTracks, setStudentTracks] = useState<{ [id: string]: "INDIVIDUAL" | "GROUP" | "FOUNDATION" }>({});
  const [studentHalaqas, setStudentHalaqas] = useState<{ [id: string]: string }>({});

  // Drawer states
  const [rescheduleDrawer, setRescheduleDrawer] = useState<{ [id: string]: boolean }>({});
  const [customTimes, setCustomTimes] = useState<{ [id: string]: string }>({});
  const [comments, setComments] = useState<{ [id: string]: string }>({});
  const [submittingIds, setSubmittingIds] = useState<{ [id: string]: boolean }>({});

  const fetchData = async () => {
    try {
      const [resS, resH] = await Promise.all([
        fetch("/api/teacher/students"),
        fetch("/api/teacher/halaqat"),
      ]);

      if (resS.ok) {
        const d = await resS.json();
        setPendingRegistrations(d.pendingRegistrations || []);
        setRejectedRegistrations(d.rejectedRegistrations || []);
        setJoinRequests(d.joinRequests || []);
      }
      if (resH.ok) {
        const d = await resH.json();
        setHalaqat(d.halaqat || []);
      }
    } catch (e) {
      console.error("Fetch requests error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Listen to realtime notifications to keep requests page updated live
  useEffect(() => {
    if (!lastEvent) return;
    if (
      lastEvent.type === "STUDENT_REGISTRATION_SUBMITTED" ||
      lastEvent.type === "STUDENT_REGISTRATION_APPROVED" ||
      lastEvent.type === "SESSION_JOIN_REQUESTED" ||
      lastEvent.type === "JOIN_REQUEST_SUBMITTED" ||
      lastEvent.type === "JOIN_REQUEST_APPROVED"
    ) {
      fetchData();
    }
  }, [lastEvent]);

  // Suggested times preset
  const suggestedTimes = [
    ...(halaqat.map((h: any) => `${h.name} (${h.startTime || "16:00"})`)),
    "الفجر (05:30 ص)",
    "العصر (04:00 م)",
    "المغرب (06:30 م)",
    "العشاء (08:00 م)",
    "غداً صباحاً (09:00 ص)",
  ].filter((v, i, a) => a.indexOf(v) === i).slice(0, 5);

  // 1. Approve New Student Registration
  const handleApproveRegistration = async (stu: any) => {
    const track = studentTracks[stu.id] || "GROUP";
    const targetHalaqaId = studentHalaqas[stu.id] || (halaqat.length > 0 ? halaqat[0].id : "");

    setSubmittingIds((prev) => ({ ...prev, [stu.id]: true }));
    try {
      const res = await fetch("/api/teacher/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "APPROVE_STUDENT_REGISTRATION",
          studentUserId: stu.id,
          track,
          targetHalaqaId,
        }),
      });

      if (res.ok) {
        playChimePing();
        fetchData();
      } else {
        alert("فشل تأكيد اعتماد الحساب");
      }
    } catch {
      alert("حدث خطأ في الاتصال");
    } finally {
      setSubmittingIds((prev) => ({ ...prev, [stu.id]: false }));
    }
  };

  // 2. Reschedule New Student Registration
  const handleRescheduleRegistration = async (stuId: string) => {
    const finalTime = customTimes[stuId]?.trim() || suggestedTimes[0];
    const comment = comments[stuId] || "";

    setSubmittingIds((prev) => ({ ...prev, [stuId]: true }));
    try {
      const res = await fetch("/api/teacher/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "RESCHEDULE_STUDENT_REGISTRATION",
          studentUserId: stuId,
          scheduledTime: finalTime,
          comment,
        }),
      });

      if (res.ok) {
        playChimePing();
        setRescheduleDrawer((prev) => ({ ...prev, [stuId]: false }));
        fetchData();
      } else {
        alert("فشل حفظ الموعد");
      }
    } catch {
      alert("حدث خطأ في الاتصال");
    } finally {
      setSubmittingIds((prev) => ({ ...prev, [stuId]: false }));
    }
  };

  // 3. Reject New Student Registration
  const handleRejectRegistration = async (stuId: string) => {
    if (!confirm("هل أنت متأكد من الاعتذار عن قبول تسجيل هذا الطالب؟")) return;
    const comment = comments[stuId] || "نعتذر لاكتمال النصاب حالياً";

    setSubmittingIds((prev) => ({ ...prev, [stuId]: true }));
    try {
      const res = await fetch("/api/teacher/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "REJECT_STUDENT_REGISTRATION",
          studentUserId: stuId,
          reason: comment,
        }),
      });

      if (res.ok) {
        fetchData();
      }
    } catch {
      alert("حدث خطأ أثناء الرفض");
    } finally {
      setSubmittingIds((prev) => ({ ...prev, [stuId]: false }));
    }
  };

  // 4. Accept Halaqa / Session Join Request
  const handleAcceptJoinRequest = async (req: any) => {
    setSubmittingIds((prev) => ({ ...prev, [req.id]: true }));
    try {
      const res = await fetch("/api/teacher/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ACCEPT_JOIN_SESSION",
          requestId: req.id,
          halaqaId: req.halaqaId,
          studentId: req.studentId,
        }),
      });

      if (res.ok) {
        playChimePing();
        fetchData();
      } else {
        alert("فشل قبول الطلب");
      }
    } catch {
      alert("حدث خطأ في الاتصال");
    } finally {
      setSubmittingIds((prev) => ({ ...prev, [req.id]: false }));
    }
  };

  // 5. Reschedule Halaqa / Session Join Request
  const handleRescheduleJoinRequest = async (req: any) => {
    const finalTime = customTimes[req.id]?.trim() || suggestedTimes[0];
    const notes = comments[req.id] || "";

    setSubmittingIds((prev) => ({ ...prev, [req.id]: true }));
    try {
      const res = await fetch("/api/teacher/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "RESCHEDULE_JOIN_SESSION",
          requestId: req.id,
          studentId: req.studentId,
          scheduledTime: finalTime,
          notes,
        }),
      });

      if (res.ok) {
        playChimePing();
        setRescheduleDrawer((prev) => ({ ...prev, [req.id]: false }));
        fetchData();
      }
    } catch {
      alert("حدث خطأ");
    } finally {
      setSubmittingIds((prev) => ({ ...prev, [req.id]: false }));
    }
  };

  // 6. Reject Halaqa / Session Join Request
  const handleRejectJoinRequest = async (req: any) => {
    if (!confirm("هل أنت متأكد من الاعتذار عن هذا الطلب؟")) return;
    const reason = comments[req.id] || "نعتذر لاكتمال النصاب";

    setSubmittingIds((prev) => ({ ...prev, [req.id]: true }));
    try {
      const res = await fetch("/api/teacher/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "REJECT_JOIN_SESSION",
          requestId: req.id,
          studentId: req.studentId,
          reason,
        }),
      });

      if (res.ok) {
        fetchData();
      }
    } catch {
      alert("حدث خطأ");
    } finally {
      setSubmittingIds((prev) => ({ ...prev, [req.id]: false }));
    }
  };

  const pendingJoinRequests = joinRequests.filter((r) => r.status === "PENDING");
  const processedJoinRequests = joinRequests.filter((r) => r.status !== "PENDING");

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <UserCheck className="w-6 h-6 text-emerald-600" />
              إدارة الطلبات والاعتمادات
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              مراجعة واعتماد طلبات تسجيل الطلاب الجدد، وتحديد مساراتهم، والبت في طلبات الانضمام للحلقات.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchData}
              className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              title="تحديث القائمة"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>تحديث</span>
            </button>
          </div>
        </div>

        {/* Tab Bar */}
        <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl text-xs font-black gap-1 flex-wrap">
          <button
            onClick={() => setActiveTab("REGISTRATIONS")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition relative ${
              activeTab === "REGISTRATIONS"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>طلبات تسجيل الطلاب الجدد</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                pendingRegistrations.length > 0
                  ? "bg-amber-400 text-slate-950 font-black animate-pulse"
                  : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
              }`}
            >
              {pendingRegistrations.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("JOIN_REQUESTS")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition relative ${
              activeTab === "JOIN_REQUESTS"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <Users className="w-4 h-4 text-emerald-500" />
            <span>طلبات الانضمام للحلقات</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                pendingJoinRequests.length > 0
                  ? "bg-emerald-500 text-white font-black animate-pulse"
                  : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
              }`}
            >
              {pendingJoinRequests.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("ARCHIVE")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition ${
              activeTab === "ARCHIVE"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <Archive className="w-4 h-4 text-slate-500" />
            <span>سجل الطلبات المعالجة والأرشيف</span>
          </button>
        </div>

        {/* Tab 1: Pending Student Registrations */}
        {activeTab === "REGISTRATIONS" && (
          <div className="space-y-4">
            {pendingRegistrations.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-3 shadow-sm">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h3 className="font-black text-sm text-slate-800 dark:text-slate-200">
                  لا توجد طلبات تسجيل طلاب معلقة حالياً
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  جميع الطلاب المسجلين تم اعتمادهم وتفعيل حساباتهم. سيظهر أي طالب جديد فور تسجيله هنا مباشرة.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {pendingRegistrations.map((stu) => {
                  const currentTrack = studentTracks[stu.id] || "GROUP";
                  const currentHalaqa = studentHalaqas[stu.id] || (halaqat[0]?.id || "");
                  const isDrawerOpen = rescheduleDrawer[stu.id] || false;
                  const isSubmitting = submittingIds[stu.id] || false;

                  return (
                    <div
                      key={stu.id}
                      className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-amber-400/50 p-5 shadow-md space-y-4 relative overflow-hidden"
                    >
                      {/* Card Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-emerald-500 text-slate-950 font-black flex items-center justify-center text-lg shadow-md shrink-0">
                            {stu.name?.[0] || "ط"}
                          </div>
                          <div>
                            <h3 className="font-black text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                              {stu.name}
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300">
                                طالب جديد
                              </span>
                            </h3>
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                              <Mail className="w-3 h-3 text-slate-400" />
                              {stu.email}
                            </span>
                          </div>
                        </div>

                        <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {new Date(stu.createdAt).toLocaleDateString("ar-SA")}
                        </span>
                      </div>

                      {/* Student Info Details */}
                      <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl text-xs">
                        <div>
                          <span className="text-slate-400 block text-[10px]">رقم الجوال:</span>
                          <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                            {stu.phone || "غير محدد"}
                          </span>
                        </div>
                        {stu.studentProfile?.guardianName && (
                          <div>
                            <span className="text-slate-400 block text-[10px]">ولي الأمر:</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              {stu.studentProfile.guardianName}
                            </span>
                          </div>
                        )}
                        {stu.studentProfile?.guardianPhone && (
                          <div>
                            <span className="text-slate-400 block text-[10px]">هاتف الولي:</span>
                            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                              {stu.studentProfile.guardianPhone}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Track Selector (فردي / مجموعة / تأسيس) */}
                      <div className="space-y-2 bg-emerald-50/60 dark:bg-emerald-950/20 p-3 rounded-2xl border border-emerald-500/30">
                        <label className="text-[11px] font-black text-emerald-800 dark:text-emerald-300 block">
                          تحديد مسار انضمام الطالب في الأكاديمية:
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            type="button"
                            onClick={() => setStudentTracks((prev) => ({ ...prev, [stu.id]: "INDIVIDUAL" }))}
                            className={`py-2 px-2 rounded-xl text-xs font-black border transition flex items-center justify-center gap-1 ${
                              currentTrack === "INDIVIDUAL"
                                ? "bg-amber-400 text-slate-950 border-amber-300 shadow-sm"
                                : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800"
                            }`}
                          >
                            <User className="w-3.5 h-3.5" />
                            <span>فردي (خاص)</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setStudentTracks((prev) => ({ ...prev, [stu.id]: "GROUP" }))}
                            className={`py-2 px-2 rounded-xl text-xs font-black border transition flex items-center justify-center gap-1 ${
                              currentTrack === "GROUP"
                                ? "bg-amber-400 text-slate-950 border-amber-300 shadow-sm"
                                : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800"
                            }`}
                          >
                            <Users className="w-3.5 h-3.5" />
                            <span>مجموعة</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setStudentTracks((prev) => ({ ...prev, [stu.id]: "FOUNDATION" }))}
                            className={`py-2 px-2 rounded-xl text-xs font-black border transition flex items-center justify-center gap-1 ${
                              currentTrack === "FOUNDATION"
                                ? "bg-amber-400 text-slate-950 border-amber-300 shadow-sm"
                                : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800"
                            }`}
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>تأسيس</span>
                          </button>
                        </div>

                        {halaqat.length > 0 && (
                          <div className="pt-1">
                            <select
                              value={currentHalaqa}
                              onChange={(e) => setStudentHalaqas((prev) => ({ ...prev, [stu.id]: e.target.value }))}
                              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:border-amber-400"
                            >
                              {halaqat.map((h: any) => (
                                <option key={h.id} value={h.id}>
                                  {`إلحاق بالحلقة: ${h.name} (${h.startTime || "16:00"})`}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>

                      {/* Reschedule Drawer */}
                      {isDrawerOpen && (
                        <div className="bg-amber-50 dark:bg-amber-950/30 p-3.5 rounded-2xl border border-amber-500/40 space-y-3">
                          <span className="text-xs font-black text-amber-900 dark:text-amber-300 block">
                            تحديد موعد وإرساله للطالب:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {suggestedTimes.map((t, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => setCustomTimes((prev) => ({ ...prev, [stu.id]: t }))}
                                className={`text-[11px] px-2.5 py-1 rounded-lg border font-bold transition ${
                                  customTimes[stu.id] === t
                                    ? "bg-amber-400 text-slate-950 border-amber-300"
                                    : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800"
                                }`}
                              >
                                {t}
                              </button>
                            ))}
                          </div>

                          <input
                            type="text"
                            placeholder="أو اكتب موعداً مخصصاً (مثال: غداً 4:30 م)..."
                            value={customTimes[stu.id] || ""}
                            onChange={(e) => setCustomTimes((prev) => ({ ...prev, [stu.id]: e.target.value }))}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                          />

                          <input
                            type="text"
                            placeholder="ملاحظة للطالب (اختياري)..."
                            value={comments[stu.id] || ""}
                            onChange={(e) => setComments((prev) => ({ ...prev, [stu.id]: e.target.value }))}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                          />

                          <button
                            type="button"
                            onClick={() => handleRescheduleRegistration(stu.id)}
                            disabled={isSubmitting}
                            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-xs shadow flex items-center justify-center gap-1.5"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>تأكيد وإرسال الموعد للطالب 📩</span>
                          </button>
                        </div>
                      )}

                      {/* UNIFIED ACTION BUTTONS */}
                      <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                        {/* Option 1: ACCEPT */}
                        <button
                          type="button"
                          onClick={() => handleApproveRegistration(stu)}
                          disabled={isSubmitting}
                          className="py-2.5 px-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white font-black text-xs shadow-md flex items-center justify-center gap-1.5 transition active:scale-95 disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>قبول وتفعيل ✅</span>
                        </button>

                        {/* Option 2: RESCHEDULE */}
                        <button
                          type="button"
                          onClick={() => setRescheduleDrawer((prev) => ({ ...prev, [stu.id]: !prev[stu.id] }))}
                          disabled={isSubmitting}
                          className={`py-2.5 px-2 rounded-2xl font-black text-xs border transition flex items-center justify-center gap-1.5 ${
                            isDrawerOpen
                              ? "bg-amber-400 text-slate-950 border-amber-300 shadow-sm"
                              : "bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 border-amber-400/40"
                          }`}
                        >
                          <Calendar className="w-4 h-4 text-amber-500" />
                          <span>تعليق بموعد 📅</span>
                        </button>

                        {/* Option 3: REJECT */}
                        <button
                          type="button"
                          onClick={() => handleRejectRegistration(stu.id)}
                          disabled={isSubmitting}
                          className="py-2.5 px-2 rounded-2xl bg-red-50 dark:bg-red-950/30 hover:bg-red-100 text-red-600 dark:text-red-300 border border-red-300 dark:border-red-900/50 font-black text-xs transition active:scale-95 flex items-center justify-center gap-1.5 disabled:opacity-50"
                        >
                          <XCircle className="w-4 h-4 text-red-500" />
                          <span>اعتذار / رفض ❌</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Halaqa & Session Join Requests */}
        {activeTab === "JOIN_REQUESTS" && (
          <div className="space-y-4">
            {pendingJoinRequests.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-3 shadow-sm">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h3 className="font-black text-sm text-slate-800 dark:text-slate-200">
                  لا توجد طلبات انضمام معلقة حالياً
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  كافة طلبات الانضمام للحلقات المباشرة تمت معالجتها والبت فيها.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {pendingJoinRequests.map((req) => {
                  const isDrawerOpen = rescheduleDrawer[req.id] || false;
                  const isSubmitting = submittingIds[req.id] || false;

                  return (
                    <div
                      key={req.id}
                      className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-emerald-500/50 p-5 shadow-md space-y-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              req.student?.user?.avatar ||
                              "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150"
                            }
                            alt={req.student?.user?.name}
                            className="w-12 h-12 rounded-2xl object-cover shadow-md"
                          />
                          <div>
                            <h3 className="font-black text-sm text-slate-900 dark:text-slate-100">
                              {req.student?.user?.name || "طالب العلم"}
                            </h3>
                            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold block mt-0.5">
                              طلب الانضمام إلى: {req.halaqa?.name}
                            </span>
                          </div>
                        </div>

                        <span className="text-[10px] font-mono text-slate-400">
                          {new Date(req.createdAt).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>

                      {req.notes && (
                        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl text-xs text-slate-600 dark:text-slate-300">
                          <span className="font-bold text-slate-800 dark:text-slate-200 block mb-0.5">ملاحظات الطالب:</span>
                          {req.notes}
                        </div>
                      )}

                      {/* Reschedule Drawer */}
                      {isDrawerOpen && (
                        <div className="bg-amber-50 dark:bg-amber-950/30 p-3.5 rounded-2xl border border-amber-500/40 space-y-3">
                          <span className="text-xs font-black text-amber-900 dark:text-amber-300 block">
                            اقتراح موعد بديل للحلقة:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {suggestedTimes.map((t, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => setCustomTimes((prev) => ({ ...prev, [req.id]: t }))}
                                className={`text-[11px] px-2.5 py-1 rounded-lg border font-bold transition ${
                                  customTimes[req.id] === t
                                    ? "bg-amber-400 text-slate-950 border-amber-300"
                                    : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800"
                                }`}
                              >
                                {t}
                              </button>
                            ))}
                          </div>

                          <input
                            type="text"
                            placeholder="موعد بديل مخصص..."
                            value={customTimes[req.id] || ""}
                            onChange={(e) => setCustomTimes((prev) => ({ ...prev, [req.id]: e.target.value }))}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                          />

                          <button
                            type="button"
                            onClick={() => handleRescheduleJoinRequest(req)}
                            disabled={isSubmitting}
                            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-xs shadow flex items-center justify-center gap-1.5"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>إرسال الموعد البديل للطالب 📩</span>
                          </button>
                        </div>
                      )}

                      {/* UNIFIED ACTION BUTTONS */}
                      <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                        <button
                          type="button"
                          onClick={() => handleAcceptJoinRequest(req)}
                          disabled={isSubmitting}
                          className="py-2.5 px-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white font-black text-xs shadow-md flex items-center justify-center gap-1.5 transition active:scale-95"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>قبول وتسكين ✅</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setRescheduleDrawer((prev) => ({ ...prev, [req.id]: !prev[req.id] }))}
                          disabled={isSubmitting}
                          className={`py-2.5 px-2 rounded-2xl font-black text-xs border transition flex items-center justify-center gap-1.5 ${
                            isDrawerOpen
                              ? "bg-amber-400 text-slate-950 border-amber-300 shadow-sm"
                              : "bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 border-amber-400/40"
                          }`}
                        >
                          <Calendar className="w-4 h-4 text-amber-500" />
                          <span>تعليق بموعد 📅</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRejectJoinRequest(req)}
                          disabled={isSubmitting}
                          className="py-2.5 px-2 rounded-2xl bg-red-50 dark:bg-red-950/30 hover:bg-red-100 text-red-600 dark:text-red-300 border border-red-300 dark:border-red-900/50 font-black text-xs transition active:scale-95 flex items-center justify-center gap-1.5"
                        >
                          <XCircle className="w-4 h-4 text-red-500" />
                          <span>اعتذار / رفض ❌</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Archive / History */}
        {activeTab === "ARCHIVE" && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="font-black text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Archive className="w-4 h-4 text-slate-500" />
                  سجل القرارات السابقة (المقبولة والمرفوضة)
                </span>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {/* Processed Join Requests */}
                {processedJoinRequests.map((r) => (
                  <div key={r.id} className="p-4 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-xs text-slate-900 dark:text-slate-100 block">
                        {r.student?.user?.name}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        الحلقة: {r.halaqa?.name}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-3 py-1 rounded-full ${
                        r.status === "ACCEPTED"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
                          : "bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300"
                      }`}
                    >
                      {r.status === "ACCEPTED" ? "تم القبول والتسكين ✅" : "تم الاعتذار ❌"}
                    </span>
                  </div>
                ))}

                {/* Rejected Registrations */}
                {rejectedRegistrations.map((stu) => (
                  <div key={stu.id} className="p-4 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-xs text-slate-900 dark:text-slate-100 block">
                        {stu.name}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        تسجيل حساب جديد • {stu.email}
                      </span>
                    </div>

                    <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300">
                      تم الاعتذار عن التسجيل ❌
                    </span>
                  </div>
                ))}

                {processedJoinRequests.length === 0 && rejectedRegistrations.length === 0 && (
                  <div className="p-8 text-center text-xs text-slate-400">
                    لا توجد سجلات سابقة بعد
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
