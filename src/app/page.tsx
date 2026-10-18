"use client";

import React from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import {
  BookOpen,
  Video,
  Lock,
  Award,
  Users,
  ShieldCheck,
  CheckCircle2,
  CalendarDays,
  Sparkles,
  ArrowLeft,
  ChevronLeft,
  Star,
  GraduationCap,
  Library,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-32 bg-gradient-to-b from-emerald-50/50 via-slate-50 to-slate-50 dark:from-slate-900/60 dark:via-slate-950 dark:to-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100/80 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold mb-6 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-gold-accent" />
            <span>المنصة الرائدة لتحفيظ القرآن الكريم والعلوم الشرعية عن بُعد</span>
          </div>

          {/* Main Title */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-tight max-w-4xl mx-auto mb-6">
            « وَرَتِّلِ ٱلْقُرْءَانَ تَرْتِيلًا »
            <span className="block text-2xl sm:text-4xl lg:text-5xl font-extrabold text-islamic-800 dark:text-emerald-400 mt-3">
              منظومة تعليمية متكاملة بحلقات تفاعلية ومصحف مراقب
            </span>
          </h1>

          <p className="text-sm sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed mb-10">
            أكاديمية إلكترونية متطورة تجمع بين غرف الفيديو المباشرة، والمصحف الرقمي التفاعلي مع التحكم الحصري للمعلم بتقنية <strong>التسميع المغلق</strong> التي تمنع فتح المصحف أثناء الاختبار.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/teacher/dashboard"
              className="flex items-center gap-2 bg-islamic-800 hover:bg-islamic-700 text-white font-black text-sm px-7 py-4 rounded-2xl shadow-xl transition-transform hover:scale-105"
            >
              دخول لوحة تحكم المعلم
              <ChevronLeft className="w-4 h-4" />
            </Link>

            <Link
              href="/student/dashboard"
              className="flex items-center gap-2 bg-white dark:bg-slate-900 border-2 border-emerald-600 text-emerald-700 dark:text-emerald-300 font-black text-sm px-7 py-4 rounded-2xl shadow hover:bg-emerald-50 dark:hover:bg-slate-800 transition"
            >
              دخول بوابة الطالب
            </Link>
          </div>

          {/* Live Quick Feature highlights */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 max-w-4xl mx-auto text-right">
            <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <Video className="w-5 h-5 text-emerald-600 mb-2" />
              <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100">فيديو مباشر مدمج</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">غرف فصول افتراضية بدون برامج خارجية</p>
            </div>

            <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <Lock className="w-5 h-5 text-amber-500 mb-2" />
              <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100">التسميع المغلق الصارم</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">حجب حقيقي للمصحف من الخادم أثناء التسميع</p>
            </div>

            <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <Award className="w-5 h-5 text-emerald-600 mb-2" />
              <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100">سجل حفظ وتقييم رقمي</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">إحصائيات إتقان التجويد وعدد الأخطاء</p>
            </div>

            <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <Library className="w-5 h-5 text-purple-600 mb-2" />
              <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100">مكتبة إسلامية وتنزيل</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">كتب التجويد ونور البيان وقارئ مدمج</p>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Mushaf Section */}
      <section className="py-16 bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                الميزة الجوهرية الأقوى
              </div>
              <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-slate-100">
                مصحف تفاعلي كامل التحكم بيد المعلم
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                يتميز نظامنا بثلاثة أوضاع حقيقية تمنح المعلم السيطرة الكاملة على مجريات الحلقة:
              </p>

              <div className="space-y-3 pt-2">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
                  <h4 className="font-bold text-xs text-emerald-700 dark:text-emerald-400 mb-1">
                    ١. وضع العرض والمزامنة الحية (View Mode)
                  </h4>
                  <p className="text-xs text-slate-500">
                    يحدد المعلم السورة والصفحة لتظهر فوراً على شاشات الطلاب مع إمكانية قفل أو فتح التصفح الحر.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50">
                  <h4 className="font-bold text-xs text-red-600 dark:text-red-400 mb-1">
                    ٢. وضع التسميع المغلق الصارم (Tasmee' Locked Mode)
                  </h4>
                  <p className="text-xs text-slate-500">
                    بضغطة زر يختفي المصحف تماماً من شاشة الطالب، ويمنع الخادم استرداده حتى ينهي الشيخ التسميع ويحفظ درجات الإتقان.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50">
                  <h4 className="font-bold text-xs text-amber-700 dark:text-amber-400 mb-1">
                    ٣. وضع العرض الموجّه (Guided Mode)
                  </h4>
                  <p className="text-xs text-slate-500">
                    ينقر المعلم على أي آية ليتم إبرازها وتلوينها بالذهب فوراً لدى كل الطلاب لتتبع القراءة.
                  </p>
                </div>
              </div>
            </div>

            {/* Visual Preview */}
            <div className="quran-frame bg-amber-50/20 dark:bg-slate-950 p-6 rounded-3xl shadow-xl border-4 border-gold-accent/50 text-center">
              <span className="text-xs font-bold text-amber-600 block mb-3 font-amiri">
                بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
              </span>
              <p className="font-amiri text-2xl text-slate-900 dark:text-slate-100 leading-loose">
                الٓمٓ ﴿١﴾ ذَٰلِكَ ٱلْكِتَـٰبُ لَا رَيْبَ ۛ فِيهِ ۛ هُدًۭى لِّلْمُتَّقِينَ ﴿٢﴾ ٱلَّذِينَ يُؤْمِنُونَ بِٱلْغَيْبِ وَيُقِيمُونَ ٱلصَّلَوٰةَ وَمِمَّا رَزَقْنَـٰهُمْ يُنفِقُونَ ﴿٣﴾
              </p>
              <div className="mt-6 pt-4 border-t border-gold-accent/20 flex justify-between text-xs text-slate-400">
                <span>سورة البقرة</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">صفحة ٢</span>
                <span>الجزء الأول</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-slate-900 text-slate-400 py-12 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto px-4 text-center space-y-3">
          <p className="font-bold text-slate-200 text-sm">
            منصة ورتّل لتحفيظ القرآن الكريم والعلوم الشرعية عن بُعد
          </p>
          <p>
            تطبيق تعليمي متكامل صُمم لخدمة كتاب الله تعالى بأعلى المعايير التقنية والأمنية.
          </p>
          <p className="text-slate-600 pt-4">
            جميع الحقوق محفوظة © {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
}
