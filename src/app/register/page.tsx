"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  User,
  Phone,
  Mail,
  Lock,
  Calendar,
  Sparkles,
  CheckCircle2,
  Users,
  MessageSquare,
  Clock,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

export default function RegisterStudentPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [age, setAge] = useState("");
  const [currentLevel, setCurrentLevel] = useState("قصار السور (جزء عمّ)");
  const [preferredTrack, setPreferredTrack] = useState<"GROUP" | "INDIVIDUAL" | "FOUNDATION">("GROUP");
  const [guardianName, setGuardianName] = useState("");
  const [guardianPhone, setGuardianPhone] = useState("");
  const [registrationNotes, setRegistrationNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submittedData, setSubmittedData] = useState<any | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: "STUDENT",
          name,
          phone,
          email: email.trim() || undefined,
          password,
          age: age ? parseInt(age, 10) : undefined,
          currentLevel,
          preferredTrack,
          guardianName,
          guardianPhone,
          registrationNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "فشل إرسال طلب التسجيل");
      } else {
        setSubmittedData({
          name,
          phone,
          email: email.trim() || "غير مدخل (اختياري)",
          age: age ? `${age} سنة` : "غير محدد",
          currentLevel,
          preferredTrackLabel:
            preferredTrack === "INDIVIDUAL"
              ? "حلقة خاصة فردية"
              : preferredTrack === "FOUNDATION"
              ? "مسار التأسيس والقاعدة النورانية"
              : "حلقة جماعية",
          notes: registrationNotes,
        });
      }
    } catch {
      setError("حدث خطأ أثناء الاتصال بالخادم");
    } finally {
      setLoading(false);
    }
  };

  // Screen after student submits: Their part is 100% finished, request sent to Sheikh!
  if (submittedData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-950/20 via-slate-50 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
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

        <div className="sm:mx-auto sm:w-full sm:max-w-lg">
          <div className="bg-white dark:bg-slate-900 py-8 px-6 sm:px-10 shadow-2xl rounded-3xl border-2 border-emerald-500/60 text-center space-y-6 animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 rounded-3xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner border border-emerald-500/30">
              <CheckCircle2 className="w-10 h-10 animate-bounce" />
            </div>

            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-black text-xs">
                <Clock className="w-3.5 h-3.5 animate-spin" />
                طلبك الآن قيد المعالجة والاعتماد لدى فضيلة الشيخ
              </span>
              <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100">
                تم إرسال طلب تسجيلك بنجاح!
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                مرحباً بك يا <strong className="text-emerald-600 font-black">{submittedData.name}</strong>.
                انتهى دورك الآن، وصل طلبك مباشرة إلى فضيلة الشيخ لمراجعة بياناتك، وتحديد المسار والموعد المناسب والتواصل معك.
              </p>
            </div>

            {/* Summary card */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-right space-y-2 text-xs">
              <div className="flex justify-between border-b border-slate-200/60 dark:border-slate-700/60 pb-2">
                <span className="text-slate-500">اسم الطالب:</span>
                <span className="font-black text-slate-900 dark:text-slate-100">{submittedData.name}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 dark:border-slate-700/60 pb-2">
                <span className="text-slate-500">رقم الجوال للتواصل:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{submittedData.phone}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 dark:border-slate-700/60 pb-2">
                <span className="text-slate-500">العمر / السن:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{submittedData.age}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 dark:border-slate-700/60 pb-2">
                <span className="text-slate-500">المستوى القرآني:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{submittedData.currentLevel}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 dark:border-slate-700/60 pb-2">
                <span className="text-slate-500">المسار المطلوب:</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">{submittedData.preferredTrackLabel}</span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-slate-500">حالة الطلب:</span>
                <span className="font-black text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                  بانتظار قرار الشيخ (معلق)
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <Link
                href="/"
                className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition"
              >
                العودة للرئيسية
              </Link>
              <button
                onClick={() => {
                  setSubmittedData(null);
                  setName("");
                  setPhone("");
                  setEmail("");
                  setPassword("");
                  setAge("");
                  setGuardianName("");
                  setGuardianPhone("");
                  setRegistrationNotes("");
                }}
                className="py-3 px-4 rounded-xl bg-islamic-800 hover:bg-islamic-700 text-white font-bold text-xs shadow transition"
              >
                تسجيل طالب آخر
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl text-center">
        <Link href="/" className="inline-flex items-center gap-2 mb-3 group">
          <div className="w-12 h-12 rounded-2xl bg-islamic-800 text-gold-accent flex items-center justify-center shadow-lg border border-gold-accent/30 group-hover:scale-105 transition-transform">
            <BookOpen className="w-6 h-6" />
          </div>
          <span className="font-black text-2xl text-islamic-800 dark:text-emerald-400">
            وَرَتِّلْ
          </span>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 flex items-center justify-center gap-2">
          <Sparkles className="w-6 h-6 text-gold-accent" />
          طلب تسجيل طالب جديد
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
          املأ بياناتك أدناه وسيتولى فضيلة الشيخ مراجعة طلبك وتحديد المسار والموعد الأنسب لك.
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white dark:bg-slate-900 py-8 px-6 sm:px-10 shadow-xl rounded-3xl border border-slate-200 dark:border-slate-800 space-y-6">
          {error && (
            <div className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 rounded-xl text-xs font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* 1. Name */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                اسم الطالب كاملاً (رباعي أو ثلاثي): <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder="محمد أحمد إبراهيم المنصور"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl pr-9 pl-3 py-2.5 text-slate-900 dark:text-slate-100 font-medium"
                />
              </div>
            </div>

            {/* 2. Phone & Email in 2 columns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Phone (Mandatory) */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  رقم الجوال / الواتساب: <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                  <input
                    type="tel"
                    required
                    placeholder="0500000000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl pr-9 pl-3 py-2.5 text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>
                <span className="text-[10px] text-slate-400 block mt-1">
                  للتواصل واستلام المواعيد، ويمكنك تسجيل الدخول به
                </span>
              </div>

              {/* Email (Optional!) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    البريد الإلكتروني:
                  </label>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                    (اختياري - غير إجباري)
                  </span>
                </div>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                  <input
                    type="email"
                    placeholder="اختياري (يمكنك تركه فارغاً)"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl pr-9 pl-3 py-2.5 text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* 3. Password & Age */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  كلمة المرور: <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                  <input
                    type="password"
                    required
                    placeholder="كلمة المرور للدخول للحساب"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl pr-9 pl-3 py-2.5 text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  العمر / السن:
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                  <input
                    type="number"
                    min="4"
                    max="99"
                    placeholder="مثال: 14"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl pr-9 pl-3 py-2.5 text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* 4. Current Quranic Level */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                المستوى الحالي في حفظ وتلاوة القرآن الكريم:
              </label>
              <select
                value={currentLevel}
                onChange={(e) => setCurrentLevel(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:border-amber-400"
              >
                <option value="مبتدئ (تعلم القراءة الصحيحة والتجويد)">مبتدئ (تعلم القراءة الصحيحة والتجويد)</option>
                <option value="قصار السور (جزء عمّ)">قصار السور (جزء عمّ)</option>
                <option value="من (1 إلى 5 أجزاء)">من (1 إلى 5 أجزاء)</option>
                <option value="من (5 إلى 15 جزءاً)">من (5 إلى 15 جزءاً)</option>
                <option value="أكثر من 15 جزءاً">أكثر من 15 جزءاً</option>
                <option value="خاتم لكتاب الله كاملاً (تثبيت وإجازة)">خاتم لكتاب الله كاملاً (تثبيت وإجازة)</option>
              </select>
            </div>

            {/* 5. Preferred Track */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                المسار المرغوب في الأكاديمية:
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPreferredTrack("GROUP")}
                  className={`p-2.5 rounded-xl border text-center transition ${
                    preferredTrack === "GROUP"
                      ? "bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-black shadow-sm"
                      : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  <Users className="w-4 h-4 mx-auto mb-1" />
                  <span className="block text-[11px]">حلقة جماعية</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPreferredTrack("INDIVIDUAL")}
                  className={`p-2.5 rounded-xl border text-center transition ${
                    preferredTrack === "INDIVIDUAL"
                      ? "bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-black shadow-sm"
                      : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  <User className="w-4 h-4 mx-auto mb-1" />
                  <span className="block text-[11px]">حلقة فردية خاصة</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPreferredTrack("FOUNDATION")}
                  className={`p-2.5 rounded-xl border text-center transition ${
                    preferredTrack === "FOUNDATION"
                      ? "bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-black shadow-sm"
                      : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  <BookOpen className="w-4 h-4 mx-auto mb-1" />
                  <span className="block text-[11px]">تأسيس وقاعدة نورانية</span>
                </button>
              </div>
            </div>

            {/* 6. Guardian Info (Optional) */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                بيانات ولي الأمر (للطلاب الناشئة - اختياري):
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="اسم ولي الأمر"
                  value={guardianName}
                  onChange={(e) => setGuardianName(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100"
                />
                <input
                  type="tel"
                  placeholder="هاتف ولي الأمر"
                  value={guardianPhone}
                  onChange={(e) => setGuardianPhone(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 font-mono"
                />
              </div>
            </div>

            {/* 7. Student Notes */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                ملاحظات أو رغبة خاصة لفضيلة الشيخ (اختياري):
              </label>
              <div className="relative">
                <MessageSquare className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                <textarea
                  rows={2}
                  placeholder="مثال: أفضل الحلقات في المساء بعد صلاة العصر، أو أود البدء من سورة البقرة..."
                  value={registrationNotes}
                  onChange={(e) => setRegistrationNotes(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl pr-9 pl-3 py-2.5 text-slate-900 dark:text-slate-100 resize-none"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black py-3.5 rounded-2xl shadow-lg transition active:scale-98 disabled:opacity-50 text-sm flex items-center justify-center gap-2 mt-2"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>{loading ? "جارٍ إرسال الطلب لفضيلة الشيخ..." : "إرسال طلب التسجيل لفضيلة الشيخ 📨"}</span>
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-500 mt-4">
          لديك حساب معتمد بالفعل؟{" "}
          <Link href="/login" className="font-bold text-emerald-600 hover:underline">
            تسجيل الدخول
          </Link>
        </p>
      </div>
    </div>
  );
}
