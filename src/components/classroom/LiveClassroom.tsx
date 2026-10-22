"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
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
  Calendar,
  Eye,
  XCircle,
  Plus,
  Maximize2,
  Minimize2,
  UserMinus,
} from "lucide-react";
import { playTeacherJoinAlertSound, playStudentApprovedSound } from "@/lib/sound";

interface LiveClassroomProps {
  sessionId: string;
}

// Configurable ICE servers with fallback STUN & optional environment-driven TURN
function getIceServers(): RTCConfiguration {
  const turnUrl = process.env.NEXT_PUBLIC_TURN_URL;
  const turnUser = process.env.NEXT_PUBLIC_TURN_USERNAME;
  const turnCred = process.env.NEXT_PUBLIC_TURN_CREDENTIAL;

  const iceServers: RTCIceServer[] = [
    { urls: ["stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"] },
    { urls: ["stun:stun3.l.google.com:19302", "stun:stun4.l.google.com:19302"] },
    { urls: "stun:global.stun.twilio.com:3478" },
  ];

  if (turnUrl && turnUser && turnCred) {
    iceServers.push({
      urls: turnUrl,
      username: turnUser,
      credential: turnCred,
    });
  } else {
    // Openrelay project fallback
    iceServers.push(
      {
        urls: "turn:openrelay.metered.ca:80",
        username: "openrelayproject",
        credential: "openrelayproject",
      },
      {
        urls: "turn:openrelay.metered.ca:443",
        username: "openrelayproject",
        credential: "openrelayproject",
      },
      {
        urls: "turn:openrelay.metered.ca:443?transport=tcp",
        username: "openrelayproject",
        credential: "openrelayproject",
      }
    );
  }

  return {
    iceServers,
    iceCandidatePoolSize: 10,
  };
}

// Real-time audio analyser helper to detect when a participant is speaking
function setupAudioAnalyser(
  stream: MediaStream,
  onSpeakingChange: (speaking: boolean) => void
): () => void {
  try {
    const audioTrack = stream.getAudioTracks()[0];
    if (!audioTrack) return () => {};

    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return () => {};

    const audioCtx = new AudioCtx();
    const source = audioCtx.createMediaStreamSource(new MediaStream([audioTrack]));
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 128;
    source.connect(analyser);

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    let isSpeaking = false;

    const interval = setInterval(() => {
      try {
        if (audioCtx.state === "suspended") {
          audioCtx.resume().catch(() => {});
        }
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        const speakingNow = avg > 14;

        if (speakingNow !== isSpeaking) {
          isSpeaking = speakingNow;
          onSpeakingChange(speakingNow);
        }
      } catch {}
    }, 150);

    return () => {
      clearInterval(interval);
      try {
        source.disconnect();
        analyser.disconnect();
        audioCtx.close().catch(() => {});
      } catch {}
    };
  } catch {
    return () => {};
  }
}

export interface RemotePeerState {
  clientId: string;
  role: "teacher" | "student";
  name: string;
  hasAudio: boolean;
  hasVideo: boolean;
  isVideoOn: boolean;
  isMicOn: boolean;
  isSpeaking: boolean;
  isHandRaised?: boolean;
  canSpeak?: boolean;
  connectionState: string;
  stream: MediaStream;
}

interface PeerEntry {
  clientId: string;
  role: "teacher" | "student";
  name: string;
  pc: RTCPeerConnection;
  stream: MediaStream;
  hasAudio: boolean;
  hasVideo: boolean;
  isVideoOn: boolean;
  isMicOn: boolean;
  isSpeaking: boolean;
  isHandRaised?: boolean;
  canSpeak?: boolean;
  connectionState: string;
  iceCandidatesQueue: RTCIceCandidateInit[];
  analyserCleanup?: () => void;
}

// Subcomponent: Dedicated Unmuted Audio Element per remote participant
function RemotePeerAudio({
  peer,
  onUnlockNeeded,
}: {
  peer: RemotePeerState;
  onUnlockNeeded?: () => void;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioTrack = peer.stream?.getAudioTracks()?.[0];
  const trackId = audioTrack?.id;

  // Attach track ONLY when the underlying audio track changes, avoiding playback resets
  useEffect(() => {
    const audioEl = audioRef.current;
    if (!audioEl || !audioTrack) return;

    const currentStream = audioEl.srcObject as MediaStream | null;
    const currentTrackId = currentStream?.getAudioTracks()?.[0]?.id;
    if (currentTrackId !== trackId) {
      audioEl.srcObject = new MediaStream([audioTrack]);
      audioEl.volume = 1.0;
      audioEl.muted = false;
      audioEl.play().catch(() => {
        if (onUnlockNeeded) onUnlockNeeded();
      });
    }
  }, [trackId, audioTrack, onUnlockNeeded]);

  // Clean unmount ONLY when participant leaves
  useEffect(() => {
    return () => {
      const audioEl = audioRef.current;
      if (audioEl) {
        try {
          audioEl.pause();
          audioEl.srcObject = null;
        } catch {}
      }
    };
  }, []);

  return <audio ref={audioRef} autoPlay playsInline />;
}

// Subcomponent: Dedicated Video Element per remote participant
function RemotePeerVideo({
  stream,
  hasVideo,
  isVideoOn,
  label,
  fallbackInitial,
  isSpeaking,
  isMicOn,
  isHero = false,
  actions,
}: {
  stream: MediaStream;
  hasVideo: boolean;
  isVideoOn: boolean;
  label: string;
  fallbackInitial: string;
  isSpeaking: boolean;
  isMicOn: boolean;
  isHero?: boolean;
  actions?: React.ReactNode;
}) {
  const vidRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const vidEl = vidRef.current;
    if (!vidEl || !stream) return;
    const videoTracks = stream.getVideoTracks();
    if (videoTracks.length === 0) return;

    const currentStream = vidEl.srcObject as MediaStream | null;
    const currentTrackId = currentStream?.getVideoTracks()?.[0]?.id;
    if (currentTrackId !== videoTracks[0].id) {
      // Pass video-only track to prevent WebRTC lip-sync jitter buffer padding on audio
      vidEl.srcObject = new MediaStream([videoTracks[0]]);
      vidEl.muted = true;
      vidEl.defaultMuted = true;
      vidEl.play().catch(() => {});
    }
  }, [stream, hasVideo, isVideoOn]);

  return (
    <div
      className={`relative bg-slate-900 rounded-xl overflow-hidden border shadow-md group transition-all duration-300 ${
        isHero ? "aspect-video w-full" : "aspect-video w-full"
      } ${
        isSpeaking && isMicOn
          ? "border-amber-400 ring-2 ring-amber-400/80 shadow-amber-500/20"
          : "border-slate-800"
      }`}
    >
      <video
        ref={vidRef}
        autoPlay
        playsInline
        muted
        data-role="student-video"
        className={`w-full h-full object-cover ${hasVideo && isVideoOn ? "block" : "hidden"}`}
      />
      {(!hasVideo || !isVideoOn) && (
        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-center p-2">
          <div
            className={`rounded-2xl flex items-center justify-center font-black ring-2 shadow mb-1 ${
              isHero
                ? "w-16 h-16 text-xl bg-slate-800 text-amber-300 ring-gold-accent/50"
                : "w-10 h-10 text-xs bg-slate-800 text-amber-300 ring-gold-accent/50"
            }`}
          >
            {fallbackInitial}
          </div>
          <span className="text-[10px] text-amber-300 font-bold flex items-center gap-1">
            {label} (صوت فقط)
          </span>
        </div>
      )}

      <div className="absolute bottom-1 right-1 bg-black/80 px-2 py-0.5 rounded text-[10px] font-bold text-white flex items-center gap-1.5 backdrop-blur-sm">
        {isSpeaking && isMicOn ? (
          <span className="flex items-center gap-1 text-amber-300 animate-pulse font-black">
            <Radio className="w-3 h-3 text-amber-400" />
            يرتل الآن 🎙️
          </span>
        ) : isMicOn ? (
          <Mic className="w-3 h-3 text-emerald-400" />
        ) : (
          <MicOff className="w-3 h-3 text-red-400" />
        )}
        <span>{label}</span>
      </div>

      {actions && (
        <div className="absolute top-1 left-1 flex items-center gap-1 z-20">
          {actions}
        </div>
      )}
    </div>
  );
}

export function LiveClassroom({ sessionId }: LiveClassroomProps) {
  const { user } = useAuth();
  const { lastEvent } = useRealtime();
  const searchParams = useSearchParams();
  const roleParam = searchParams.get("role");

  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [authStatus, setAuthStatus] = useState<
    "CHECKING" | "AUTHORIZED" | "PENDING_APPROVAL" | "NEEDS_REQUEST" | "DEFERRED" | "PROPOSED_SLOT" | "REJECTED"
  >("CHECKING");
  const [followUpRequestData, setFollowUpRequestData] = useState<any>(null);
  const [halaqaInfo, setHalaqaInfo] = useState<{ name: string; teacherName: string; id: string }>({
    name: "حلقة التحفيظ والتجويد",
    teacherName: "فضيلة المعلم",
    id: "",
  });
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [requestSuccessMsg, setRequestSuccessMsg] = useState("");

  // Sheikh Follow-up Request Decision System
  const [pendingFollowUpRequests, setPendingFollowUpRequests] = useState<any[]>([]);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [selectedFollowUpSlotId, setSelectedFollowUpSlotId] = useState<string>("");
  const [showNewSlotModal, setShowNewSlotModal] = useState<boolean>(false);
  const [targetFollowUpForNewSlot, setTargetFollowUpForNewSlot] = useState<any>(null);
  const [newSlotTitle, setNewSlotTitle] = useState("جلسة تسميع فردية خاصة");
  const [newSlotDate, setNewSlotDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [newSlotTime, setNewSlotTime] = useState("17:00");
  const [newSlotDuration, setNewSlotDuration] = useState("30");
  const [newSlotType, setNewSlotType] = useState<"ONE_ON_ONE" | "HALAQA">("ONE_ON_ONE");
  const [isSubmittingDecision, setIsSubmittingDecision] = useState(false);

  // Media toggles & Remote Media State Tracking
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [remoteIsVideoOn, setRemoteIsVideoOn] = useState(true);
  const [remoteIsMicOn, setRemoteIsMicOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [activeTab, setActiveTab] = useState<"MUSHAF" | "CHAT" | "PARTICIPANTS">("MUSHAF");

  // Student Microphone Permission Request System
  const [canSpeak, setCanSpeak] = useState(false);
  const [speakRequestStatus, setSpeakRequestStatus] = useState<"IDLE" | "REQUESTED" | "GRANTED" | "REJECTED">("IDLE");
  const [pendingSpeakRequests, setPendingSpeakRequests] = useState<Array<{ studentId: string; studentName: string }>>([]);
  const [speakNotice, setSpeakNotice] = useState<string | null>(null);

  // Session Recording System
  const [showRecordingModal, setShowRecordingModal] = useState(false);
  const [selectedRecordingType, setSelectedRecordingType] = useState<"AUDIO_VIDEO" | "AUDIO_ONLY">("AUDIO_VIDEO");
  const [activeRecordingType, setActiveRecordingType] = useState<"AUDIO_VIDEO" | "AUDIO_ONLY">("AUDIO_VIDEO");
  const [isUploadingRecording, setIsUploadingRecording] = useState(false);
  const [remoteIsRecording, setRemoteIsRecording] = useState(false);

  // Recording engine refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingChunksRef = useRef<Blob[]>([]);
  const recordingStreamRef = useRef<MediaStream | null>(null);
  const recordingCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const recordingAnimRef = useRef<number | null>(null);
  const recordingAudioCtxRef = useRef<AudioContext | null>(null);
  const recordingAudioDestRef = useRef<MediaStreamAudioDestinationNode | null>(null);

  // Hardware status
  const [hasRealMic, setHasRealMic] = useState(false);
  const [hasRealCam, setHasRealCam] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [mediaTypeNotice, setMediaTypeNotice] = useState<string>("جارٍ فحص الكاميرا والميكروفون...");

  // Connection status
  const [hasRemoteStream, setHasRemoteStream] = useState(false);
  const [remoteHasAudio, setRemoteHasAudio] = useState(false);
  const [remoteHasVideo, setRemoteHasVideo] = useState(false);
  const [needsAudioUnlock, setNeedsAudioUnlock] = useState(false);
  const [remotePeerName, setRemotePeerName] = useState<string>("");
  const [connectionStatus, setConnectionStatus] = useState<string>("بانتظار الطرف الآخر...");

  // Audio indicators
  const [localIsSpeaking, setLocalIsSpeaking] = useState(false);
  const [remoteIsSpeaking, setRemoteIsSpeaking] = useState(false);

  // Chat and notifications
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [studentHandAlert, setStudentHandAlert] = useState<{ studentName: string; visible: boolean } | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([
    {
      sender: "النظام",
      text: "مرحباً بكم في الحلقة القرآنية المباشرة. تم تفعيل الاتصال المباشر بالصوت والصورة.",
      time: new Date().toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" }),
      system: true,
    },
  ]);
  const [chatInput, setChatInput] = useState("");

  // Elements and stream refs
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const iceCandidatesQueue = useRef<RTCIceCandidateInit[]>([]);
  const lastSignalIdRef = useRef<number>(0);
  const remoteClientIdRef = useRef<string | null>(null);

  // Multi-Peer WebRTC Architecture
  const [remotePeers, setRemotePeers] = useState<RemotePeerState[]>([]);
  const [tasmeeStudentId, setTasmeeStudentId] = useState<string | null>(null);
  const peersRef = useRef<Map<string, PeerEntry>>(new Map());

  const localAudioAnalyserCleanupRef = useRef<(() => void) | null>(null);
  const remoteAudioAnalyserCleanupRef = useRef<(() => void) | null>(null);

  const [clientId] = useState(() => "peer-" + Math.random().toString(36).substring(2, 9) + "-" + Date.now().toString(36));
  const [activeRoleOverride, setActiveRoleOverride] = useState<"teacher" | "student" | null>(null);

  // Determine if this screen is Teacher
  const isTeacher =
    activeRoleOverride !== null
      ? activeRoleOverride === "teacher"
      : roleParam === "teacher"
      ? true
      : roleParam === "student"
      ? false
      : user?.role === "TEACHER" || user?.role === "ADMIN" || session?.halaqa?.teacher?.userId === user?.id;

  const myRole = isTeacher ? "teacher" : "student";
  const myName = user?.name || (isTeacher ? "معلم الحلقة" : "طالب العلم");

  // Fetch session details & verify Sheikh approval
  const fetchSession = useCallback(async () => {
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
      console.error("fetchSession error:", e);
    } finally {
      setLoading(false);
    }
  }, [sessionId, roleParam, isTeacher]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  // Realtime listener for approval updates & follow-up decisions
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

    if (lastEvent.type === "SESSION_FOLLOWUP_REQUESTED" && isTeacher) {
      playTeacherJoinAlertSound();
      setPendingFollowUpRequests((prev) => {
        if (prev.some((r) => r.requestId === lastEvent.payload?.requestId)) return prev;
        return [...prev, lastEvent.payload];
      });
      fetchAvailableSlots();
    }

    if (lastEvent.type === "SESSION_FOLLOWUP_DECIDED" && !isTeacher) {
      if (lastEvent.payload?.decision === "ACCEPTED") {
        playStudentApprovedSound();
        setAuthStatus("AUTHORIZED");
        setCanSpeak(false);
        setIsMicOn(false);
      } else if (lastEvent.payload?.decision === "DEFERRED") {
        setAuthStatus("DEFERRED");
      } else if (lastEvent.payload?.decision === "REJECTED") {
        setAuthStatus("REJECTED");
      }
      fetchSession();
    }

    if (lastEvent.type === "SESSION_FOLLOWUP_SLOT_PROPOSED" && !isTeacher) {
      setAuthStatus("PROPOSED_SLOT");
      setFollowUpRequestData(lastEvent.payload);
      fetchSession();
    }
  }, [lastEvent, isTeacher, fetchSession]);

  // Fallback poll while student is waiting on approval (every 2.5s)
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
            setCanSpeak(false);
            setIsMicOn(false);
            setSession(data.session);
          } else if (data.authorizationStatus && data.authorizationStatus !== authStatus) {
            setAuthStatus(data.authorizationStatus);
            if (data.followUpRequest) {
              setFollowUpRequestData(data.followUpRequest);
            }
          }
        }
      } catch {}
    }, 2500);
    return () => clearInterval(interval);
  }, [authStatus, isTeacher, sessionId, roleParam]);

  // Fetch Sheikh's available unbooked slots
  const fetchAvailableSlots = useCallback(async () => {
    try {
      const res = await fetch("/api/teacher/slots");
      if (res.ok) {
        const data = await res.json();
        const slots = data.slots || [];
        setAvailableSlots(slots);
        if (slots.length > 0 && !selectedFollowUpSlotId) {
          setSelectedFollowUpSlotId(slots[0].id);
        }
      }
    } catch (e) {
      console.error("fetchAvailableSlots error:", e);
    }
  }, [selectedFollowUpSlotId]);

  useEffect(() => {
    if (isTeacher) {
      fetchAvailableSlots();
    }
  }, [isTeacher, fetchAvailableSlots]);

  // Handle Sheikh decision on student follow-up request
  const handleSheikhDecision = async (
    requestId: string,
    decision: "ACCEPT_NOW" | "REJECT" | "DEFER" | "PROPOSE_EXISTING_SLOT" | "CREATE_AND_PROPOSE_SLOT",
    extra: any = {}
  ) => {
    setIsSubmittingDecision(true);
    try {
      const res = await fetch("/api/classroom/followup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "DECISION",
          requestId,
          decision,
          ...extra,
        }),
      });
      const d = await res.json();
      if (res.ok) {
        if (d.warning) {
          if (window.confirm(d.message)) {
            return handleSheikhDecision(requestId, "ACCEPT_NOW", { forceAccept: true });
          }
          return;
        }
        alert(d.message);
        setPendingFollowUpRequests((prev) => prev.filter((r) => r.requestId !== requestId));
        setShowNewSlotModal(false);
        fetchSession();
      } else {
        alert(d.error || "فشل تنفيذ القرار");
      }
    } catch (e) {
      console.error("Sheikh decision error:", e);
      alert("حدث خطأ أثناء إرسال القرار");
    } finally {
      setIsSubmittingDecision(false);
    }
  };

  // Handle Student submitting follow-up request from classroom gate
  const handleSendFollowUpRequestFromGate = async () => {
    setSubmittingRequest(true);
    try {
      const res = await fetch("/api/classroom/followup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "REQUEST_FOLLOWUP",
          sessionId: session?.id || sessionId,
        }),
      });

      if (res.ok) {
        setAuthStatus("PENDING_APPROVAL");
        setRequestSuccessMsg("تم رفع طلب متابعة الجلسة إلى فضيلة الشيخ بنجاح، وهو قيد المراجعة والاعتماد.");
      } else {
        const d = await res.json();
        alert(d.error || "فشل إرسال طلب المتابعة");
      }
    } catch (err) {
      console.error(err);
      alert("حدث خطأ أثناء إرسال الطلب");
    } finally {
      setSubmittingRequest(false);
    }
  };

  // Handle student responding to proposed slot
  const handleStudentRespondToProposedSlot = async (action: "ACCEPT" | "REJECT") => {
    try {
      const reqId = followUpRequestData?.requestId || followUpRequestData?.id;
      const res = await fetch("/api/classroom/followup/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId: reqId, action }),
      });
      const d = await res.json();
      if (res.ok) {
        alert(d.message);
        fetchSession();
      } else {
        alert(d.error || "حدث خطأ");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle legacy join request from gate if needed
  const handleSendJoinRequestFromGate = async () => {
    return handleSendFollowUpRequestFromGate();
  };

  // Auto-record student attendance check-in
  useEffect(() => {
    if (!isTeacher && authStatus === "AUTHORIZED" && session?.id && session?.status === "ACTIVE") {
      fetch("/api/teacher/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "STUDENT_CHECKIN",
          sessionId: session.id,
        }),
      }).catch(console.error);
    }
  }, [sessionId, isTeacher, authStatus, session?.id, session?.status]);

  // Helper to send signaling message via HTTP POST
  const sendSignalingMessage = useCallback(
    async (signalType: string, payload: any, targetClientId?: string | null) => {
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
            targetClientId: targetClientId !== undefined ? targetClientId : null,
            data: payload,
          }),
        });
      } catch (err) {
        console.error("Signaling POST error:", err);
      }
    },
    [session?.id, sessionId, myRole, myName, clientId]
  );

  // Sync peers state array with React state
  const updatePeersState = useCallback(() => {
    const list: RemotePeerState[] = Array.from(peersRef.current.values()).map((p) => ({
      clientId: p.clientId,
      role: p.role,
      name: p.name,
      hasAudio: p.hasAudio,
      hasVideo: p.hasVideo,
      isVideoOn: p.isVideoOn,
      isMicOn: p.isMicOn,
      isSpeaking: p.isSpeaking,
      isHandRaised: p.isHandRaised,
      canSpeak: p.canSpeak,
      connectionState: p.connectionState,
      stream: p.stream,
    }));
    setRemotePeers(list);
    setHasRemoteStream(list.length > 0);
    setRemoteHasAudio(list.some((p) => p.hasAudio));
    setRemoteHasVideo(list.some((p) => p.hasVideo));
    setRemoteIsSpeaking(list.some((p) => p.isSpeaking));
    if (list.length > 0) {
      setRemotePeerName(list[0].name);
      setConnectionStatus("متصل مباشرة (صوت وفيديو حي)");
    } else {
      setConnectionStatus("بانتظار الطرف الآخر...");
    }
  }, []);

  // Sync local tracks to a single RTCPeerConnection safely
  const syncTracksToPeer = useCallback((pc: RTCPeerConnection) => {
    if (!localStreamRef.current) return;
    const localTracks = localStreamRef.current.getTracks();
    const transceivers = pc.getTransceivers ? pc.getTransceivers() : [];

    localTracks.forEach((track) => {
      let matchedSender: RTCRtpSender | null = null;
      if (transceivers.length > 0) {
        const t = transceivers.find((tr) => {
          const receiverKind = tr.receiver?.track?.kind;
          const senderTrackKind = tr.sender?.track?.kind;
          return receiverKind === track.kind || senderTrackKind === track.kind;
        });
        if (t && t.sender) {
          matchedSender = t.sender;
          if (t.direction === "recvonly") {
            t.direction = "sendrecv";
          }
        }
      }
      if (!matchedSender) {
        const senders = pc.getSenders();
        matchedSender = senders.find((s) => s.track && s.track.kind === track.kind) || null;
      }
      if (matchedSender) {
        if (matchedSender.track !== track) {
          matchedSender.replaceTrack(track).catch((err) => {
            console.warn("replaceTrack error:", err);
          });
        }
      } else {
        try {
          pc.addTrack(track, localStreamRef.current!);
        } catch (e) {
          console.warn("addTrack error:", e);
        }
      }
    });
  }, []);

  // Sync local tracks across all connected peers
  const syncAllPeersTracks = useCallback(() => {
    peersRef.current.forEach((peer) => {
      if (peer.pc && peer.pc.signalingState !== "closed") {
        syncTracksToPeer(peer.pc);
      }
    });
  }, [syncTracksToPeer]);

  // Backward-compatible single PC accessor
  const syncLocalTracks = useCallback(
    (pc: RTCPeerConnection) => {
      syncTracksToPeer(pc);
    },
    [syncTracksToPeer]
  );

  // Dedicated Offer Trigger for a specific peer
  const triggerOfferForPeer = useCallback(
    async (targetClientId: string, reason: string) => {
      const entry = peersRef.current.get(targetClientId);
      if (!entry) return;
      const pc = entry.pc;
      if (!pc || pc.signalingState === "closed") return;

      syncTracksToPeer(pc);

      if (pc.signalingState === "have-local-offer" && pc.localDescription) {
        console.log(`Resending local offer to ${targetClientId}. Reason: ${reason}`);
        await sendSignalingMessage("OFFER", pc.localDescription, targetClientId);
        return;
      }

      if (pc.signalingState !== "stable") {
        console.log(`Offer delayed for ${targetClientId}: signalingState is currently ${pc.signalingState}`);
        return;
      }

      try {
        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true,
        });
        await pc.setLocalDescription(offer);
        await sendSignalingMessage("OFFER", offer, targetClientId);
        console.log(`Sent offer to ${targetClientId} (${entry.name}). Reason: ${reason}`);
      } catch (err) {
        console.error(`Offer creation error for ${targetClientId}:`, err);
      }
    },
    [syncTracksToPeer, sendSignalingMessage]
  );

  // General triggerOffer (backward-compatible)
  const triggerOffer = useCallback(
    async (targetId: string | null, reason: string) => {
      if (!isTeacher) return;
      if (targetId) {
        await triggerOfferForPeer(targetId, reason);
      } else {
        peersRef.current.forEach((_, pId) => {
          triggerOfferForPeer(pId, reason);
        });
      }
    },
    [isTeacher, triggerOfferForPeer]
  );

  // Remove a peer connection cleanly
  const removePeer = useCallback(
    (peerClientId: string) => {
      const entry = peersRef.current.get(peerClientId);
      if (entry) {
        if (entry.analyserCleanup) entry.analyserCleanup();
        try {
          entry.pc.close();
        } catch {}
        peersRef.current.delete(peerClientId);
        if (tasmeeStudentId === peerClientId) {
          setTasmeeStudentId(null);
        }
        updatePeersState();
      }
    },
    [tasmeeStudentId, updatePeersState]
  );

  // Select a student for Tasmee' mode (Spotlight)
  const handleSelectTasmeeStudent = useCallback(
    (studentClientId: string | null) => {
      if (!isTeacher) return;
      setTasmeeStudentId(studentClientId);
      sendSignalingMessage("TASMEE_SPOTLIGHT", { studentId: studentClientId });
    },
    [isTeacher, sendSignalingMessage]
  );

  // Kick a student from the classroom
  const handleTeacherKickStudent = useCallback(
    async (studentClientId: string) => {
      if (window.confirm("هل أنت متأكد من استبعاد هذا الطالب من الجلسة؟")) {
        await sendSignalingMessage("KICK", { targetClientId: studentClientId }, studentClientId);
        removePeer(studentClientId);
      }
    },
    [sendSignalingMessage, removePeer]
  );

  // Initialize or retrieve an RTCPeerConnection for a given client ID
  const getOrCreatePeer = useCallback(
    (targetClientId: string, peerRole: "teacher" | "student", peerName: string): PeerEntry => {
      let entry = peersRef.current.get(targetClientId);
      if (entry && entry.pc.signalingState !== "closed") {
        syncTracksToPeer(entry.pc);
        return entry;
      }

      if (entry && entry.pc.signalingState === "closed") {
        if (entry.analyserCleanup) entry.analyserCleanup();
      }

      const config = getIceServers();
      const pc = new RTCPeerConnection(config);
      const stream = new MediaStream();

      const newEntry: PeerEntry = {
        clientId: targetClientId,
        role: peerRole,
        name: peerName || (peerRole === "teacher" ? "معلم الحلقة" : "طالب العلم"),
        pc,
        stream,
        hasAudio: false,
        hasVideo: false,
        isVideoOn: true,
        isMicOn: true,
        isSpeaking: false,
        isHandRaised: false,
        connectionState: "connecting",
        iceCandidatesQueue: [],
      };
      peersRef.current.set(targetClientId, newEntry);

      // Attach local tracks
      syncTracksToPeer(pc);

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          sendSignalingMessage("ICE_CANDIDATE", event.candidate.toJSON(), targetClientId);
        }
      };

      pc.ontrack = (event) => {
        console.log(`[WebRTC] Track received from ${targetClientId} (${peerName}):`, event.track.kind, event.track.id);
        const p = peersRef.current.get(targetClientId);
        if (!p) return;

        // Cleanly remove any old track of the same kind to prevent track accumulation and stale buffer playout
        p.stream.getTracks().forEach((existingTrack) => {
          if (existingTrack.kind === event.track.kind && existingTrack.id !== event.track.id) {
            p.stream.removeTrack(existingTrack);
            try { existingTrack.stop(); } catch {}
          }
        });

        if (!p.stream.getTracks().some((t) => t.id === event.track.id)) {
          p.stream.addTrack(event.track);
        }

        p.hasAudio = p.stream.getAudioTracks().length > 0;
        p.hasVideo = p.stream.getVideoTracks().length > 0;

        if (event.track.kind === "audio") {
          // Enforce zero jitter buffer delay hint to prevent lag accumulation and repeat speech
          if (event.receiver && "playoutDelayHint" in event.receiver) {
            try {
              (event.receiver as any).playoutDelayHint = 0.0;
            } catch {}
          }

          if (p.analyserCleanup) {
            p.analyserCleanup();
          }
          p.analyserCleanup = setupAudioAnalyser(new MediaStream([event.track]), (speaking) => {
            const cur = peersRef.current.get(targetClientId);
            if (cur && cur.isSpeaking !== speaking) {
              cur.isSpeaking = speaking;
              updatePeersState();
            }
          });

          // Connect to dynamic recording mixer if recording is active
          if (recordingAudioDestRef.current && recordingAudioCtxRef.current) {
            try {
              const src = recordingAudioCtxRef.current.createMediaStreamSource(new MediaStream([event.track]));
              src.connect(recordingAudioDestRef.current);
            } catch (recErr) {
              console.warn("Could not attach peer audio to recording mixer:", recErr);
            }
          }
        }

        updatePeersState();
      };

      pc.onconnectionstatechange = () => {
        console.log(`[WebRTC] Connection state for ${targetClientId}:`, pc.connectionState);
        const p = peersRef.current.get(targetClientId);
        if (p) {
          p.connectionState = pc.connectionState;
          updatePeersState();
        }
      };

      pc.oniceconnectionstatechange = () => {
        console.log(`[WebRTC] ICE state for ${targetClientId}:`, pc.iceConnectionState);
        const p = peersRef.current.get(targetClientId);
        if (p) {
          if (pc.iceConnectionState === "failed") {
            if (isTeacher) {
              try {
                pc.restartIce();
                triggerOfferForPeer(targetClientId, "ICE_RESTART");
              } catch {}
            }
          }
          updatePeersState();
        }
      };

      updatePeersState();
      return newEntry;
    },
    [syncTracksToPeer, sendSignalingMessage, isTeacher, updatePeersState, triggerOfferForPeer]
  );

  // Backward-compatible getOrCreatePeerConnection
  const getOrCreatePeerConnection = useCallback(() => {
    const firstPeer = peersRef.current.values().next().value;
    if (firstPeer && firstPeer.pc.signalingState !== "closed") {
      return firstPeer.pc;
    }
    return null;
  }, []);

  // Request real hardware camera and microphone independently
  const initRealMedia = useCallback(async () => {
    setPermissionError(null);
    let micTrack: MediaStreamTrack | null = null;
    let camTrack: MediaStreamTrack | null = null;
    let micSuccess = false;
    let camSuccess = false;

    // Step 1: Attempt full combined request
    try {
      const combined = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 24 },
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
        },
      });

      const audioTracks = combined.getAudioTracks();
      const videoTracks = combined.getVideoTracks();

      if (audioTracks.length > 0) {
        micTrack = audioTracks[0];
        micSuccess = true;
      }
      if (videoTracks.length > 0) {
        camTrack = videoTracks[0];
        camSuccess = true;
      }
    } catch (errCombined: any) {
      console.warn("Combined getUserMedia failed, attempting separate requests...", errCombined?.name);

      // Step 2: Try microphone independently
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            channelCount: 1,
          },
        });
        if (audioStream.getAudioTracks().length > 0) {
          micTrack = audioStream.getAudioTracks()[0];
          micSuccess = true;
        }
      } catch (errAudio: any) {
        console.warn("Microphone access failed:", errAudio?.name || errAudio);
      }

      // Step 3: Try camera independently
      try {
        const videoStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            frameRate: { ideal: 24 },
          },
        });
        if (videoStream.getVideoTracks().length > 0) {
          camTrack = videoStream.getVideoTracks()[0];
          camSuccess = true;
        }
      } catch (errVideo: any) {
        console.warn("Camera access failed:", errVideo?.name || errVideo);
      }
    }

    setHasRealMic(micSuccess);
    setHasRealCam(camSuccess);

    // Build the actual MediaStream with real hardware tracks only (NO fake audio oscillators)
    const newStream = new MediaStream();
    if (micTrack) {
      micTrack.enabled = isTeacher ? isMicOn : (canSpeak && isMicOn);
      newStream.addTrack(micTrack);
    }
    if (camTrack) {
      camTrack.enabled = isVideoOn;
      newStream.addTrack(camTrack);
    }

    // Stop old tracks if any
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
    }

    localStreamRef.current = newStream;

    // Attach to local video preview if video is present
    if (localVideoRef.current && camTrack) {
      localVideoRef.current.srcObject = newStream;
      localVideoRef.current.play().catch(() => {});
    }

    // Set user-facing status notice
    if (micSuccess && camSuccess) {
      setMediaTypeNotice("الكاميرا والميكروفون متصلان بنجاح");
    } else if (micSuccess && !camSuccess) {
      setMediaTypeNotice("الميكروفون متصل (الكاميرا غير متوفرة أو محجوبة)");
    } else if (!micSuccess && camSuccess) {
      setMediaTypeNotice("الكاميرا متصلة (الميكروفون غير متوفر أو محجوب)");
    } else {
      setMediaTypeNotice("لم يتم العثور على كاميرا أو ميكروفون متاحين");
      setPermissionError("لم نتمكن من الوصول للكاميرا أو الميكروفون. يرجى التأكد من توصيل الأجهزة ومنح الإذن في المتصفح.");
    }

    // Setup local audio analyser for real voice activity
    if (localAudioAnalyserCleanupRef.current) {
      localAudioAnalyserCleanupRef.current();
      localAudioAnalyserCleanupRef.current = null;
    }
    if (micTrack) {
      localAudioAnalyserCleanupRef.current = setupAudioAnalyser(newStream, setLocalIsSpeaking);
    }

    // Sync with all peers
    syncAllPeersTracks();

    return newStream;
  }, [isTeacher, canSpeak, isMicOn, isVideoOn, syncAllPeersTracks]);

  // Initial media hardware initialization (runs once per session lifecycle)
  useEffect(() => {
    let isCancelled = false;

    initRealMedia().then(() => {
      if (isCancelled) return;
      // Announce presence immediately
      sendSignalingMessage("PRESENCE", { role: myRole, name: myName, video: isVideoOn, mic: isMicOn });
      if (isTeacher) {
        setTimeout(() => triggerOffer(null, "INIT_MEDIA"), 600);
      }
    });

    return () => {
      isCancelled = true;
      if (localAudioAnalyserCleanupRef.current) {
        localAudioAnalyserCleanupRef.current();
        localAudioAnalyserCleanupRef.current = null;
      }
      peersRef.current.forEach((peer) => {
        if (peer.analyserCleanup) peer.analyserCleanup();
        try {
          peer.pc.close();
        } catch {}
      });
      peersRef.current.clear();
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
      }
    };
  }, [sessionId]);

  // Clean exit announcement on page close or unmount
  useEffect(() => {
    const handleBeforeUnload = () => {
      sendSignalingMessage("PEER_LEFT", { clientId });
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      sendSignalingMessage("PEER_LEFT", { clientId });
    };
  }, [clientId, sendSignalingMessage]);

  // Continuously synchronize local audio track with state and permissions with zero stream teardown
  useEffect(() => {
    if (!localStreamRef.current) return;
    const shouldBeEnabled = isTeacher ? isMicOn : (canSpeak && isMicOn);
    localStreamRef.current.getAudioTracks().forEach((track) => {
      if (track.enabled !== shouldBeEnabled) {
        track.enabled = shouldBeEnabled;
      }
    });
  }, [isTeacher, canSpeak, isMicOn]);

  // Signaling message handler with Multi-Peer support
  const handleSignalMessage = useCallback(
    async (msg: any) => {
      const { signalType, senderRole, senderName, senderClientId, targetClientId, data } = msg;

      // Filter out messages specifically targeted to other clients
      if (targetClientId && targetClientId !== clientId) {
        return;
      }

      if (senderName && !remotePeerName) {
        setRemotePeerName(senderName);
      }

      try {
        if (signalType === "PRESENCE") {
          const peerRole = (senderRole as "teacher" | "student") || "student";
          const entry = getOrCreatePeer(senderClientId, peerRole, senderName);
          entry.name = senderName || entry.name;
          if (data?.video !== undefined) entry.isVideoOn = Boolean(data.video);
          if (data?.mic !== undefined) entry.isMicOn = Boolean(data.mic);
          updatePeersState();

          if (isTeacher) {
            // Check if already active & connected before triggering offer to avoid renegotiation loops every 3s
            const isAlreadyActive =
              entry.pc.remoteDescription !== null &&
              (entry.pc.connectionState === "connected" ||
               entry.pc.iceConnectionState === "connected" ||
               entry.pc.iceConnectionState === "completed");

            if (!isAlreadyActive && entry.pc.signalingState === "stable") {
              setTimeout(() => triggerOfferForPeer(senderClientId, "STUDENT_INITIAL_JOIN"), 250);
            }
          } else {
            // Student responds with PRESENCE_ACK targeted to Sheikh
            sendSignalingMessage(
              "PRESENCE_ACK",
              { role: myRole, name: myName, video: isVideoOn, mic: isMicOn },
              senderClientId
            );
          }
        } else if (signalType === "PRESENCE_ACK") {
          const peerRole = (senderRole as "teacher" | "student") || "student";
          const entry = getOrCreatePeer(senderClientId, peerRole, senderName);
          entry.name = senderName || entry.name;
          if (data?.video !== undefined) entry.isVideoOn = Boolean(data.video);
          if (data?.mic !== undefined) entry.isMicOn = Boolean(data.mic);
          updatePeersState();

          if (isTeacher) {
            const isAlreadyActive =
              entry.pc.remoteDescription !== null &&
              (entry.pc.connectionState === "connected" ||
               entry.pc.iceConnectionState === "connected" ||
               entry.pc.iceConnectionState === "completed");

            if (!isAlreadyActive && entry.pc.signalingState === "stable") {
              setTimeout(() => triggerOfferForPeer(senderClientId, "PRESENCE_ACK_INITIAL"), 200);
            }
          }
        } else if (signalType === "OFFER") {
          const peerRole = (senderRole as "teacher" | "student") || "teacher";
          const entry = getOrCreatePeer(senderClientId, peerRole, senderName);
          const pc = entry.pc;
          syncTracksToPeer(pc);

          await pc.setRemoteDescription(new RTCSessionDescription(data));

          // Drain queued ICE candidates for this peer
          while (entry.iceCandidatesQueue.length > 0) {
            const cand = entry.iceCandidatesQueue.shift();
            if (cand) {
              await pc.addIceCandidate(new RTCIceCandidate(cand)).catch(() => {});
            }
          }

          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          await sendSignalingMessage("ANSWER", answer, senderClientId);
          console.log(`Student sent answer to ${senderClientId} (${senderName})`);
        } else if (signalType === "ANSWER") {
          const entry = peersRef.current.get(senderClientId);
          if (entry && entry.pc.signalingState === "have-local-offer") {
            await entry.pc.setRemoteDescription(new RTCSessionDescription(data));

            while (entry.iceCandidatesQueue.length > 0) {
              const cand = entry.iceCandidatesQueue.shift();
              if (cand) {
                await entry.pc.addIceCandidate(new RTCIceCandidate(cand)).catch(() => {});
              }
            }
            console.log(`Teacher accepted answer from ${senderClientId}`);
            updatePeersState();
          }
        } else if (signalType === "ICE_CANDIDATE") {
          const entry = peersRef.current.get(senderClientId);
          if (entry) {
            if (entry.pc.remoteDescription && entry.pc.remoteDescription.type) {
              await entry.pc.addIceCandidate(new RTCIceCandidate(data)).catch((e) => {
                console.warn("Error adding ICE candidate:", e);
              });
            } else {
              entry.iceCandidatesQueue.push(data);
            }
          }
        } else if (signalType === "MEDIA_STATE" && data) {
          const entry = peersRef.current.get(senderClientId);
          if (entry) {
            if (data.video !== undefined) entry.isVideoOn = Boolean(data.video);
            if (data.mic !== undefined) entry.isMicOn = Boolean(data.mic);
            updatePeersState();
          }
        } else if (signalType === "TASMEE_SPOTLIGHT") {
          setTasmeeStudentId(data?.studentId || null);
        } else if (signalType === "PEER_LEFT" && data) {
          const leavingId = data.clientId || senderClientId;
          removePeer(leavingId);
        } else if (signalType === "KICK") {
          if (!isTeacher && (data?.targetClientId === clientId || !data?.targetClientId)) {
            alert("قام فضيلة الشيخ بإخراجك من الحلقة الحالية.");
            window.location.href = "/student/dashboard";
          }
        } else if (signalType === "CHAT_MESSAGE" && data) {
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
          const entry = peersRef.current.get(senderClientId);
          if (entry) {
            entry.isHandRaised = Boolean(data.raised);
            updatePeersState();
          }
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
          if (!isTeacher && (data?.targetClientId === clientId || !data?.targetClientId)) {
            setIsMicOn(false);
            if (localStreamRef.current) {
              localStreamRef.current.getAudioTracks().forEach((track) => {
                track.enabled = false;
              });
            }
            sendSignalingMessage("MEDIA_STATE", { mic: false, video: isVideoOn });
          }
        } else if (signalType === "SPEAK_REQUEST" && data) {
          if (isTeacher) {
            const reqStudentId = data.studentId || senderClientId;
            const reqStudentName = data.studentName || senderName || "طالب العلم";
            setPendingSpeakRequests((prev) => {
              if (prev.some((r) => r.studentId === reqStudentId)) return prev;
              return [...prev, { studentId: reqStudentId, studentName: reqStudentName }];
            });
            playTeacherJoinAlertSound();
          }
        } else if (signalType === "SPEAK_DECISION" && data) {
          if (!isTeacher) {
            if (data.targetClientId && data.targetClientId !== clientId) return;
            if (data.granted) {
              setCanSpeak(true);
              setIsMicOn(true);
              setSpeakRequestStatus("GRANTED");
              setSpeakNotice("منحك فضيلة الشيخ إذن التحدث بالميكروفون 🎙️ - تم تفعيل المايك بنجاح");
              playStudentApprovedSound();

              // Cleanly enable audio track without touching video or resetting connection
              if (localStreamRef.current) {
                localStreamRef.current.getAudioTracks().forEach((track) => {
                  track.enabled = true;
                });
              }

              sendSignalingMessage("MEDIA_STATE", { mic: true, video: isVideoOn });
              setTimeout(() => setSpeakNotice(null), 7000);
            } else {
              setCanSpeak(false);
              setSpeakRequestStatus("REJECTED");
              setSpeakNotice("اعتذر فضيلة الشيخ عن منح إذن التحدث حالياً.");
              setTimeout(() => setSpeakNotice(null), 5000);
            }
          }
        } else if (signalType === "SPEAK_REVOKED" && data) {
          if (!isTeacher) {
            if (data.targetClientId && data.targetClientId !== clientId) return;
            setCanSpeak(false);
            setIsMicOn(false);
            setSpeakRequestStatus("IDLE");
            if (localStreamRef.current) {
              localStreamRef.current.getAudioTracks().forEach((track) => {
                track.enabled = false;
              });
            }
            sendSignalingMessage("MEDIA_STATE", { mic: false, video: isVideoOn });
            setSpeakNotice("قام فضيلة الشيخ بسحب إذن التحدث وكتم الميكروفون.");
            setTimeout(() => setSpeakNotice(null), 5000);
          }
        } else if (signalType === "SESSION_FOLLOWUP_REQUESTED" && data) {
          if (isTeacher) {
            playTeacherJoinAlertSound();
            setPendingFollowUpRequests((prev) => {
              if (prev.some((r) => r.requestId === data.requestId)) return prev;
              return [...prev, data];
            });
            fetchAvailableSlots();
          }
        } else if (signalType === "RECORDING_STATE" && data) {
          setRemoteIsRecording(Boolean(data.isRecording));
          if (data.recordingType) {
            setActiveRecordingType(data.recordingType);
          }
        }
      } catch (err) {
        console.error("Signal handle error:", err);
      }
    },
    [
      getOrCreatePeer,
      isTeacher,
      myRole,
      myName,
      remotePeerName,
      sendSignalingMessage,
      syncTracksToPeer,
      triggerOfferForPeer,
      updatePeersState,
      removePeer,
      clientId,
      isVideoOn,
      isMicOn,
      activeTab,
    ]
  );

  // Robust HTTP Signaling Polling Loop
  useEffect(() => {
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
          if (data.latestId !== undefined && data.latestId > lastSignalIdRef.current) {
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

    // Poll every 800ms
    const interval = setInterval(pollSignals, 800);

    // Heartbeat presence: ping presence periodically & real-time low-latency audio health check
    const heartbeat = setInterval(() => {
      sendSignalingMessage("PRESENCE", { role: myRole, name: myName, video: isVideoOn, mic: isMicOn });
      if (isTeacher) {
        peersRef.current.forEach((peer, pId) => {
          if (peer.pc.signalingState === "stable" && peer.connectionState !== "connected") {
            triggerOfferForPeer(pId, "HEARTBEAT_RETRY");
          }
        });
      }

      // Enforce zero jitter buffer delay hint across all audio receivers to eliminate audio latency buildup
      peersRef.current.forEach((peer) => {
        if (peer.pc && (peer.pc.connectionState === "connected" || peer.pc.iceConnectionState === "connected")) {
          peer.pc.getReceivers().forEach((receiver) => {
            if (receiver.track && receiver.track.kind === "audio" && "playoutDelayHint" in receiver) {
              try {
                (receiver as any).playoutDelayHint = 0.0;
              } catch {}
            }
          });
        }
      });
    }, 3000);

    return () => {
      active = false;
      clearInterval(interval);
      clearInterval(heartbeat);
    };
  }, [sessionId, session?.id, myRole, isTeacher, clientId, hasRemoteStream, handleSignalMessage, sendSignalingMessage, triggerOffer, myName]);

  // Keep local and remote media elements continuously attached to active streams
  useEffect(() => {
    if (localVideoRef.current && localStreamRef.current) {
      if (localVideoRef.current.srcObject !== localStreamRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
        localVideoRef.current.play().catch(() => {});
      }
    }
    if (remoteVideoRef.current && remoteStreamRef.current) {
      if (remoteVideoRef.current.srcObject !== remoteStreamRef.current) {
        remoteVideoRef.current.srcObject = remoteStreamRef.current;
        remoteVideoRef.current.play().catch(() => {});
      }
    }

  }, [hasRemoteStream, isTeacher, isVideoOn, authStatus]);

  // Ambient user interaction audio unlocker for mobile browsers
  useEffect(() => {
    const handleUnlockAudio = () => {
      document.querySelectorAll("audio").forEach((a) => {
        if (a.paused) {
          a.play().then(() => setNeedsAudioUnlock(false)).catch(() => {});
        }
      });
      if (remoteVideoRef.current && remoteVideoRef.current.paused) {
        remoteVideoRef.current.play().catch(() => {});
      }
    };
    window.addEventListener("click", handleUnlockAudio, { passive: true });
    window.addEventListener("touchstart", handleUnlockAudio, { passive: true });
    return () => {
      window.removeEventListener("click", handleUnlockAudio);
      window.removeEventListener("touchstart", handleUnlockAudio);
    };
  }, []);

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
    if (!isTeacher && !canSpeak) {
      alert("الميكروفون مقفل حالياً. يرجى الضغط على زر «طلب التحدث ✋» لطلب الإذن من فضيلة الشيخ أولاً.");
      return;
    }
    const next = !isMicOn;
    setIsMicOn(next);
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = next;
      });
    }
    sendSignalingMessage("MEDIA_STATE", { mic: next, video: isVideoOn });
  };

  const handleRequestToSpeak = async () => {
    if (speakRequestStatus === "REQUESTED") return;
    setSpeakRequestStatus("REQUESTED");
    setSpeakNotice("تم إرسال طلب التحدث لفضيلة الشيخ... بانتظار الإذن ⏳");
    await sendSignalingMessage("SPEAK_REQUEST", {
      studentId: clientId,
      studentName: myName,
    });
  };

  const handleTeacherGrantSpeak = async (studentClientId: string) => {
    setPendingSpeakRequests((prev) => prev.filter((r) => r.studentId !== studentClientId));
    await sendSignalingMessage(
      "SPEAK_DECISION",
      {
        targetClientId: studentClientId,
        granted: true,
      },
      studentClientId
    );
    handleSelectTasmeeStudent(studentClientId);
  };

  const handleTeacherRejectSpeak = async (studentClientId: string) => {
    setPendingSpeakRequests((prev) => prev.filter((r) => r.studentId !== studentClientId));
    await sendSignalingMessage(
      "SPEAK_DECISION",
      {
        targetClientId: studentClientId,
        granted: false,
      },
      studentClientId
    );
  };

  const handleTeacherRevokeSpeak = async (targetId?: string) => {
    const target = targetId || remoteClientIdRef.current;
    await sendSignalingMessage(
      "SPEAK_REVOKED",
      {
        targetClientId: target,
      },
      target
    );
    alert("تم سحب إذن التحدث وكتم صوت الطالب بنجاح.");
  };

  const startRealRecording = async (type: "AUDIO_VIDEO" | "AUDIO_ONLY") => {
    if (typeof window === "undefined" || !(window as any).MediaRecorder) {
      alert("عذراً، متصفحك لا يدعم تسجيل الوسائط MediaRecorder.");
      return;
    }

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      recordingAudioCtxRef.current = audioCtx;
      if (audioCtx.state === "suspended") {
        await audioCtx.resume();
      }
      const audioDest = audioCtx.createMediaStreamDestination();
      recordingAudioDestRef.current = audioDest;

      if (localStreamRef.current && localStreamRef.current.getAudioTracks().length > 0) {
        try {
          const localSrc = audioCtx.createMediaStreamSource(
            new MediaStream([localStreamRef.current.getAudioTracks()[0]])
          );
          localSrc.connect(audioDest);
        } catch (e) {
          console.warn("Could not attach local audio to recording mixer:", e);
        }
      }

      if (remoteStreamRef.current && remoteStreamRef.current.getAudioTracks().length > 0) {
        try {
          const remoteSrc = audioCtx.createMediaStreamSource(
            new MediaStream([remoteStreamRef.current.getAudioTracks()[0]])
          );
          remoteSrc.connect(audioDest);
        } catch (e) {
          console.warn("Could not attach remote audio to recording mixer:", e);
        }
      }

      let combinedStream: MediaStream;
      let chosenMime = "";

      if (type === "AUDIO_VIDEO") {
        const canvas = document.createElement("canvas");
        canvas.width = 1280;
        canvas.height = 720;
        const ctx = canvas.getContext("2d");
        recordingCanvasRef.current = canvas;

        const drawLoop = () => {
          if (!ctx) return;
          ctx.fillStyle = "#090d16";
          ctx.fillRect(0, 0, 1280, 720);

          const localVid = localVideoRef.current;
          const remoteVid = remoteVideoRef.current;
          const hasLocal = localVid && localVid.readyState >= 2 && !localVid.paused;
          const hasRemote = remoteVid && remoteVid.readyState >= 2 && !remoteVid.paused;

          if (hasLocal && hasRemote) {
            ctx.drawImage(localVid, 650, 60, 610, 580);
            ctx.drawImage(remoteVid, 20, 60, 610, 580);

            ctx.fillStyle = "rgba(15, 23, 42, 0.8)";
            ctx.fillRect(650, 600, 610, 40);
            ctx.fillRect(20, 600, 610, 40);
            ctx.font = "bold 20px Cairo, sans-serif";
            ctx.fillStyle = "#facc15";
            ctx.textAlign = "right";
            ctx.fillText(myName || "معلم الحلقة", 1240, 628);
            ctx.fillText(remotePeerName || "طالب العلم", 610, 628);
          } else if (hasLocal) {
            ctx.drawImage(localVid, 160, 60, 960, 600);
            ctx.fillStyle = "rgba(15, 23, 42, 0.8)";
            ctx.fillRect(160, 620, 960, 40);
            ctx.font = "bold 20px Cairo, sans-serif";
            ctx.fillStyle = "#facc15";
            ctx.textAlign = "right";
            ctx.fillText(myName || "معلم الحلقة", 1100, 648);
          } else if (hasRemote) {
            ctx.drawImage(remoteVid, 160, 60, 960, 600);
            ctx.fillStyle = "rgba(15, 23, 42, 0.8)";
            ctx.fillRect(160, 620, 960, 40);
            ctx.font = "bold 20px Cairo, sans-serif";
            ctx.fillStyle = "#facc15";
            ctx.textAlign = "right";
            ctx.fillText(remotePeerName || "طالب العلم", 1100, 648);
          } else {
            ctx.fillStyle = "#1e293b";
            ctx.fillRect(100, 80, 1080, 560);
            ctx.font = "bold 30px Cairo, sans-serif";
            ctx.fillStyle = "#f8fafc";
            ctx.textAlign = "center";
            ctx.fillText("جلسة تحفيظ وتجويد القرآن الكريم", 640, 340);
            ctx.font = "18px Cairo, sans-serif";
            ctx.fillStyle = "#94a3b8";
            ctx.fillText(session?.title || "منصة ورتّل القرآنية", 640, 390);
          }

          ctx.fillStyle = "rgba(6, 78, 59, 0.9)";
          ctx.fillRect(0, 0, 1280, 50);
          ctx.font = "bold 20px Cairo, sans-serif";
          ctx.fillStyle = "#ffffff";
          ctx.textAlign = "right";
          ctx.fillText("منصة ورتّل - جلسة تحفيظ وتجويد القرآن الكريم", 1250, 32);

          ctx.fillStyle = "#ef4444";
          ctx.beginPath();
          ctx.arc(35, 25, 7, 0, 2 * Math.PI);
          ctx.fill();
          ctx.font = "bold 14px Cairo, sans-serif";
          ctx.fillStyle = "#ffffff";
          ctx.textAlign = "left";
          ctx.fillText("تسجيل مباشر (صوت وصورة)", 50, 30);

          recordingAnimRef.current = requestAnimationFrame(drawLoop);
        };

        drawLoop();
        const canvasStream = canvas.captureStream(25);
        combinedStream = new MediaStream([
          ...canvasStream.getVideoTracks(),
          ...audioDest.stream.getAudioTracks(),
        ]);

        const videoMimes = [
          "video/webm;codecs=vp8,opus",
          "video/webm;codecs=vp9,opus",
          "video/webm;codecs=h264,opus",
          "video/webm",
        ];
        chosenMime = videoMimes.find((m) => MediaRecorder.isTypeSupported(m)) || "";
      } else {
        combinedStream = new MediaStream([
          ...audioDest.stream.getAudioTracks(),
        ]);
        const audioMimes = [
          "audio/webm;codecs=opus",
          "audio/webm",
          "audio/ogg;codecs=opus",
        ];
        chosenMime = audioMimes.find((m) => MediaRecorder.isTypeSupported(m)) || "";
      }

      recordingStreamRef.current = combinedStream;
      recordingChunksRef.current = [];

      const recorder = new MediaRecorder(combinedStream, {
        mimeType: chosenMime || undefined,
      });

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordingChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        try {
          setIsUploadingRecording(true);
          const blob = new Blob(recordingChunksRef.current, {
            type: chosenMime || (type === "AUDIO_ONLY" ? "audio/webm" : "video/webm"),
          });

          const ext = "webm";
          const fileName = `rec_${sessionId}_${Date.now()}.${ext}`;

          const formData = new FormData();
          formData.append("file", blob, fileName);
          formData.append("sessionId", sessionId);
          formData.append("halaqaId", session?.halaqaId || session?.halaqa?.id || "");
          formData.append(
            "title",
            `تسجيل ${session?.title || "الحلقة"} (${type === "AUDIO_ONLY" ? "صوت فقط" : "صوت وصورة"})`
          );
          formData.append("durationSeconds", String(recordSeconds));
          formData.append("recordingType", type);

          const res = await fetch("/api/recordings", {
            method: "POST",
            body: formData,
          });

          if (res.ok) {
            alert("تم حفظ ورفع التسجيل بنجاح في مكتبة التسجيلات!");
          } else {
            const errD = await res.json().catch(() => ({}));
            alert(errD.error || "حدث خطأ أثناء حفظ التسجيل");
          }
        } catch (uploadErr) {
          console.error("Recording upload error:", uploadErr);
          alert("تعذر رفع التسجيل إلى الخادم");
        } finally {
          setIsUploadingRecording(false);
          setRecordSeconds(0);
          setIsRecording(false);
        }
      };

      recorder.start(1000);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setActiveRecordingType(type);
      setShowRecordingModal(false);
      sendSignalingMessage("RECORDING_STATE", { isRecording: true, recordingType: type });
    } catch (err: any) {
      console.error("Failed to start recording:", err);
      alert(`تعذر بدء التسجيل: ${err?.message || "خطأ غير معروف"}`);
    }
  };

  const stopRealRecording = () => {
    if (recordingAnimRef.current) {
      cancelAnimationFrame(recordingAnimRef.current);
      recordingAnimRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (recordingStreamRef.current) {
      recordingStreamRef.current.getTracks().forEach((t) => t.stop());
    }
    if (recordingAudioCtxRef.current) {
      recordingAudioCtxRef.current.close().catch(() => {});
      recordingAudioCtxRef.current = null;
    }
    recordingAudioDestRef.current = null;
    sendSignalingMessage("RECORDING_STATE", { isRecording: false });
  };

  const toggleVideo = () => {
    const next = !isVideoOn;
    setIsVideoOn(next);
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = next;
      });
    }
    sendSignalingMessage("MEDIA_STATE", { mic: isMicOn, video: next });
  };

  const handleEndSession = async () => {
    if (window.confirm("هل أنت متأكد من إنهاء الحلقة لجميع الطلاب الآن؟")) {
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

  if (loading || authStatus === "CHECKING") {
    return (
      <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Radio className="w-8 h-8 text-emerald-500 animate-spin" />
        <p className="text-sm font-bold">جارٍ التحقق من تصريح القبول والاعتماد من الشيخ...</p>
      </div>
    );
  }

  // If a student joined a classroom where no live session is currently active
  if (!isTeacher && (!session || session?.status !== "ACTIVE")) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full text-center space-y-5 text-white shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto border border-amber-400/20">
            <Radio className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-black text-white">لا توجد حلقة منعقدة حالياً</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              لم يبدأ فضيلة الشيخ بث الحلقة بعد. سيظهر إشعار فوري وتنبيه في لوحة التحكم عند بدء انعقاد الجلسة.
            </p>
          </div>
          <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
            <button
              onClick={fetchSession}
              className="px-5 py-2.5 rounded-xl text-xs font-black bg-amber-500 hover:bg-amber-400 text-slate-950 transition flex items-center justify-center gap-1.5"
            >
              <RefreshCw className="w-4 h-4" />
              تحديث
            </button>
            <Link
              href="/student/dashboard"
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 transition text-center"
            >
              العودة للوحة الطالب
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const studentsList = session?.halaqa?.enrollments || [];
  const connectedStudents = remotePeers.filter((p) => p.role === "student");
  const teacherPeer = remotePeers.find((p) => p.role === "teacher") || null;
  const activeTasmeeStudent = connectedStudents.find((s) => s.clientId === tasmeeStudentId) || null;

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] bg-slate-950 text-white rounded-2xl overflow-hidden shadow-2xl border border-slate-800 relative">
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

      {/* Teacher Session Follow-up Requests Floating Decision Bar */}
      {isTeacher && pendingFollowUpRequests.length > 0 && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 max-w-2xl w-[95%] animate-in slide-in-from-top duration-300">
          <div className="bg-slate-900/98 text-white rounded-3xl p-4 sm:p-5 shadow-2xl border-2 border-emerald-500/90 backdrop-blur-md space-y-3.5">
            {/* Header with Student Info */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black shrink-0">
                  <Eye className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      طلب متابعة جلسة مباشرة 👁️
                    </span>
                    <span className="text-[10px] text-slate-400">
                      توقيت الطلب: {pendingFollowUpRequests[0].requestTime || "الآن"}
                    </span>
                  </div>
                  <h4 className="text-sm font-black text-white mt-0.5">
                    الطالب: <strong className="text-emerald-300">{pendingFollowUpRequests[0].studentName || "طالب العلم"}</strong> ({pendingFollowUpRequests[0].studentNumber || "طالب"})
                  </h4>
                  <span className="text-[10px] text-slate-400 block">
                    الجلسة: {pendingFollowUpRequests[0].sessionTitle || pendingFollowUpRequests[0].halaqaName || session?.halaqa?.name}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setPendingFollowUpRequests((prev) => prev.slice(1))}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg"
                title="إخفاء التنبيه مؤقتاً"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 5 Distinct Actions for the Sheikh */}
            <div className="space-y-2.5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {/* Decision 1: Accept Now (Muted) */}
                <button
                  onClick={() => handleSheikhDecision(pendingFollowUpRequests[0].requestId, "ACCEPT_NOW")}
                  disabled={isSubmittingDecision}
                  className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs py-2 px-3 rounded-xl shadow-lg transition active:scale-95 cursor-pointer disabled:opacity-50"
                  title="قبول الطالب الآن في الجلسة ويدخل بصوت مكتوم"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>1. قبول الآن (صامت) ✅</span>
                </button>

                {/* Decision 2: Reject */}
                <button
                  onClick={() => {
                    const r = window.prompt("سبب الاعتذار (اختياري):", "اعتذر الشيخ لاكتمال الحضور");
                    handleSheikhDecision(pendingFollowUpRequests[0].requestId, "REJECT", { reason: r || undefined });
                  }}
                  disabled={isSubmittingDecision}
                  className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-red-900 text-red-300 hover:text-white font-bold text-xs py-2 px-3 rounded-xl border border-slate-700 transition cursor-pointer disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" />
                  <span>2. رفض الطلب ❌</span>
                </button>

                {/* Decision 3: Defer / Reply Later */}
                <button
                  onClick={() => handleSheikhDecision(pendingFollowUpRequests[0].requestId, "DEFER")}
                  disabled={isSubmittingDecision}
                  className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-blue-900 text-blue-300 hover:text-white font-bold text-xs py-2 px-3 rounded-xl border border-slate-700 transition cursor-pointer disabled:opacity-50"
                >
                  <Clock className="w-4 h-4" />
                  <span>3. تعليق والرد لاحقاً ⏳</span>
                </button>
              </div>

              {/* Decisions 4 & 5: Propose Existing Slot OR Create New Slot */}
              <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-amber-300 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>4. اقتراح موعد متاح بالفعل في جدولك:</span>
                  </span>
                  <button
                    onClick={() => {
                      setTargetFollowUpForNewSlot(pendingFollowUpRequests[0]);
                      setShowNewSlotModal(true);
                    }}
                    className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>5. إنشاء موعد جديد مخصص</span>
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <select
                    value={selectedFollowUpSlotId}
                    onChange={(e) => setSelectedFollowUpSlotId(e.target.value)}
                    className="w-full sm:flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                  >
                    {availableSlots.length === 0 ? (
                      <option value="">لا توجد مواعيد متاحة حالياً - أنشئ موعداً جديداً</option>
                    ) : (
                      availableSlots.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.title} ({s.dayOfWeek || "الموعد"} {s.startTime} - {s.endTime})
                        </option>
                      ))
                    )}
                  </select>
                  <button
                    onClick={() => {
                      if (!selectedFollowUpSlotId) {
                        alert("يرجى اختيار موعد متاح أولاً");
                        return;
                      }
                      handleSheikhDecision(pendingFollowUpRequests[0].requestId, "PROPOSE_EXISTING_SLOT", {
                        slotId: selectedFollowUpSlotId,
                      });
                    }}
                    disabled={isSubmittingDecision || !selectedFollowUpSlotId}
                    className="w-full sm:w-auto bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs px-3.5 py-2 rounded-xl transition disabled:opacity-50 shrink-0 cursor-pointer"
                  >
                    إرسال الموعد المقترح للطالب ✉️
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sheikh Create New Appointment Slot Modal (Option 5) */}
      {showNewSlotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 text-right">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">5. إنشاء واقتراح موعد جديد للطالب</h3>
                  <p className="text-[10px] text-slate-400">تحديد موعد مخصص وفحص التعارض مع جدول الشيخ</p>
                </div>
              </div>
              <button
                onClick={() => setShowNewSlotModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-bold">عنوان الجلسة / الغرض:</label>
                <input
                  type="text"
                  value={newSlotTitle}
                  onChange={(e) => setNewSlotTitle(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">التاريخ:</label>
                  <input
                    type="date"
                    value={newSlotDate}
                    onChange={(e) => setNewSlotDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">وقت البداية:</label>
                  <input
                    type="time"
                    value={newSlotTime}
                    onChange={(e) => setNewSlotTime(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">المدة بالدقائق:</label>
                  <select
                    value={newSlotDuration}
                    onChange={(e) => setNewSlotDuration(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-emerald-500"
                  >
                    <option value="15">15 دقيقة</option>
                    <option value="30">30 دقيقة</option>
                    <option value="45">45 دقيقة</option>
                    <option value="60">60 دقيقة</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">نوع الجلسة:</label>
                  <select
                    value={newSlotType}
                    onChange={(e) => setNewSlotType(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-emerald-500"
                  >
                    <option value="ONE_ON_ONE">جلسة فردية خاصة</option>
                    <option value="HALAQA">حلقة جماعية</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowNewSlotModal(false)}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white font-bold text-xs"
              >
                إلغاء
              </button>
              <button
                type="button"
                disabled={isSubmittingDecision}
                onClick={() => {
                  if (!targetFollowUpForNewSlot) return;
                  handleSheikhDecision(targetFollowUpForNewSlot.requestId, "CREATE_AND_PROPOSE_SLOT", {
                    slotTitle: newSlotTitle,
                    slotDate: newSlotDate,
                    startTime: newSlotTime,
                    durationMinutes: newSlotDuration,
                    slotType: newSlotType,
                  });
                }}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1.5 shadow-lg active:scale-95 disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>حفظ واقتراح الموعد للطالب فوراً</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Teacher Speak Requests Floating Bar */}
      {isTeacher && pendingSpeakRequests.length > 0 && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 max-w-lg w-[95%] animate-in slide-in-from-top duration-200">
          <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-amber-950 text-white rounded-2xl p-3.5 shadow-2xl border-2 border-amber-500/90 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-black">
                <Hand className="w-5 h-5 animate-bounce" />
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black text-amber-300 block">طلب الإذن بالتحدث بالميكروفون</span>
                <span className="text-xs font-bold text-white block">
                  الطالب <strong className="text-amber-300">{pendingSpeakRequests[0].studentName}</strong> يطلب التحدث
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleTeacherGrantSpeak(pendingSpeakRequests[0].studentId)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs px-3.5 py-1.5 rounded-xl shadow transition flex items-center gap-1 active:scale-95"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                منح الإذن ✅
              </button>
              <button
                onClick={() => handleTeacherRejectSpeak(pendingSpeakRequests[0].studentId)}
                className="bg-slate-800 hover:bg-red-900 text-slate-300 hover:text-white font-bold text-xs px-3 py-1.5 rounded-xl transition border border-slate-700"
              >
                رفض ❌
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Student Speak Notice Banner */}
      {!isTeacher && speakNotice && (
        <div className="bg-emerald-950/95 border-b border-emerald-500/60 px-4 py-2.5 text-emerald-200 text-xs font-bold flex items-center justify-between gap-2 z-40 backdrop-blur-md animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
            <span>{speakNotice}</span>
          </div>
          <button
            onClick={() => setSpeakNotice(null)}
            className="p-1 text-slate-400 hover:text-white rounded-lg"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Multi-Peer Dedicated Unmuted Audio Elements */}
      {remotePeers.map((peer) => (
        <RemotePeerAudio
          key={peer.clientId}
          peer={peer}
          onUnlockNeeded={() => setNeedsAudioUnlock(true)}
        />
      ))}

      {/* Floating Audio Unlock Button for Mobile browsers when autoplay is restricted */}
      {needsAudioUnlock && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-bounce">
          <button
            onClick={() => {
              document.querySelectorAll("audio").forEach((a) => a.play().catch(() => {}));
              setNeedsAudioUnlock(false);
            }}
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black px-4 py-2.5 rounded-full shadow-2xl text-xs border-2 border-white cursor-pointer active:scale-95 transition"
          >
            <Volume2 className="w-4 h-4 text-amber-300" />
            انقر هنا لتفعيل صوت الطرف الآخر المباشر
          </button>
        </div>
      )}

      {/* Non-blocking Status Ribbon for Student pending sheikh approval / follow-up */}
      {!isTeacher && authStatus !== "AUTHORIZED" && (
        <div className="bg-amber-950/90 border-b border-amber-500/50 px-4 py-2.5 text-amber-300 text-xs font-bold flex flex-wrap items-center justify-between gap-2 z-40 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 animate-spin text-amber-400 shrink-0" />
            <span>
              {authStatus === "PENDING_APPROVAL"
                ? "طلب متابعة الجلسة قيد مراجعة واعتماد فضيلة الشيخ ⏳"
                : authStatus === "DEFERRED"
                ? "تم تعليق طلبك لمراجعته والتواصل معك بعد انتهاء الجلسة ⏳"
                : authStatus === "PROPOSED_SLOT"
                ? `يقترح عليك الشيخ موعداً بديلاً: ${followUpRequestData?.proposedTime || followUpRequestData?.slot?.startTime || "موعد لاحق"}`
                : authStatus === "REJECTED"
                ? "اعتذر الشيخ عن قبول المتابعة للجلسة الحالية"
                : "الجلسة منعقدة حالياً مع الشيخ. يمكنك رفع طلب لمتابعة الجلسة."}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {authStatus === "PROPOSED_SLOT" && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleStudentRespondToProposedSlot("ACCEPT")}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[11px] px-3 py-1 rounded-lg transition shadow"
                >
                  قبول الموعد المقترح ✅
                </button>
                <button
                  onClick={() => handleStudentRespondToProposedSlot("REJECT")}
                  className="bg-slate-800 hover:bg-red-800 text-slate-300 hover:text-white font-bold text-[11px] px-3 py-1 rounded-lg transition"
                >
                  اعتذار ❌
                </button>
              </div>
            )}
            {authStatus === "NEEDS_REQUEST" && (
              <button
                onClick={handleSendFollowUpRequestFromGate}
                disabled={submittingRequest}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[11px] px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5 shadow"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{submittingRequest ? "جارٍ الإرسال..." : "طلب متابعة الجلسة 👁️"}</span>
              </button>
            )}
            <button
              onClick={fetchSession}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[11px] px-2.5 py-1 rounded-lg transition"
            >
              تحديث الحالة
            </button>
          </div>
        </div>
      )}

      {/* Permission alert if devices are missing or denied */}
      {permissionError && (
        <div className="bg-red-950/90 border-b border-red-700/60 px-4 py-2 text-red-200 text-xs font-semibold flex items-center justify-between gap-2 z-40">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{permissionError}</span>
          </div>
          <button
            onClick={initRealMedia}
            className="bg-red-700 hover:bg-red-600 text-white text-[11px] font-bold px-2.5 py-1 rounded-md transition"
          >
            إعادة المحاولة
          </button>
        </div>
      )}

      {/* Top Header Bar */}
      <div className="bg-slate-900 px-4 py-3 border-b border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 px-3 py-1 rounded-full text-xs font-bold">
            <span className={`w-2 h-2 rounded-full ${hasRemoteStream ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
            {hasRemoteStream ? "اتصال مباشر نشط (صوت وصورة)" : connectionStatus}
          </div>

          {/* Quick Instant Role Toggle for testing or dual devices */}
          <button
            onClick={() => {
              const nextRole = isTeacher ? "student" : "teacher";
              setActiveRoleOverride(nextRole);
              setAuthStatus("AUTHORIZED");
            }}
            className={`px-3 py-1 rounded-full text-xs font-black transition flex items-center gap-1.5 border shadow ${
              isTeacher
                ? "bg-emerald-600/30 border-emerald-400 text-emerald-300 hover:bg-emerald-600/50"
                : "bg-amber-600/30 border-amber-400 text-amber-300 hover:bg-amber-600/50"
            }`}
            title="انقر للتبديل الفوري بين وضع المعلم ووضع الطالب لتجربة المايك والفيديو"
          >
            <span>{isTeacher ? "أنت: معلم الحلقة 👨‍🏫" : "أنت: طالب العلم 🧑‍🎓"}</span>
            <span className="text-[10px] opacity-75 underline">(تبديل)</span>
          </button>

          {mediaTypeNotice && (
            <span className="text-[10px] text-slate-400 bg-slate-800/80 border border-slate-700 px-2 py-0.5 rounded-md hidden md:inline">
              {mediaTypeNotice}
            </span>
          )}

          <span className="font-bold text-sm text-slate-100 hidden sm:inline">
            {session?.halaqa?.name || "الحلقة القرآنية"}
          </span>
          <span className="text-xs text-slate-400 hidden sm:inline">
            • المعلم: {session?.halaqa?.teacher?.user?.name || "معلم الحلقة"}
          </span>
        </div>

        {/* Recording Indicator & Mobile Tabs */}
        <div className="flex items-center gap-3">
          {(isRecording || remoteIsRecording) && (
            <div className="flex items-center gap-2 bg-red-950/90 border border-red-600 text-red-200 px-3 py-1 rounded-full text-xs font-bold animate-pulse shadow-lg">
              <Circle className="w-2.5 h-2.5 fill-red-500 text-red-500" />
              <span>
                {isRecording
                  ? `تسجيل نشط: ${activeRecordingType === "AUDIO_ONLY" ? "صوت فقط 🎙️" : "صوت وصورة 🎥"}`
                  : "المعلم يسجل الجلسة حالياً 🔴"}
              </span>
              {isRecording && (
                <span className="font-mono bg-red-900/80 px-1.5 py-0.5 rounded text-[11px] text-white">
                  {Math.floor(recordSeconds / 60)}:{String(recordSeconds % 60).padStart(2, "0")}
                </span>
              )}
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

      {/* Main Classroom Body */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left / Center: Interactive Mushaf */}
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

        {/* Right Side: Video Streams Grid & Participants & Chat */}
        <div className="w-full lg:w-96 bg-slate-900 border-t lg:border-t-0 lg:border-r border-slate-800 flex flex-col shrink-0">
          {/* Multi-Peer Video Streams Grid & Tasmee' Mode Spotlight */}
          <div className="p-3 bg-slate-950 border-b border-slate-800 space-y-2">
            {/* 1. If active Tasmee' Spotlight */}
            {activeTasmeeStudent ? (
              <div className="space-y-2 animate-in fade-in duration-300">
                {/* Spotlight Header Banner */}
                <div className="flex items-center justify-between bg-gradient-to-r from-amber-950 via-slate-900 to-amber-950 border border-amber-500/60 px-3 py-1.5 rounded-xl text-xs">
                  <div className="flex items-center gap-1.5 text-amber-300 font-black">
                    <Radio className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                    <span>وضع التسميع الفردي: <strong className="text-white">{activeTasmeeStudent.name}</strong></span>
                  </div>
                  {isTeacher && (
                    <button
                      onClick={() => handleSelectTasmeeStudent(null)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-bold transition flex items-center gap-1"
                    >
                      <X className="w-3 h-3" /> إنهاء التسميع
                    </button>
                  )}
                </div>

                {/* Hero Spotlight Video Card */}
                <RemotePeerVideo
                  stream={activeTasmeeStudent.stream}
                  hasVideo={activeTasmeeStudent.hasVideo}
                  isVideoOn={activeTasmeeStudent.isVideoOn}
                  label={`${activeTasmeeStudent.name} (يرتّل الآن 🎙️)`}
                  fallbackInitial={activeTasmeeStudent.name?.[0] || "ط"}
                  isSpeaking={activeTasmeeStudent.isSpeaking}
                  isMicOn={activeTasmeeStudent.isMicOn}
                  isHero={true}
                  actions={
                    isTeacher ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleTeacherRevokeSpeak(activeTasmeeStudent.clientId)}
                          className="bg-red-950/90 hover:bg-red-800 text-red-200 border border-red-700/80 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition shadow cursor-pointer active:scale-95"
                          title="سحب إذن التحدث وكتم صوت الطالب فوراً"
                        >
                          <VolumeX className="w-3 h-3 text-red-400" />
                          <span>كتم</span>
                        </button>
                      </div>
                    ) : null
                  }
                />

                {/* Secondary Row: Teacher View + Other Students Thumbnails */}
                <div className="grid grid-cols-3 gap-1.5 pt-1">
                  {/* Sheikh View */}
                  <div className="relative aspect-video bg-slate-900 rounded-xl overflow-hidden border border-emerald-500/50 shadow">
                    {isTeacher ? (
                      <video
                        key="teacher-local-small"
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className={`w-full h-full object-cover scale-x-[-1] ${
                          isVideoOn && hasRealCam ? "block" : "hidden"
                        }`}
                      />
                    ) : teacherPeer ? (
                      <video
                        key="teacher-remote-small"
                        autoPlay
                        playsInline
                        muted
                        ref={(el) => {
                          if (el && teacherPeer.stream && el.srcObject !== teacherPeer.stream) {
                            el.srcObject = teacherPeer.stream;
                            el.play().catch(() => {});
                          }
                        }}
                        className={`w-full h-full object-cover ${
                          teacherPeer.hasVideo && teacherPeer.isVideoOn ? "block" : "hidden"
                        }`}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-center">
                        <div className="w-6 h-6 rounded-lg bg-islamic-800 text-gold-accent flex items-center justify-center font-black text-xs">
                          ش
                        </div>
                      </div>
                    )}
                    <div className="absolute bottom-0.5 right-1 bg-black/80 px-1.5 py-0.2 rounded text-[9px] font-bold text-emerald-400">
                      {isTeacher ? "المعلم (أنت)" : (session?.halaqa?.teacher?.user?.name || "المعلم")}
                    </div>
                  </div>

                  {/* Other connected students thumbnails */}
                  {connectedStudents
                    .filter((s) => s.clientId !== activeTasmeeStudent.clientId)
                    .map((stu) => (
                      <div
                        key={stu.clientId}
                        className="relative aspect-video bg-slate-900 rounded-xl overflow-hidden border border-slate-800 hover:border-amber-400/60 transition group cursor-pointer"
                        onClick={() => isTeacher && handleSelectTasmeeStudent(stu.clientId)}
                        title={isTeacher ? "انقر لنقل أولوية التسميع إلى هذا الطالب" : stu.name}
                      >
                        <RemotePeerVideo
                          stream={stu.stream}
                          hasVideo={stu.hasVideo}
                          isVideoOn={stu.isVideoOn}
                          label={stu.name}
                          fallbackInitial={stu.name?.[0] || "ط"}
                          isSpeaking={stu.isSpeaking}
                          isMicOn={stu.isMicOn}
                          isHero={false}
                        />
                        {isTeacher && (
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                            <span className="text-[10px] font-black bg-amber-500 text-slate-950 px-2 py-0.5 rounded-lg shadow">
                              تسميع 🎙️
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            ) : (
              /* 2. Normal Grid Mode (No active Tasmee' spotlight) */
              <div className="space-y-2">
                {/* Control / Info Bar */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                  <span>المشاركون المتصلون بالبث: <strong className="text-white">{connectedStudents.length + 1}</strong></span>
                  {connectedStudents.length > 1 && isTeacher && (
                    <span className="text-emerald-400 font-bold text-[10px]">
                      انقر على «تسميع 🎙️» لتكبير صورة أي طالب ومتابعة تلاوته
                    </span>
                  )}
                </div>

                {/* Adaptive Video Grid */}
                <div className={`grid gap-2 ${connectedStudents.length <= 1 ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-2"}`}>
                  {/* Slot 1: Teacher Slot */}
                  <div
                    className={`relative aspect-video bg-slate-900 rounded-xl overflow-hidden border shadow-md group transition-all duration-300 ${
                      (isTeacher ? (localIsSpeaking && isMicOn) : remoteIsSpeaking)
                        ? "border-emerald-400 ring-2 ring-emerald-400/80 shadow-emerald-500/20"
                        : "border-slate-700"
                    }`}
                  >
                    {isTeacher ? (
                      <>
                        <video
                          key="teacher-local-preview"
                          ref={localVideoRef}
                          autoPlay
                          playsInline
                          muted
                          className={`w-full h-full object-cover scale-x-[-1] ${
                            isVideoOn && hasRealCam ? "block" : "hidden"
                          }`}
                        />
                        {(!isVideoOn || !hasRealCam) && (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 p-2 text-center">
                            <div className="w-12 h-12 rounded-2xl bg-islamic-800 text-gold-accent flex items-center justify-center font-black text-sm ring-2 ring-emerald-500/50 mb-1 shadow">
                              ش
                            </div>
                            <span className="text-[10px] text-slate-400">
                              {!hasRealCam ? "الكاميرا غير متوفرة" : "الكاميرا متوقفة"}
                            </span>
                          </div>
                        )}
                      </>
                    ) : teacherPeer ? (
                      <>
                        <video
                          key="teacher-remote-preview"
                          autoPlay
                          playsInline
                          muted
                          ref={(el) => {
                            if (el && teacherPeer.stream && el.srcObject !== teacherPeer.stream) {
                              el.srcObject = teacherPeer.stream;
                              el.play().catch(() => {});
                            }
                          }}
                          className={`w-full h-full object-cover ${
                            teacherPeer.hasVideo && teacherPeer.isVideoOn ? "block" : "hidden"
                          }`}
                        />
                        {(!teacherPeer.hasVideo || !teacherPeer.isVideoOn) && (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-center p-2">
                            <div className="w-12 h-12 rounded-2xl bg-islamic-800 text-gold-accent flex items-center justify-center font-black text-sm ring-2 ring-emerald-500/50 mb-1 shadow">
                              ش
                            </div>
                            <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                              بث المعلم (صوت فقط)
                            </span>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-center p-2">
                        <div className="w-12 h-12 rounded-2xl bg-islamic-800 text-gold-accent flex items-center justify-center font-black text-sm ring-2 ring-emerald-500/50 mb-1 shadow">
                          ش
                        </div>
                        <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                          بانتظار بث المعلم...
                        </span>
                      </div>
                    )}

                    <div className="absolute bottom-1 right-1 bg-black/80 px-2 py-0.5 rounded text-[10px] font-bold text-emerald-400 flex items-center gap-1.5 backdrop-blur-sm">
                      {(isTeacher ? (localIsSpeaking && isMicOn) : remoteIsSpeaking) ? (
                        <span className="flex items-center gap-1 text-emerald-300 animate-pulse font-black">
                          <Radio className="w-3 h-3 text-emerald-400" />
                          يتحدث الآن 🎙️
                        </span>
                      ) : (
                        <Volume2 className="w-3 h-3 text-emerald-400" />
                      )}
                      <span>{isTeacher ? "المعلم (أنت)" : (session?.halaqa?.teacher?.user?.name || "معلم الحلقة")}</span>
                    </div>
                  </div>

                  {/* If user is Student: Slot 2 shows their own camera preview */}
                  {!isTeacher && (
                    <div
                      className={`relative aspect-video bg-slate-900 rounded-xl overflow-hidden border shadow-md group transition-all duration-300 ${
                        localIsSpeaking && isMicOn
                          ? "border-amber-400 ring-2 ring-amber-400/80 shadow-amber-500/20"
                          : "border-slate-700"
                      }`}
                    >
                      <video
                        key="student-local-preview"
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className={`w-full h-full object-cover scale-x-[-1] ${
                          isVideoOn && hasRealCam ? "block" : "hidden"
                        }`}
                      />
                      {(!isVideoOn || !hasRealCam) && (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 p-2 text-center">
                          <div className="w-12 h-12 rounded-2xl bg-slate-800 text-amber-300 flex items-center justify-center font-black text-sm ring-2 ring-gold-accent/50 mb-1 shadow">
                            ط
                          </div>
                          <span className="text-[10px] text-slate-400">
                            {!hasRealCam ? "الكاميرا غير متوفرة" : "الكاميرا متوقفة"}
                          </span>
                        </div>
                      )}

                      <div className="absolute bottom-1 right-1 bg-black/80 px-2 py-0.5 rounded text-[10px] font-bold text-white flex items-center gap-1.5 backdrop-blur-sm">
                        {localIsSpeaking && isMicOn ? (
                          <span className="flex items-center gap-1 text-amber-300 animate-pulse font-black">
                            <Radio className="w-3 h-3 text-amber-400" />
                            ترتل الآن 🎙️
                          </span>
                        ) : isMicOn && hasRealMic ? (
                          <Mic className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <MicOff className="w-3 h-3 text-red-400" />
                        )}
                        <span>{myName} (أنت)</span>
                      </div>

                      {isHandRaised && (
                        <div className="absolute top-1 left-1 bg-amber-500 text-slate-950 px-1.5 py-0.5 rounded text-[10px] font-black flex items-center gap-0.5 animate-bounce shadow">
                          <Hand className="w-2.5 h-2.5" /> اليد مرفوعة
                        </div>
                      )}
                    </div>
                  )}

                  {/* Connected Students Slots */}
                  {connectedStudents.map((stu) => (
                    <RemotePeerVideo
                      key={stu.clientId}
                      stream={stu.stream}
                      hasVideo={stu.hasVideo}
                      isVideoOn={stu.isVideoOn}
                      label={stu.name}
                      fallbackInitial={stu.name?.[0] || "ط"}
                      isSpeaking={stu.isSpeaking}
                      isMicOn={stu.isMicOn}
                      isHero={false}
                      actions={
                        isTeacher ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleSelectTasmeeStudent(stu.clientId)}
                              className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-2 py-0.5 rounded text-[10px] font-black transition shadow flex items-center gap-0.5 active:scale-95"
                              title="تكبير صورة هذا الطالب للتسميع ومتابعة مخارج الحروف"
                            >
                              <Maximize2 className="w-3 h-3" />
                              <span>تسميع 🎙️</span>
                            </button>
                            <button
                              onClick={() => handleTeacherRevokeSpeak(stu.clientId)}
                              className="bg-red-950/90 hover:bg-red-800 text-red-200 border border-red-700/80 px-1.5 py-0.5 rounded text-[10px] font-bold transition shadow"
                              title="كتم صوت الطالب"
                            >
                              <VolumeX className="w-3 h-3 text-red-400" />
                            </button>
                            <button
                              onClick={() => handleTeacherKickStudent(stu.clientId)}
                              className="bg-slate-800 hover:bg-red-900 text-slate-400 hover:text-white px-1 py-0.5 rounded text-[10px] transition"
                              title="استبعاد الطالب من الجلسة"
                            >
                              <UserMinus className="w-3 h-3" />
                            </button>
                          </div>
                        ) : null
                      }
                    />
                  ))}

                  {/* If Teacher and no students connected yet */}
                  {isTeacher && connectedStudents.length === 0 && (
                    <div className="relative aspect-video bg-slate-900 rounded-xl overflow-hidden border border-slate-800 flex flex-col items-center justify-center p-3 text-center">
                      <div className="w-10 h-10 rounded-2xl bg-slate-800 text-amber-300 flex items-center justify-center font-black text-xs ring-2 ring-gold-accent/50 mb-1 shadow">
                        ط
                      </div>
                      <span className="text-[10px] text-amber-300 font-bold flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                        بانتظار انضمام الطلاب...
                      </span>
                    </div>
                  )}
                </div>
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
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                <span>المشاركون في الحلقة ({connectedStudents.length} متصل)</span>
                {isTeacher && connectedStudents.length > 0 && (
                  <button
                    onClick={() => handleTeacherRevokeSpeak()}
                    className="text-[10px] text-red-400 hover:text-red-300 font-bold"
                  >
                    كتم الجميع
                  </button>
                )}
              </div>

              {/* Connected Active Students */}
              {connectedStudents.map((stu) => (
                <div
                  key={stu.clientId}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-800/80 border border-slate-700 shadow-sm"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500 font-black flex items-center justify-center text-xs shrink-0">
                      {stu.name?.[0] || "ط"}
                    </div>
                    <div>
                      <span className="block text-xs font-black text-white flex items-center gap-1.5">
                        {stu.name}
                        {stu.clientId === tasmeeStudentId && (
                          <span className="text-[9px] bg-amber-500 text-slate-950 px-1 rounded font-bold">
                            تسميع 🎙️
                          </span>
                        )}
                      </span>
                      <span className="block text-[10px] text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-2.5 h-2.5" /> متصل بالبث المباشر
                        {stu.isSpeaking && stu.isMicOn && (
                          <span className="text-amber-300 font-bold animate-pulse">• يتحدث</span>
                        )}
                      </span>
                    </div>
                  </div>

                  {isTeacher && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleSelectTasmeeStudent(stu.clientId === tasmeeStudentId ? null : stu.clientId)}
                        className={`p-1.5 rounded-lg text-xs font-bold transition flex items-center gap-0.5 ${
                          stu.clientId === tasmeeStudentId
                            ? "bg-amber-500 text-slate-950 font-black"
                            : "bg-slate-700 hover:bg-amber-500 hover:text-slate-950 text-slate-200"
                        }`}
                        title="تكبير / إلغاء تكبير صورة الطالب للتسميع"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleTeacherRevokeSpeak(stu.clientId)}
                        title="كتم صوت الطالب"
                        className="p-1.5 rounded-lg bg-slate-700 hover:bg-red-600 text-slate-300 hover:text-white transition cursor-pointer"
                      >
                        <VolumeX className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleTeacherKickStudent(stu.clientId)}
                        title="طرد الطالب من الفصل"
                        className="p-1.5 rounded-lg bg-slate-700 hover:bg-red-800 text-slate-400 hover:text-white transition cursor-pointer"
                      >
                        <UserMinus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {/* Other enrolled students who haven't connected yet */}
              {studentsList
                .filter((enr: any) => !connectedStudents.some((cs) => cs.name === enr.student?.user?.name))
                .map((enr: any) => (
                  <div
                    key={enr.id}
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-800/40 border border-slate-800 opacity-70"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 border border-slate-700 font-bold flex items-center justify-center text-xs shrink-0">
                        {enr.student?.user?.name?.[0] || "ط"}
                      </div>
                      <div>
                        <span className="block text-xs font-bold text-slate-300">
                          {enr.student?.user?.name}
                        </span>
                        <span className="block text-[10px] text-slate-500">
                          مسجل بالحلقة (غير متصل حالياً)
                        </span>
                      </div>
                    </div>
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
            className={`p-2.5 sm:p-3 rounded-xl transition cursor-pointer relative ${
              !isTeacher && !canSpeak
                ? "bg-slate-800 text-slate-500 border border-slate-700 hover:bg-slate-750"
                : isMicOn && hasRealMic
                ? "bg-slate-800 hover:bg-slate-700 text-slate-200"
                : "bg-red-600 hover:bg-red-700 text-white"
            }`}
            title={
              !isTeacher && !canSpeak
                ? "الميكروفون مقفل - اطلب إذن التحدث من الشيخ"
                : !hasRealMic
                ? "الميكروفون غير متوفر"
                : isMicOn
                ? "كتم الميكروفون"
                : "تشغيل الميكروفون"
            }
          >
            {!isTeacher && !canSpeak ? (
              <div className="relative">
                <MicOff className="w-4 h-4 text-slate-400" />
                <Lock className="w-2.5 h-2.5 absolute -top-1 -right-1 text-amber-400" />
              </div>
            ) : isMicOn && hasRealMic ? (
              <Mic className="w-4 h-4" />
            ) : (
              <MicOff className="w-4 h-4" />
            )}
          </button>

          <button
            onClick={toggleVideo}
            className={`p-2.5 sm:p-3 rounded-xl transition cursor-pointer ${
              isVideoOn && hasRealCam
                ? "bg-slate-800 hover:bg-slate-700 text-slate-200"
                : "bg-red-600 hover:bg-red-700 text-white"
            }`}
            title={
              !hasRealCam
                ? "الكاميرا غير متوفرة"
                : isVideoOn
                ? "إيقاف الكاميرا"
                : "تشغيل الكاميرا"
            }
          >
            {isVideoOn && hasRealCam ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
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

        {/* Center: Actions (Raise hand, speaking permission, recording) */}
        <div className="flex items-center gap-2">
          {!isTeacher && (
            <>
              {!canSpeak ? (
                speakRequestStatus === "REQUESTED" ? (
                  <button
                    disabled
                    className="flex items-center gap-1.5 px-3.5 py-2 sm:py-2.5 rounded-xl text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-400/40"
                  >
                    <Clock className="w-3.5 h-3.5 animate-spin text-amber-400" />
                    <span>بانتظار إذن الشيخ... ⏳</span>
                  </button>
                ) : (
                  <button
                    onClick={handleRequestToSpeak}
                    className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white shadow-lg transition active:scale-95 cursor-pointer"
                  >
                    <Hand className="w-3.5 h-3.5" />
                    <span>طلب التحدث ✋</span>
                  </button>
                )
              ) : (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/50">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>مأذون لك بالتحدث</span>
                </div>
              )}

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
            </>
          )}

          {isTeacher && (
            <button
              onClick={() => {
                if (isRecording) {
                  stopRealRecording();
                } else {
                  setShowRecordingModal(true);
                }
              }}
              disabled={isUploadingRecording}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                isRecording
                  ? "bg-red-600 text-white hover:bg-red-700 shadow-lg animate-pulse"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-200"
              } disabled:opacity-50`}
            >
              {isUploadingRecording ? (
                <>
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>جارٍ رفع التسجيل...</span>
                </>
              ) : isRecording ? (
                <>
                  <Circle className="w-3 h-3 fill-white" />
                  <span>إيقاف التسجيل</span>
                </>
              ) : (
                <>
                  <Circle className="w-3 h-3 fill-red-500 text-red-500" />
                  <span>بدء التسجيل</span>
                </>
              )}
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

      {/* Teacher Recording Options Modal */}
      {showRecordingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 text-right">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center">
                  <Circle className="w-4 h-4 fill-red-500 text-red-500 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">بدء تسجيل الجلسة</h3>
                  <p className="text-[11px] text-slate-400">اختر نوع التسجيل المطلوب لحفظ مجريات الحلقة</p>
                </div>
              </div>
              <button
                onClick={() => setShowRecordingModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {/* Option 1: Audio & Video */}
              <div
                onClick={() => setSelectedRecordingType("AUDIO_VIDEO")}
                className={`p-4 rounded-2xl border-2 transition cursor-pointer flex items-center gap-3.5 ${
                  selectedRecordingType === "AUDIO_VIDEO"
                    ? "border-emerald-500 bg-emerald-500/10 text-white shadow-md shadow-emerald-500/10"
                    : "border-slate-800 bg-slate-800/40 text-slate-300 hover:border-slate-700"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    selectedRecordingType === "AUDIO_VIDEO"
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-800 text-slate-400"
                  }`}
                >
                  <Video className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-sm">تسجيل بالصوت والصورة</span>
                    {selectedRecordingType === "AUDIO_VIDEO" && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                    تسجيل مرئي كامل يدمج كاميرا المعلم والطالب مع دمج الصوت في ملف فيديو واحد.
                  </p>
                </div>
              </div>

              {/* Option 2: Audio Only */}
              <div
                onClick={() => setSelectedRecordingType("AUDIO_ONLY")}
                className={`p-4 rounded-2xl border-2 transition cursor-pointer flex items-center gap-3.5 ${
                  selectedRecordingType === "AUDIO_ONLY"
                    ? "border-emerald-500 bg-emerald-500/10 text-white shadow-md shadow-emerald-500/10"
                    : "border-slate-800 bg-slate-800/40 text-slate-300 hover:border-slate-700"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    selectedRecordingType === "AUDIO_ONLY"
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-800 text-slate-400"
                  }`}
                >
                  <Mic className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-sm">تسجيل بالصوت فقط</span>
                    {selectedRecordingType === "AUDIO_ONLY" && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                    تسجيل صوتي عالي النقاوة للتلاوة والترتيل بدون فيديو بحجم ملف خفيف وسريع.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowRecordingModal(false)}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white font-bold text-xs"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={() => startRealRecording(selectedRecordingType)}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs flex items-center gap-2 shadow-lg active:scale-95"
              >
                <Circle className="w-3.5 h-3.5 fill-white text-white" />
                <span>بدء التسجيل الآن 🔴</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
