"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Settings, Save, CheckCircle2, Palette, Shield, Globe } from "lucide-react";

export default function AdminSettingsPage() {
  const [platformName, setPlatformName] = useState("منصة ورتّل لتحفيظ القرآن الكريم");
  const [platformDesc, setPlatformDesc] = useState(
    "أكاديمية تعليمية متكاملة لتحفيظ القرآن الكريم والتجويد والعلوم الشرعية عن بُعد مع إدارة الحلقات الحية والتحكم التفاعلي بالمصحف"
  );
  const [contactEmail, setContactEmail] = useState("support@warattel.com");
  const [allowRegistration, setAllowRegistration] = useState(true);
  const [primaryColor, setPrimaryColor] = useState("#064e3b");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.settings) {
          if (d.settings.platform_name) setPlatformName(d.settings.platform_name);
          if (d.settings.platform_description) setPlatformDesc(d.settings.platform_description);
          if (d.settings.contact_email) setContactEmail(d.settings.contact_email);
          if (d.settings.allow_registration) setAllowRegistration(d.settings.allow_registration === "true");
        }
      })
      .catch(console.error);
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settings: {
            platform_name: platformName,
            platform_description: platformDesc,
            contact_email: contactEmail,
            allow_registration: String(allowRegistration),
          },
        }),
      });

      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
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
            إعدادات المنصة والهوية البصرية
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            تخصيص اسم المنصة، والشعار، وسياسات التسجيل العامة والاتصال.
          </p>
        </div>

        {saved && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-2xl flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            تم حفظ اسم المنصة وإعداداتها بنجاح!
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Globe className="w-4 h-4 text-emerald-600" />
              البيانات العامة للمنصة
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  اسم المنصة أو الأكاديمية:
                </label>
                <input
                  type="text"
                  required
                  value={platformName}
                  onChange={(e) => setPlatformName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  الوصف التعريفي العام:
                </label>
                <textarea
                  rows={3}
                  value={platformDesc}
                  onChange={(e) => setPlatformDesc(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-slate-100 leading-relaxed"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  البريد الإلكتروني الرسمي للدعم الفني:
                </label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 font-mono"
                />
              </div>

              <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 cursor-pointer pt-2">
                <input
                  type="checkbox"
                  checked={allowRegistration}
                  onChange={(e) => setAllowRegistration(e.target.checked)}
                  className="rounded text-islamic-600 focus:ring-islamic-500 w-4 h-4"
                />
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  السماح للطلاب الجدد بإنشاء حسابات ذاتية من الواجهة العامة
                </span>
              </label>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 bg-islamic-800 hover:bg-islamic-700 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-md transition"
            >
              <Save className="w-4 h-4" />
              {saving ? "جارٍ الحفظ..." : "حفظ إعدادات المنصة"}
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
