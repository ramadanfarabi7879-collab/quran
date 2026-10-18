"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRealtime } from "@/components/providers/AppProviders";
import { playScheduleAlertSound } from "@/lib/sound";
import {
  Calendar,
  Clock,
  Plus,
  Edit3,
  Trash2,
  Bell,
  Volume2,
  CheckCircle2,
  AlertCircle,
  X,
  Radio,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Users,
  Video,
} from "lucide-react";

export interface ScheduleHalaqa {
  id: string;
  name: string;
  description?: string | null;
  level: string;
  scheduleDays: string;
  startTime: string;
  endTime: string;
  capacity?: number;
  status: string;
  teacher?: {
    user?: {
      name: string;
      avatar?: string | null;
    };
  };
  enrollments?: any[];
  liveSessions?: any[];
}

interface ScheduleBoardWidgetProps {
  isTeacher?: boolean;
  onStartSession?: (halaqaId: string) => void;
  className?: string;
}

const AVAILABLE_DAYS = [
  "السبت",
  "الأحد",
  "الإثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
];

const AVAILABLE_LEVELS = [
  "مبتدئ",
  "متوسط",
  "متقدم",
  "حفظ وتثبيت",
  "إجازة وقراءات",
];

const AVAILABLE_STATUSES = [
  { value: "ACTIVE", label: "نشط ومجدول" },
  { value: "UPCOMING", label: "قريب الانعقاد" },
  { value: "PAUSED", label: "مؤجل مؤقتاً" },
  { value: "COMPLETED", label: "مكتمل" },
];

export function ScheduleBoardWidget({
  isTeacher = false,
  onStartSession,
  className = "",
}: ScheduleBoardWidgetProps) {
  const { lastEvent } = useRealtime();

  const [halaqat, setHalaqat] = useState<ScheduleHalaqa[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(true);

  // Edit / Add Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"ADD" | "EDIT">("ADD");
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form Fields
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formSelectedDays, setFormSelectedDays] = useState<string[]>([
    "السبت",
    "الإثنين",
    "الأربعاء",
  ]);
  const [formStartTime, setFormStartTime] = useState("16:00");
  const [formEndTime, setFormEndTime] = useState("17:30");
  const [formLevel, setFormLevel] = useState("متوسط");
  const [formCapacity, setFormCapacity] = useState(20);
  const [formStatus, setFormStatus] = useState("ACTIVE");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Realtime Live Toast Alert
  const [alertToast, setAlertToast] = useState<{
    visible: boolean;
    title: string;
    message: string;
    time: string;
  } | null>(null);

  // Fetch appointments schedule from API
  const fetchSchedule = async () => {
    try {
      const res = await fetch("/api/teacher/halaqat");
      if (res.ok) {
        const data = await res.json();
        setHalaqat(data.halaqat || []);
      }
    } catch (err) {
      console.error("Failed to fetch halaqat schedule:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, []);

  // Listen to realtime schedule update events
  useEffect(() => {
    if (lastEvent && lastEvent.type === "SCHEDULE_UPDATED") {
      const payload = lastEvent.payload;

      // 1. Refresh schedule list immediately
      fetchSchedule();

      // 2. Play audible chime alert
      playScheduleAlertSound();

      // 3. Show prominent toast notification banner
      const nowTime = new Date().toLocaleTimeString("ar-EG", {
        hour: "2-digit",
        minute: "2-digit",
      });

      let alertTitle = "🔔 تحديث في جدول المواعيد";
      if (payload?.action === "CREATED") {
        alertTitle = "✨ موعد حلقة جديد تمت إضافته";
      } else if (payload?.action === "DELETED") {
        alertTitle = "⚠️ تم إلغاء موعد حلقة";
      }

      setAlertToast({
        visible: true,
        title: alertTitle,
        message: payload?.message || "قام فضيلة الشيخ بتحديث جدول الحلقات والمواعيد.",
        time: nowTime,
      });

      // Auto dismiss after 8 seconds
      const timer = setTimeout(() => {
        setAlertToast(null);
      }, 8000);

      return () => clearTimeout(timer);
    }
  }, [lastEvent]);

  // Open modal for adding
  const handleOpenAdd = () => {
    setModalMode("ADD");
    setEditingId(null);
    setFormName("");
    setFormDescription("");
    setFormSelectedDays(["السبت", "الإثنين", "الأربعاء"]);
    setFormStartTime("16:00");
    setFormEndTime("17:30");
    setFormLevel("متوسط");
    setFormCapacity(20);
    setFormStatus("ACTIVE");
    setFormError("");
    setIsModalOpen(true);
  };

  // Open modal for editing
  const handleOpenEdit = (h: ScheduleHalaqa) => {
    setModalMode("EDIT");
    setEditingId(h.id);
    setFormName(h.name);
    setFormDescription(h.description || "");

    const days = h.scheduleDays
      ? h.scheduleDays.split(",").map((d) => d.trim())
      : ["السبت"];
    setFormSelectedDays(days);

    setFormStartTime(h.startTime || "16:00");
    setFormEndTime(h.endTime || "17:30");
    setFormLevel(h.level || "متوسط");
    setFormCapacity(h.capacity || 20);
    setFormStatus(h.status || "ACTIVE");
    setFormError("");
    setIsModalOpen(true);
  };

  // Toggle day selection
  const handleToggleDay = (day: string) => {
    if (formSelectedDays.includes(day)) {
      if (formSelectedDays.length > 1) {
        setFormSelectedDays(formSelectedDays.filter((d) => d !== day));
      }
    } else {
      setFormSelectedDays([...formSelectedDays, day]);
    }
  };

  // Submit add or edit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError("يرجى كتابة اسم الحلقة أو الموعد");
      return;
    }
    if (formSelectedDays.length === 0) {
      setFormError("يرجى تحديد يوم واحد على الأقل للموعد");
      return;
    }

    setSubmitting(true);
    setFormError("");

    try {
      const payload = {
        id: editingId,
        name: formName.trim(),
        description: formDescription.trim(),
        scheduleDays: formSelectedDays.join(", "),
        startTime: formStartTime,
        endTime: formEndTime,
        level: formLevel,
        capacity: Number(formCapacity),
        status: formStatus,
      };

      const res = await fetch("/api/teacher/halaqat", {
        method: modalMode === "ADD" ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "فشل حفظ الموعد");
      }

      setIsModalOpen(false);
      await fetchSchedule();
    } catch (err: any) {
      setFormError(err.message || "حدث خطأ أثناء حفظ الموعد");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete appointment
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`هل أنت متأكد من حذف موعد حلقة "${name}"؟`)) {
      return;
    }

    try {
      const res = await fetch(`/api/teacher/halaqat?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errData = await res.json();
        alert(errData.error || "فشل حذف الموعد");
        return;
      }

      await fetchSchedule();
    } catch (err) {
      console.error("Delete error:", err);
      alert("حدث خطأ أثناء حذف الموعد");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            نشط ومجدول
          </span>
        );
      case "UPCOMING":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-700">
            <Clock className="w-2.5 h-2.5" />
            قريباً
          </span>
        );
      case "PAUSED":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
            مؤجل
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            {status}
          </span>
        );
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Realtime Floating Notification Alert Banner */}
      {alertToast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-lg animate-in slide-in-from-top-4 duration-300">
          <div className="bg-gradient-to-r from-islamic-900 via-slate-900 to-islamic-950 text-white p-4 rounded-2xl shadow-2xl border-2 border-gold-accent/70 flex items-start gap-3 backdrop-blur-md">
            <div className="w-10 h-10 rounded-xl bg-gold-accent/20 flex items-center justify-center shrink-0 text-gold-accent">
              <Bell className="w-5 h-5 animate-bounce" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="font-black text-sm text-gold-accent flex items-center gap-1.5">
                  {alertToast.title}
                </h4>
                <span className="text-[10px] text-slate-400">{alertToast.time}</span>
              </div>
              <p className="text-xs text-slate-200 mt-1 leading-relaxed">
                {alertToast.message}
              </p>
            </div>
            <button
              onClick={() => setAlertToast(null)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
              title="إغلاق التنبيه"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Schedule Board Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-all">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-l from-emerald-50/50 dark:from-emerald-950/20 via-transparent to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-sm text-slate-900 dark:text-slate-100">
                  لوحة المواعيد وجدول الحلقات
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300">
                  {halaqat.length} مواعيد
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                محدثة ومربوطة لحظياً بالتنبيهات
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Test Alert Sound */}
            <button
              onClick={() => playScheduleAlertSound()}
              title="تجربة صوت تنبيه المواعيد"
              className="p-2 rounded-xl text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <Volume2 className="w-4 h-4" />
            </button>

            {/* Teacher Control: Add Appointment */}
            {isTeacher && (
              <button
                onClick={handleOpenAdd}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-sm transition active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة موعد</span>
              </button>
            )}

            {/* Collapse / Expand */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title={isExpanded ? "طي الجدول" : "توسيع الجدول"}
            >
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Content Body */}
        {isExpanded && (
          <div className="p-4 sm:p-5 space-y-3">
            {loading ? (
              <div className="py-8 text-center text-xs text-slate-400">
                جارٍ تحميل جدول المواعيد...
              </div>
            ) : halaqat.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                لا توجد مواعيد مجدولة حالياً.
                {isTeacher && " اضغط على زر 'إضافة موعد' لجدولة أول موعد."}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {halaqat.map((h) => (
                  <div
                    key={h.id}
                    className="p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-800/40 hover:border-emerald-500/40 dark:hover:border-emerald-500/40 transition group relative flex flex-col justify-between"
                  >
                    <div>
                      {/* Top: Name & Badges */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                            {h.name}
                          </h4>
                          {h.teacher?.user?.name && (
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                              فضيلة الشيخ: {h.teacher.user.name}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {getStatusBadge(h.status)}
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                            {h.level}
                          </span>
                        </div>
                      </div>

                      {/* Middle: Days and Times */}
                      <div className="space-y-1.5 my-2">
                        <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                          <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span className="font-semibold">{h.scheduleDays}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                          <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span className="font-mono text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                            {h.startTime} - {h.endTime}
                          </span>
                        </div>
                      </div>

                      {/* Description if any */}
                      {h.description && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-1">
                          {h.description}
                        </p>
                      )}
                    </div>

                    {/* Bottom Actions */}
                    <div className="pt-3 mt-2 border-t border-slate-200/50 dark:border-slate-800 flex items-center justify-between">
                      <div className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        <span>{h.enrollments?.length || 0} طلاب مسجلين</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {isTeacher ? (
                          <>
                            {/* Launch Session */}
                            {onStartSession && (
                              <button
                                onClick={() => onStartSession(h.id)}
                                title="بدء الجلسة الآن"
                                className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold px-2 flex items-center gap-1 transition"
                              >
                                <Video className="w-3 h-3" />
                                <span>بدء</span>
                              </button>
                            )}

                            {/* Edit Button */}
                            <button
                              onClick={() => handleOpenEdit(h)}
                              title="تعديل الموعد"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-white dark:hover:bg-slate-700 transition"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete Button */}
                            <button
                              onClick={() => handleDelete(h.id, h.name)}
                              title="حذف الموعد"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-white dark:hover:bg-slate-700 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            متاح للحضور
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sheikh Add / Edit Appointment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-600/10 text-emerald-600 flex items-center justify-center">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900 dark:text-slate-100">
                    {modalMode === "ADD" ? "إضافة موعد حلقة جديد" : "تعديل موعد الحلقة"}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    يتم تحديث المواعيد فورياً لدى جميع الطلاب مع إطلاق نغمة تنبيه
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-200/50 dark:hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Title / Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  اسم الحلقة أو الموعد <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="مثال: حلقة الفجر لتثبيت حفظ جزء عم"
                  required
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-slate-100"
                />
              </div>

              {/* Days Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  أيام الانعقاد <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {AVAILABLE_DAYS.map((day) => {
                    const isSelected = formSelectedDays.includes(day);
                    return (
                      <button
                        type="button"
                        key={day}
                        onClick={() => handleToggleDay(day)}
                        className={`text-xs px-3 py-1.5 rounded-xl font-bold border transition ${
                          isSelected
                            ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-400"
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Start & End Times */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    وقت البدء
                  </label>
                  <input
                    type="time"
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                    required
                    className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    وقت الانتهاء
                  </label>
                  <input
                    type="time"
                    value={formEndTime}
                    onChange={(e) => setFormEndTime(e.target.value)}
                    required
                    className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              {/* Level & Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    المستوى
                  </label>
                  <select
                    value={formLevel}
                    onChange={(e) => setFormLevel(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-slate-100"
                  >
                    {AVAILABLE_LEVELS.map((lvl) => (
                      <option key={lvl} value={lvl}>
                        {lvl}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    حالة الموعد
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-slate-100"
                  >
                    {AVAILABLE_STATUSES.map((st) => (
                      <option key={st.value} value={st.value}>
                        {st.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description / Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  ملاحظات أو توجيهات للطلاب (اختياري)
                </label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="مثال: يرجى تحضير ربع الحزب الأول قبل الموعد"
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-slate-100 resize-none"
                />
              </div>

              {/* Form Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="text-xs font-bold px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="text-xs font-bold px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white shadow-md transition active:scale-95 flex items-center gap-2"
                >
                  {submitting ? (
                    "جارٍ الحفظ..."
                  ) : modalMode === "ADD" ? (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>إضافة الموعد وبث التنبيه</span>
                    </>
                  ) : (
                    <>
                      <Edit3 className="w-4 h-4" />
                      <span>حفظ التعديل وإشعار الطلاب</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
