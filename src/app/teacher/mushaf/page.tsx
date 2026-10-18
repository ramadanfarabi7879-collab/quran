"use client";

import React, { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { InteractiveMushaf } from "@/components/mushaf/InteractiveMushaf";
import { BookOpen, Sparkles, ShieldCheck } from "lucide-react";

export default function TeacherMushafPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <AppShell>
      <div className="flex-1 flex flex-col h-full min-h-0 space-y-2">
        <div className="flex items-center justify-between shrink-0">
          <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-600" />
            غرفة التحكم في المصحف والتسميع التفاعلي
          </h1>
          <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline">
            مصحف المدينة المنورة - نسخة مجمع الملك فهد
          </span>
        </div>

        <div className="flex-1 min-h-0 flex flex-col">
          <InteractiveMushaf
            key={refreshKey}
            sessionId="main-halaqa-session"
            isTeacher={true}
            onEvaluationSaved={() => setRefreshKey((k) => k + 1)}
          />
        </div>
      </div>
    </AppShell>
  );
}
