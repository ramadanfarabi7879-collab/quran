"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, User, Mail, Lock, Phone, GraduationCap, CheckCircle2, Clock } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState("STUDENT");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [guardianName, setGuardianName] = useState("");
  const [guardianPhone, setGuardianPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submittedPending, setSubmittedPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          name,
          email,
          password,
          phone,
          guardianName,
          guardianPhone,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "فشل إنشاء الحساب");
      } else {
        if (data.requiresApproval) {
          setSubmittedPending(true);
        } else if (role === "TEACHER") {
          router.push("/teacher/dashboard");
        } else {
          router.push("/student/dashboard");
        }
      }
    } catch {
      setError("حدث خطأ أثناء الاتصال بالخادم");
    } finally {
      setLoading(false);
    }
  };

  if (submittedPending) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-4 group">
            <div className="w-12 h-12 rounded-2xl bg-islamic-800 text-gold-accent flex items-center justify-center shadow-lg border border-gold-accent/30 group-hover:scale-105 transition-transform">
              <BookOpen className="w-6 h-6" />
            </div>
            <span className="font-black text-2xl text-islamic-800 dark:text-emerald-400">
              وَرَتِّلْ
            </span>
          </Link>
        </div>

        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white dark:bg-slate-900 py-8 px-6 sm:px-8 shadow-2xl rounded-3xl border-2 border-emerald-500/50 text-center space-y-5">
            <div className="w-16 h-16 rounded-3xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 font-bold text-xs mb-2">
                <Clock className="w-3.5 h-3.5 animate-spin" />
                طلبك قيد المراجعة والاعتماد لدى فضيلة الشيخ
              </span>
              <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 mt-2">
                تم تسجيل بياناتك بنجاح!
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                مرحباً بك يا <strong className="text-emerald-600">{name}</strong>. تم إرسال إشعار فوري لمعلم ومقرئ الحلقة لمراجعة بياناتك وتفعيل حسابك.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-xs text-slate-500 dark:text-slate-400 text-right space-y-1">
              <div>البريد المسجل: <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{email}</span></div>
              {phone && <div>رقم الجوال: <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{phone}</span></div>}
              <div>الحالة: <span className="font-bold text-amber-600">بانتظار موافقة المعلم</span></div>
            </div>

            <div className="pt-2">
              <Link
                href="/login"
                className="w-full inline-flex items-center justify-center py-3 px-4 rounded-xl bg-islamic-800 hover:bg-islamic-700 text-white font-bold text-xs shadow-md transition"
              >
                الذهاب إلى صفحة تسجيل الدخول
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
          إنشاء حساب جديد في الأكاديمية
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          اختر نوع الحساب وأدخل بياناتك للبدء في الحلقات القرآنية
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white dark:bg-slate-900 py-8 px-6 sm:px-8 shadow-xl rounded-3xl border border-slate-200 dark:border-slate-800 space-y-6">
          {error && (
            <div className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 rounded-xl text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Role selector */}
          <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl text-xs font-bold">
            <button
              type="button"
              onClick={() => setRole("STUDENT")}
              className={`py-2 rounded-xl transition ${
                role === "STUDENT"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow"
                  : "text-slate-500"
              }`}
            >
              طالب في حلقة
            </button>
            <button
              type="button"
              onClick={() => setRole("TEACHER")}
              className={`py-2 rounded-xl transition ${
                role === "TEACHER"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow"
                  : "text-slate-500"
              }`}
            >
              معلم ومقرئ
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                الاسم الثلاثي:
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder="محمد أحمد عبد الله"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl pr-9 pl-3 py-2.5 text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

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

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                رقم الجوال:
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                <input
                  type="tel"
                  placeholder="+966500000000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl pr-9 pl-3 py-2.5 text-slate-900 dark:text-slate-100 font-mono"
                />
              </div>
            </div>

            {role === "STUDENT" && (
              <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    اسم ولي الأمر:
                  </label>
                  <input
                    type="text"
                    placeholder="للطلاب الناشئة"
                    value={guardianName}
                    onChange={(e) => setGuardianName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    هاتف ولي الأمر:
                  </label>
                  <input
                    type="tel"
                    placeholder="رقم التواصل"
                    value={guardianPhone}
                    onChange={(e) => setGuardianPhone(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-islamic-800 hover:bg-islamic-700 text-white font-bold py-3 rounded-xl shadow-md transition disabled:opacity-50 text-xs mt-2"
            >
              {loading ? "جارٍ إنشاء الحساب..." : "تأكيد وإنشاء الحساب"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-500 mt-4">
          لديك حساب بالفعل؟{" "}
          <Link href="/login" className="font-bold text-emerald-600 hover:underline">
            تسجيل الدخول
          </Link>
        </p>
      </div>
    </div>
  );
}
