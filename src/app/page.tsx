"use client";

import React from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { useAuth } from "@/components/providers/AppProviders";
import {
  BookOpen,
  UserPlus,
  GraduationCap,
  Users,
  ShieldCheck,
  Video,
  Lock,
  Award,
  Library,
  ChevronLeft,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Clock,
  Key,
  CalendarDays,
  FileCheck2,
} from "lucide-react";

export default function UnifiedGatewayPage() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col text-right" dir="rtl">
      <Navbar />

      {/* Main Unified Portal Section */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 w-full">
        {/* Header Title */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100/90 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-black mb-4 shadow-sm">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>بوابة الاستقبال والولوج الموحدة للمنظومة القرآنية</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
            « وَرَتِّلِ ٱلْقُرْءَانَ تَرْتِيلًا »
          </h1>
          <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
            مرحباً بك في منصة <strong>وَرَتِّلْ</strong> لتحفيظ القرآن الكريم والعلوم الشرعية.
            اختر بوابتك المخصصة بالأسفل للمتابعة الفورية:
          </p>
        </div>

        {/* 4 Dedicated Executive Role Portals Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {/* PORTAL 1: NEW STUDENT REGISTRATION */}
          <div className="bg-gradient-to-b from-white to-emerald-50/50 dark:from-slate-900 dark:to-emerald-950/20 rounded-3xl border-2 border-emerald-500/50 p-6 shadow-xl hover:shadow-2xl hover:border-emerald-500 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden">
            <div className="absolute top-0 left-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30 group-hover:scale-110 transition-transform">
                  <UserPlus className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-black px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300/50">
                  للانضمام للأكاديمية
                </span>
              </div>

              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white mb-1.5">
                  بوابة تسجيل طالب جديد
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  تقديم طلب التحاق جديد بالحلقات. تملأ بياناتك الأساسية واختيار مسارك ومستواك القرآني، ثم ينتقل طلبك مباشرة لفضيلة الشيخ لمراجعته وتحديد الموعد المناسب.
                </p>
              </div>

              <div className="pt-2 space-y-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>البريد الإلكتروني اختياري تماماً</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  <span>مراجعة واعتماد مباشر من الشيخ</span>
                </div>
              </div>
            </div>

            <div className="pt-6">
              <Link
                href="/register"
                className="w-full py-3.5 px-4 rounded-2xl bg-emerald-700 hover:bg-emerald-600 active:scale-95 text-white font-black text-xs shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2 transition-all"
              >
                <span>تسجيل طالب جديد الآن</span>
                <ChevronLeft className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* PORTAL 2: REGISTERED STUDENT DASHBOARD */}
          <div className="bg-gradient-to-b from-white to-blue-50/50 dark:from-slate-900 dark:to-blue-950/20 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xl hover:shadow-2xl hover:border-blue-500/50 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/30 group-hover:scale-110 transition-transform">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-black px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-300/50">
                  للطلاب المسجلين
                </span>
              </div>

              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white mb-1.5">
                  بوابة الطالب المسجل
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  متابعة الحلقات القرآنية اليومية، التسميع المباشر أمام الشيخ، جدول الحضور والغياب، الواجبات المنزلية، والمكتبة الشرعية الرقمية.
                </p>
              </div>

              <div className="pt-2 space-y-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-1.5">
                  <Video className="w-3.5 h-3.5 text-blue-500" />
                  <span>دخول غرف الحلقات والفيديو الحي</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-emerald-500" />
                  <span>مصحف رقمي ومتابعة التسميع</span>
                </div>
              </div>
            </div>

            <div className="pt-6 space-y-2">
              <Link
                href={user?.role === "STUDENT" ? "/student/dashboard" : "/login?redirect=/student/dashboard"}
                className="w-full py-3 px-4 rounded-2xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-black text-xs shadow-md flex items-center justify-center gap-2 transition-all"
              >
                <span>{user?.role === "STUDENT" ? "المتابعة إلى لوحة الطالب" : "تسجيل دخول الطالب"}</span>
                <ChevronLeft className="w-4 h-4" />
              </Link>
              {!user && (
                <Link
                  href="/register"
                  className="w-full py-2.5 px-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 transition"
                >
                  <span>تقديم طلب تسجيل طالب جديد</span>
                </Link>
              )}
            </div>
          </div>

          {/* PORTAL 3: TEACHER & SHEIKH DASHBOARD */}
          <div className="bg-gradient-to-b from-white to-islamic-50/50 dark:from-slate-900 dark:to-emerald-950/30 rounded-3xl border-2 border-islamic-800/40 dark:border-emerald-600/40 p-6 shadow-xl hover:shadow-2xl hover:border-islamic-800 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-islamic-800 text-gold-accent flex items-center justify-center shadow-lg shadow-islamic-950/40 group-hover:scale-110 transition-transform">
                  <BookOpen className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-black px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 border border-amber-300/50">
                  للمعلمين والمقرئين
                </span>
              </div>

              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white mb-1.5">
                  بوابة الشيخ والمعلم
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  إدارة الحلقات القرآنية، التحكم الحصري في المصحف التفاعلي، تفعيل وضع التسميع المغلق الصارم، واعتماد طلبات الطلاب الجدد.
                </p>
              </div>

              <div className="pt-2 space-y-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-500" />
                  <span>التحكم في التسميع المغلق الصارم</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-emerald-500" />
                  <span>اعتماد وقبول طلبات التسجيل</span>
                </div>
              </div>
            </div>

            <div className="pt-6 space-y-2">
              <Link
                href={user?.role === "TEACHER" || user?.role === "ADMIN" ? "/teacher/dashboard" : "/login?redirect=/teacher/dashboard"}
                className="w-full py-3 px-4 rounded-2xl bg-islamic-800 hover:bg-islamic-700 active:scale-95 text-white font-black text-xs shadow-lg flex items-center justify-center gap-2 transition-all border border-gold-accent/30"
              >
                <span>{user?.role === "TEACHER" || user?.role === "ADMIN" ? "المتابعة إلى لوحة الشيخ" : "تسجيل دخول الشيخ والمعلم"}</span>
                <ChevronLeft className="w-4 h-4" />
              </Link>
              <Link
                href={user?.role === "TEACHER" || user?.role === "ADMIN" ? "/teacher/requests" : "/login?redirect=/teacher/requests"}
                className="w-full py-2.5 px-3 rounded-2xl bg-amber-400/20 hover:bg-amber-400/30 text-amber-900 dark:text-amber-300 border border-amber-400/40 font-black text-xs flex items-center justify-center gap-1.5 transition"
              >
                <span>مراجعة طلبات الطلاب المعلقة</span>
              </Link>
            </div>
          </div>

          {/* PORTAL 4: ADMIN & SUPERVISOR CONTROL */}
          <div className="bg-gradient-to-b from-white to-purple-50/50 dark:from-slate-900 dark:to-purple-950/20 rounded-3xl border-2 border-purple-500/50 p-6 shadow-xl hover:shadow-2xl hover:border-purple-500 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-lg shadow-purple-600/30 group-hover:scale-110 transition-transform">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-black px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-300/50">
                  للإدارة العامة والمشرف
                </span>
              </div>

              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white mb-1.5">
                  لوحة الإدارة والصلاحيات
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  التحكم المركزي الشامل: تعديل بيانات الحسابات، تجميد أو حذف المستخدمين، فتح وغلق الصلاحيات لكل مستخدم، والإشراف على كافة الحلقات.
                </p>
              </div>

              <div className="pt-2 space-y-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-amber-500" />
                  <span>تخصيص الصلاحيات الفردية بدقة</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CalendarDays className="w-3.5 h-3.5 text-purple-500" />
                  <span>إشراف كامل على المعلمين والحلقات</span>
                </div>
              </div>
            </div>

            <div className="pt-6 space-y-2">
              <Link
                href={user?.role === "ADMIN" ? "/admin/dashboard" : "/login?redirect=/admin/dashboard"}
                className="w-full py-3 px-4 rounded-2xl bg-purple-700 hover:bg-purple-600 active:scale-95 text-white font-black text-xs shadow-md flex items-center justify-center gap-2 transition-all"
              >
                <span>{user?.role === "ADMIN" ? "المتابعة إلى لوحة الإدارة" : "تسجيل دخول الإدارة العامة"}</span>
                <ChevronLeft className="w-4 h-4" />
              </Link>
              <Link
                href={user?.role === "ADMIN" ? "/admin/dashboard?tab=USERS" : "/login?redirect=/admin/dashboard?tab=USERS"}
                className="w-full py-2.5 px-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 transition"
              >
                <span>إدارة المستخدمين والصلاحيات</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Feature Highlights Banner */}
        <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              مميزات المنظومة التعليمية الرقمية
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              أحدث التقنيات لخدمة القرآن الكريم وحلقات الإتقان
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
              <div className="p-2.5 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 w-fit">
                <Lock className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                التسميع المغلق الصارم
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                حجب حقيقي فوري للمصحف من شاشة الطالب بقرار الشيخ لضمان صدق التسميع.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
              <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 w-fit">
                <Video className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                فصول افتراضية مدمجة
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                غرف فيديو وبث مباشر عالية الجودة تعمل مباشرة من المتصفح بدون أي برامج.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
              <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 w-fit">
                <Award className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                سجل حفظ وتقييم رقمي
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                توثيق لآيات الحفظ والمراجعة وأخطاء التجويد مع إصدار شهادات إتقان فورية.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
              <div className="p-2.5 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 w-fit">
                <Library className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                مكتبة إسلامية مدمجة
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                كتب التجويد المعتمدة، متن الجزرية وتحفة الأطفال، مع إمكانية التنزيل والقراءة.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6 text-center text-xs text-slate-500">
        منصة وَرَتِّلْ لتحفيظ القرآن الكريم والعلوم الشرعية • منظومة إلكترونية متكاملة
      </footer>
    </div>
  );
}
