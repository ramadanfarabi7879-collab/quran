"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/components/providers/AppProviders";
import { Settings, Save, CheckCircle2, ShieldCheck, Clock, MessageSquare, Video, User } from "lucide-react";

export default function TeacherSettingsPage() {
  const { user, refreshUser } = useAuth();
  const [teacherName, setTeacherName] = useState("");
  const [teacherPhone, setTeacherPhone] = useState("");
  const [teacherTitle, setTeacherTitle] = useState("");
  const [teacherBio, setTeacherBio] = useState("");
  const [autoApprove, setAutoApprove] = useState(false);
  const [graceMinutes, setGraceMinutes] = useState(15);
  const [retentionDays, setRetentionDays] = useState(30);
  const [allowMessaging, setAllowMessaging] = useState(true);
  const [startHour, setStartHour] = useState(8);
  const [endHour, setEndHour] = useState(22);
  const [allowStudentDownload, setAllowStudentDownload] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setTeacherName(user.name || "");
      setTeacherPhone(user.phone || "");
      if (user.teacherProfile) {
        setTeacherTitle(user.teacherProfile.title || "الشيخ المقرئ");
        setTeacherBio(user.teacherProfile.bio || "");
      }
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/auth/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: teacherName,
          phone: teacherPhone,
          title: teacherTitle,
          bio: teacherBio,
        }),
      });
      if (res.ok) {
        setSaved(true);
        if (refreshUser) refreshUser();
        setTimeout(() => setSaved(false), 4000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Settings className="w-6 h-6 text-emerald-600" />
            إعدادات المعلم المتقدمة
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            التحكم الذاتي الكامل في بيانات المعلم، وسياسات القبول، ومواعيد الحضور، وضوابط التسميع والتسجيل والتواصل.
          </p>
        </div>

        {saved && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-2xl flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            تم حفظ وتحديث بيانات المعلم والإعدادات بنجاح!
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Section 0: Teacher Identity */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <User className="w-4 h-4 text-emerald-600" />
              البيانات الشخصية وهوية المعلم
            </h3>
            <p className="text-xs text-slate-500">
              قم بكتابة اسمك الحقيقي ورقم هاتفك وصفتك لتظهر لجميع الطلاب في الحلقات والشهادات.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  اسم المعلم / فضيلة الشيخ:
                </label>
                <input
                  type="text"
                  required
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  placeholder="مثال: فضيلة الشيخ..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  اللقب أو الصفة:
                </label>
                <input
                  type="text"
                  value={teacherTitle}
                  onChange={(e) => setTeacherTitle(e.target.value)}
                  placeholder="مثال: المقرئ بالقراءات العشر، معلم القرآن الكريم..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  رقم الهاتف / واتساب:
                </label>
                <input
                  type="text"
                  value={teacherPhone}
                  onChange={(e) => setTeacherPhone(e.target.value)}
                  placeholder="مثال: +966500000000"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  نبذة تعريفية ومؤهلات الإقراء:
                </label>
                <input
                  type="text"
                  value={teacherBio}
                  onChange={(e) => setTeacherBio(e.target.value)}
                  placeholder="إجازة في حفص عن عاصم، خبرة في التحفيظ..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>
          </div>

          {/* Section 1: Admission & Attendance Policy */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              سياسة القبول والحضور والغياب
            </h3>

            <div className="space-y-3 text-xs">
              <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoApprove}
                  onChange={(e) => setAutoApprove(e.target.checked)}
                  className="rounded text-islamic-600 focus:ring-islamic-500 w-4 h-4"
                />
                <div>
                  <span className="font-bold text-slate-900 dark:text-slate-100 block">
                    قبول طلبات انضمام الطلاب تلقائياً دون انتظار المراجعة اليدوية
                  </span>
                  <span className="text-[11px] text-slate-500">
                    عند التفعيل، سينضم الطالب مباشرة فور إرسال الطلب إذا كانت الحلقة لم تكتمل طاقتها.
                  </span>
                </div>
              </label>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  مدة السماح بالتأخير قبل احتساب الطالب "متأخراً" (بالدقائق):
                </label>
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={graceMinutes}
                  onChange={(e) => setGraceMinutes(Number(e.target.value))}
                  className="w-32 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Recordings & Privacy */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Video className="w-4 h-4 text-amber-500" />
              سياسة تسجيل الحلقات والاحتفاظ
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  مدة الاحتفاظ بتسجيلات الحلقات قبل الحذف التلقائي:
                </label>
                <select
                  value={retentionDays}
                  onChange={(e) => setRetentionDays(Number(e.target.value))}
                  className="w-48 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-slate-100"
                >
                  <option value={7}>٧ أيام</option>
                  <option value={30}>٣٠ يوماً (موصى به)</option>
                  <option value={60}>٦٠ يوماً</option>
                  <option value={90}>٩٠ يوماً</option>
                </select>
              </div>

              <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowStudentDownload}
                  onChange={(e) => setAllowStudentDownload(e.target.checked)}
                  className="rounded text-islamic-600 focus:ring-islamic-500 w-4 h-4"
                />
                <div>
                  <span className="font-bold text-slate-900 dark:text-slate-100 block">
                    السماح للطلاب بتنزيل ملفات تسجيلات الفيديو على أجهزتهم
                  </span>
                  <span className="text-[11px] text-slate-500">
                    عند التعطيل، يُتاح للطلاب المشاهدة داخل مشغل المنصة فقط دون رابط تنزيل مباشر.
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Section 3: Student Communication Hours */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-500" />
              ضوابط وساعات تواصل الطلاب
            </h3>

            <div className="space-y-3 text-xs">
              <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowMessaging}
                  onChange={(e) => setAllowMessaging(e.target.checked)}
                  className="rounded text-islamic-600 focus:ring-islamic-500 w-4 h-4"
                />
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  تفعيل المراسلات المباشرة مع الطلاب داخل المنصة
                </span>
              </label>

              {allowMessaging && (
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      بداية وقت استقبال الرسائل (الساعة):
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="23"
                      value={startHour}
                      onChange={(e) => setStartHour(Number(e.target.value))}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-slate-100 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      نهاية وقت استقبال الرسائل (الساعة):
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="23"
                      value={endHour}
                      onChange={(e) => setEndHour(Number(e.target.value))}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-slate-100 font-mono"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="flex items-center gap-2 bg-islamic-800 hover:bg-islamic-700 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-md transition"
            >
              <Save className="w-4 h-4" />
              حفظ وتطبيق الإعدادات
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
