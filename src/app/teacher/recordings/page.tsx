"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import {
  Video,
  Play,
  Download,
  Clock,
  Calendar,
  HardDrive,
  Trash2,
  Mic,
  Music,
  X,
  Sparkles,
} from "lucide-react";

export default function TeacherRecordingsPage() {
  const [recordings, setRecordings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingItem, setPlayingItem] = useState<any | null>(null);

  const fetchRecordings = async () => {
    try {
      const res = await fetch("/api/recordings");
      if (res.ok) {
        const d = await res.json();
        setRecordings(d.recordings || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecordings();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا التسجيل نهائياً؟")) return;
    try {
      const res = await fetch(`/api/recordings?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setRecordings((prev) => prev.filter((r) => r.id !== id));
        if (playingItem?.id === id) setPlayingItem(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return "1.2 ميجابايت";
    return (bytes / (1024 * 1024)).toFixed(1) + " ميجابايت";
  };

  const formatDuration = (sec: number) => {
    if (!sec || sec <= 0) return "٠:٣٠";
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Video className="w-6 h-6 text-emerald-600" />
            مكتبة تسجيلات الحلقات الافتراضية
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            مشاهدة وسماع تسجيلات الحلقات المؤرشفة (صوت وصورة أو صوت فقط)، مع سياسات الحفظ والخصوصية.
          </p>
        </div>

        {/* Media Player Modal (Audio / Video) */}
        {playingItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-slate-950 rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl border border-slate-800">
              <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {playingItem.recordingType === "AUDIO_ONLY" ? (
                    <Mic className="w-4 h-4 text-amber-400" />
                  ) : (
                    <Video className="w-4 h-4 text-emerald-400" />
                  )}
                  <span className="font-bold text-sm">{playingItem.title}</span>
                </div>
                <button
                  onClick={() => setPlayingItem(null)}
                  className="text-slate-400 hover:text-white text-xs font-bold bg-slate-800 px-3 py-1 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {playingItem.recordingType === "AUDIO_ONLY" ? (
                <div className="p-8 sm:p-12 flex flex-col items-center justify-center text-center space-y-5 bg-gradient-to-b from-slate-900 to-slate-950">
                  <div className="w-20 h-20 rounded-3xl bg-amber-500/10 border-2 border-amber-500/30 flex items-center justify-center text-amber-400 shadow-xl animate-pulse">
                    <Mic className="w-10 h-10" />
                  </div>
                  <div>
                    <h3 className="font-black text-base text-white">{playingItem.title}</h3>
                    <span className="text-xs text-amber-300 font-bold mt-1 inline-block bg-amber-500/20 px-3 py-1 rounded-full">
                      تسجيل صوتي فقط (عالي النقاء)
                    </span>
                  </div>
                  <audio
                    src={playingItem.videoUrl}
                    controls
                    autoPlay
                    className="w-full max-w-md mt-2 accent-amber-500"
                  />
                </div>
              ) : (
                <div className="aspect-video bg-black flex items-center justify-center">
                  <video
                    src={playingItem.videoUrl}
                    controls
                    autoPlay
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Recordings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {loading ? (
            <div className="col-span-full p-12 text-center text-slate-400 text-xs">
              جارٍ تحميل التسجيلات...
            </div>
          ) : recordings.length === 0 ? (
            <div className="col-span-full p-12 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs">
              لا توجد تسجيلات محفوظة حالياً. يتم إنشاء التسجيلات تلقائياً عند الضغط على "بدء التسجيل" داخل الحلقة بعد اختيار نوع التسجيل (صوت وصورة أو صوت فقط).
            </div>
          ) : (
            recordings.map((rec) => {
              const isAudioOnly = rec.recordingType === "AUDIO_ONLY";
              return (
                <div
                  key={rec.id}
                  className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between"
                >
                  <div>
                    <div
                      className={`relative aspect-video flex items-center justify-center group cursor-pointer ${
                        isAudioOnly
                          ? "bg-gradient-to-tr from-slate-900 via-amber-950/40 to-slate-900"
                          : "bg-slate-900"
                      }`}
                      onClick={() => setPlayingItem(rec)}
                    >
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform ${
                          isAudioOnly
                            ? "bg-amber-500 text-slate-950 font-black"
                            : "bg-emerald-600/90 text-white"
                        }`}
                      >
                        {isAudioOnly ? (
                          <Mic className="w-5 h-5 ml-0.5" />
                        ) : (
                          <Play className="w-5 h-5 fill-white ml-0.5" />
                        )}
                      </div>

                      {/* Recording Type Tag */}
                      <span
                        className={`absolute top-2.5 right-2.5 text-[10px] font-bold px-2 py-0.5 rounded-lg backdrop-blur ${
                          isAudioOnly
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                            : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        }`}
                      >
                        {isAudioOnly ? "🎙️ تسجيل صوتي" : "🎥 صوت وصورة"}
                      </span>

                      <span className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded">
                        {formatDuration(rec.durationSeconds)}
                      </span>
                    </div>

                    <div className="p-4 space-y-2">
                      <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 line-clamp-1">
                        {rec.title}
                      </h3>
                      <div className="space-y-1 text-xs text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>التاريخ: {new Date(rec.createdAt).toLocaleDateString("ar-SA")}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <HardDrive className="w-3.5 h-3.5 text-slate-400" />
                          <span>حجم الملف: {formatFileSize(rec.fileSizeBytes)}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-amber-600 font-medium text-[11px]">
                          <Clock className="w-3.5 h-3.5" />
                          <span>مدة الحفظ: {rec.retentionDays || 30} يوماً</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 pt-0 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2 mt-2">
                    <button
                      onClick={() => setPlayingItem(rec)}
                      className={`flex-1 font-bold text-xs py-2 rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm text-white ${
                        isAudioOnly
                          ? "bg-amber-600 hover:bg-amber-500"
                          : "bg-emerald-600 hover:bg-emerald-500"
                      }`}
                    >
                      {isAudioOnly ? <Mic className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-white" />}
                      <span>{isAudioOnly ? "استماع للتسجيل" : "تشغيل التسجيل"}</span>
                    </button>

                    <a
                      href={rec.videoUrl}
                      download
                      className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 hover:text-emerald-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                      title="تحميل الملف"
                    >
                      <Download className="w-4 h-4" />
                    </a>

                    <button
                      onClick={() => handleDelete(rec.id)}
                      className="p-2 border border-red-200 dark:border-red-900/40 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                      title="حذف التسجيل"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </AppShell>
  );
}
