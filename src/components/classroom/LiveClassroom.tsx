"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Script from "next/script";
import { useSearchParams } from "next/navigation";
import { useAuth, useRealtime } from "@/components/providers/AppProviders";
import { InteractiveMushaf } from "@/components/mushaf/InteractiveMushaf";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  Hand,
  PhoneOff,
  Users,
  MessageSquare,
  Circle,
  VolumeX,
  Volume2,
  CheckCircle2,
  Radio,
  Send,
  AlertCircle,
  Sparkles,
  RefreshCw,
  Lock,
  Clock,
  ShieldCheck,
  UserPlus,
  UserCheck,
  Bell,
  X,
} from "lucide-react";
import { playTeacherJoinAlertSound, playStudentApprovedSound } from "@/lib/sound";

interface LiveClassroomProps {
  sessionId: string;
}

export function LiveClassroom({ sessionId }: LiveClassroomProps) {
  const { user } = useAuth();
  const { lastEvent } = useRealtime();
  const searchParams = useSearchParams();
  const roleParam = searchParams.get("role");

  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [authStatus, setAuthStatus] = useState<"CHECKING" | "AUTHORIZED" | "PENDING_APPROVAL" | "NEEDS_REQUEST" | "REJECTED">("CHECKING");
  const [halaqaInfo, setHalaqaInfo] = useState<{ name: string; teacherName: string; id: string }>({
    name: "حلقة التحفيظ والتجويد",
    teacherName: "فضيلة المعلم",
    id: "",
  });
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [requestSuccessMsg, setRequestSuccessMsg] = useState("");

  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [activeTab, setActiveTab] = useState<"MUSHAF" | "CHAT" | "PARTICIPANTS">("MUSHAF");
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [studentHandAlert, setStudentHandAlert] = useState<{ studentName: string; visible: boolean } | null>(null);
  const [jitsiReady, setJitsiReady] = useState(false);
  const [jitsiLoaded, setJitsiLoaded] = useState(false);

  const [chatMessages, setChatMessages] = useState<any[]>([
    {
      sender: "النظام",
      text: "مرحباً بكم في الحلقة القرآنية المباشرة. تم تفعيل الصوت والفيديو التفاعلي.",
      time: "16:00",
      system: true,
    },
  ]);
  const [chatInput, setChatInput] = useState("");

  // Jitsi refs
  const jitsiContainerRef = useRef<HTMLDivElement | null>(null);
  const jitsiApiRef = useRef<any>(null);

  // Signaling refs (kept for chat & hand raise via signaling channel)
  const lastSignalIdRef = useRef<number>(0);
  const [clientId] = useState(() => "peer-" + Math.random().toString(36).substring(2, 9));

  // Determine if this screen is Teacher
  const isTeacher =
    roleParam === "teacher"
      ? true
      : roleParam === "student"
      ? false
      : user?.role === "TEACHER" || user?.role === "ADMIN" || session?.halaqa?.teacher?.userId === user?.id;

  const myRole = isTeacher ? "teacher" : "student";
  const myName = user?.name || (isTeacher ? "معلم الحلقة" : "طالب العلم");

  // Fetch session details & verify Sheikh approval
  const fetchSession = async () => {
    try {
      const res = await fetch(`/api/live/session?sessionId=${sessionId}&role=${roleParam || ""}`);
      if (res.ok) {
        const data = await res.json();
        setSession(data.session);

        const hName = data.halaqaName || data.session?.halaqa?.name || "حلقة القرآن الكريم";
        const tName = data.teacherName || data.session?.halaqa?.teacher?.user?.name || "معلم الحلقة";
        const hId = data.halaqaId || data.session?.halaqaId || data.session?.halaqa?.id || "";

        setHalaqaInfo({ name: hName, teacherName: tName, id: hId });

        if (isTeacher) {
          setAuthStatus("AUTHORIZED");
        } else {
          if (data.isAuthorized) {
            setAuthStatus("AUTHORIZED");
          } else {
            setAuthStatus(data.authorizationStatus || "NEEDS_REQUEST");
          }
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, [sessionId]);

  // Realtime listener for approval updates and teacher in-room join requests
  useEffect(() => {
    if (!lastEvent) return;

    if (
      lastEvent.type === "JOIN_REQUEST_APPROVED" ||
      lastEvent.type === "SESSION_JOIN_APPROVED" ||
      lastEvent.type === "SCHEDULE_UPDATED"
    ) {
      if (!isTeacher) {
        playStudentApprovedSound();
        setAuthStatus("AUTHORIZED");
      }
      fetchSession();
    }

    if (
      lastEvent.type === "SESSION_JOIN_REQUESTED" ||
      lastEvent.type === "JOIN_REQUEST_SUBMITTED"
    ) {
      if (isTeacher) {
        fetchSession();
      }
    }
  }, [lastEvent, isTeacher, sessionId]);

  // Fallback active poll while student is waiting on gatekeeper screen (every 2s)
  useEffect(() => {
    if (isTeacher || authStatus !== "PENDING_APPROVAL") return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/live/session?sessionId=${sessionId}&role=${roleParam || ""}`);
        if (res.ok) {
          const data = await res.json();
          if (data.isAuthorized) {
            playStudentApprovedSound();
            setAuthStatus("AUTHORIZED");
            setSession(data.session);
          }
        }
      } catch {}
    }, 2000);
    return () => clearInterval(interval);
  }, [authStatus, isTeacher, sessionId, roleParam]);

  // Handle submitting join request directly from gatekeeper screen (1-click direct tap)
  const handleSendJoinRequestFromGate = async () => {
    const targetHalaqaId = halaqaInfo.id || session?.halaqaId || session?.halaqa?.id;
    setSubmittingRequest(true);
    try {
      const res = await fetch("/api/student/join-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          halaqaId: targetHalaqaId,
          sessionId: session?.id || sessionId,
        }),
      });

      if (res.ok) {
        setAuthStatus("PENDING_APPROVAL");
        setRequestSuccessMsg("تم رفع طلب الانضمام إلى فضيلة الشيخ بنجاح، وهو قيد المراجعة والاعتماد.");
      } else {
        const d = await res.json();
        alert(d.error || "فشل إرسال طلب الانضمام");
      }
    } catch (err) {
      console.error(err);
      alert("حدث خطأ أثناء إرسال الطلب");
    } finally {
      setSubmittingRequest(false);
    }
  };

  // Auto-record student attendance check-in ONLY when student is authorized
  useEffect(() => {
    if (!isTeacher && authStatus === "AUTHORIZED") {
      fetch("/api/teacher/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "STUDENT_CHECKIN",
          sessionId,
        }),
      }).catch(console.error);
    }
  }, [sessionId, isTeacher, authStatus]);

  // Helper to send signaling message via HTTP POST (kept for chat & hand raise)
  const sendSignalingMessage = async (signalType: string, payload: any) => {
    try {
      await fetch("/api/classroom/signal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: session?.id || sessionId,
          signalType,
          senderRole: myRole,
          senderName: myName,
          senderClientId: clientId,
          data: payload,
        }),
      });
    } catch (err) {
      console.error("Signaling POST error:", err);
    }
  };

  // HTTP Signaling Polling Loop for Chat & Hand Raise (Every 2 seconds)
  useEffect(() => {
    if (!isTeacher && authStatus !== "AUTHORIZED") return;
    let active = true;

    const pollSignals = async () => {
      if (!active) return;
      try {
        const targetSess = session?.id || sessionId;
        const res = await fetch(
          `/api/classroom/signal?sessionId=${targetSess}&role=${myRole}&clientId=${clientId}&since=${lastSignalIdRef.current}`
        );
        if (res.ok) {
          const data = await res.json();
          if (data.latestId !== undefined) {
            lastSignalIdRef.current = data.latestId;
          }

          if (data.messages && data.messages.length > 0) {
            for (const msg of data.messages) {
              await handleSignalMessage(msg);
            }
          }
        }
      } catch (err) {
        console.error("Signal poll error:", err);
      }
    };

    const handleSignalMessage = async (msg: any) => {
      const { signalType, senderName, data } = msg;

      if (signalType === "CHAT_MESSAGE" && data) {
        setChatMessages((prev) => [
          ...prev,
          {
            sender: data.sender || senderName || "المشارك",
            text: data.text,
            time: data.time || new Date().toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" }),
            isMe: false,
          },
        ]);
        if (activeTab !== "CHAT") {
          setUnreadChatCount((prev) => prev + 1);
        }
      } else if (signalType === "HAND_RAISE" && data) {
        if (isTeacher) {
          if (data.raised) {
            setStudentHandAlert({
              studentName: data.studentName || senderName || "طالب العلم",
              visible: true,
            });
          } else {
            setStudentHandAlert(null);
          }
        }
      } else if (signalType === "REMOTE_MUTE") {
        if (!isTeacher && jitsiApiRef.current) {
          jitsiApiRef.current.executeCommand("toggleAudio");
          setIsMicOn(false);
        }
      }
    };

    const interval = setInterval(pollSignals, 2000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [sessionId, session?.id, myRole, isTeacher, authStatus, clientId, activeTab]);

  // Initialize Jitsi Meet when authorized and script is loaded
  useEffect(() => {
    if (authStatus !== "AUTHORIZED") return;
    if (!jitsiLoaded) return;
    if (!jitsiContainerRef.current) return;
    if (jitsiApiRef.current) return; // already initialized

    const roomName = `quran-halaqa-${sessionId}`.replace(/[^a-zA-Z0-9\-]/g, "-");

    try {
      const JitsiMeetExternalAPI = (window as any).JitsiMeetExternalAPI;
      if (!JitsiMeetExternalAPI) {
        console.warn("JitsiMeetExternalAPI not available yet");
        return;
      }

      const api = new JitsiMeetExternalAPI("meet.jit.si", {
        roomName,
        parentNode: jitsiContainerRef.current,
        width: "100%",
        height: "100%",
        configOverwrite: {
          startWithAudioMuted: !isMicOn,
          startWithVideoMuted: !isVideoOn,
          prejoinPageEnabled: false,
          disableDeepLinking: true,
          enableWelcomePage: false,
        },
        interfaceConfigOverwrite: {
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          TOOLBAR_BUTTONS: [],
          MOBILE_APP_PROMO: false,
        },
        userInfo: {
          displayName: myName,
        },
      });

      // Grant moderator role to teacher
      if (isTeacher) {
        api.addEventListener("videoConferenceJoined", () => {
          api.executeCommand("toggleLobby", false);
          setJitsiReady(true);
        });
      } else {
        api.addEventListener("videoConferenceJoined", () => {
          setJitsiReady(true);
        });
      }

      jitsiApiRef.current = api;
    } catch (err) {
      console.error("Jitsi initialization error:", err);
    }

    // Cleanup on unmount
    return () => {
      if (jitsiApiRef.current) {
        try {
          jitsiApiRef.current.dispose();
        } catch {}
        jitsiApiRef.current = null;
      }
    };
  }, [authStatus, jitsiLoaded, sessionId]);

  // Recording timer
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

  const toggleMic = () => {
    const next = !isMicOn;
    setIsMicOn(next);
    if (jitsiApiRef.current) {
      jitsiApiRef.current.executeCommand("toggleAudio");
    }
  };

  const toggleVideo = () => {
    const next = !isVideoOn;
    setIsVideoOn(next);
    if (jitsiApiRef.current) {
      jitsiApiRef.current.executeCommand("toggleVideo");
    }
  };

  const handleEndSession = async () => {
    if (window.confirm("هل أنت متأكد من إنهاء الحلقة لجميع الطلاب الآن؟")) {
      if (jitsiApiRef.current) {
        try { jitsiApiRef.current.executeCommand("hangup"); } catch {}
      }
      await fetch("/api/live/session", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      window.location.href = isTeacher ? "/teacher/dashboard" : "/student/dashboard";
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const time = new Date().toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" });
    const text = chatInput.trim();

    setChatMessages((prev) => [
      ...prev,
      {
        sender: myName,
        text,
        time,
        isMe: true,
      },
    ]);
    setChatInput("");

    await sendSignalingMessage("CHAT_MESSAGE", {
      sender: myName,
      text,
      time,
    });
  };

  const toggleHandRaise = async () => {
    const next = !isHandRaised;
    setIsHandRaised(next);
    await sendSignalingMessage("HAND_RAISE", {
      raised: next,
      studentName: myName,
    });
  };

  const handleTeacherMuteStudent = async () => {
    await sendSignalingMessage("REMOTE_MUTE", { target: "student" });
    alert("تم إرسال أمر كتم صوت الطالب بنجاح.");
  };

  const handleToggleRecording = async () => {
    if (isRecording) {
      await fetch("/api/recordings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          halaqaId: session?.halaqaId,
          title: `تسجيل ${session?.title || "الحلقة"}`,
          durationSeconds: recordSeconds,
          retentionDays: 30,
        }),
      });
      alert("تم إيقاف التسجيل وحفظه في مكتبة التسجيلات بنجاح.");
      setIsRecording(false);
      setRecordSeconds(0);
    } else {
      setIsRecording(true);
    }
  };

  if (loading || authStatus === "CHECKING") {
    return (
      <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Radio className="w-8 h-8 text-emerald-500 animate-spin" />
        <p className="text-sm font-bold">جارٍ التحقق من تصريح القبول والاعتماد من الشيخ...</p>
      </div>
    );
  }

  // Gatekeeper Barrier: Student access is strictly conditioned upon Sheikh's acceptance
  if (!isTeacher && authStatus !== "AUTHORIZED") {
    return (
      <div className="min-h-[75vh] flex items-center justify-center p-4">
        <div className="bg-slate-900/95 backdrop-blur-xl border-2 border-amber-500/40 rounded-3xl p-6 sm:p-10 max-w-xl w-full shadow-2xl text-center space-y-6 relative overflow-hidden text-white">
          {/* Decorative aura */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Golden Shield & Lock Icon */}
          <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-amber-500/20 to-gold-accent/30 animate-pulse border border-amber-400/40" />
            <Lock className="w-9 h-9 text-amber-400 relative z-10" />
          </div>

          {/* Condition Header */}
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-400/30">
              <ShieldCheck className="w-3.5 h-3.5" />
              الدخول مشروط بموافقة وقبول الشيخ
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              {halaqaInfo.name}
            </h2>
            <p className="text-xs sm:text-sm text-amber-200/80 font-medium">
              بإشراف فضيلة {halaqaInfo.teacherName}
            </p>
          </div>

          {/* Status-specific body */}
          {authStatus === "PENDING_APPROVAL" ? (
            <div className="bg-amber-950/40 border border-amber-500/40 rounded-3xl p-6 text-center space-y-4">
              <div className="flex items-center justify-center gap-2 text-amber-300 font-black text-sm">
                <Clock className="w-5 h-5 shrink-0 animate-spin text-amber-400" />
                <span>طلبك قيد موافقة واعتماد فضيلة الشيخ ⏳</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">
                تم إشعار الشيخ بطلبك الآن. سيتم فتح قاعة الحلقة تلقائياً فور موافقة الشيخ دون الحاجة لإعادة تحميل الصفحة.
              </p>
              {requestSuccessMsg && (
                <div className="p-2.5 bg-emerald-900/40 border border-emerald-500/40 text-emerald-300 text-xs rounded-xl flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{requestSuccessMsg}</span>
                </div>
              )}
              <div className="pt-2 flex flex-col sm:flex-row justify-center gap-2">
                <button
                  onClick={fetchSession}
                  className="flex-1 flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs py-3 rounded-xl transition"
                >
                  <RefreshCw className="w-4 h-4" />
                  تحديث الحالة الآن
                </button>
                <Link
                  href="/student/dashboard"
                  className="px-5 py-3 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 transition text-center"
                >
                  العودة للرئيسية
                </Link>
              </div>
            </div>
          ) : authStatus === "REJECTED" ? (
            <div className="bg-red-950/40 border border-red-500/40 rounded-3xl p-6 text-center space-y-3">
              <div className="flex items-center justify-center gap-2 text-red-400 font-bold text-sm">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>اعتذر فضيلة الشيخ عن قبول الانضمام</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">
                نعتذر إليك، لا يمكن الانضمام لهذه الحلقة في الوقت الراهن لاكتمال النصاب المحدد.
              </p>
              <div className="pt-2 flex justify-center">
                <Link
                  href="/student/my-halaqat"
                  className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl border border-slate-700"
                >
                  استعراض الحلقات المتاحة
                </Link>
              </div>
            </div>
          ) : (
            <div className="bg-slate-800/80 border border-slate-700 rounded-3xl p-6 text-center space-y-5">
              <div>
                <h4 className="text-sm font-bold text-slate-200 mb-1">
                  طلب انضمام إلى الحلقة المباشرة
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
                  هذه الحلقة مخصصة للطلاب المعتمدين من الشيخ. اضغط أدناه لرفع إشعار فوري لفضيلة الشيخ لقبولك.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5">
                <button
                  onClick={handleSendJoinRequestFromGate}
                  disabled={submittingRequest}
                  className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white font-black text-sm py-3.5 rounded-2xl shadow-xl transition-transform hover:scale-102 active:scale-98 disabled:opacity-50"
                >
                  <UserPlus className="w-5 h-5" />
                  <span>{submittingRequest ? "جارٍ إرسال الطلب للشيخ..." : "طلب انضمام"}</span>
                </button>
                <Link
                  href="/student/dashboard"
                  className="px-5 py-3.5 rounded-2xl text-xs font-bold bg-slate-700/60 hover:bg-slate-700 text-slate-300 transition text-center"
                >
                  العودة للرئيسية
                </Link>
              </div>
            </div>
          )}

          {/* Footer note */}
          <div className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5 pt-2">
            <Lock className="w-3 h-3 text-amber-500/70" />
            <span>نظام الاعتماد القرآني المعتمد لمنصة ورتّل</span>
          </div>
        </div>
      </div>
    );
  }

  const studentsList = session?.halaqa?.enrollments || [];

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] bg-slate-950 text-white rounded-2xl overflow-hidden shadow-2xl border border-slate-800 relative">

      {/* Jitsi External API Script */}
      <Script
        src="https://meet.jit.si/external_api.js"
        strategy="afterInteractive"
        onLoad={() => setJitsiLoaded(true)}
      />

      {/* Teacher Student Hand Raise Toast */}
      {isTeacher && studentHandAlert?.visible && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 max-w-md w-[90%] animate-in slide-in-from-top duration-200">
          <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-amber-950 text-white rounded-2xl p-3.5 shadow-2xl border-2 border-amber-500/80 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-black">
                <Hand className="w-5 h-5 animate-bounce" />
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black text-amber-300 block">طلب استئذان / تسميع</span>
                <span className="text-xs font-bold text-white block">{studentHandAlert.studentName} رفع يده</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setStudentHandAlert(null)}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs px-3 py-1.5 rounded-xl shadow transition"
              >
                تفضل بالتسميع ✅
              </button>
              <button
                onClick={() => setStudentHandAlert(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Header Bar */}
      <div className="bg-slate-900 px-4 py-3 border-b border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 px-3 py-1 rounded-full text-xs font-bold">
            <span className={`w-2 h-2 rounded-full ${jitsiReady ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
            {jitsiReady ? "اتصال فيديو مباشر نشط" : "جارٍ تحميل قاعة الفيديو..."}
          </div>
          <span className="font-bold text-sm text-slate-100 hidden sm:inline">
            {session?.halaqa?.name || "الحلقة القرآنية"}
          </span>
          <span className="text-xs text-slate-400 hidden sm:inline">
            • المعلم: {session?.halaqa?.teacher?.user?.name || "معلم الحلقة"}
          </span>
        </div>

        {/* Recording Indicator & Mobile Tabs */}
        <div className="flex items-center gap-3">
          {isRecording && (
            <div className="flex items-center gap-2 bg-red-950/80 border border-red-700/60 text-red-300 px-3 py-1 rounded-full text-xs font-bold animate-pulse">
              <Circle className="w-2.5 h-2.5 fill-red-500 text-red-500" />
              <span>تسجيل جارٍ</span>
              <span className="font-mono">
                {Math.floor(recordSeconds / 60)}:{String(recordSeconds % 60).padStart(2, "0")}
              </span>
            </div>
          )}

          {/* Quick tab switcher on mobile */}
          <div className="flex lg:hidden bg-slate-800 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setActiveTab("MUSHAF")}
              className={`px-2.5 py-1 rounded-md ${
                activeTab === "MUSHAF" ? "bg-islamic-700 text-white font-bold" : "text-slate-400"
              }`}
            >
              المصحف
            </button>
            <button
              onClick={() => {
                setActiveTab("CHAT");
                setUnreadChatCount(0);
              }}
              className={`px-2.5 py-1 rounded-md relative ${
                activeTab === "CHAT" ? "bg-islamic-700 text-white font-bold" : "text-slate-400"
              }`}
            >
              المحادثة
              {unreadChatCount > 0 && (
                <span className="mr-1 px-1 bg-emerald-500 text-slate-950 text-[9px] font-black rounded-full">
                  {unreadChatCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Classroom Body (Split Screen Layout) */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left / Center: Interactive Mushaf & Recitation Control */}
        <div
          className={`flex-1 overflow-y-auto p-2 sm:p-4 bg-slate-900/50 ${
            activeTab === "MUSHAF" ? "block" : "hidden lg:block"
          }`}
        >
          <InteractiveMushaf
            sessionId={sessionId}
            isTeacher={isTeacher}
            halaqaId={session?.halaqaId}
            halaqaName={session?.halaqa?.name}
          />
        </div>

        {/* Right Side: Jitsi Video & Participants & Chat */}
        <div className="w-full lg:w-96 bg-slate-900 border-t lg:border-t-0 lg:border-r border-slate-800 flex flex-col shrink-0">
          {/* Jitsi Meet Embed (replaces the two video slots) */}
          <div
            ref={jitsiContainerRef}
            style={{ height: "240px" }}
            className="w-full bg-slate-950 border-b border-slate-800 shrink-0 relative"
          >
            {!jitsiLoaded && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-400">
                <Radio className="w-6 h-6 text-emerald-500 animate-spin" />
                <span className="text-xs font-bold">جارٍ تحميل قاعة الفيديو...</span>
              </div>
            )}
          </div>

          {/* Right Panel Tabs: Participants vs Chat */}
          <div className="flex border-b border-slate-800 bg-slate-900 text-xs font-semibold">
            <button
              onClick={() => setActiveTab("PARTICIPANTS")}
              className={`flex-1 py-2 text-center border-b-2 transition ${
                activeTab === "PARTICIPANTS"
                  ? "border-emerald-500 text-emerald-400 font-bold bg-slate-800/40"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              الطلاب والحضور ({studentsList.length || 1})
            </button>
            <button
              onClick={() => {
                setActiveTab("CHAT");
                setUnreadChatCount(0);
              }}
              className={`flex-1 py-2 text-center border-b-2 transition relative ${
                activeTab === "CHAT"
                  ? "border-emerald-500 text-emerald-400 font-bold bg-slate-800/40"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <span>محادثة الحلقة</span>
              {unreadChatCount > 0 && (
                <span className="mr-1.5 px-1.5 py-0.2 bg-emerald-500 text-slate-950 text-[10px] font-black rounded-full animate-bounce">
                  {unreadChatCount}
                </span>
              )}
            </button>
          </div>

          {/* Tab Content 1: Participants List */}
          {activeTab === "PARTICIPANTS" && (
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                المشاركون في الحلقة
              </div>
              {studentsList.map((enr: any) => (
                <div
                  key={enr.id}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-800/60 border border-slate-800"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-emerald-950/70 text-emerald-300 border border-emerald-500/30 font-bold flex items-center justify-center text-xs shrink-0">
                      {enr.student?.user?.name?.[0] || "ط"}
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-slate-200">
                        {enr.student?.user?.name}
                      </span>
                      <span className="block text-[10px] text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-2.5 h-2.5" /> حاضر في الجلسة
                      </span>
                    </div>
                  </div>

                  {isTeacher && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={handleTeacherMuteStudent}
                        title="كتم صوت الطالب"
                        className="p-1.5 rounded-lg bg-slate-700 hover:bg-red-600 text-slate-300 hover:text-white transition cursor-pointer"
                      >
                        <VolumeX className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Tab Content 2: Chat */}
          {activeTab === "CHAT" && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col ${msg.isMe ? "items-start" : "items-end"} ${
                      msg.system ? "items-center text-center" : ""
                    }`}
                  >
                    {msg.system ? (
                      <span className="text-[10px] bg-slate-800 text-slate-400 px-2.5 py-1 rounded-full">
                        {msg.text}
                      </span>
                    ) : (
                      <div
                        className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs ${
                          msg.isMe
                            ? "bg-islamic-700 text-white rounded-br-none"
                            : "bg-slate-800 text-slate-200 rounded-bl-none"
                        }`}
                      >
                        <div className="text-[10px] font-bold text-amber-300 mb-0.5">{msg.sender}</div>
                        <p>{msg.text}</p>
                        <span className="text-[9px] text-slate-300 block text-left mt-1">{msg.time}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendMessage} className="p-2 border-t border-slate-800 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="اكتب رسالة للحلقة..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="flex-1 bg-slate-800 text-xs px-3 py-2 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <button
                  type="submit"
                  className="bg-islamic-700 hover:bg-islamic-600 px-3 py-2 rounded-xl text-white transition"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Classroom Control Toolbar */}
      <div className="bg-slate-900/95 px-4 sm:px-6 py-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 shrink-0">
        {/* Left: Device toggles */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleMic}
            className={`p-2.5 sm:p-3 rounded-xl transition cursor-pointer ${
              isMicOn
                ? "bg-slate-800 hover:bg-slate-700 text-slate-200"
                : "bg-red-600 hover:bg-red-700 text-white"
            }`}
            title={isMicOn ? "كتم الميكروفون" : "تشغيل الميكروفون"}
          >
            {isMicOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
          </button>

          <button
            onClick={toggleVideo}
            className={`p-2.5 sm:p-3 rounded-xl transition cursor-pointer ${
              isVideoOn
                ? "bg-slate-800 hover:bg-slate-700 text-slate-200"
                : "bg-red-600 hover:bg-red-700 text-white"
            }`}
            title={isVideoOn ? "إيقاف الكاميرا" : "تشغيل الكاميرا"}
          >
            {isVideoOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setIsScreenSharing(!isScreenSharing)}
            className={`hidden sm:flex p-3 rounded-xl transition ${
              isScreenSharing
                ? "bg-emerald-600 text-white"
                : "bg-slate-800 hover:bg-slate-700 text-slate-200"
            }`}
            title="مشاركة الشاشة"
          >
            <Monitor className="w-4 h-4" />
          </button>
        </div>

        {/* Center: Actions (Raise hand, recording) */}
        <div className="flex items-center gap-2">
          {!isTeacher && (
            <button
              onClick={toggleHandRaise}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                isHandRaised
                  ? "bg-amber-500 text-slate-950 shadow-lg"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-200"
              }`}
            >
              <Hand className="w-3.5 h-3.5" />
              <span>{isHandRaised ? "خفض اليد" : "رفع اليد"}</span>
            </button>
          )}

          {isTeacher && (
            <button
              onClick={handleToggleRecording}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                isRecording
                  ? "bg-red-600 text-white hover:bg-red-700 shadow-lg animate-pulse"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-200"
              }`}
            >
              <Circle className={`w-3 h-3 ${isRecording ? "fill-white" : "fill-red-500 text-red-500"}`} />
              <span>{isRecording ? "إيقاف التسجيل" : "بدء التسجيل"}</span>
            </button>
          )}
        </div>

        {/* Right: Leave / End Session */}
        <div>
          {isTeacher ? (
            <button
              onClick={handleEndSession}
              className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white font-bold px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs shadow-md transition cursor-pointer"
            >
              <PhoneOff className="w-4 h-4" />
              <span>إنهاء الحلقة</span>
            </button>
          ) : (
            <button
              onClick={() => (window.location.href = "/student/dashboard")}
              className="flex items-center gap-1.5 bg-red-950/70 hover:bg-red-900 text-red-200 font-bold px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs border border-red-800/60 transition cursor-pointer"
            >
              <PhoneOff className="w-4 h-4" />
              <span>مغادرة</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
