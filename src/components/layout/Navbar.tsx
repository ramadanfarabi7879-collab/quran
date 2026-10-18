"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth, useRealtime } from "@/components/providers/AppProviders";
import {
  Bell,
  Moon,
  Sun,
  UserCheck,
  LogOut,
  Video,
  Radio,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Menu,
  Eye,
} from "lucide-react";
import { playHalaqaStartSound } from "@/lib/sound";

interface NavbarProps {
  onToggleMobileMenu?: () => void;
}

export function Navbar({ onToggleMobileMenu }: NavbarProps = {}) {
  const { user, switchUser, logout } = useAuth();
  const { connected, lastEvent } = useRealtime();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [activeSessionBanner, setActiveSessionBanner] = useState<{
    id: string;
    title: string;
    halaqaName: string;
  } | null>(null);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch {}
  };

  const checkActiveSession = async () => {
    try {
      const res = await fetch("/api/live/session");
      if (res.ok) {
        const data = await res.json();
        if (data.session && data.session.status === "ACTIVE") {
          setActiveSessionBanner({
            id: data.session.id,
            title: data.session.title,
            halaqaName: data.session.halaqa?.name || "حلقة الفجر",
          });
        } else {
          setActiveSessionBanner(null);
        }
      }
    } catch {}
  };

  useEffect(() => {
    fetchNotifications();
    checkActiveSession();

    // 3-second fallback interval to guarantee notification delivery on all devices & mobile
    const interval = setInterval(() => {
      checkActiveSession();
      fetchNotifications();
    }, 3000);

    return () => clearInterval(interval);
  }, [user]);

  // Realtime notification update
  useEffect(() => {
    if (lastEvent) {
      if (lastEvent.type === "HALAQA_LIVE_STARTED") {
        checkActiveSession();
        fetchNotifications();
        // Play notification sound for student
        if (user?.role === "STUDENT" || (typeof window !== "undefined" && window.location.pathname.startsWith("/student"))) {
          playHalaqaStartSound();
        }
      } else if (lastEvent.type === "HALAQA_LIVE_ENDED") {
        setActiveSessionBanner(null);
      } else if (lastEvent.type === "NEW_NOTIFICATION" || lastEvent.type === "STUDENT_ATTENDANCE_CHECKIN") {
        fetchNotifications();
      }
    }
  }, [lastEvent, user]);

  const markAllNotificationsAsRead = async () => {
    await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAll: true }),
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-800 transition-colors">
      {/* Live Session Alert Banner */}
      {activeSessionBanner && (
        <div className="bg-gradient-to-r from-emerald-600 via-islamic-800 to-emerald-700 text-white px-4 py-2 flex items-center justify-between shadow-inner animate-pulse">
          <div className="flex items-center gap-3">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-amber-300" />
              <span className="font-semibold text-sm">حلقة مباشرة منعقدة الآن:</span>
              <span className="text-amber-200 text-sm font-medium">{activeSessionBanner.halaqaName}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/classroom/${activeSessionBanner.id}?role=${user?.role === "TEACHER" ? "teacher" : "student"}`}
              className="flex items-center gap-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold px-3 py-1 rounded-lg text-xs transition-all shadow"
            >
              <Video className="w-3.5 h-3.5" />
              دخول الحلقة
            </Link>
            <Link
              href="/student/my-halaqat"
              className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white font-bold px-3 py-1 rounded-lg text-xs transition-all"
            >
              <Eye className="w-3.5 h-3.5" />
              متابعة الحلقة
            </Link>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Platform Name */}
          <div className="flex items-center gap-2 sm:gap-3">
            {onToggleMobileMenu && (
              <button
                onClick={onToggleMobileMenu}
                aria-label="فتح القائمة الجانبية"
                className="md:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}

            <Link href="/" className="flex items-center gap-2 sm:gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-islamic-800 text-gold-accent flex items-center justify-center shadow-md border border-gold-accent/30 group-hover:scale-105 transition-transform">
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-black text-xl text-islamic-800 dark:text-emerald-400 tracking-tight">
                  وَرَتِّلْ
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 -mt-1 font-medium">
                  منصة تحفيظ القرآن والعلوم الشرعية
                </span>
              </div>
            </Link>

            {/* SSE Live status indicator */}
            <div
              className={`hidden md:flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border ${
                connected
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                  : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800"
              }`}
              title={connected ? "الاتصال اللحظي نشط" : "جارٍ إعادة الاتصال"}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
              {connected ? "مباشر" : "مزامنة"}
            </div>
          </div>

          {/* Quick Demo Switcher Bar (Crucial for Pair Evaluation) */}
          <div className="hidden lg:flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium px-2 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-gold-accent" />
              تبديل سريع:
            </span>
            <button
              onClick={() => switchUser("TEACHER")}
              className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all ${
                user?.role === "TEACHER"
                  ? "bg-islamic-800 text-white shadow"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              الشيخ المنشاوي (معلم)
            </button>
            <button
              onClick={() => switchUser("STUDENT", "student@quran.com")}
              className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all ${
                user?.role === "STUDENT"
                  ? "bg-emerald-600 text-white shadow"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              عبد الرحمن (طالب)
            </button>
            <button
              onClick={() => switchUser("ADMIN")}
              className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all ${
                user?.role === "ADMIN"
                  ? "bg-amber-600 text-white shadow"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              مدير المنصة (أدمن)
            </button>
            <Link
              href="/simulation"
              className="text-xs px-2.5 py-1 rounded-lg font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 shadow flex items-center gap-1 transition"
            >
              <Video className="w-3.5 h-3.5" />
              المحاكاة الحية (شاشتين)
            </Link>
          </div>

          {/* Right actions: Notifications, Dark mode, User profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              aria-label="تبديل الوضع الليلي والنهاري"
              className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                aria-label="مركز الإشعارات"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Popover */}
              {showNotifications && (
                <div className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl z-50 overflow-hidden">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Bell className="w-4 h-4 text-emerald-600" />
                      مركز الإشعارات
                    </span>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllNotificationsAsRead}
                        className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
                      >
                        تعليم الكل كمقروء
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-sm text-slate-500">لا توجد إشعارات حالياً</div>
                    ) : (
                      notifications.map((n) => (
                        <Link
                          key={n.id}
                          href={n.link || "#"}
                          onClick={() => setShowNotifications(false)}
                          className={`block p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition ${
                            !n.isRead ? "bg-emerald-50/40 dark:bg-emerald-950/20" : ""
                          }`}
                        >
                          <div className="flex items-start gap-2.5">
                            <div className="mt-0.5">
                              {n.type === "HALAQA_STARTING" ? (
                                <Radio className="w-4 h-4 text-emerald-600 animate-pulse" />
                              ) : n.type === "EVALUATION_NEW" ? (
                                <CheckCircle2 className="w-4 h-4 text-amber-500" />
                              ) : (
                                <AlertCircle className="w-4 h-4 text-blue-500" />
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{n.title}</p>
                              <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                                {n.body}
                              </p>
                              <span className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(n.createdAt).toLocaleTimeString("ar-SA", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                          </div>
                        </Link>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile / Login Link */}
            {user ? (
              <div className="flex items-center gap-2">
                <Link
                  href={
                    user.role === "TEACHER"
                      ? "/teacher/dashboard"
                      : user.role === "ADMIN"
                      ? "/admin/dashboard"
                      : "/student/dashboard"
                  }
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <img
                    src={
                      user.avatar ||
                      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150"
                    }
                    alt={user.name}
                    className="w-8 h-8 rounded-full object-cover ring-2 ring-emerald-600/30"
                  />
                  <div className="hidden sm:flex flex-col text-right">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">
                      {user.name}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      {user.role === "TEACHER"
                        ? "معلم الحلقة"
                        : user.role === "ADMIN"
                        ? "مدير المنصة"
                        : "طالب مجتهد"}
                    </span>
                  </div>
                </Link>
                <button
                  onClick={logout}
                  title="تسجيل الخروج"
                  className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="text-xs font-bold text-slate-700 dark:text-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  تسجيل الدخول
                </Link>
                <Link
                  href="/register"
                  className="text-xs font-bold text-white bg-islamic-800 hover:bg-islamic-700 px-3.5 py-1.5 rounded-lg shadow transition"
                >
                  حساب جديد
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
