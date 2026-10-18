"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/providers/AppProviders";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  CheckSquare,
  BookOpen,
  FileCheck2,
  Award,
  Trash2,
  Library,
  Video,
  Settings,
  ShieldAlert,
  BarChart3,
  BookmarkCheck,
  GraduationCap,
  X,
  LogOut,
  LogIn,
  UserPlus,
  UserCheck,
} from "lucide-react";

interface SidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ mobileOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const isStudentRoute = pathname?.startsWith("/student");
  const isAdminRoute = pathname?.startsWith("/admin");
  const isTeacherRoute = pathname?.startsWith("/teacher");

  const role = isStudentRoute
    ? "STUDENT"
    : isAdminRoute
    ? "ADMIN"
    : isTeacherRoute
    ? "TEACHER"
    : user?.role || "STUDENT";

  const teacherNav = [
    { name: "لوحة التحكم", href: "/teacher/dashboard", icon: LayoutDashboard },
    { name: "إدارة الطلبات", href: "/teacher/requests", icon: UserCheck },
    { name: "إدارة الحلقات", href: "/teacher/halaqat", icon: CalendarDays },
    { name: "إدارة الطلاب", href: "/teacher/students", icon: Users },
    { name: "الحضور والغياب", href: "/teacher/attendance", icon: CheckSquare },
    { name: "المصحف التفاعلي والتسميع", href: "/teacher/mushaf", icon: BookOpen },
    { name: "الواجبات والتكليفات", href: "/teacher/assignments", icon: FileCheck2 },
    { name: "سجل الحفظ والتقييم", href: "/teacher/evaluations", icon: Award },
    { name: "المكتبة الرقمية", href: "/teacher/library", icon: Library },
    { name: "تسجيلات الحلقات", href: "/teacher/recordings", icon: Video },
    { name: "التقارير والإحصائيات", href: "/teacher/reports", icon: BarChart3 },
    { name: "الطلاب المحذوفين", href: "/teacher/trash", icon: Trash2 },
    { name: "إعدادات المعلم", href: "/teacher/settings", icon: Settings },
  ];

  const studentNav = [
    { name: "لوحة الطالب", href: "/student/dashboard", icon: LayoutDashboard },
    { name: "حلقاتي وجدولي", href: "/student/my-halaqat", icon: GraduationCap },
    { name: "المصحف الرقمي", href: "/student/mushaf", icon: BookOpen },
    { name: "واجباتي وتسليماتي", href: "/student/assignments", icon: FileCheck2 },
    { name: "سجل إنجازاتي وتقييماتي", href: "/student/achievements", icon: Award },
    { name: "سجل الحضور والغياب", href: "/student/attendance", icon: CheckSquare },
    { name: "المكتبة الإسلامية", href: "/student/library", icon: Library },
    { name: "تسجيلات الحلقات", href: "/student/recordings", icon: Video },
  ];

  const adminNav = [
    { name: "لوحة الإدارة الشاملة والصلاحيات", href: "/admin/dashboard", icon: LayoutDashboard },
    { name: "إدارة الطلبات", href: "/teacher/requests", icon: UserCheck },
    { name: "لوحة الحلقات والتعليم المباشر", href: "/teacher/dashboard", icon: Video },
    { name: "إدارة المستخدمين والمعلمين", href: "/admin/dashboard?tab=USERS", icon: Users },
    { name: "إدارة الحلقات والمواعيد", href: "/teacher/halaqat", icon: CalendarDays },
    { name: "إدارة الطلاب", href: "/teacher/students", icon: Users },
    { name: "المصحف التفاعلي والتسميع", href: "/teacher/mushaf", icon: BookOpen },
    { name: "الواجبات والتكليفات", href: "/teacher/assignments", icon: FileCheck2 },
    { name: "سجل الحفظ والتقييم", href: "/teacher/evaluations", icon: Award },
    { name: "حضور وغياب الحلقات", href: "/teacher/attendance", icon: CheckSquare },
    { name: "المكتبة الرقمية", href: "/teacher/library", icon: Library },
    { name: "تسجيلات الحلقات", href: "/teacher/recordings", icon: Video },
    { name: "إعدادات الهوية والمنصة", href: "/admin/settings", icon: Settings },
    { name: "سجل التدقيق والرقابة", href: "/admin/audit", icon: ShieldAlert },
  ];

  const navItems = role === "ADMIN" ? adminNav : role === "STUDENT" ? studentNav : teacherNav;

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Header with Role Badge and Close Button (on mobile) */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 flex-1">
          <div
            className={`w-2.5 h-2.5 rounded-full shrink-0 ${
              role === "TEACHER"
                ? "bg-islamic-600"
                : role === "STUDENT"
                ? "bg-emerald-500"
                : "bg-amber-500"
            }`}
          />
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
              {role === "TEACHER"
                ? "بوابة المعلم والمقرئ"
                : role === "STUDENT"
                ? "بوابة الطالب"
                : "لوحة الإدارة المركزية"}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">
              صلاحيات كاملة معتمدة
            </span>
          </div>
        </div>

        {/* Mobile Close Button */}
        <button
          onClick={onClose}
          className="md:hidden mr-2 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          title="إغلاق القائمة"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Nav List */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/teacher/dashboard" &&
              item.href !== "/student/dashboard" &&
              pathname?.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => onClose?.()}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? "bg-islamic-800 text-white shadow-md dark:bg-emerald-700 dark:text-white"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 ${
                  isActive ? "text-gold-accent" : "text-slate-400 dark:text-slate-500"
                }`}
              />
              <span className="truncate">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer Info & Logout */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
        {user ? (
          <button
            onClick={() => {
              logout();
              onClose?.();
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 text-xs font-bold border border-red-200/80 dark:border-red-900/50 transition active:scale-95 shadow-sm"
            title="تسجيل الخروج من المنصة"
          >
            <LogOut className="w-4 h-4" />
            <span>تسجيل الخروج</span>
          </button>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <Link
              href="/login"
              onClick={() => onClose?.()}
              className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl bg-islamic-800 text-white hover:bg-islamic-700 text-xs font-bold transition shadow-sm"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>دخول</span>
            </Link>
            <Link
              href="/register"
              onClick={() => onClose?.()}
              className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold transition"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>تسجيل</span>
            </Link>
          </div>
        )}
        <p className="text-[10px] text-center text-slate-400 dark:text-slate-500">
          نظام ورتّل للتحفيظ عن بُعد v1.0
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar (md+) */}
      <aside className="hidden md:flex w-64 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex-col shrink-0 min-h-[calc(100vh-4rem)]">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer (Overlay for < md) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
          />

          {/* Drawer Content */}
          <div className="fixed top-0 right-0 bottom-0 w-72 bg-white dark:bg-slate-900 shadow-2xl z-50 overflow-hidden flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
