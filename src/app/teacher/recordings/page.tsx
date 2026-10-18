"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Video, Play, Download, Clock, Calendar, ShieldCheck, HardDrive, Trash2 } from "lucide-react";

export default function TeacherRecordingsPage() {
  const [recordings, setRecordings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingVideo, setPlayingVideo] = useState<any | null>(null);

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

  const formatFileSize = (bytes: number) => {
    return (bytes / (1024 * 1024)).toFixed(1) + " ميجابايت";
  };

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    return `${m} دقيقة`;
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
            مشاهدة تسجيلات الحلقات المؤرشفة، مع تطبيق سياسات الاحتفاظ التلقائية (٣٠ - ٩٠ يوماً) وضوابط الخصوصية.
          </p>
        </div>

        {/* Video Player Modal */}
        {playingVideo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-slate-950 rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl border border-slate-800">
              <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
                <span className="font-bold text-sm">{playingVideo.title}</span>
                <button
                  onClick={() => setPlayingVideo(null)}
                  className="text-slate-400 hover:text-white text-xs font-bold bg-slate-800 px-3 py-1 rounded-lg"
                >
                  إغلاق
                </button>
              </div>
              <div className="aspect-video bg-black flex items-center justify-center">
                <video
                  src={playingVideo.videoUrl}
                  controls
                  autoPlay
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          </div>
        )}

        {/* Recordings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {recordings.length === 0 ? (
            <div className="col-span-full p-12 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs">
              لا توجد تسجيلات محفوظة حالياً. يتم إنشاء التسجيلات تلقائياً عند الضغط على "بدء التسجيل" داخل الحلقة.
            </div>
          ) : (
            recordings.map((rec) => (
              <div
                key={rec.id}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="relative aspect-video bg-slate-900 flex items-center justify-center group cursor-pointer"
                       onClick={() => setPlayingVideo(rec)}>
                    <div className="w-12 h-12 rounded-full bg-emerald-600/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <Play className="w-5 h-5 fill-white ml-0.5" />
                    </div>
                    <span className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded">
                      {formatDuration(rec.durationSeconds)}
                    </span>
                  </div>

                  <div className="p-4 space-y-2">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
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
                      <div className="flex items-center gap-1.5 text-amber-600 font-medium">
                        <Clock className="w-3.5 h-3.5" />
                        <span>مدة الحفظ: {rec.retentionDays} يوماً (حتى {new Date(rec.expiresAt).toLocaleDateString("ar-SA")})</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 pt-0 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2 mt-2">
                  <button
                    onClick={() => setPlayingVideo(rec)}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2 rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    تشغيل التسجيل
                  </button>
                  <a
                    href={rec.videoUrl}
                    download
                    className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 hover:text-emerald-600 hover:bg-slate-50 dark:hover:bg-slate-800"
                    title="تحميل"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </AppShell>
  );
}
