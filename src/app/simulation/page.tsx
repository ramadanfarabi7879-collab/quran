"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Video,
  Sparkles,
  Volume2,
  ArrowLeft,
  RefreshCw,
  Radio,
  User,
  GraduationCap,
  BookOpen,
  LayoutDashboard,
  ShieldAlert,
} from "lucide-react";
import { playHalaqaStartSound } from "@/lib/sound";

export default function SimulationPage() {
  const [key, setKey] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);
  const [viewMode, setViewMode] = useState<"MUSHAF" | "DASHBOARDS">("MUSHAF");

  const handleRestart = () => {
    setKey((prev) => prev + 1);
  };

  const handleTriggerTeacherSession = async () => {
    setIsSimulating(true);
    try {
      const res = await fetch("/api/teacher/halaqat");
      const data = await res.json();
      const halaqaId = data.halaqat?.[0]?.id;

      if (halaqaId) {
        await fetch("/api/live/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            halaqaId,
            title: "جلسة العرض الحي المتزامن",
          }),
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans" dir="rtl">
      {/* Simulation Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-islamic-800 text-amber-300 flex items-center justify-center font-black">
              و
            </div>
            <div>
              <span className="font-black text-sm text-emerald-400 block">وَرَتِّلْ - منصة القرآن</span>
              <span className="text-[10px] text-slate-400 block">المحاكاة الحية المتزامنة (معلم ⇄ طالب)</span>
            </div>
          </Link>

          <span className="hidden md:inline-flex items-center gap-1.5 bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 text-xs px-3 py-1 rounded-full font-bold">
            <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
            اتصال لحظي حي نشط (SSE)
          </span>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center bg-slate-800/90 p-1 rounded-xl border border-slate-700">
          <button
            onClick={() => setViewMode("MUSHAF")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              viewMode === "MUSHAF"
                ? "bg-islamic-700 text-white shadow-md"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            المصحف والتسميع المغلق
          </button>
          <button
            onClick={() => setViewMode("DASHBOARDS")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              viewMode === "DASHBOARDS"
                ? "bg-islamic-700 text-white shadow-md"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            لوحات التحكم وبدء الحلقات
          </button>
        </div>

        {/* Quick Action Controls */}
        <div className="flex items-center gap-2">
          {viewMode === "DASHBOARDS" && (
            <>
              <button
                onClick={() => playHalaqaStartSound()}
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-400/30 px-3 py-1.5 rounded-xl text-xs font-bold transition active:scale-95"
                title="اختبار نغمة التنبيه الصوتي"
              >
                <Volume2 className="w-3.5 h-3.5" />
                صوت الرنين
              </button>

              <button
                onClick={handleTriggerTeacherSession}
                disabled={isSimulating}
                className="flex items-center gap-1.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 px-3.5 py-1.5 rounded-xl text-xs font-black shadow-lg transition active:scale-95 disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {isSimulating ? "جارٍ بدء الجلسة..." : "إطلاق جلسة المعلم"}
              </button>
            </>
          )}

          <button
            onClick={handleRestart}
            title="إعادة تحميل الشاشتين"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Split Screens Container */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-3 p-3 overflow-hidden bg-slate-900/50">
        {/* Right Pane: Teacher Screen */}
        <div className="flex flex-col bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
          <div className="bg-slate-800/80 px-4 py-2 flex items-center justify-between border-b border-slate-700/60">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <User className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-xs text-slate-200">
                شاشة المعلم: الشيخ أحمد المنشاوي
              </span>
            </div>
            <span className="text-[10px] text-amber-300 font-bold bg-amber-950/60 border border-amber-400/20 px-2.5 py-0.5 rounded-md">
              {viewMode === "MUSHAF"
                ? "اضغط 'بدء التسميع المغلق' بالأعلى للتحكم"
                : "اضغط على 'إنشاء جلسة الآن' بالأسفل"}
            </span>
          </div>

          <div className="flex-1 w-full h-[calc(100vh-8.5rem)] bg-white">
            <iframe
              key={`teacher-${viewMode}-${key}`}
              src={viewMode === "MUSHAF" ? "/teacher/mushaf" : "/teacher/dashboard"}
              className="w-full h-full border-0"
              title="Teacher Dashboard"
            />
          </div>
        </div>

        {/* Left Pane: Student Screen */}
        <div className="flex flex-col bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
          <div className="bg-slate-800/80 px-4 py-2 flex items-center justify-between border-b border-slate-700/60">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-400 animate-pulse" />
              <GraduationCap className="w-4 h-4 text-amber-400" />
              <span className="font-bold text-xs text-slate-200">
                شاشة الطالب: عبد الرحمن العلي
              </span>
            </div>
            <span className="text-[10px] text-emerald-300 font-bold bg-emerald-950/60 border border-emerald-400/20 px-2.5 py-0.5 rounded-md">
              {viewMode === "MUSHAF"
                ? "المصحف سيختفي هنا فورياً عند أمر المعلم"
                : "ستنطلق النغمة وتنبثق نافذة التنبيه هنا"}
            </span>
          </div>

          <div className="flex-1 w-full h-[calc(100vh-8.5rem)] bg-white">
            <iframe
              key={`student-${viewMode}-${key}`}
              src={viewMode === "MUSHAF" ? "/student/mushaf" : "/student/dashboard"}
              className="w-full h-full border-0"
              title="Student Dashboard"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
