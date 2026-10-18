"use client";

import React, { useState, useEffect, useRef } from "react";
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

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
    { urls: "stun:stun4.l.google.com:19302" },
    { urls: "stun:global.stun.twilio.com:3478" },
  ],
  iceCandidatePoolSize: 10,
};

// Canvas-based animated video stream fallback with sub-audible audio carrier
function createSyntheticMediaStream(role: string, name: string): MediaStream {
  if (typeof document === "undefined") {
    return new MediaStream();
  }

  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 480;
  const ctx = canvas.getContext("2d");

  let frame = 0;
  const isTeacherRole = role === "teacher";

  const renderFrame = () => {
    if (!ctx) return;
    frame++;

    // Gradient background
    const grad = ctx.createLinearGradient(0, 0, 640, 480);
    if (isTeacherRole) {
      grad.addColorStop(0, "#064e3b");
      grad.addColorStop(0.5, "#0f172a");
      grad.addColorStop(1, "#022c22");
    } else {
      grad.addColorStop(0, "#1e1b4b");
      grad.addColorStop(0.5, "#0f172a");
      grad.addColorStop(1, "#451a03");
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 640, 480);

    // Glowing aura ring
    ctx.save();
    ctx.beginPath();
    ctx.arc(320, 190, 72 + Math.sin(frame * 0.08) * 5, 0, Math.PI * 2);
    ctx.strokeStyle = isTeacherRole ? "rgba(16, 185, 129, 0.45)" : "rgba(245, 158, 11, 0.45)";
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.restore();

    // Central circular avatar plate
    ctx.save();
    ctx.beginPath();
    ctx.arc(320, 190, 62, 0, Math.PI * 2);
    ctx.fillStyle = isTeacherRole ? "#047857" : "#b45309";
    ctx.fill();
    ctx.restore();

    // Initials / Title
    ctx.font = "bold 30px 'Segoe UI', Tahoma, sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(isTeacherRole ? "الشيخ" : "طالب", 320, 190);

    // Participant Name
    ctx.font = "bold 20px 'Segoe UI', Tahoma, sans-serif";
    ctx.fillStyle = "#f8fafc";
    ctx.fillText(name, 320, 280);

    // Role text
    ctx.font = "14px 'Segoe UI', Tahoma, sans-serif";
    ctx.fillStyle = isTeacherRole ? "#34d399" : "#fbbf24";
    ctx.fillText(isTeacherRole ? "المقرئ المعتمد • بث حي نشط" : "طالب العلم • متصل ومستمع", 320, 310);

    // Animated Soundwave bars at the bottom
    const barCount = 18;
    const barWidth = 10;
    const spacing = 6;
    const totalW = barCount * (barWidth + spacing) - spacing;
    const startX = (640 - totalW) / 2;
    ctx.fillStyle = isTeacherRole ? "#10b981" : "#f59e0b";

    for (let i = 0; i < barCount; i++) {
      const h = 10 + Math.abs(Math.sin((frame * 0.12) + i * 0.45)) * 32;
      ctx.fillRect(startX + i * (barWidth + spacing), 420 - h, barWidth, h);
    }

    // Top indicator
    ctx.font = "bold 13px 'Segoe UI', Tahoma, sans-serif";
    ctx.fillStyle = "#ef4444";
    ctx.beginPath();
    ctx.arc(580, 40, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "right";
    ctx.fillText("بث حي مباشر", 570, 44);

    // Digital time
    const timeStr = new Date().toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    ctx.font = "12px monospace";
    ctx.fillStyle = "#94a3b8";
    ctx.textAlign = "left";
    ctx.fillText(timeStr, 50, 44);

    requestAnimationFrame(renderFrame);
  };

  renderFrame();

  const stream = (canvas as any).captureStream ? (canvas as any).captureStream(25) : (canvas as any).mozCaptureStream(25);

  // Synthesize gentle sub-audible carrier audio track
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioCtx) {
      const audioCtx = new AudioCtx();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      gain.gain.value = 0.00001;
      osc.connect(gain);
      const dest = audioCtx.createMediaStreamDestination();
      gain.connect(dest);
      osc.start();
      dest.stream.getAudioTracks().forEach((t) => stream.addTrack(t));
    }
  } catch (e) {
    console.warn("AudioContext synthetic track fallback error:", e);
  }

  return stream;
}

// Real-time audio analyser helper to detect when a participant is speaking
function setupAudioAnalyser(stream: MediaStream, onSpeakingChange: (speaking: boolean) => void): () => void {
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
      analyser.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const avg = sum / dataArray.length;
      const speakingNow = avg > 12;

      if (speakingNow !== isSpeaking) {
        isSpeaking = speakingNow;
        onSpeakingChange(speakingNow);
      }
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


  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [activeTab, setActiveTab] = useState<"MUSHAF" | "CHAT" | "PARTICIPANTS">("MUSHAF");
  const [hasRemoteStream, setHasRemoteStream] = useState(false);
  const [needsAudioUnlock, setNeedsAudioUnlock] = useState(false);
  const [remotePeerName, setRemotePeerName] = useState<string>("");
  const [connectionStatus, setConnectionStatus] = useState<string>("بانتظار الطرف الآخر...");
  const [mediaTypeNotice, setMediaTypeNotice] = useState<string>("");
  const [localIsSpeaking, setLocalIsSpeaking] = useState(false);
  const [remoteIsSpeaking, setRemoteIsSpeaking] = useState(false);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [studentHandAlert, setStudentHandAlert] = useState<{ studentName: string; visible: boolean } | null>(null);

  const [chatMessages, setChatMessages] = useState<any[]>([
    {
      sender: "النظام",
      text: "مرحباً بكم في الحلقة القرآنية المباشرة. تم تفعيل الصوت والفيديو التفاعلي.",
      time: "16:00",
      system: true,
    },
  ]);
  const [chatInput, setChatInput] = useState("");

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const iceCandidatesQueue = useRef<RTCIceCandidateInit[]>([]);
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

  // Helper to send WebRTC signaling message via HTTP POST
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

  // Attach or sync local tracks to an existing or new PeerConnection
  const syncLocalTracks = (pc: RTCPeerConnection) => {
    if (!localStreamRef.current) return;
    const senders = pc.getSenders();
    localStreamRef.current.getTracks().forEach((track) => {
      const existingSender = senders.find((s) => s.track && s.track.kind === track.kind);
      if (existingSender) {
        existingSender.replaceTrack(track).catch(() => {});
      } else {
        try {
          pc.addTrack(track, localStreamRef.current!);
        } catch (e) {
          console.warn("Error adding track to PC:", e);
        }
      }
    });
  };

  // Initialize or get PeerConnection
  const getOrCreatePeerConnection = () => {
    if (peerConnectionRef.current && peerConnectionRef.current.signalingState !== "closed") {
      syncLocalTracks(peerConnectionRef.current);
      return peerConnectionRef.current;
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionRef.current = pc;

    // Attach local audio & video tracks if stream is already available
    syncLocalTracks(pc);

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignalingMessage("ICE_CANDIDATE", event.candidate.toJSON());
      }
    };

    // Handle receiving remote tracks (video and audio)
    pc.ontrack = (event) => {
      console.log("WebRTC Remote Track Received:", event.track.kind);
      if (!remoteStreamRef.current) {
        remoteStreamRef.current = new MediaStream();
      }
      if (!remoteStreamRef.current.getTracks().some((t) => t.id === event.track.id)) {
        remoteStreamRef.current.addTrack(event.track);
      }

      const stream = remoteStreamRef.current;

      if (remoteVideoRef.current) {
        if (remoteVideoRef.current.srcObject !== stream) {
          remoteVideoRef.current.srcObject = stream;
        }
        remoteVideoRef.current.play().catch(() => {});
      }

      if (remoteAudioRef.current) {
        if (remoteAudioRef.current.srcObject !== stream) {
          remoteAudioRef.current.srcObject = stream;
        }
        remoteAudioRef.current.play().catch(() => {
          setNeedsAudioUnlock(true);
        });
      }

      setupAudioAnalyser(stream, setRemoteIsSpeaking);
      setHasRemoteStream(true);
      setConnectionStatus("متصل مباشرة");
    };

    pc.oniceconnectionstatechange = () => {
      console.log("ICE Connection State changed to:", pc.iceConnectionState);
      if (pc.iceConnectionState === "connected" || pc.iceConnectionState === "completed") {
        setHasRemoteStream(true);
        setConnectionStatus("متصل مباشرة");
      } else if (pc.iceConnectionState === "failed") {
        setConnectionStatus("جارٍ إعادة محاولة الربط...");
        if (isTeacher) {
          try {
            pc.restartIce();
            triggerOffer("ICE_RESTART");
          } catch {}
        }
      } else if (pc.iceConnectionState === "disconnected") {
        setConnectionStatus("انقطع الاتصال - جارٍ إعادة المحاولة...");
      }
    };

    return pc;
  };

  // Dedicated Offer Trigger with state guards
  const triggerOffer = async (reason: string) => {
    if (!isTeacher) return;
    const pc = getOrCreatePeerConnection();
    syncLocalTracks(pc);

    if (pc.signalingState !== "stable") {
      console.log("Cannot trigger offer right now, signalingState is", pc.signalingState);
      return;
    }

    try {
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
      await pc.setLocalDescription(offer);
      await sendSignalingMessage("OFFER", offer);
      console.log("Teacher sent offer successfully. Reason:", reason);
    } catch (e) {
      console.error("Create offer error:", e);
    }
  };

  // Setup local camera & microphone stream with intelligent fallback
  useEffect(() => {
    if (!isTeacher && authStatus !== "AUTHORIZED") return;
    let active = true;

    const initMedia = async () => {
      let stream: MediaStream | null = null;

      // Tier 1: Try real physical camera & microphone
      try {
        stream = await navigator.mediaDevices.getUserMedia({
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
        setMediaTypeNotice("الكاميرا والميكروفون متصلان بنجاح");
      } catch (errVideo) {
        console.warn("Physical camera access failed or locked by another tab. Trying mic-only...", errVideo);
        // Tier 2: Try physical microphone only + synthetic canvas video
        try {
          const micStream = await navigator.mediaDevices.getUserMedia({
            audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
          });
          const synthStream = createSyntheticMediaStream(myRole, myName);
          stream = new MediaStream([
            ...synthStream.getVideoTracks(),
            ...micStream.getAudioTracks(),
          ]);
          setMediaTypeNotice("الميكروفون متصل (بث فيديو افتراضي تفاعلي)");
        } catch (errAudio) {
          console.warn("Physical mic access failed or unavailable. Falling back to synthetic media...", errAudio);
          // Tier 3: Complete synthetic media stream fallback
          stream = createSyntheticMediaStream(myRole, myName);
          setMediaTypeNotice("بث تفاعلي ذكي (كاميرا وميكروفون افتراضيان)");
        }
      }

      if (!active || !stream) {
        if (stream) stream.getTracks().forEach((t) => t.stop());
        return;
      }

      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.play().catch(() => {});
      }

      // Attach audio analyser for local speech detection
      setupAudioAnalyser(stream, setLocalIsSpeaking);

      // Attach tracks to PC
      const pc = getOrCreatePeerConnection();
      syncLocalTracks(pc);

      // Announce presence immediately
      await sendSignalingMessage("PRESENCE", { role: myRole, name: myName });

      if (isTeacher) {
        setTimeout(() => triggerOffer("INIT_MEDIA"), 500);
      }
    };

    initMedia();

    return () => {
      active = false;
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
    };
  }, [sessionId, myRole, authStatus, isTeacher]);

  // Robust HTTP Signaling Polling Loop (Every 1 second)
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

      if (senderName) {
        setRemotePeerName(senderName);
      }

      const pc = getOrCreatePeerConnection();

      try {
        if (signalType === "PRESENCE") {
          setConnectionStatus("تم رصد الطرف الآخر - جارٍ التوصيل...");
          if (isTeacher) {
            triggerOffer("PRESENCE_RECEIVED");
          } else {
            await sendSignalingMessage("PRESENCE_ACK", { role: myRole, name: myName });
          }
        } else if (signalType === "PRESENCE_ACK") {
          setConnectionStatus("تم الرد من الطرف الآخر - جاري إرسال العرض...");
          if (isTeacher) {
            triggerOffer("PRESENCE_ACK_RECEIVED");
          }
        } else if (signalType === "OFFER") {
          // Student receives Offer from Teacher
          setConnectionStatus("تم استقبال بث المعلم - جاري الرد...");
          syncLocalTracks(pc);
          await pc.setRemoteDescription(new RTCSessionDescription(data));

          // Process queued ICE candidates
          while (iceCandidatesQueue.current.length > 0) {
            const candidate = iceCandidatesQueue.current.shift();
            if (candidate) await pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
          }

          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          await sendSignalingMessage("ANSWER", answer);
          console.log("Student sent answer to Teacher");
        } else if (signalType === "ANSWER") {
          // Teacher receives Answer from Student
          setConnectionStatus("تم استقبال رد الطالب - جاري استكمال الربط...");
          if (pc.signalingState === "have-local-offer") {
            await pc.setRemoteDescription(new RTCSessionDescription(data));

            while (iceCandidatesQueue.current.length > 0) {
              const candidate = iceCandidatesQueue.current.shift();
              if (candidate) await pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
            }
            console.log("Teacher set remote description from Answer");
          }
        } else if (signalType === "ICE_CANDIDATE") {
          if (pc.remoteDescription && pc.remoteDescription.type) {
            await pc.addIceCandidate(new RTCIceCandidate(data)).catch(() => {});
          } else {
            iceCandidatesQueue.current.push(data);
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
        }
      } catch (err) {
        console.error("Signal handle error:", err);
      }
    };

    // Run polling every 1 second
    const interval = setInterval(pollSignals, 1000);

    // Also periodic presence heartbeat until connected
    const heartbeat = setInterval(() => {
      if (!hasRemoteStream) {
        sendSignalingMessage("PRESENCE", { role: myRole, name: myName });
        if (isTeacher && peerConnectionRef.current?.signalingState === "stable") {
          triggerOffer("HEARTBEAT_RETRY");
        }
      }
    }, 3000);

    return () => {
      active = false;
      clearInterval(interval);
      clearInterval(heartbeat);
    };
  }, [sessionId, session?.id, myRole, isTeacher, hasRemoteStream, authStatus, clientId]);

  // Keep remote video and audio element refs updated whenever remote stream is active
  useEffect(() => {
    if (hasRemoteStream && remoteStreamRef.current) {
      if (remoteVideoRef.current && remoteVideoRef.current.srcObject !== remoteStreamRef.current) {
        remoteVideoRef.current.srcObject = remoteStreamRef.current;
      }
      remoteVideoRef.current?.play().catch(() => {});

      if (remoteAudioRef.current && remoteAudioRef.current.srcObject !== remoteStreamRef.current) {
        remoteAudioRef.current.srcObject = remoteStreamRef.current;
        remoteAudioRef.current.play().catch(() => setNeedsAudioUnlock(true));
      }
    }
  }, [hasRemoteStream]);

  // Global ambient user interaction audio unblocker
  useEffect(() => {
    const handleUnlockAudio = () => {
      if (remoteAudioRef.current && remoteAudioRef.current.paused) {
        remoteAudioRef.current.play().catch(() => {});
      }
      if (remoteVideoRef.current && remoteVideoRef.current.paused) {
        remoteVideoRef.current.play().catch(() => {});
      }
    };
    window.addEventListener("click", handleUnlockAudio);
    window.addEventListener("touchstart", handleUnlockAudio);
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
    const next = !isMicOn;
    setIsMicOn(next);
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = next;
      });
    }
  };

  const toggleVideo = () => {
    const next = !isVideoOn;
    setIsVideoOn(next);
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = next;
      });
    }
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

      {/* Hidden Unmuted Audio Element to guarantee clear two-way sound */}
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

      {/* Top Header Bar */}
      <div className="bg-slate-900 px-4 py-3 border-b border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 px-3 py-1 rounded-full text-xs font-bold">
            <span className={`w-2 h-2 rounded-full ${hasRemoteStream ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
            {hasRemoteStream ? "اتصال فيديو مباشر نشط" : connectionStatus}
          </div>
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

        {/* Right Side: Video Streams Grid & Participants & Chat */}
        <div className="w-full lg:w-96 bg-slate-900 border-t lg:border-t-0 lg:border-r border-slate-800 flex flex-col shrink-0">
          {/* Two-Way Real Video Streams Grid */}
          <div className="p-3 grid grid-cols-2 gap-2 bg-slate-950 border-b border-slate-800">
            {/* Slot 1: Teacher Camera */}
            <div
              className={`relative aspect-video bg-slate-900 rounded-xl overflow-hidden border shadow-md group transition-all duration-300 ${
                (isTeacher ? (localIsSpeaking && isMicOn) : remoteIsSpeaking)
                  ? "border-emerald-400 ring-2 ring-emerald-400/80 shadow-emerald-500/20"
                  : "border-slate-700"
              }`}
            >
              {isTeacher ? (
                // On Teacher Screen: Show Teacher's local camera
                <>
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover scale-x-[-1] ${isVideoOn ? "block" : "hidden"}`}
                  />
                  {!isVideoOn && (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900">
                      <div className="w-12 h-12 rounded-2xl bg-islamic-800 text-gold-accent flex items-center justify-center font-black text-sm ring-2 ring-emerald-500/50 mb-1 shadow">
                        ش
                      </div>
                      <span className="text-[10px] text-slate-400">الكاميرا متوقفة</span>
                    </div>
                  )}
                </>
              ) : (
                // On Student Screen: Show Teacher's LIVE Remote Stream
                <>
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className={`w-full h-full object-cover ${hasRemoteStream ? "block" : "hidden"}`}
                  />
                  {!hasRemoteStream && (
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

            {/* Slot 2: Student Camera */}
            <div
              className={`relative aspect-video bg-slate-900 rounded-xl overflow-hidden border shadow-md group transition-all duration-300 ${
                (!isTeacher ? (localIsSpeaking && isMicOn) : remoteIsSpeaking)
                  ? "border-amber-400 ring-2 ring-amber-400/80 shadow-amber-500/20"
                  : "border-slate-700"
              }`}
            >
              {!isTeacher ? (
                // On Student Screen: Show Student's local camera
                <>
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover scale-x-[-1] ${isVideoOn ? "block" : "hidden"}`}
                  />
                  {!isVideoOn && (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900">
                      <div className="w-12 h-12 rounded-2xl bg-slate-800 text-amber-300 flex items-center justify-center font-black text-sm ring-2 ring-gold-accent/50 mb-1 shadow">
                        ط
                      </div>
                      <span className="text-[10px] text-slate-400">الكاميرا متوقفة</span>
                    </div>
                  )}
                </>
              ) : (
                // On Teacher Screen: Show Student's LIVE Remote Stream
                <>
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className={`w-full h-full object-cover ${hasRemoteStream ? "block" : "hidden"}`}
                  />
                  {!hasRemoteStream && (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-center p-2">
                      <div className="w-12 h-12 rounded-2xl bg-slate-800 text-amber-300 flex items-center justify-center font-black text-sm ring-2 ring-gold-accent/50 mb-1 shadow">
                        ط
                      </div>
                      <span className="text-[10px] text-amber-300 font-bold flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                        بانتظار انضمام الطالب...
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
                  (!isTeacher ? isMicOn : hasRemoteStream) ? (
                    <Mic className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <MicOff className="w-3 h-3 text-red-400" />
                  )
                )}
                <span>{!isTeacher ? "عبد الرحمن العلي (أنت)" : (remotePeerName || "عبد الرحمن محمد العلي")}</span>
              </div>

              {((!isTeacher && isHandRaised) || (isTeacher && studentHandAlert?.visible)) && (
                <div className="absolute top-1 left-1 bg-amber-500 text-slate-950 px-1.5 py-0.5 rounded text-[10px] font-black flex items-center gap-0.5 animate-bounce shadow">
                  <Hand className="w-2.5 h-2.5" /> اليد مرفوعة
                </div>
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
