"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AppProviders";
import { BookOpen, Lock, Mail, Sparkles, CheckCircle2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { switchUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "فشل تسجيل الدخول");
      } else {
        if (data.user?.role === "TEACHER") router.push("/teacher/dashboard");
        else if (data.user?.role === "ADMIN") router.push("/admin/dashboard");
        else router.push("/student/dashboard");
      }
    } catch {
      setError("حدث خطأ أثناء الاتصال بالخادم");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDirectLogin = async (role: string, email: string, path: string) => {
    setLoading(true);
    await switchUser(role, email);
    router.push(path);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
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
          أدخل بيانات حسابك للمتابعة إلى الحلقات وغرف التسميع
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white dark:bg-slate-900 py-8 px-6 sm:px-8 shadow-xl rounded-3xl border border-slate-200 dark:border-slate-800 space-y-6">
          {error && (
            <div className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 rounded-xl text-xs font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                البريد الإلكتروني:
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl pr-9 pl-3 py-2.5 text-slate-900 dark:text-slate-100 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                كلمة المرور:
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl pr-9 pl-3 py-2.5 text-slate-900 dark:text-slate-100 font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-islamic-800 hover:bg-islamic-700 text-white font-bold py-3 rounded-xl shadow-md transition disabled:opacity-50 text-xs"
            >
              {loading ? "جارٍ تسجيل الدخول..." : "دخول المنصة"}
            </button>
          </form>

          {/* Direct Role Portals */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-gold-accent" />
              الدخول المباشر للبوابات الرسمية:
            </span>

            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={() =>
                  handleQuickDirectLogin("TEACHER", "teacher@quran.com", "/teacher/dashboard")
                }
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-slate-200 dark:border-slate-700 text-right transition flex items-center justify-between"
              >
                <div>
                  <span className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                    بوابة المعلم والمقرئ
                  </span>
                  <span className="block text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                    تسجيل الدخول المباشر لمعلم الحلقات
                  </span>
                </div>
                <span className="text-[11px] font-bold text-emerald-600">دخول المعلم ←</span>
              </button>

              <Link
                href="/register"
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-slate-200 dark:border-slate-700 text-right transition flex items-center justify-between group"
              >
                <div>
                  <span className="block text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-emerald-700 dark:group-hover:text-emerald-300">
                    بوابة تسجيل الطلاب الجدد
                  </span>
                  <span className="block text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                    طلب انضمام طالب للأكاديمية والالتحاق بالحلقات
                  </span>
                </div>
                <span className="text-[11px] font-bold text-emerald-600">تسجيل طالب جديد ←</span>
              </Link>

              <button
                onClick={() => handleQuickDirectLogin("ADMIN", "admin@quran.com", "/admin/dashboard")}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-950/40 border border-slate-200 dark:border-slate-700 text-right transition flex items-center justify-between"
              >
                <div>
                  <span className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                    الإدارة العامة للمنصة
                  </span>
                  <span className="block text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                    لوحة الإشراف المركزي
                  </span>
                </div>
                <span className="text-[11px] font-bold text-amber-600">دخول الإدارة ←</span>
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-500 mt-4">
          ليس لديك حساب؟{" "}
          <Link href="/register" className="font-bold text-emerald-600 hover:underline">
            أنشئ حساباً جديداً
          </Link>
        </p>
      </div>
    </div>
  );
}
