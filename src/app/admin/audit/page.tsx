"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { ShieldAlert, Clock, User, CheckCircle2 } from "lucide-react";

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<any[]>([
    {
      id: "1",
      action: "UPDATE_PLATFORM_SETTINGS",
      details: "تحديث اسم المنصة والبريد الإلكتروني الرسمي للدعم الفني",
      createdAt: new Date().toISOString(),
      user: { name: "مدير المنصة العام" },
    },
    {
      id: "2",
      action: "ROLE_CHANGE",
      details: "ترقية المستخدم الشيخ أحمد المنشاوي إلى رتبة معلم ومقرئ معتمد",
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      user: { name: "مدير المنصة العام" },
    },
    {
      id: "3",
      action: "HALAQA_CREATED",
      details: "إنشاء حلقة الفجر المباركة وإضافة الجداول الزمنية الأسبوعية",
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      user: { name: "الشيخ أحمد المنشاوي" },
    },
  ]);

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-amber-500" />
            سجل التدقيق والعمليات الأمنية (Audit Logs)
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            توثيق جميع العمليات الحساسة، وتغييرات الصلاحيات، وتعديل إعدادات المنصة لضمان الأمان والشفافية.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <div className="space-y-3">
            {logs.map((log) => (
              <div
                key={log.id}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                      {log.action}
                    </span>
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {log.user?.name}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">{log.details}</p>
                </div>

                <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {new Date(log.createdAt).toLocaleString("ar-SA")}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
