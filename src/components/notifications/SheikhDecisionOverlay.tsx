"use client";

import React, { useState, useEffect } from "react";
import { useAuth, useRealtime } from "@/components/providers/AppProviders";
import { playTeacherJoinAlertSound, playChimePing } from "@/lib/sound";
import {
  Bell,
  UserCheck,
  UserPlus,
  Clock,
  X,
  Calendar,
  Sparkles,
  Users,
  User,
  BookOpen,
  CheckCircle2,
  XCircle,
  Send,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface DecisionItem {
  id: string;
  type: "REGISTRATION" | "SESSION_JOIN";
  studentId?: string;
  studentUserId?: string;
  studentName: string;
  studentAvatar?: string;
  phone?: string;
  time?: string;
  sessionId?: string;
  halaqaId?: string;
  halaqaName?: string;
  notes?: string;
  requestId?: string;
}

export function SheikhDecisionOverlay() {
  const { user } = useAuth();
  const { lastEvent } = useRealtime();

  const isTeacherOrAdmin = user?.role === "TEACHER" || user?.role === "ADMIN";

  const [queue, setQueue] = useState<DecisionItem[]>([]);
  const [activeItem, setActiveItem] = useState<DecisionItem | null>(null);

  // Form states inside active card
  const [selectedTrack, setSelectedTrack] = useState<"INDIVIDUAL" | "GROUP" | "FOUNDATION">("GROUP");
  const [selectedHalaqaId, setSelectedHalaqaId] = useState<string>("");
  const [availableHalaqat, setAvailableHalaqat] = useState<any[]>([]);
  const [showRescheduleDrawer, setShowRescheduleDrawer] = useState(false);
  const [customTime, setCustomTime] = useState("");
  const [teacherComment, setTeacherComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actionDoneMsg, setActionDoneMsg] = useState<string | null>(null);

  // Helper: Persist handled/dismissed requests in sessionStorage so they NEVER reappear as popups
  const markHandled = (item?: DecisionItem | null) => {
    if (!item) return;
    try {
      const raw = sessionStorage.getItem("sheikh_handled_requests") || "[]";
      const list: string[] = JSON.parse(raw);
      const keys = [item.id, item.studentUserId, item.studentId, item.requestId].filter(Boolean) as string[];
      keys.forEach((k) => {
        if (!list.includes(k)) list.push(k);
      });
      sessionStorage.setItem("sheikh_handled_requests", JSON.stringify(list));
    } catch {}
  };

  const isItemHandled = (key?: string | null) => {
    if (!key) return false;
    try {
      const raw = sessionStorage.getItem("sheikh_handled_requests") || "[]";
      const list: string[] = JSON.parse(raw);
      return list.includes(key);
    } catch {
      return false;
    }
  };

  // 1. Load existing halaqat schedules for suggestions
  useEffect(() => {
    if (!isTeacherOrAdmin) return;
    const fetchHalaqat = async () => {
      try {
        const res = await fetch("/api/teacher/halaqat");
        if (res.ok) {
          const d = await res.json();
          setAvailableHalaqat(d.halaqat || []);
          if (d.halaqat?.length > 0) {
            setSelectedHalaqaId(d.halaqat[0].id);
          }
        }
      } catch {}
    };
    fetchHalaqat();
  }, [isTeacherOrAdmin]);

  // 2. Load pending registrations & join requests on mount & periodically
  useEffect(() => {
    if (!isTeacherOrAdmin) return;

    let isMounted = true;
    const syncPendingRequests = async () => {
      try {
        const res = await fetch("/api/teacher/students");
        if (!res.ok || !isMounted) return;
        const data = await res.json();

        const pendingItems: DecisionItem[] = [];

        // A. Pending New Student Registrations (isActive: false, not handled)
        if (data.pendingRegistrations && Array.isArray(data.pendingRegistrations)) {
          data.pendingRegistrations.forEach((u: any) => {
            if (isItemHandled(u.id)) return;
            pendingItems.push({
              id: `reg-${u.id}`,
              type: "REGISTRATION",
              studentUserId: u.id,
              studentName: u.name || "طالب جديد",
              phone: u.phone || u.studentProfile?.guardianPhone || "",
              time: u.createdAt
                ? new Date(u.createdAt).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })
                : new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }),
              notes: u.studentProfile?.guardianName ? `ولي الأمر: ${u.studentProfile.guardianName}` : undefined,
            });
          });
        }

        // B. Pending Session/Halaqa Join Requests
        if (data.joinRequests && Array.isArray(data.joinRequests)) {
          data.joinRequests
            .filter((r: any) => r.status === "PENDING" && !isItemHandled(r.id) && !isItemHandled(r.studentId))
            .forEach((r: any) => {
              pendingItems.push({
                id: `join-${r.id}`,
                type: "SESSION_JOIN",
                requestId: r.id,
                studentId: r.studentId,
                studentUserId: r.student?.user?.id,
                studentName: r.student?.user?.name || "طالب العلم",
                studentAvatar: r.student?.user?.avatar,
                phone: r.student?.user?.phone,
                time: r.createdAt
                  ? new Date(r.createdAt).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })
                  : new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }),
                halaqaId: r.halaqaId,
                halaqaName: r.halaqa?.name || "الحلقة القرآنية",
                notes: r.notes,
              });
            });
        }

        if (isMounted && pendingItems.length > 0) {
          setQueue((prev) => {
            const existingKeys = new Set(prev.map((i) => i.studentUserId || i.studentId || i.id));
            const freshItems = pendingItems.filter(
              (i) =>
                !existingKeys.has(i.studentUserId || i.studentId || i.id) &&
                !isItemHandled(i.studentUserId) &&
                !isItemHandled(i.studentId) &&
                !isItemHandled(i.id)
            );
            return freshItems.length > 0 ? [...prev, ...freshItems] : prev;
          });
        }
      } catch {}
    };

    syncPendingRequests();
    const timer = setInterval(syncPendingRequests, 6000);
    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, [isTeacherOrAdmin]);

  // 3. Realtime notification listeners (Instant reactive wakeup)
  useEffect(() => {
    if (!isTeacherOrAdmin || !lastEvent) return;

    // 1. New student registration
    if (lastEvent.type === "STUDENT_REGISTRATION_SUBMITTED") {
      const p = lastEvent.payload;
      const targetUserId = p.studentUserId || p.studentId;
      if (isItemHandled(targetUserId)) return;

      playTeacherJoinAlertSound();
      const newItem: DecisionItem = {
        id: `reg-${targetUserId}-${Date.now()}`,
        type: "REGISTRATION",
        studentUserId: targetUserId,
        studentName: p.studentName || "طالب جديد",
        phone: p.phone,
        time: p.time || new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }),
        notes: p.notes,
      };
      setQueue((prev) => {
        if (prev.some((item) => (item.studentUserId === newItem.studentUserId || item.id === newItem.id) && item.type === "REGISTRATION")) {
          return prev;
        }
        return [...prev, newItem];
      });
    }

    // 2. Student requested to join live session
    if (lastEvent.type === "SESSION_JOIN_REQUESTED" || lastEvent.type === "JOIN_REQUEST_SUBMITTED") {
      const p = lastEvent.payload;
      if (isItemHandled(p.requestId) || isItemHandled(p.studentId)) return;

      playTeacherJoinAlertSound();
      const newItem: DecisionItem = {
        id: `sess-${p.sessionId || "live"}-${p.studentId}-${Date.now()}`,
        type: "SESSION_JOIN",
        studentId: p.studentId,
        studentUserId: p.studentUserId,
        studentName: p.studentName || "طالب العلم",
        studentAvatar: p.studentAvatar,
        time: p.time || new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }),
        sessionId: p.sessionId,
        halaqaId: p.halaqaId,
        halaqaName: p.halaqaName || "الحلقة القرآنية",
        requestId: p.requestId,
      };
      setQueue((prev) => {
        if (prev.some((item) => item.studentId === newItem.studentId && item.sessionId === newItem.sessionId)) {
          return prev;
        }
        return [...prev, newItem];
      });
    }
  }, [lastEvent, isTeacherOrAdmin]);

  // Set active item when queue updates
  useEffect(() => {
    if (!activeItem && queue.length > 0) {
      setActiveItem(queue[0]);
      setShowRescheduleDrawer(false);
      setCustomTime("");
      setTeacherComment("");
      setActionDoneMsg(null);
    }
  }, [queue, activeItem]);

  const dismissCurrent = () => {
    if (activeItem) {
      markHandled(activeItem);
    }
    setActiveItem(null);
    setShowRescheduleDrawer(false);
    setCustomTime("");
    setTeacherComment("");
    setActionDoneMsg(null);
    setQueue((prev) => (prev.length > 0 ? prev.slice(1) : []));
  };

  if (!isTeacherOrAdmin || !activeItem) {
    return null;
  }

  // Pre-compiled list of suggested times from actual halaqat or presets
  const suggestedTimes = [
    ...(availableHalaqat.map((h: any) => `${h.name} (${h.startTime || "16:00"})`)),
    "الفجر (05:30 ص)",
    "العصر (04:00 م)",
    "المغرب (06:30 م)",
    "العشاء (08:00 م)",
    "غداً صباحاً (09:00 ص)",
  ].filter((v, i, a) => a.indexOf(v) === i).slice(0, 5);

  // 1. Unified Accept Handler - Disappears IMMEDIATELY
  const handleAccept = async () => {
    const current = activeItem;
    if (!current) return;
    markHandled(current);
    dismissCurrent(); // Instant vanish from screen!

    try {
      if (current.type === "REGISTRATION") {
        await fetch("/api/teacher/students", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "APPROVE_STUDENT_REGISTRATION",
            studentUserId: current.studentUserId,
            track: selectedTrack,
            targetHalaqaId: selectedHalaqaId,
          }),
        });
        playChimePing();
      } else {
        await fetch("/api/teacher/attendance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "ACCEPT_JOIN_SESSION",
            sessionId: current.sessionId,
            halaqaId: current.halaqaId,
            studentId: current.studentId,
            requestId: current.requestId,
          }),
        });
        playChimePing();
      }
    } catch (err) {
      console.error("Accept error:", err);
    }
  };

  // 2. Unified Reschedule / Comment Handler - Disappears IMMEDIATELY
  const handleRescheduleSubmit = async () => {
    const current = activeItem;
    if (!current) return;
    const finalTime = customTime.trim() || suggestedTimes[0];
    if (!finalTime) {
      alert("يرجى اختيار أو كتابة الموعد");
      return;
    }

    markHandled(current);
    dismissCurrent(); // Instant vanish from screen!

    try {
      if (current.type === "REGISTRATION") {
        await fetch("/api/teacher/students", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "RESCHEDULE_STUDENT_REGISTRATION",
            studentUserId: current.studentUserId,
            scheduledTime: finalTime,
            comment: teacherComment,
          }),
        });
        playChimePing();
      } else {
        await fetch("/api/teacher/attendance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "RESCHEDULE_JOIN_SESSION",
            sessionId: current.sessionId,
            studentId: current.studentId,
            requestId: current.requestId,
            scheduledTime: finalTime,
            notes: teacherComment,
          }),
        });
        playChimePing();
      }
    } catch (err) {
      console.error("Reschedule error:", err);
    }
  };

  // 3. Unified Reject / Decline Handler - Disappears IMMEDIATELY
  const handleReject = async () => {
    const current = activeItem;
    if (!current) return;
    if (!confirm("هل أنت متأكد من الاعتذار عن هذا الطلب؟")) return;

    markHandled(current);
    dismissCurrent(); // Instant vanish from screen!

    try {
      if (current.type === "REGISTRATION") {
        await fetch("/api/teacher/students", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "REJECT_STUDENT_REGISTRATION",
            studentUserId: current.studentUserId,
            reason: teacherComment || "نعتذر لاكتمال النصاب حالياً",
          }),
        });
      } else {
        await fetch("/api/teacher/attendance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "REJECT_JOIN_SESSION",
            sessionId: current.sessionId,
            studentId: current.studentId,
            requestId: current.requestId,
            reason: teacherComment || "اعتذار عن قبول الجلسة الحالية",
          }),
        });
      }
    } catch (err) {
      console.error("Reject error:", err);
    }
  };

  const isRegistration = activeItem.type === "REGISTRATION";

  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[99999] w-[95%] max-w-xl animate-in slide-in-from-top-6 duration-300 drop-shadow-2xl">
      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-white rounded-3xl p-4 sm:p-5 border-2 border-amber-400 shadow-[0_20px_50px_rgba(0,0,0,0.85)] relative overflow-hidden backdrop-blur-xl">
        {/* Glow ambient background effect */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Success/Done Flash Message */}
        {actionDoneMsg ? (
          <div className="py-6 flex flex-col items-center justify-center gap-2 text-center animate-in zoom-in-95">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 animate-bounce" />
            <h4 className="text-base font-black text-white">{actionDoneMsg}</h4>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Header: Badge + Queue counter + Dismiss */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                <span className="text-[11px] font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                  {isRegistration ? (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      طلب تسجيل طالب جديد على المنصة
                    </>
                  ) : (
                    <>
                      <Bell className="w-3.5 h-3.5 text-amber-300" />
                      طلب انضمام لحلقة منعقدة الآن
                    </>
                  )}
                </span>
                {queue.length > 1 && (
                  <span className="bg-amber-400/20 text-amber-200 border border-amber-400/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {`طلب 1 من ${queue.length}`}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-400 font-mono">{activeItem.time}</span>
                <button
                  onClick={dismissCurrent}
                  className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition"
                  title="إغلاق التنبيه"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Student Info Card */}
            <div className="flex items-center gap-3 bg-white/5 rounded-2xl p-3 border border-white/10">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-slate-950 font-black flex items-center justify-center text-lg shrink-0 shadow-lg">
                {activeItem.studentAvatar ? (
                  <img
                    src={activeItem.studentAvatar}
                    alt={activeItem.studentName}
                    className="w-full h-full rounded-2xl object-cover"
                  />
                ) : (
                  activeItem.studentName.charAt(0) || "ط"
                )}
              </div>
              <div className="flex-1 min-w-0 text-right">
                <h4 className="text-base font-black text-white truncate">{activeItem.studentName}</h4>
                <p className="text-xs text-slate-300 truncate">
                  {isRegistration ? (
                    activeItem.phone ? `الهاتف: ${activeItem.phone}` : "طالب جديد ينتظر تحديد مساره"
                  ) : (
                    `يرغب في الدخول إلى: ${activeItem.halaqaName}`
                  )}
                </p>
              </div>
            </div>

            {/* If New Registration: Sheikh Selects Track / Group (مطلوب من الشيخ بناء على معلومات الطالب) */}
            {isRegistration && (
              <div className="space-y-2 bg-emerald-950/40 p-3 rounded-2xl border border-emerald-500/30">
                <label className="text-[11px] font-black text-emerald-300 block">
                  اختر مسار انضمام الطالب في الأكاديمية:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedTrack("INDIVIDUAL")}
                    className={`py-2 px-2 rounded-xl text-xs font-black border transition flex items-center justify-center gap-1.5 ${
                      selectedTrack === "INDIVIDUAL"
                        ? "bg-amber-400 text-slate-950 border-amber-300 shadow-md"
                        : "bg-white/5 text-slate-200 border-white/10 hover:bg-white/10"
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>فردي (خاص)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedTrack("GROUP")}
                    className={`py-2 px-2 rounded-xl text-xs font-black border transition flex items-center justify-center gap-1.5 ${
                      selectedTrack === "GROUP"
                        ? "bg-amber-400 text-slate-950 border-amber-300 shadow-md"
                        : "bg-white/5 text-slate-200 border-white/10 hover:bg-white/10"
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>مجموعة</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedTrack("FOUNDATION")}
                    className={`py-2 px-2 rounded-xl text-xs font-black border transition flex items-center justify-center gap-1.5 ${
                      selectedTrack === "FOUNDATION"
                        ? "bg-amber-400 text-slate-950 border-amber-300 shadow-md"
                        : "bg-white/5 text-slate-200 border-white/10 hover:bg-white/10"
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>تأسيس</span>
                  </button>
                </div>

                {availableHalaqat.length > 0 && (
                  <div className="pt-1">
                    <select
                      value={selectedHalaqaId}
                      onChange={(e) => setSelectedHalaqaId(e.target.value)}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
                    >
                      {availableHalaqat.map((h: any) => (
                        <option key={h.id} value={h.id}>
                          {`إلحاق بالحلقة: ${h.name} (${h.startTime || "16:00"})`}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            {/* Inline Expandable Drawer for Reschedule / Suggest Appointment */}
            {showRescheduleDrawer && (
              <div className="bg-amber-950/40 p-3.5 rounded-2xl border border-amber-500/40 space-y-3 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    تحديد موعد بديل وإرساله للطالب:
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowRescheduleDrawer(false)}
                    className="text-[11px] text-slate-400 hover:text-white"
                  >
                    إلغاء الموعد
                  </button>
                </div>

                {/* Quick Suggestion Chips from the Program */}
                <div>
                  <span className="text-[10px] text-slate-300 block mb-1.5 font-bold">
                    مواعيد مقترحة من جدول الحلقات:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {suggestedTimes.map((t, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setCustomTime(t)}
                        className={`text-[11px] px-2.5 py-1 rounded-lg border font-bold transition ${
                          customTime === t
                            ? "bg-amber-400 text-slate-950 border-amber-300"
                            : "bg-white/10 text-slate-200 border-white/15 hover:bg-white/20"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Time Input */}
                <div>
                  <input
                    type="text"
                    value={customTime}
                    onChange={(e) => setCustomTime(e.target.value)}
                    placeholder="أو اكتب موعداً مخصصاً (مثال: غداً بعد العصر 4:30 م)..."
                    className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-400"
                  />
                </div>

                {/* Optional Note */}
                <div>
                  <input
                    type="text"
                    value={teacherComment}
                    onChange={(e) => setTeacherComment(e.target.value)}
                    placeholder="ملاحظة للطالب (اختياري)..."
                    className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-400"
                  />
                </div>

                {/* Confirm Send Appointment Button */}
                <button
                  type="button"
                  onClick={handleRescheduleSubmit}
                  disabled={submitting || (!customTime.trim() && suggestedTimes.length === 0)}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 text-slate-950 font-black text-xs shadow-md flex items-center justify-center gap-1.5 transition active:scale-95 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submitting ? "جارٍ الإرسال..." : "تأكيد وإرسال الموعد للطالب 📩"}</span>
                </button>
              </div>
            )}

            {/* UNIFIED 3-OPTION ACTION ROW IN ONE STEP */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              {/* Option 1: ACCEPT */}
              <button
                type="button"
                onClick={handleAccept}
                disabled={submitting}
                className="py-3 px-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs shadow-lg transition-transform hover:scale-102 active:scale-95 flex items-center justify-center gap-1.5 disabled:opacity-50"
                title="قبول الطلب وتأكيده مباشرة"
              >
                {isRegistration ? <UserCheck className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                <span>{submitting ? "جارٍ..." : isRegistration ? "قبول وتفعيل ✅" : "قبول ودخول 🎥"}</span>
              </button>

              {/* Option 2: RESCHEDULE / COMMENT */}
              <button
                type="button"
                onClick={() => setShowRescheduleDrawer(!showRescheduleDrawer)}
                disabled={submitting}
                className={`py-3 px-2 rounded-2xl font-black text-xs border transition flex items-center justify-center gap-1.5 ${
                  showRescheduleDrawer
                    ? "bg-amber-400 text-slate-950 border-amber-300 shadow-md"
                    : "bg-white/10 text-amber-300 border-amber-400/40 hover:bg-white/15"
                }`}
                title="تحديد موعد بديل للطالب"
              >
                <Calendar className="w-4 h-4 text-amber-300" />
                <span>تعليق بموعد 📅</span>
              </button>

              {/* Option 3: REJECT */}
              <button
                type="button"
                onClick={handleReject}
                disabled={submitting}
                className="py-3 px-2 rounded-2xl bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 font-black text-xs transition active:scale-95 flex items-center justify-center gap-1.5 disabled:opacity-50"
                title="الاعتذار عن قبول الطلب"
              >
                <XCircle className="w-4 h-4 text-red-400" />
                <span>اعتذار / رفض ❌</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
