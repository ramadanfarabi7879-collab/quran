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

  // Media toggles
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
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
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const iceCandidatesQueue = useRef<RTCIceCandidateInit[]>([]);
  const lastSignalIdRef = useRef<number>(0);
  const remoteClientIdRef = useRef<string | null>(null);

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

  // Realtime listener for approval updates
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
            setSession(data.session);
          }
        }
      } catch {}
    }, 2500);
    return () => clearInterval(interval);
  }, [authStatus, isTeacher, sessionId, roleParam]);

  // Handle submitting join request
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
        const target = targetClientId !== undefined ? targetClientId : remoteClientIdRef.current;
        await fetch("/api/classroom/signal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: session?.id || sessionId,
            signalType,
            senderRole: myRole,
            senderName: myName,
            senderClientId: clientId,
            targetClientId: target || null,
            data: payload,
          }),
        });
      } catch (err) {
        console.error("Signaling POST error:", err);
      }
    },
    [session?.id, sessionId, myRole, myName, clientId]
  );

  // Sync local tracks with RTCPeerConnection
  const syncLocalTracks = useCallback((pc: RTCPeerConnection) => {
    if (!localStreamRef.current) return;
    const senders = pc.getSenders();
    localStreamRef.current.getTracks().forEach((track) => {
      const existingSender = senders.find((s) => s.track && s.track.kind === track.kind);
      if (existingSender) {
        existingSender.replaceTrack(track).catch((err) => {
          console.warn("replaceTrack error:", err);
        });
      } else {
        try {
          pc.addTrack(track, localStreamRef.current!);
        } catch (e) {
          console.warn("addTrack error:", e);
        }
      }
    });
  }, []);

  // Dedicated Offer Trigger with state guards
  const triggerOffer = useCallback(
    async (targetId: string | null, reason: string) => {
      if (!isTeacher) return;
      const pc = peerConnectionRef.current;
      if (!pc || pc.signalingState === "closed") return;

      syncLocalTracks(pc);

      if (pc.signalingState !== "stable") {
        console.log("Offer delayed: signalingState is currently", pc.signalingState);
        return;
      }

      try {
        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true,
        });
        await pc.setLocalDescription(offer);
        await sendSignalingMessage("OFFER", offer, targetId);
        console.log("Teacher sent offer successfully. Target:", targetId, "Reason:", reason);
      } catch (e) {
        console.error("Create offer error:", e);
      }
    },
    [isTeacher, syncLocalTracks, sendSignalingMessage]
  );

  // Initialize or get RTCPeerConnection
  const getOrCreatePeerConnection = useCallback(() => {
    if (peerConnectionRef.current && peerConnectionRef.current.signalingState !== "closed") {
      syncLocalTracks(peerConnectionRef.current);
      return peerConnectionRef.current;
    }

    const config = getIceServers();
    const pc = new RTCPeerConnection(config);
    peerConnectionRef.current = pc;

    // Attach local audio & video tracks
    syncLocalTracks(pc);

    // Send local ICE candidates to signaling server
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignalingMessage("ICE_CANDIDATE", event.candidate.toJSON(), remoteClientIdRef.current);
      }
    };

    // Handle receiving remote tracks (video and audio)
    pc.ontrack = (event) => {
      console.log("WebRTC Remote Track Received:", event.track.kind, event.track.id);

      let stream = remoteStreamRef.current;
      if (!stream) {
        stream = event.streams && event.streams[0] ? event.streams[0] : new MediaStream();
        remoteStreamRef.current = stream;
      }

      if (!stream.getTracks().some((t) => t.id === event.track.id)) {
        stream.addTrack(event.track);
      }

      // Check track types
      const hasAudio = stream.getAudioTracks().length > 0;
      const hasVideo = stream.getVideoTracks().length > 0;
      setRemoteHasAudio(hasAudio);
      setRemoteHasVideo(hasVideo);

      // Bind to media elements
      if (event.track.kind === "audio") {
        if (remoteAudioRef.current) {
          if (remoteAudioRef.current.srcObject !== stream) {
            remoteAudioRef.current.srcObject = stream;
          }
          remoteAudioRef.current.play().catch(() => {
            setNeedsAudioUnlock(true);
          });
        }

        // Attach audio analyser
        if (remoteAudioAnalyserCleanupRef.current) {
          remoteAudioAnalyserCleanupRef.current();
          remoteAudioAnalyserCleanupRef.current = null;
        }
        remoteAudioAnalyserCleanupRef.current = setupAudioAnalyser(stream, setRemoteIsSpeaking);
      }

      if (event.track.kind === "video") {
        if (remoteVideoRef.current) {
          if (remoteVideoRef.current.srcObject !== stream) {
            remoteVideoRef.current.srcObject = stream;
          }
          remoteVideoRef.current.play().catch(() => {});
        }
      }

      setHasRemoteStream(true);
      setConnectionStatus("متصل مباشرة (صوت وفيديو حي)");
    };

    pc.oniceconnectionstatechange = () => {
      console.log("ICE Connection State changed:", pc.iceConnectionState);
      if (pc.iceConnectionState === "connected" || pc.iceConnectionState === "completed") {
        setHasRemoteStream(true);
        setConnectionStatus("متصل مباشرة (صوت وفيديو حي)");
      } else if (pc.iceConnectionState === "failed") {
        setConnectionStatus("جارٍ إعادة محاولة الربط...");
        if (isTeacher) {
          try {
            pc.restartIce();
            triggerOffer(remoteClientIdRef.current, "ICE_RESTART");
          } catch {}
        }
      } else if (pc.iceConnectionState === "disconnected") {
        setConnectionStatus("انقطع الاتصال - جارٍ استعادة الربط...");
      }
    };

    pc.onconnectionstatechange = () => {
      console.log("PeerConnection State:", pc.connectionState);
      if (pc.connectionState === "connected") {
        setHasRemoteStream(true);
        setConnectionStatus("متصل مباشرة (صوت وفيديو حي)");
      } else if (pc.connectionState === "failed") {
        setConnectionStatus("فشل الاتصال - جارٍ إعادة المحاولة...");
      }
    };

    return pc;
  }, [syncLocalTracks, sendSignalingMessage, isTeacher, triggerOffer]);

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

    // Sync with PeerConnection if active
    const pc = getOrCreatePeerConnection();
    syncLocalTracks(pc);

    return newStream;
  }, [isMicOn, isVideoOn, getOrCreatePeerConnection, syncLocalTracks]);

  // Initial media hardware initialization
  useEffect(() => {
    let isCancelled = false;

    initRealMedia().then(() => {
      if (isCancelled) return;
      // Announce presence immediately
      sendSignalingMessage("PRESENCE", { role: myRole, name: myName });
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
      if (remoteAudioAnalyserCleanupRef.current) {
        remoteAudioAnalyserCleanupRef.current();
        remoteAudioAnalyserCleanupRef.current = null;
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
    };
  }, [sessionId, myRole, isTeacher]);

  // Signaling message handler
  const handleSignalMessage = useCallback(
    async (msg: any) => {
      const { signalType, senderRole, senderName, senderClientId, data } = msg;

      if (senderName && !remotePeerName) {
        setRemotePeerName(senderName);
      }

      if (senderClientId && !remoteClientIdRef.current) {
        remoteClientIdRef.current = senderClientId;
      }

      const pc = getOrCreatePeerConnection();

      try {
        if (signalType === "PRESENCE") {
          remoteClientIdRef.current = senderClientId;
          setConnectionStatus("تم رصد الطرف الآخر - جارٍ التوصيل...");
          if (isTeacher) {
            triggerOffer(senderClientId, "PRESENCE_RECEIVED");
          } else {
            sendSignalingMessage("PRESENCE_ACK", { role: myRole, name: myName }, senderClientId);
          }
        } else if (signalType === "PRESENCE_ACK") {
          remoteClientIdRef.current = senderClientId;
          setConnectionStatus("تم الرد من الطرف الآخر - جارٍ إرسال العرض...");
          if (isTeacher) {
            triggerOffer(senderClientId, "PRESENCE_ACK_RECEIVED");
          }
        } else if (signalType === "OFFER") {
          remoteClientIdRef.current = senderClientId;
          setConnectionStatus("تم استقبال بث المعلم - جارٍ الرد...");
          syncLocalTracks(pc);

          await pc.setRemoteDescription(new RTCSessionDescription(data));

          // Drain queued ICE candidates
          while (iceCandidatesQueue.current.length > 0) {
            const cand = iceCandidatesQueue.current.shift();
            if (cand) {
              await pc.addIceCandidate(new RTCIceCandidate(cand)).catch((err) => {
                console.warn("Drain candidate error:", err);
              });
            }
          }

          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          await sendSignalingMessage("ANSWER", answer, senderClientId);
          console.log("Student successfully sent answer to Teacher:", senderClientId);
        } else if (signalType === "ANSWER") {
          setConnectionStatus("تم استقبال رد الطالب - جارٍ استكمال الربط...");
          if (pc.signalingState === "have-local-offer") {
            await pc.setRemoteDescription(new RTCSessionDescription(data));

            while (iceCandidatesQueue.current.length > 0) {
              const cand = iceCandidatesQueue.current.shift();
              if (cand) {
                await pc.addIceCandidate(new RTCIceCandidate(cand)).catch((err) => {
                  console.warn("Drain candidate error:", err);
                });
              }
            }
            console.log("Teacher set remote description from Answer");
          }
        } else if (signalType === "ICE_CANDIDATE") {
          if (pc.remoteDescription && pc.remoteDescription.type) {
            await pc.addIceCandidate(new RTCIceCandidate(data)).catch((e) => {
              console.warn("Error adding ICE candidate:", e);
            });
          } else {
            iceCandidatesQueue.current.push(data);
          }
        } else if (signalType === "MEDIA_STATE" && data) {
          if (data.mic !== undefined) {
            // Track remote participant mute status
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
          if (!isTeacher) {
            setIsMicOn(false);
            if (localStreamRef.current) {
              localStreamRef.current.getAudioTracks().forEach((track) => {
                track.enabled = false;
              });
            }
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
              setSpeakRequestStatus("GRANTED");
              setSpeakNotice("منحك فضيلة الشيخ إذن التحدث بالميكروفون 🎙️ - يمكنك الآن تشغيل المايك");
              playStudentApprovedSound();
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
            setSpeakNotice("قام فضيلة الشيخ بسحب إذن التحدث وكتم الميكروفون.");
            setTimeout(() => setSpeakNotice(null), 5000);
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
    [getOrCreatePeerConnection, isTeacher, myRole, myName, remotePeerName, sendSignalingMessage, syncLocalTracks, triggerOffer, activeTab]
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

    // Heartbeat presence: ping presence periodically until connected
    const heartbeat = setInterval(() => {
      if (!hasRemoteStream) {
        sendSignalingMessage("PRESENCE", { role: myRole, name: myName });
        if (isTeacher && peerConnectionRef.current?.signalingState === "stable") {
          triggerOffer(remoteClientIdRef.current, "HEARTBEAT_RETRY");
        }
      }
    }, 3000);

    return () => {
      active = false;
      clearInterval(interval);
      clearInterval(heartbeat);
    };
  }, [sessionId, session?.id, myRole, isTeacher, clientId, hasRemoteStream, handleSignalMessage, sendSignalingMessage, triggerOffer, myName]);

  // Keep remote media elements attached to active remote stream
  useEffect(() => {
    if (hasRemoteStream && remoteStreamRef.current) {
      const stream = remoteStreamRef.current;
      if (remoteVideoRef.current && remoteVideoRef.current.srcObject !== stream) {
        remoteVideoRef.current.srcObject = stream;
        remoteVideoRef.current.play().catch(() => {});
      }
      if (remoteAudioRef.current && remoteAudioRef.current.srcObject !== stream) {
        remoteAudioRef.current.srcObject = stream;
        remoteAudioRef.current.play().catch(() => setNeedsAudioUnlock(true));
      }
    }
  }, [hasRemoteStream]);

  // Ambient user interaction audio unlocker for mobile browsers
  useEffect(() => {
    const handleUnlockAudio = () => {
      if (remoteAudioRef.current && remoteAudioRef.current.paused) {
        remoteAudioRef.current.play().then(() => {
          setNeedsAudioUnlock(false);
        }).catch(() => {});
      }
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
    await sendSignalingMessage("SPEAK_DECISION", {
      targetClientId: studentClientId,
      granted: true,
    });
  };

  const handleTeacherRejectSpeak = async (studentClientId: string) => {
    setPendingSpeakRequests((prev) => prev.filter((r) => r.studentId !== studentClientId));
    await sendSignalingMessage("SPEAK_DECISION", {
      targetClientId: studentClientId,
      granted: false,
    });
  };

  const handleTeacherRevokeSpeak = async (targetId?: string) => {
    const target = targetId || remoteClientIdRef.current;
    await sendSignalingMessage("SPEAK_REVOKED", {
      targetClientId: target,
    });
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
    }
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

      {/* Unmuted Dedicated Remote Audio Element */}
      <audio ref={remoteAudioRef} autoPlay playsInline />

      {/* Floating Audio Unlock Button for Mobile browsers when autoplay is restricted */}
      {needsAudioUnlock && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-bounce">
          <button
            onClick={() => {
              if (remoteAudioRef.current) {
                remoteAudioRef.current.play().then(() => {
                  setNeedsAudioUnlock(false);
                });
              }
            }}
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black px-4 py-2.5 rounded-full shadow-2xl text-xs border-2 border-white cursor-pointer active:scale-95 transition"
          >
            <Volume2 className="w-4 h-4 text-amber-300" />
            انقر هنا لتفعيل صوت الطرف الآخر المباشر
          </button>
        </div>
      )}

      {/* Non-blocking Status Ribbon for Student pending sheikh approval */}
      {!isTeacher && authStatus !== "AUTHORIZED" && (
        <div className="bg-amber-950/90 border-b border-amber-500/50 px-4 py-2 text-amber-300 text-xs font-bold flex flex-wrap items-center justify-between gap-2 z-40 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 animate-spin text-amber-400 shrink-0" />
            <span>
              {authStatus === "PENDING_APPROVAL"
                ? "طلب انضمامك قيد موافقة واعتماد فضيلة الشيخ ⏳"
                : authStatus === "REJECTED"
                ? "اعتذر الشيخ عن قبول الانضمام لاكتمال النصاب المحدد"
                : "الحلقة مخصصة للطلاب المعتمدين"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {authStatus === "NEEDS_REQUEST" && (
              <button
                onClick={handleSendJoinRequestFromGate}
                disabled={submittingRequest}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[11px] px-3 py-1 rounded-lg transition"
              >
                {submittingRequest ? "جارٍ الإرسال..." : "طلب انضمام للحلقة"}
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
          {/* Two-Way Real Video Streams Grid */}
          <div className="p-3 grid grid-cols-2 gap-2 bg-slate-950 border-b border-slate-800">
            {/* Slot 1: Teacher Slot */}
            <div
              className={`relative aspect-video bg-slate-900 rounded-xl overflow-hidden border shadow-md group transition-all duration-300 ${
                (isTeacher ? (localIsSpeaking && isMicOn) : remoteIsSpeaking)
                  ? "border-emerald-400 ring-2 ring-emerald-400/80 shadow-emerald-500/20"
                  : "border-slate-700"
              }`}
            >
              {isTeacher ? (
                // Teacher screen: show Teacher's local camera
                <>
                  <video
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
              ) : (
                // Student screen: show Teacher's remote stream
                <>
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover ${
                      hasRemoteStream && remoteHasVideo ? "block" : "hidden"
                    }`}
                  />
                  {(!hasRemoteStream || !remoteHasVideo) && (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-center p-2">
                      <div className="w-12 h-12 rounded-2xl bg-islamic-800 text-gold-accent flex items-center justify-center font-black text-sm ring-2 ring-emerald-500/50 mb-1 shadow">
                        ش
                      </div>
                      <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                        {hasRemoteStream ? (
                          "بث المعلم (صوت فقط)"
                        ) : (
                          <>
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                            بانتظار بث المعلم...
                          </>
                        )}
                      </span>
                    </div>
                  )}
                </>
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

            {/* Slot 2: Student Slot */}
            <div
              className={`relative aspect-video bg-slate-900 rounded-xl overflow-hidden border shadow-md group transition-all duration-300 ${
                (!isTeacher ? (localIsSpeaking && isMicOn) : remoteIsSpeaking)
                  ? "border-amber-400 ring-2 ring-amber-400/80 shadow-amber-500/20"
                  : "border-slate-700"
              }`}
            >
              {!isTeacher ? (
                // Student screen: show Student's local camera
                <>
                  <video
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
                </>
              ) : (
                // Teacher screen: show Student's remote stream
                <>
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover ${
                      hasRemoteStream && remoteHasVideo ? "block" : "hidden"
                    }`}
                  />
                  {(!hasRemoteStream || !remoteHasVideo) && (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-center p-2">
                      <div className="w-12 h-12 rounded-2xl bg-slate-800 text-amber-300 flex items-center justify-center font-black text-sm ring-2 ring-gold-accent/50 mb-1 shadow">
                        ط
                      </div>
                      <span className="text-[10px] text-amber-300 font-bold flex items-center gap-1">
                        {hasRemoteStream ? (
                          "بث الطالب (صوت فقط)"
                        ) : (
                          <>
                            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                            بانتظار انضمام الطالب...
                          </>
                        )}
                      </span>
                    </div>
                  )}
                </>
              )}

              <div className="absolute bottom-1 right-1 bg-black/80 px-2 py-0.5 rounded text-[10px] font-bold text-white flex items-center gap-1.5 backdrop-blur-sm">
                {(!isTeacher ? (localIsSpeaking && isMicOn) : remoteIsSpeaking) ? (
                  <span className="flex items-center gap-1 text-amber-300 animate-pulse font-black">
                    <Radio className="w-3 h-3 text-amber-400" />
                    يرتل الآن 🎙️
                  </span>
                ) : (
                  (!isTeacher ? (isMicOn && hasRealMic) : hasRemoteStream) ? (
                    <Mic className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <MicOff className="w-3 h-3 text-red-400" />
                  )
                )}
                <span>{!isTeacher ? `${myName} (أنت)` : (remotePeerName || "الطالب")}</span>
              </div>

              {((!isTeacher && isHandRaised) || (isTeacher && studentHandAlert?.visible)) && (
                <div className="absolute top-1 left-1 bg-amber-500 text-slate-950 px-1.5 py-0.5 rounded text-[10px] font-black flex items-center gap-0.5 animate-bounce shadow">
                  <Hand className="w-2.5 h-2.5" /> اليد مرفوعة
                </div>
              )}

              {isTeacher && hasRemoteStream && (
                <button
                  onClick={() => handleTeacherRevokeSpeak()}
                  className="absolute top-1 left-1 bg-red-950/90 hover:bg-red-800 text-red-200 border border-red-700/80 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition shadow cursor-pointer active:scale-95 z-20"
                  title="سحب إذن التحدث وكتم ميكروفون الطالب فوراً"
                >
                  <VolumeX className="w-3 h-3 text-red-400" />
                  <span>كتم / سحب الإذن</span>
                </button>
              )}
            </div>
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
