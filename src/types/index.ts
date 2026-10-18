export type UserRole = "ADMIN" | "TEACHER" | "STUDENT";

export interface CurrentUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string | null;
  phone?: string | null;
  teacherProfile?: {
    id: string;
    title: string;
    bio?: string | null;
    specialties?: string | null;
    allowStudentMessaging: boolean;
    messagingStartHour: number;
    messagingEndHour: number;
    defaultAttendanceGraceMinutes: number;
    recordingsRetentionDays: number;
  } | null;
  studentProfile?: {
    id: string;
    studentNumber: string;
    guardianName?: string | null;
    guardianPhone?: string | null;
    currentJuz: number;
    totalMemorizedAyahs: number;
    totalReviewedAyahs: number;
  } | null;
}

export type MushafMode = "VIEW" | "TASMEE_LOCKED" | "GUIDED";

export interface MushafState {
  sessionId: string;
  mode: MushafMode;
  currentSurah: number;
  currentPage: number;
  currentAyah: number;
  activeStudentId?: string | null;
  allowFreeNavigation: boolean;
  highlightedAyahs: number[];
  lockedAt?: string | null;
  updatedAt?: string;
}

export interface SurahMeta {
  number: number;
  name: string;
  englishName: string;
  revelationType: "Meccan" | "Medinan";
  numberOfAyahs: number;
  startPage: number;
  juzNumber: number;
}

export interface JuzMeta {
  number: number;
  name: string;
  startPage: number;
  startSurahName: string;
  startAyahText: string;
}

export interface HizbMeta {
  number: number;
  name: string;
  juzNumber: number;
  startPage: number;
  startSurahName: string;
  startAyahText: string;
}

export interface Ayah {
  numberInSurah: number;
  text: string;
  juz: number;
  page: number;
  surahNumber: number;
}

export interface RealtimeEvent {
  type:
    | "MUSHAF_STATE_UPDATED"
    | "HALAQA_LIVE_STARTED"
    | "HALAQA_LIVE_ENDED"
    | "STUDENT_ATTENDANCE_CHECKIN"
    | "STUDENT_ATTENDANCE_VERIFIED"
    | "NEW_NOTIFICATION"
    | "NEW_MESSAGE"
    | "VIDEO_SIGNAL"
    | "WEBRTC_SIGNAL"
    | "RECORDING_TOGGLE"
    | "SCHEDULE_UPDATED"
    | "JOIN_REQUEST_SUBMITTED"
    | "JOIN_REQUEST_APPROVED"
    | "JOIN_REQUEST_REJECTED"
    | "SESSION_JOIN_REQUESTED"
    | "SESSION_JOIN_APPROVED"
    | "SESSION_JOIN_REJECTED"
    | "SESSION_JOIN_RESCHEDULED"
    | "STUDENT_REGISTRATION_SUBMITTED"
    | "STUDENT_REGISTRATION_APPROVED"
    | "STUDENT_REGISTRATION_RESCHEDULED"
    | "STUDENT_REGISTRATION_REJECTED";
  payload: any;
  senderId?: string;
  channel?: string;
  timestamp: number;
}
