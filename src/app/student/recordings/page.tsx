"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Video, Play, Clock, Calendar, Download } from "lucide-react";

export default function StudentRecordingsPage() {
  const [recordings, setRecordings] = useState<any[]>([]);
  const [playingVideo, setPlayingVideo] = useState<any | null>(null);

  useEffect(() => {
    fetch("/api/recordings")
      .then((r) => r.json())
      .then((d) => setRecordings(d.recordings || []))
      .catch(console.error);
  }, []);

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Video className="w-6 h-6 text-emerald-600" />
            تسجيلات الحلقات السابقة
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            مشاهدة تسجيلات الحلقات التي حضرتها أو فاتتك لمراجعة توجيهات وتصويبات المعلم.
          </p>
        </div>

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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {recordings.length === 0 ? (
            <div className="col-span-full p-12 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs">
              لا توجد تسجيلات متاحة حالياً.
            </div>
          ) : (
            recordings.map((rec) => (
              <div
                key={rec.id}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div
                    onClick={() => setPlayingVideo(rec)}
                    className="relative aspect-video bg-slate-900 flex items-center justify-center cursor-pointer group"
                  >
                    <div className="w-12 h-12 rounded-full bg-emerald-600/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <Play className="w-5 h-5 fill-white ml-0.5" />
                    </div>
                  </div>

                  <div className="p-4 space-y-1.5">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                      {rec.title}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{new Date(rec.createdAt).toLocaleDateString("ar-SA")}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 pt-0 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 mt-2">
                  <button
                    onClick={() => setPlayingVideo(rec)}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2 rounded-xl transition flex items-center justify-center gap-1.5 shadow"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    مشاهدة التسجيل
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </AppShell>
  );
}
