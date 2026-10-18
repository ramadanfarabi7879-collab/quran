"use client";

import React, { useState, useEffect, useRef } from "react";
import { AppShell } from "@/components/layout/AppShell";
import {
  FileCheck2,
  Mic,
  Square,
  Play,
  RotateCcw,
  Send,
  CheckCircle2,
  Clock,
  Award,
  AlertCircle,
} from "lucide-react";

export default function StudentAssignmentsPage() {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState<any | null>(null);

  // Audio recording state
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const fetchAssignments = async () => {
    try {
      const res = await fetch("/api/assignments");
      if (res.ok) {
        const d = await res.json();
        setAssignments(d.assignments || []);
        if (d.assignments?.[0]) setSelectedAssignment(d.assignments[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  // Timer for recording
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordSeconds((s) => s + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordSeconds(0);
      setAudioBlob(null);
      setAudioUrl(null);
    } catch (err) {
      alert("يرجى السماح بالوصول إلى الميكروفون لتسجيل التسميع المنزلي.");
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleResetRecording = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordSeconds(0);
  };

  const handleSubmitHomework = async () => {
    if (!selectedAssignment) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SUBMIT_HOMEWORK",
          assignmentId: selectedAssignment.id,
          notes: notes || "تم التسجيل بحمد الله",
          audioUrl: audioUrl || "/audio/sample-recitation.mp3",
          audioDuration: recordSeconds || 45,
        }),
      });

      if (res.ok) {
        setSubmitSuccess(true);
        setTimeout(() => setSubmitSuccess(false), 4000);
        fetchAssignments();
        handleResetRecording();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const mySubmission = selectedAssignment?.submissions?.[0];

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FileCheck2 className="w-6 h-6 text-emerald-600" />
            واجباتي وتسليم التسميع المنزلي
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            سجل صوتك بالتسميع مباشرة من المتصفح وارفعه للمعلم لمراجعته ورصد التقييم والتصحيح.
          </p>
        </div>

        {submitSuccess && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-2xl flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            تم تسليم الواجب وإرسال إشعار فوري لفضيلة الشيخ بنجاح!
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Assignments List */}
          <div className="lg:col-span-1 space-y-3">
            <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider">
              قائمة التكليفات المطلوبة
            </h3>
            {assignments.map((a) => {
              const isSelected = selectedAssignment?.id === a.id;
              const hasSubmission = a.submissions?.length > 0;

              return (
                <div
                  key={a.id}
                  onClick={() => setSelectedAssignment(a)}
                  className={`p-4 rounded-2xl border transition cursor-pointer space-y-1.5 ${
                    isSelected
                      ? "bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-500 ring-2 ring-emerald-500/20"
                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                      {a.title}
                    </span>
                    {hasSubmission ? (
                      <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> تم التسليم
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-amber-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> مطلوب
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-500 block">
                    موعد التسليم: {new Date(a.dueDate).toLocaleDateString("ar-SA")}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Submission and Voice Recorder Details */}
          <div className="lg:col-span-2">
            {selectedAssignment ? (
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-emerald-600">
                      {selectedAssignment.halaqa?.name}
                    </span>
                    <span className="text-xs text-slate-400">
                      تاريخ الاستحقاق: {new Date(selectedAssignment.dueDate).toLocaleDateString("ar-SA")}
                    </span>
                  </div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">
                    {selectedAssignment.title}
                  </h2>
                  {selectedAssignment.instructions && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl mt-3 leading-relaxed">
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        توجيهات المعلم:{" "}
                      </span>
                      {selectedAssignment.instructions}
                    </p>
                  )}
                </div>

                {/* If already graded, show grade & feedback */}
                {mySubmission?.status === "GRADED" && (
                  <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800/60 p-5 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-emerald-600" />
                        تم تصحيح الواجب من فضيلة الشيخ
                      </span>
                      <span className="text-base font-black text-emerald-700 dark:text-emerald-300">
                        الدرجة: {mySubmission.grade}/١٠٠
                      </span>
                    </div>
                    {mySubmission.teacherFeedback && (
                      <p className="text-xs text-slate-700 dark:text-slate-300 pt-2 border-t border-emerald-200/60 dark:border-emerald-900/60">
                        <span className="font-bold">ملاحظات الشيخ: </span>
                        {mySubmission.teacherFeedback}
                      </p>
                    )}
                  </div>
                )}

                {/* In-Browser Voice Recorder */}
                <div className="bg-slate-50 dark:bg-slate-800/40 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center space-y-4">
                  <span className="font-bold text-xs text-slate-700 dark:text-slate-300 block">
                    تسجيل التلاوة والتسميع المنزلي عبر الميكروفون
                  </span>

                  {/* Recorder Controls */}
                  <div className="flex flex-col items-center justify-center space-y-3">
                    {isRecording ? (
                      <button
                        onClick={stopVoiceRecording}
                        className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-xl animate-pulse transition"
                        title="إيقاف التسجيل"
                      >
                        <Square className="w-6 h-6 fill-white" />
                      </button>
                    ) : (
                      <button
                        onClick={startVoiceRecording}
                        className="w-16 h-16 rounded-full bg-islamic-800 hover:bg-islamic-700 text-white flex items-center justify-center shadow-xl transition hover:scale-105"
                        title="بدء التسجيل الصوتي"
                      >
                        <Mic className="w-7 h-7" />
                      </button>
                    )}

                    <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300">
                      {isRecording
                        ? `جارٍ التسجيل: ${recordSeconds} ثانية`
                        : audioUrl
                        ? `تم التسجيل بنجاح (${recordSeconds} ثانية)`
                        : "اضغط على الميكروفون لبدء التسجيل"}
                    </span>

                    {/* Audio Player Preview */}
                    {audioUrl && (
                      <div className="w-full max-w-md pt-2 flex items-center gap-3">
                        <audio src={audioUrl} controls className="w-full h-10" />
                        <button
                          onClick={handleResetRecording}
                          title="إعادة التسجيل"
                          className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div>
                    <input
                      type="text"
                      placeholder="أضف ملاحظة للمعلم (اختياري)..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full max-w-md mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={handleSubmitHomework}
                      disabled={submitting}
                      className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-md transition disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      {submitting ? "جارٍ الإرسال..." : "تسليم الواجب الآن"}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-400 text-xs">
                اختر واجباً من القائمة لعرض تفاصيله وتسليمه
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
