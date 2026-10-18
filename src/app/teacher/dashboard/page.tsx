"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth, useRealtime } from "@/components/providers/AppProviders";
import {
  Users,
  CalendarDays,
  Award,
  Video,
  FileCheck2,
  CheckCircle2,
  Clock,
  Plus,
  Play,
  ArrowUpRight,
  TrendingUp,
  Sparkles,
  Shield,
  ShieldCheck,
  UserPlus,
} from "lucide-react";
import { ScheduleBoardWidget } from "@/components/schedule/ScheduleBoardWidget";


export default function TeacherDashboard() {
  const { user } = useAuth();
  const { lastEvent } = useRealtime();
  const [halaqat, setHalaqat] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [joinRequests, setJoinRequests] = useState<any[]>([]);
  const [pendingRegistrations, setPendingRegistrations] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [startingSession, setStartingSession] = useState(false);
  const [selectedHalaqaId, setSelectedHalaqaId] = useState("");
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [showAddHalaqaModal, setShowAddHalaqaModal] = useState(false);
  const [newHalaqaName, setNewHalaqaName] = useState("");
  const [newHalaqaLevel, setNewHalaqaLevel] = useState("متوسط");
  const [newHalaqaDays, setNewHalaqaDays] = useState("السبت, الإثنين, الأربعاء");
  const [newHalaqaStartTime, setNewHalaqaStartTime] = useState("16:00");
  const [newHalaqaEndTime, setNewHalaqaEndTime] = useState("17:30");
  const [creatingHalaqa, setCreatingHalaqa] = useState(false);

  const handleCreateNewHalaqa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHalaqaName.trim()) {
      alert("يرجى إدخال اسم ومسمى الحلقة");
      return;
    }
    setCreatingHalaqa(true);
    try {
      const res = await fetch("/api/teacher/halaqat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newHalaqaName.trim(),
          level: newHalaqaLevel,
          scheduleDays: newHalaqaDays,
          startTime: newHalaqaStartTime,
          endTime: newHalaqaEndTime,
        }),
      });

      if (res.ok) {
        setShowAddHalaqaModal(false);
        setNewHalaqaName("");
        alert("تم إنشاء الحلقة القرآنية وإضافتها بنجاح!");
        fetchData();
      } else {
        const d = await res.json();
        alert(d.error || "فشل إنشاء الحلقة");
      }
    } catch {
      alert("حدث خطأ أثناء حفظ بيانات الحلقة");
    } finally {
      setCreatingHalaqa(false);
    }
  };

  const fetchData = async () => {
    try {
      const [resH, resS, resA] = await Promise.all([
        fetch("/api/teacher/halaqat"),
        fetch("/api/teacher/students"),
        fetch("/api/assignments"),
      ]);

      if (resH.ok) {
        const d = await resH.json();
        setHalaqat(d.halaqat || []);
        if (d.halaqat?.[0]) setSelectedHalaqaId(d.halaqat[0].id);
      }
      if (resS.ok) {
        const d = await resS.json();
        setStudents(d.students || []);
        setJoinRequests(d.joinRequests?.filter((r: any) => r.status === "PENDING") || []);
        setPendingRegistrations(d.pendingRegistrations || []);
      }
      if (resA.ok) {
        const d = await resA.json();
        setAssignments(d.assignments || []);
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

  useEffect(() => {
    if (
      lastEvent?.type === "STUDENT_REGISTRATION_SUBMITTED" ||
      lastEvent?.type === "STUDENT_REGISTRATION_APPROVED" ||
      lastEvent?.type === "SESSION_JOIN_REQUESTED" ||
      lastEvent?.type === "JOIN_REQUEST_SUBMITTED"
    ) {
      fetchData();
    }
  }, [lastEvent]);

  const handleApproveRegistration = async (studentUserId: string) => {
    try {
      const res = await fetch("/api/teacher/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "APPROVE_STUDENT_REGISTRATION",
          studentUserId,
        }),
      });
      if (res.ok) {
        fetchData();
      } else {
        alert("فشل تفعيل الحساب");
      }
    } catch {
      alert("حدث خطأ أثناء تفعيل الحساب");
    }
  };

  const handleStartSessionNow = async () => {
    const targetHalaqaId = selectedHalaqaId || halaqat[0]?.id || "auto";
    setStartingSession(true);
    try {
      const res = await fetch("/api/live/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          halaqaId: targetHalaqaId,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        window.location.href = `/classroom/${data.session.id}?role=teacher`;
      } else {
        alert("فشل إنشاء الجلسة، تأكد من صحة البيانات");
      }
    } catch (e) {
      console.error(e);
      alert("حدث خطأ أثناء إنشاء الجلسة");
    } finally {
      setStartingSession(false);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      const res = await fetch("/api/teacher/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ACCEPT_REQUEST",
          requestId,
        }),
      });
      if (res.ok) {
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const totalStudentsCount = students.length;
  const activeHalaqatCount = halaqat.filter((h) => h.status === "ACTIVE").length;

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Welcome & Fast Action Bar */}
        <div className="bg-gradient-to-r from-islamic-800 via-islamic-900 to-emerald-950 text-white p-6 sm:p-8 rounded-3xl shadow-xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="relative z-10">
            <span className="text-amber-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              {user?.role === "ADMIN" ? "لوحة الإشراف الإداري والتعليم المدمج" : "لوحة تحكم المعلم والمقرئ"}
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              أهلاً وسهلاً، {user?.name || (user?.role === "ADMIN" ? "مدير المنصة" : "فضيلة الشيخ")}
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-xl leading-relaxed">
              {user?.role === "ADMIN"
                ? "بصفتك مديراً للنظام، تمتلك كامل صلاحيات الإشراف، التعديل والحذف، وبدء الحلقات والتحكم بالمعلمين والطلاب."
                : "تحكم كامل في الحلقات اليومية، واجتماعات الفيديو المباشرة، والمصحف التفاعلي بوضع التسميع المغلق."}
            </p>
          </div>

          <div className="relative z-10 flex flex-wrap items-center gap-3">
            {user?.role === "ADMIN" && (
              <Link
                href="/admin/dashboard"
                className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-4 py-3 rounded-2xl shadow-lg transition text-sm"
              >
                <ShieldCheck className="w-4 h-4" />
                لوحة الصلاحيات والإدارة
              </Link>
            )}
            <button
              onClick={handleStartSessionNow}
              disabled={startingSession}
              className="flex items-center gap-2 bg-gradient-to-r from-amber-400 to-gold-accent hover:from-amber-300 text-slate-950 font-black px-5 py-3 rounded-2xl shadow-lg transition-transform hover:scale-105 active:scale-95 text-sm disabled:opacity-50 cursor-pointer"
            >
              <Video className="w-5 h-5" />
              <span>{startingSession ? "جارٍ بدء الجلسة..." : "إنشاء جلسة الآن"}</span>
            </button>

            <button
              onClick={() => setShowAddHalaqaModal(true)}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-3 rounded-2xl shadow-lg transition-transform hover:scale-105 active:scale-95 text-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة حلقة جديدة</span>
            </button>

            <Link
              href="/teacher/mushaf"
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold px-4 py-3 rounded-2xl border border-white/20 text-sm transition"
            >
              المصحف والتسميع
            </Link>
          </div>
        </div>

        {/* Admin Supervisor Elevated Banner */}
        {user?.role === "ADMIN" && (
          <div className="bg-amber-500/10 border-2 border-amber-500/40 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shrink-0">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-slate-900 dark:text-slate-100 block text-sm">
                  وضع التحكم والإشراف الإداري الشامل مفعل
                </span>
                <span className="text-slate-600 dark:text-slate-300">
                  يمكنك إدارة أي حلقة، تعيين أو تعديل المعلمين، وبدء الجلسات المباشرة، وحذف وتعديل المواعيد، وتخصيص صلاحيات الطلاب.
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link
                href="/admin/dashboard?tab=USERS"
                className="px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 text-white font-bold text-xs hover:bg-slate-800 transition"
              >
                تعديل الصلاحيات
              </Link>
              <Link
                href="/teacher/halaqat"
                className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition"
              >
                إدارة الحلقات الشاملة
              </Link>
            </div>
          </div>
        )}

        {/* Modal: Create New Halaqa */}
        {showAddHalaqaModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <CalendarDays className="w-5 h-5 text-emerald-600" />
                    إضافة حلقة ومسمى قرآني جديد
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    قم بإدخال بيانات ومسمى الحلقة ومواعيد انعقادها الأسبوعية.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddHalaqaModal(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-xl text-base font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateNewHalaqa} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    اسم ومسمى الحلقة: <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: حلقة الفجر والتحفيظ والتجويد، حلقة النور لتثبيت القرآن..."
                    value={newHalaqaName}
                    onChange={(e) => setNewHalaqaName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      المستوى القرآني:
                    </label>
                    <select
                      value={newHalaqaLevel}
                      onChange={(e) => setNewHalaqaLevel(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 font-bold"
                    >
                      <option value="مبتدئ">مبتدئ (تلقين وتصحيح تلاوة)</option>
                      <option value="متوسط">متوسط (حفظ وتجويد)</option>
                      <option value="متقدم">متقدم (تثبيت ومراجعة خاتمين)</option>
                      <option value="إجازات">إجازات وقراءات</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      أيام الانعقاد:
                    </label>
                    <input
                      type="text"
                      value={newHalaqaDays}
                      onChange={(e) => setNewHalaqaDays(e.target.value)}
                      placeholder="السبت, الإثنين, الأربعاء"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      وقت البداية:
                    </label>
                    <input
                      type="time"
                      value={newHalaqaStartTime}
                      onChange={(e) => setNewHalaqaStartTime(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      وقت النهاية:
                    </label>
                    <input
                      type="time"
                      value={newHalaqaEndTime}
                      onChange={(e) => setNewHalaqaEndTime(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowAddHalaqaModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={creatingHalaqa}
                    className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black px-5 py-2.5 rounded-xl text-xs shadow-lg transition active:scale-95 disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{creatingHalaqa ? "جارٍ الحفظ..." : "حفظ وإنشاء الحلقة"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Start Session Now */}
        {showSessionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 mb-2">
                بدء جلسة حلقة مباشرة الآن
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                اختر الحلقة لتوليد غرفة فيديو فورية وإرسال إشعار لحظي للطلاب المسجلين.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    اختر الحلقة:
                  </label>
                  <select
                    value={selectedHalaqaId || halaqat[0]?.id || "auto"}
                    onChange={(e) => setSelectedHalaqaId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-slate-100"
                  >
                    {halaqat.length === 0 ? (
                      <option value="auto">حلقة الفجر والتحفيظ والتجويد (افتراضية فورية)</option>
                    ) : (
                      halaqat.map((h) => (
                        <option key={h.id} value={h.id}>
                          {h.name} ({h.level} - {h.scheduleDays})
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    onClick={() => setShowSessionModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={handleStartSessionNow}
                    disabled={startingSession}
                    className="flex items-center gap-1.5 bg-islamic-800 hover:bg-islamic-700 text-white font-bold px-5 py-2 rounded-xl text-xs shadow"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    {startingSession ? "جارٍ الإنشاء..." : "دخول الغرفة وبث الإشعار"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">الطلاب المسجلين</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <span className="text-2xl font-black text-slate-900 dark:text-slate-100">{totalStudentsCount}</span>
            <span className="text-[11px] text-emerald-600 font-semibold block mt-1">نشطون في الحلقات</span>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">الحلقات النشطة</span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center">
                <CalendarDays className="w-4 h-4" />
              </div>
            </div>
            <span className="text-2xl font-black text-slate-900 dark:text-slate-100">{activeHalaqatCount}</span>
            <span className="text-[11px] text-slate-500 block mt-1">مواعيد أسبوعية مجدولة</span>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">طلبات الانضمام</span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <span className="text-2xl font-black text-slate-900 dark:text-slate-100">{joinRequests.length}</span>
            <span className="text-[11px] text-blue-600 font-semibold block mt-1">
              {joinRequests.length > 0 ? "بانتظار موافقتك" : "تمت معالجة الكل"}
            </span>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">نسبة الالتزام</span>
              <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <span className="text-2xl font-black text-slate-900 dark:text-slate-100">٩٥%</span>
            <span className="text-[11px] text-emerald-600 font-semibold block mt-1">معدل حضور مرتفع</span>
          </div>
        </div>

        {/* Pending New Student Registrations Alert (Requires Sheikh Approval) */}
        {pendingRegistrations.length > 0 && (
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/30 border-2 border-emerald-500/60 rounded-3xl p-4 sm:p-5 shadow-md">
            <div className="flex items-center justify-between mb-3">
              <span className="font-black text-xs sm:text-sm text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-600 animate-pulse" />
                طلبات تسجيل طلاب جدد على المنصة بحاجة لاعتمادك ({pendingRegistrations.length})
              </span>
              <Link
                href="/teacher/requests"
                className="text-xs font-black text-emerald-700 dark:text-emerald-300 hover:underline flex items-center gap-1"
              >
                <span>الانتقال إلى إدارة الطلبات والاعتمادات ←</span>
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {pendingRegistrations.map((stu) => (
                <div
                  key={stu.id}
                  className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl flex items-center justify-between border border-emerald-200 dark:border-slate-800 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold">
                      {stu.name?.[0] || "ط"}
                    </div>
                    <div>
                      <span className="block text-xs font-black text-slate-900 dark:text-slate-100">
                        {stu.name}
                      </span>
                      <span className="block text-[11px] text-slate-500 font-mono">
                        {stu.phone || stu.email}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleApproveRegistration(stu.id)}
                      className="flex items-center gap-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white font-black text-xs px-3.5 py-2 rounded-xl shadow transition active:scale-95"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>اعتماد وتفعيل ✅</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pending Requests Alert if any */}
        {joinRequests.length > 0 && (
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-xs text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-amber-600" />
                طلبات انضمام جديدة بحاجة لمراجعة ({joinRequests.length})
              </span>
              <Link
                href="/teacher/students?tab=requests"
                className="text-xs font-bold text-amber-800 dark:text-amber-300 hover:underline"
              >
                عرض الكل
              </Link>
            </div>
            <div className="space-y-2">
              {joinRequests.slice(0, 2).map((req) => (
                <div
                  key={req.id}
                  className="bg-white dark:bg-slate-900 p-3 rounded-xl flex items-center justify-between border border-amber-200/60 dark:border-slate-800"
                >
                  <div className="flex items-center gap-2.5">
                    <img
                      src={
                        req.student?.user?.avatar ||
                        "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=150"
                      }
                      alt={req.student?.user?.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <div>
                      <span className="block text-xs font-bold text-slate-900 dark:text-slate-100">
                        {req.student?.user?.name}
                      </span>
                      <span className="block text-[10px] text-slate-500">
                        طلب الانضمام إلى: {req.halaqa?.name}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleAcceptRequest(req.id)}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3 py-1 rounded-lg transition"
                    >
                      قبول
                    </button>
                    <Link
                      href="/teacher/students?tab=requests"
                      className="text-xs text-slate-600 dark:text-slate-400 hover:underline px-2"
                    >
                      تفاصيل
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sheikh Controlled Appointments & Schedule Board */}
        <ScheduleBoardWidget
          isTeacher={true}
          onStartSession={(id) => {
            setSelectedHalaqaId(id);
            handleStartSessionNow();
          }}
        />

        {/* Assignments to Review */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-amber-500" />
                التكليفات والواجبات الأخيرة
              </h2>
              <Link
                href="/teacher/assignments"
                className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-0.5"
              >
                إنشاء وتصحيح
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {assignments.slice(0, 3).map((a) => (
                <div
                  key={a.id}
                  className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between"
                >
                  <div>
                    <h3 className="font-bold text-xs text-slate-900 dark:text-slate-100">
                      {a.title}
                    </h3>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      {a.halaqa?.name} • تسليم حتى {new Date(a.dueDate).toLocaleDateString("ar-SA")}
                    </span>
                  </div>

                  <Link
                    href="/teacher/assignments"
                    className="text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-emerald-600 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700"
                  >
                    عرض التسليمات ({a.submissions?.length || 0})
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
    </AppShell>
  );
}
