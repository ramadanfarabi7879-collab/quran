"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  BookOpen,
  Lock,
  User,
  ShieldCheck,
  GraduationCap,
  Sparkles,
  UserCheck,
} from "lucide-react";

function LoginForm() {
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "";
  const roleParam = searchParams.get("role") || "";

  const [identifier, setIdentifier] = useState("123");
  const [password, setPassword] = useState("123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (roleParam === "STUDENT" || redirectUrl.includes("student")) {
      setIdentifier("student");
      setPassword("123");
    } else if (roleParam === "ADMIN" || redirectUrl.includes("admin")) {
      setIdentifier("admin");
      setPassword("123");
    } else {
      setIdentifier("123");
      setPassword("123");
    }
  }, [roleParam, redirectUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: identifier,
          password,
          role: roleParam,
          redirect: redirectUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "فشل تسجيل الدخول");
      } else {
        if (redirectUrl && redirectUrl.startsWith("/")) {
          window.location.href = redirectUrl;
        } else if (data.user?.role === "TEACHER") {
          window.location.href = "/teacher/dashboard";
        } else if (data.user?.role === "ADMIN") {
          window.location.href = "/admin/dashboard";
        } else {
          window.location.href = "/student/dashboard";
        }
      }
    } catch {
      setError("حدث خطأ أثناء الاتصال بالخادم");
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (user: string, pass: string) => {
    setIdentifier(user);
    setPassword(pass);
    setError("");
  };

  return (
    <div className="bg-white dark:bg-slate-900 py-8 px-6 sm:px-8 shadow-xl rounded-3xl border border-slate-200 dark:border-slate-800 space-y-6">
      {error && (
        <div className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 rounded-xl text-xs font-semibold leading-relaxed">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
            اسم المستخدم / رقم الجوال أو البريد:
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
            <input
              type="text"
              required
              autoFocus
              placeholder="اكتب 123"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl pr-9 pl-3 py-2.5 text-slate-900 dark:text-slate-100 font-mono text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
            كلمة المرور:
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
            <input
              type="text"
              required
              placeholder="اكتب 123"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl pr-9 pl-3 py-2.5 text-slate-900 dark:text-slate-100 font-mono text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-islamic-800 hover:bg-islamic-700 active:scale-95 text-white font-black py-3.5 rounded-xl shadow-lg transition disabled:opacity-50 text-sm flex items-center justify-center gap-2 border border-gold-accent/30"
        >
          {loading ? (
            <span>جارٍ التحقق وتأكيد الدخول...</span>
          ) : (
            <>
              <UserCheck className="w-4 h-4 text-gold-accent" />
              <span>تسجيل الدخول للمنصة</span>
            </>
          )}
        </button>
      </form>

      {/* Authorized test accounts helper */}
      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          بيانات الحسابات التجريبية السريعة (اضغط لاختيار الدور):
        </span>

        <div className="grid grid-cols-1 gap-2">
          {/* Teacher account */}
          <button
            type="button"
            onClick={() => fillCredentials("123", "123")}
            className={`p-2.5 rounded-xl border text-right transition flex items-center justify-between group ${
              identifier === "123"
                ? "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 ring-1 ring-emerald-500"
                : "bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700"
            }`}
          >
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <span className="block text-xs font-black text-slate-900 dark:text-slate-100">
                  بوابة الشيخ والمعلم
                </span>
                <span className="block text-[11px] text-emerald-700 dark:text-emerald-300 font-bold font-mono">
                  اليوزر: 123 | الباسورد: 123
                </span>
              </div>
            </div>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 group-hover:underline">
              اختيار الشيخ
            </span>
          </button>

          {/* Student account */}
          <button
            type="button"
            onClick={() => fillCredentials("student", "123")}
            className={`p-2.5 rounded-xl border text-right transition flex items-center justify-between group ${
              identifier === "student"
                ? "bg-blue-50 dark:bg-blue-950/60 border-blue-500 ring-1 ring-blue-500"
                : "bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700"
            }`}
          >
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                <GraduationCap className="w-4 h-4" />
              </div>
              <div>
                <span className="block text-xs font-black text-slate-900 dark:text-slate-100">
                  بوابة الطالب المسجل المعتمد
                </span>
                <span className="block text-[11px] text-blue-700 dark:text-blue-300 font-bold font-mono">
                  اليوزر: student | الباسورد: 123
                </span>
              </div>
            </div>
            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 group-hover:underline">
              اختيار الطالب
            </span>
          </button>

          {/* Admin account */}
          <button
            type="button"
            onClick={() => fillCredentials("admin", "123")}
            className={`p-2.5 rounded-xl border text-right transition flex items-center justify-between group ${
              identifier === "admin"
                ? "bg-purple-50 dark:bg-purple-950/60 border-purple-500 ring-1 ring-purple-500"
                : "bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700"
            }`}
          >
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-purple-600 text-white flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <span className="block text-xs font-black text-slate-900 dark:text-slate-100">
                  لوحة الإدارة والمشرف العام
                </span>
                <span className="block text-[11px] text-purple-700 dark:text-purple-300 font-bold font-mono">
                  اليوزر: admin | الباسورد: 123
                </span>
              </div>
            </div>
            <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 group-hover:underline">
              اختيار الإدارة
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-right" dir="rtl">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2 mb-4 group">
          <div className="w-12 h-12 rounded-2xl bg-islamic-800 text-gold-accent flex items-center justify-center shadow-lg border border-gold-accent/30 group-hover:scale-105 transition-transform">
            <BookOpen className="w-6 h-6" />
          </div>
          <span className="font-black text-2xl text-islamic-800 dark:text-emerald-400">
            وَرَتِّلْ
          </span>
        </Link>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
          تسجيل الدخول إلى المنصة القرآنية
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          أدخل اسم المستخدم وكلمة المرور للمتابعة إلى بوابتك
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">جارٍ التحميل...</div>}>
          <LoginForm />
        </Suspense>

        <div className="mt-6 text-center space-y-2">
          <p className="text-xs text-slate-500">
            طالب جديد وتريد الانضمام للأكاديمية؟{" "}
            <Link href="/register" className="font-bold text-emerald-600 hover:underline">
              تقديم طلب تسجيل جديد
            </Link>
          </p>
          <div>
            <Link href="/" className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
              ← العودة إلى الصفحة الرئيسية
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
