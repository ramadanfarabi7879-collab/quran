"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import {
  Users,
  CalendarDays,
  ShieldAlert,
  Settings,
  HardDrive,
  Activity,
  ArrowUpRight,
} from "lucide-react";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>({
    totalUsers: 0,
    teachersCount: 0,
    studentsCount: 0,
    activeHalaqat: 0,
  });
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((d) => {
        if (d.stats) setStats(d.stats);
        if (d.users) setUsers(d.users || []);
      })
      .catch(console.error);
  }, []);

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-amber-700 via-slate-900 to-amber-950 text-white p-6 sm:p-8 rounded-3xl shadow-xl">
          <span className="text-amber-300 text-xs font-bold uppercase tracking-wider block mb-1">
            لوحة الإدارة المركزية للأكاديمية
          </span>
          <h1 className="text-2xl sm:text-3xl font-black">
            إدارة منصة ورتّل لتحفيظ القرآن الكريم
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl leading-relaxed">
            التحكم الشامل في حسابات المعلمين والطلاب، وتخصيص هوية المنصة واسمها، ومتابعة سجلات التدقيق والأمان.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-xs font-bold text-slate-400 block mb-1">إجمالي المستخدمين</span>
            <span className="text-3xl font-black text-slate-900 dark:text-slate-100">
              {stats.totalUsers || 5}
            </span>
            <span className="text-[11px] text-emerald-600 block mt-1 font-semibold">حسابات نشطة</span>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-xs font-bold text-slate-400 block mb-1">المعلمون والمقرئون</span>
            <span className="text-3xl font-black text-islamic-800 dark:text-emerald-400">
              {stats.teachersCount || 1}
            </span>
            <span className="text-[11px] text-slate-500 block mt-1">بصلاحيات تدريس كاملة</span>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-xs font-bold text-slate-400 block mb-1">الطلاب المسجلون</span>
            <span className="text-3xl font-black text-amber-500">
              {stats.studentsCount || 4}
            </span>
            <span className="text-[11px] text-slate-500 block mt-1">في مختلف الحلقات</span>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-xs font-bold text-slate-400 block mb-1">الحلقات النشطة</span>
            <span className="text-3xl font-black text-purple-600">
              {stats.activeHalaqat || 2}
            </span>
            <span className="text-[11px] text-slate-500 block mt-1">مباشرة ومجدولة</span>
          </div>
        </div>

        {/* Users Overview */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-600" />
              مستخدمو المنصة والمعلمون
            </h3>
            <Link
              href="/admin/users"
              className="text-xs font-bold text-emerald-600 hover:underline flex items-center gap-0.5"
            >
              إدارة المستخدمين
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {users.slice(0, 5).map((u) => (
              <div key={u.id} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={
                      u.avatar ||
                      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150"
                    }
                    alt=""
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <div>
                    <span className="font-bold text-xs text-slate-900 dark:text-slate-100 block">
                      {u.name}
                    </span>
                    <span className="text-[10px] text-slate-400">{u.email}</span>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                    u.role === "TEACHER"
                      ? "bg-islamic-100 text-islamic-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                      : u.role === "ADMIN"
                      ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                      : "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
                  }`}
                >
                  {u.role === "TEACHER" ? "معلم" : u.role === "ADMIN" ? "مدير" : "طالب"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
