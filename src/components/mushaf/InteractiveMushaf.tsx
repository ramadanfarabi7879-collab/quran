"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  SURAHS,
  JUZS,
  HIZBS,
  getPageSurahs,
  toArabicNumeral,
  getSurahMeta,
  getJuzMeta,
  getHizbMeta,
  getJuzForPage,
  getHizbForPage,
  getMadinahMushafPageUrl,
  getRubForPage,
  getPageForRub,
} from "@/lib/quranData";
import {
  QURAN_QUARTERS,
  getQuartersForHizb,
  getQuartersForJuz,
  getQuarterForPage,
  QuarterData,
} from "@/lib/quranQuarters";
import { MushafMode, MushafState } from "@/types";
import { useAuth, useRealtime } from "@/components/providers/AppProviders";
import {
  Lock,
  Unlock,
  Eye,
  Crosshair,
  ChevronRight,
  ChevronLeft,
  Volume2,
  CheckCircle2,
  AlertTriangle,
  Mic,
  Award,
  Sparkles,
  ShieldAlert,
  Save,
  Clock,
  BookOpen,
  ListFilter,
  Search,
  Bookmark,
  Layers,
  Compass,
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from "lucide-react";

interface InteractiveMushafProps {
  sessionId?: string;
  isTeacher?: boolean;
  halaqaId?: string;
  halaqaName?: string;
  onEvaluationSaved?: () => void;
}

export function InteractiveMushaf({
  sessionId = "active-session",
  isTeacher = false,
  halaqaId,
  halaqaName = "حلقة الفجر لتحفيظ القرآن",
  onEvaluationSaved,
}: InteractiveMushafProps) {
  const { user } = useAuth();
  const { subscribe } = useRealtime();

  // State
  const [mode, setMode] = useState<MushafMode>("VIEW");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [currentSurah, setCurrentSurah] = useState<number>(1);
  const [highlightedAyahs, setHighlightedAyahs] = useState<number[]>([]);
  const [allowFreeNavigation, setAllowFreeNavigation] = useState(false);
  const [teacherState, setTeacherState] = useState<{ page: number; surah: number }>({ page: 1, surah: 1 });
  const [isLockedByServer, setIsLockedByServer] = useState(false);
  const [lockMessage, setLockMessage] = useState("");
  const isStudentLocked = !isTeacher && (mode === "TASMEE_LOCKED" || isLockedByServer);
  const canNavigate = isTeacher || allowFreeNavigation;

  // Active Icon Selectors Popover State (Surah, Juz, Hizb, Rub')
  const [activePopover, setActivePopover] = useState<"surah" | "juz" | "hizb" | "rub" | null>(null);
  const [surahSearch, setSurahSearch] = useState("");
  const [juzSearch, setJuzSearch] = useState("");
  const [hizbSearch, setHizbSearch] = useState("");
  const [rubSearch, setRubSearch] = useState("");
  const [rubViewScope, setRubViewScope] = useState<"hizb" | "juz" | "all">("hizb");
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const mushafScrollRef = useRef<HTMLDivElement>(null);
  const currentPageRef = useRef(currentPage);
  const prevAllowFreeRef = useRef<boolean>(false);
  const isInitialSyncDoneRef = useRef<boolean>(false);

  useEffect(() => {
    currentPageRef.current = currentPage;
  }, [currentPage]);

  // Recitation evaluation state for teacher during Tasmee'
  const [mistakesCount, setMistakesCount] = useState(0);
  const [alertsCount, setAlertsCount] = useState(0);
  const [tajweedLevel, setTajweedLevel] = useState("ممتاز");
  const [recitationNotes, setRecitationNotes] = useState("");
  const [startAyah, setStartAyah] = useState(1);
  const [endAyah, setEndAyah] = useState(10);
  const [recitationTimer, setRecitationTimer] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [savingEvaluation, setSavingEvaluation] = useState(false);
  const [evalSuccess, setEvalSuccess] = useState(false);

  // Fetch initial mushaf state
  const fetchMushafState = async () => {
    try {
      const res = await fetch(`/api/mushaf/state?sessionId=${sessionId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.state) {
          applyState(data.state);
        }
      }
    } catch {}
  };

  const applyState = (st: MushafState) => {
    setMode((prev) => (prev !== st.mode ? st.mode : prev));
    setHighlightedAyahs(st.highlightedAyahs || []);
    
    const wasFreeAllowed = prevAllowFreeRef.current;
    const isFreeNow = !!st.allowFreeNavigation;
    setAllowFreeNavigation(isFreeNow);
    setTeacherState({ page: st.currentPage, surah: st.currentSurah });

    if (isTeacher) {
      // Teacher governs their own view
    } else {
      // Student:
      // 1. Initial join: automatically snaps to teacher's current page
      // 2. Free navigation is disabled: automatically follows teacher's page
      // 3. Free navigation was just disabled: snaps back to teacher's page immediately
      // 4. Guided mode: forces follow
      const mustFollow =
        !isInitialSyncDoneRef.current ||
        !isFreeNow ||
        (wasFreeAllowed && !isFreeNow) ||
        st.mode === "GUIDED";

      if (mustFollow) {
        if (st.currentPage !== currentPageRef.current || st.currentSurah !== currentSurah) {
          currentPageRef.current = st.currentPage;
          setCurrentPage(st.currentPage);
          setCurrentSurah(st.currentSurah);
          setImageLoading(true);
          setImageError(false);
          if (mushafScrollRef.current) {
            mushafScrollRef.current.scrollTop = 0;
          }
        }
      }
    }

    prevAllowFreeRef.current = isFreeNow;
    isInitialSyncDoneRef.current = true;

    if (st.mode === "TASMEE_LOCKED" && !isTeacher) {
      setIsLockedByServer(true);
      setLockMessage(
        "وضع التسميع المغلق نشط الآن بأمر المعلم. تم حجب المصحف الشريف لمنع النظر فيه أثناء التسميع."
      );
    } else {
      setIsLockedByServer(false);
    }
  };

  useEffect(() => {
    fetchMushafState();
    // Guaranteed fallback sync every 2 seconds
    const interval = setInterval(fetchMushafState, 2000);
    return () => clearInterval(interval);
  }, [sessionId, isTeacher]);

  // Subscribe to real-time events for this session and global broadcast
  useEffect(() => {
    const unsubSession = subscribe(`session-${sessionId}`, (event) => {
      if (event.type === "MUSHAF_STATE_UPDATED" && event.payload) {
        applyState(event.payload);
      }
    });

    const unsubGlobal = subscribe("global", (event) => {
      if (event.type === "MUSHAF_STATE_UPDATED" && event.payload) {
        applyState(event.payload);
      }
    });

    const unsubMain = subscribe("session-main-halaqa-session", (event) => {
      if (event.type === "MUSHAF_STATE_UPDATED" && event.payload) {
        applyState(event.payload);
      }
    });

    return () => {
      unsubSession();
      unsubGlobal();
      unsubMain();
    };
  }, [sessionId, isTeacher]);

  // Timer for Tasmee
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (timerActive) {
      interval = setInterval(() => {
        setRecitationTimer((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerActive]);

  // Teacher action: update state
  const updateServerState = async (updates: Partial<MushafState>) => {
    if (!isTeacher) return;
    try {
      const payload = {
        sessionId,
        isTeacher: true,
        mode: updates.mode !== undefined ? updates.mode : mode,
        currentSurah: updates.currentSurah !== undefined ? updates.currentSurah : currentSurah,
        currentPage: updates.currentPage !== undefined ? updates.currentPage : currentPage,
        currentAyah: updates.currentAyah !== undefined ? updates.currentAyah : 1,
        allowFreeNavigation:
          updates.allowFreeNavigation !== undefined ? updates.allowFreeNavigation : allowFreeNavigation,
        highlightedAyahs:
          updates.highlightedAyahs !== undefined ? updates.highlightedAyahs : highlightedAyahs,
      };

      const res = await fetch("/api/mushaf/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        applyState(data.state);
      }
    } catch (err) {
      console.error("Failed to update mushaf state:", err);
    }
  };

  // Switch modes
  const handleStartTasmee = () => {
    setMode("TASMEE_LOCKED");
    setMistakesCount(0);
    setAlertsCount(0);
    setRecitationTimer(0);
    setTimerActive(true);
    setEvalSuccess(false);
    updateServerState({ mode: "TASMEE_LOCKED" });
  };

  const handleEndTasmee = () => {
    setMode("VIEW");
    setTimerActive(false);
    updateServerState({ mode: "VIEW" });
  };

  const handleSaveEvaluation = async () => {
    setSavingEvaluation(true);
    try {
      // Find active student id or default
      const res = await fetch("/api/evaluations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: "student-1", // Will be resolved by server to first enrolled student
          halaqaId: halaqaId || "halaqa-1",
          sessionId,
          surahNumber: currentSurah,
          startAyah,
          endAyah,
          recordType: "NEW_MEMORIZATION",
          mistakesCount,
          alertsCount,
          tajweedLevel,
          memorizationScore: Math.max(0, 100 - mistakesCount * 5 - alertsCount * 2),
          tajweedScore: tajweedLevel === "ممتاز" ? 100 : tajweedLevel === "جيد جداً" ? 90 : 80,
          notes: recitationNotes || "أداء طيب ومبارك في التسميع.",
          nextAssignmentText: `استكمال الحفظ من الآية ${endAyah + 1} إلى ${endAyah + 20}`,
        }),
      });

      if (res.ok) {
        setEvalSuccess(true);
        if (onEvaluationSaved) onEvaluationSaved();
        setTimeout(() => setEvalSuccess(false), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingEvaluation(false);
    }
  };

  const getSurahForPage = (pageNum: number): number => {
    let matched = 1;
    for (let i = SURAHS.length - 1; i >= 0; i--) {
      if (SURAHS[i].startPage <= pageNum) {
        matched = SURAHS[i].number;
        break;
      }
    }
    return matched;
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > 604) return;
    if (newPage === currentPageRef.current) return;
    if (isStudentLocked) return;
    if (!canNavigate) return; // Disallow student navigation when free browsing is disabled

    const matchedSurah = getSurahForPage(newPage);
    currentPageRef.current = newPage;
    setCurrentPage(newPage);
    setCurrentSurah(matchedSurah);
    setImageLoading(true);
    setImageError(false);

    if (mushafScrollRef.current) {
      mushafScrollRef.current.scrollTop = 0;
    }

    if (isTeacher) {
      updateServerState({ currentPage: newPage, currentSurah: matchedSurah });
    }
  };

  const handleSurahChange = (surahNum: number) => {
    if (isStudentLocked) return;
    if (!canNavigate) return; // Disallow student navigation when free browsing is disabled
    const s = getSurahMeta(surahNum);
    if (!s) return;
    currentPageRef.current = s.startPage;
    setCurrentSurah(surahNum);
    setCurrentPage(s.startPage);
    setImageLoading(true);
    setImageError(false);

    if (mushafScrollRef.current) {
      mushafScrollRef.current.scrollTop = 0;
    }

    if (isTeacher) {
      updateServerState({ currentSurah: surahNum, currentPage: s.startPage });
    }
  };

  const handleJuzChange = (juzNum: number) => {
    const j = getJuzMeta(juzNum);
    if (!j) return;
    handlePageChange(j.startPage);
  };

  const handleHizbChange = (hizbNum: number) => {
    const h = getHizbMeta(hizbNum);
    if (!h) return;
    handlePageChange(h.startPage);
  };

  const handleRubChange = (rubIndex: number) => {
    const targetPage = getPageForRub(currentHizbNumber, rubIndex);
    handlePageChange(targetPage);
    setActivePopover(null);
  };

  const handleAyahClick = (ayahNum: number) => {
    if (!isTeacher) return;

    const newHighlights = highlightedAyahs.includes(ayahNum)
      ? highlightedAyahs.filter((a) => a !== ayahNum)
      : [ayahNum];

    setHighlightedAyahs(newHighlights);
    updateServerState({
      mode: "GUIDED",
      highlightedAyahs: newHighlights,
      currentAyah: ayahNum,
    });
  };

  // Get current page Quran text
  const pageData = getPageSurahs(currentPage);

  // Current position metadata
  const currentJuzNumber = getJuzForPage(currentPage);
  const currentHizbNumber = getHizbForPage(currentPage);
  const currentQuarter = getQuarterForPage(currentPage);
  const currentRubNumber = currentQuarter?.rubInHizb || getRubForPage(currentPage);
  const currentJuzMeta = getJuzMeta(currentJuzNumber);
  const currentHizbMeta = getHizbMeta(currentHizbNumber);
  const currentSurahMeta = getSurahMeta(currentSurah);
  const isRightPage = currentPage % 2 !== 0; // فردي = صفحة يمنى (يمين)، زوجي = صفحة يسرى (يسار)

  // Filtered quarters according to scope and search query
  const getFilteredQuarters = (): QuarterData[] => {
    let list: QuarterData[] = [];
    if (rubViewScope === "hizb") {
      list = getQuartersForHizb(currentHizbNumber);
    } else if (rubViewScope === "juz") {
      list = getQuartersForJuz(currentJuzNumber);
    } else {
      list = QURAN_QUARTERS;
    }

    if (!rubSearch.trim()) return list;

    const query = rubSearch.trim();
    // Normalize Arabic diacritics for searching
    const normalizeArabic = (text: string) =>
      text
        .replace(/[\u064B-\u065F\u0670]/g, "") // remove tashkeel
        .replace(/[إأآا]/g, "ا")
        .replace(/ة/g, "ه")
        .replace(/ى/g, "ي");

    const normQuery = normalizeArabic(query);

    return list.filter((q) => {
      const normAyah = normalizeArabic(q.ayahText);
      const normSurah = normalizeArabic(q.surahName);
      return (
        normAyah.includes(normQuery) ||
        normSurah.includes(normQuery) ||
        q.ayahText.includes(query) ||
        q.surahName.includes(query) ||
        q.number.toString() === query ||
        q.page.toString() === query
      );
    });
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden flex-1 h-full min-h-0">
      {/* STICKY TOP CONTROLS WRAPPER (شريط التحكم المثبت أثناء التصفح والنزول في المصحف) */}
      <div className="sticky top-0 z-30 bg-slate-900 border-b border-slate-800 shadow-md shrink-0">
        {/* Teacher Floating Control Toolbar */}
        {isTeacher && (
        <div className="bg-slate-900 text-white p-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5 px-2.5 py-1 bg-amber-400/10 rounded-lg border border-amber-400/20">
              <Sparkles className="w-3.5 h-3.5" />
              أوضاع تحكم المعلم:
            </span>

            {/* Mode 1: View */}
            <button
              onClick={() => {
                setMode("VIEW");
                updateServerState({ mode: "VIEW" });
              }}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                mode === "VIEW"
                  ? "bg-islamic-600 text-white shadow-sm ring-1 ring-emerald-400"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              1. عرض المصحف
            </button>

            {/* Mode 2: Strict Closed Tasmee' */}
            <button
              onClick={mode === "TASMEE_LOCKED" ? handleEndTasmee : handleStartTasmee}
              className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
                mode === "TASMEE_LOCKED"
                  ? "bg-red-600 hover:bg-red-700 text-white animate-pulse shadow-md ring-2 ring-red-400"
                  : "bg-red-950/70 border border-red-700/50 text-red-200 hover:bg-red-900"
              }`}
            >
              {mode === "TASMEE_LOCKED" ? (
                <>
                  <Unlock className="w-3.5 h-3.5" />
                  إنهاء التسميع وإعادة فتح المصحف
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  2. بدء التسميع المغلق
                </>
              )}
            </button>

            {/* Mode 3: Guided View */}
            <button
              onClick={() => {
                setMode("GUIDED");
                updateServerState({ mode: "GUIDED" });
              }}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                mode === "GUIDED"
                  ? "bg-amber-600 text-white shadow-sm ring-1 ring-amber-400"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              <Crosshair className="w-3.5 h-3.5" />
              3. العرض الموجّه
            </button>
          </div>

          {/* Free browsing toggle for student */}
          <div className="flex items-center gap-2 bg-slate-800/90 px-3 py-1.5 rounded-xl border border-slate-700">
            <label className="flex items-center gap-2.5 text-xs text-slate-200 cursor-pointer font-bold select-none">
              <input
                type="checkbox"
                checked={allowFreeNavigation}
                onChange={(e) => {
                  const nextVal = e.target.checked;
                  setAllowFreeNavigation(nextVal);
                  updateServerState({
                    allowFreeNavigation: nextVal,
                    currentPage,
                    currentSurah,
                  });
                }}
                className="rounded text-emerald-500 focus:ring-emerald-400 w-4 h-4 cursor-pointer accent-emerald-500"
              />
              <span>السماح للطالب بالتصفح الحر</span>
            </label>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-bold transition ${
                allowFreeNavigation
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                  : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
              }`}
            >
              {allowFreeNavigation ? "مفتوح للطالب" : "مقفل (المعلم يقود)"}
            </span>
          </div>
        </div>
      )}

      {/* Recitation Evaluation Panel during TASMEE_LOCKED (Teacher side) */}
      {isTeacher && mode === "TASMEE_LOCKED" && (
        <div className="bg-gradient-to-r from-red-950/90 via-slate-900 to-slate-900 p-4 border-b border-red-900/40 text-white">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-red-900/60 px-3 py-1 rounded-xl border border-red-700/50">
                <Mic className="w-4 h-4 text-red-400 animate-bounce" />
                <span className="text-xs font-bold text-red-200">التسميع جارٍ الآن</span>
                <span className="text-xs font-mono bg-black/40 px-2 py-0.5 rounded text-white">
                  {formatTime(recitationTimer)}
                </span>
              </div>

              {/* Mistakes & Alerts Counters */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
                  <span className="text-xs text-slate-400">الأخطاء:</span>
                  <span className="text-xs font-bold text-red-400">{mistakesCount}</span>
                  <div className="flex gap-1 ml-1">
                    <button
                      onClick={() => setMistakesCount(Math.max(0, mistakesCount - 1))}
                      className="w-5 h-5 bg-slate-700 hover:bg-slate-600 rounded text-xs flex items-center justify-center"
                    >
                      -
                    </button>
                    <button
                      onClick={() => setMistakesCount(mistakesCount + 1)}
                      className="w-5 h-5 bg-red-600 hover:bg-red-500 rounded text-xs flex items-center justify-center font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
                  <span className="text-xs text-slate-400">التنبيهات:</span>
                  <span className="text-xs font-bold text-amber-400">{alertsCount}</span>
                  <div className="flex gap-1 ml-1">
                    <button
                      onClick={() => setAlertsCount(Math.max(0, alertsCount - 1))}
                      className="w-5 h-5 bg-slate-700 hover:bg-slate-600 rounded text-xs flex items-center justify-center"
                    >
                      -
                    </button>
                    <button
                      onClick={() => setAlertsCount(alertsCount + 1)}
                      className="w-5 h-5 bg-amber-600 hover:bg-amber-500 rounded text-xs flex items-center justify-center font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Tajweed rating */}
              <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg">
                {["ممتاز", "جيد جداً", "جيد", "يحتاج تدريب"].map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setTajweedLevel(lvl)}
                    className={`text-[11px] px-2 py-0.5 rounded font-medium transition ${
                      tajweedLevel === lvl
                        ? "bg-emerald-600 text-white font-bold"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            {/* Save evaluation button */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleSaveEvaluation}
                disabled={savingEvaluation}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow transition"
              >
                <Save className="w-3.5 h-3.5" />
                {savingEvaluation ? "جارٍ الحفظ..." : "حفظ التقييم الرقمي"}
              </button>
              {evalSuccess && (
                <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  تم الحفظ بنجاح!
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Student Status & Sync Banner */}
      {!isTeacher && !isStudentLocked && (
        <div
          className={`px-4 py-2 border-b flex flex-wrap items-center justify-between gap-2 text-xs transition-colors ${
            allowFreeNavigation
              ? "bg-amber-950/40 border-amber-800/60 text-amber-200"
              : "bg-emerald-950/50 border-emerald-800/60 text-emerald-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {allowFreeNavigation ? (
              <>
                <Unlock className="w-4 h-4 text-amber-400" />
                <span className="font-bold">
                  التصفح الحر متاح: أذن لك المعلم بتصفح المصحف الشريف بشكل مستقل
                </span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 text-emerald-400" />
                <span className="font-bold">
                  المصحف مدار تلقائياً من قِبل المعلم (أنت تتابع المعلم عند ص {toArabicNumeral(teacherState.page)} - سورة {getSurahMeta(teacherState.surah)?.name || ""})
                </span>
              </>
            )}
          </div>

          {allowFreeNavigation && currentPage !== teacherState.page && (
            <button
              onClick={() => handlePageChange(teacherState.page)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow transition active:scale-95"
              title="الرجوع إلى الصفحة التي يقف عندها المعلم حالياً"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>العودة لصفحة المعلم (ص {toArabicNumeral(teacherState.page)})</span>
            </button>
          )}
        </div>
      )}

      {/* ACTIVE ICON-BASED MULTI-SELECTORS BAR (السورة، الجزء، الحزب، الربع) */}
      {!isStudentLocked && (
        <div className="relative bg-slate-900 text-white p-3 border-b border-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* 4 Active Icon Selector Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* 1. Surah Icon Button */}
              <div className="relative">
                <button
                  onClick={() => {
                    if (!canNavigate) return;
                    setActivePopover(activePopover === "surah" ? null : "surah");
                  }}
                  disabled={!canNavigate}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
                    !canNavigate
                      ? "opacity-60 cursor-not-allowed bg-slate-800/60 text-slate-400 border border-slate-700/50"
                      : activePopover === "surah"
                      ? "bg-emerald-600 text-white ring-2 ring-emerald-400"
                      : "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                  }`}
                  title={!canNavigate ? "المصحف مدار تلقائياً من قِبل المعلم" : "انقر لاختيار السورة بأيقونات وقائمة السور"}
                >
                  {!canNavigate && <Lock className="w-3.5 h-3.5 text-slate-400" />}
                  <BookOpen className="w-4 h-4 text-emerald-400" />
                  <span>السورة:</span>
                  <span className="text-amber-300 font-extrabold">{currentSurahMeta?.name}</span>
                  <span className="text-[10px] bg-black/40 px-1.5 py-0.5 rounded text-slate-300">
                    {currentSurahMeta?.revelationType === "Meccan" ? "مكية" : "مدنية"}
                  </span>
                </button>

                {/* Surah List Column Popover */}
                {activePopover === "surah" && (
                  <div className="absolute top-full right-0 mt-2 z-50 w-80 sm:w-96 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-3 flex flex-col gap-2 max-h-96 overflow-hidden animate-in fade-in zoom-in-95">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5" />
                        فهرس السور (١١٤ سورة)
                      </span>
                      <button
                        onClick={() => setActivePopover(null)}
                        className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Search */}
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute right-2.5 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="ابحث عن اسم السورة أو رقمها..."
                        value={surahSearch}
                        onChange={(e) => setSurahSearch(e.target.value)}
                        className="w-full text-xs pr-8 pl-2 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    {/* Vertical Column List of Surahs */}
                    <div className="flex flex-col gap-1.5 overflow-y-auto max-h-72 pr-1">
                      {SURAHS.filter((s) => {
                        if (!surahSearch.trim()) return true;
                        const q = surahSearch.trim().toLowerCase();
                        return (
                          s.name.includes(q) ||
                          s.englishName.toLowerCase().includes(q) ||
                          s.number.toString() === q
                        );
                      }).map((s) => (
                        <button
                          key={s.number}
                          onClick={() => {
                            handleSurahChange(s.number);
                            setActivePopover(null);
                          }}
                          className={`w-full text-right p-2.5 rounded-xl text-xs font-medium flex items-center justify-between transition border ${
                            currentSurah === s.number
                              ? "bg-emerald-600 text-white border-emerald-400 font-bold shadow-md ring-1 ring-emerald-300"
                              : "bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border-slate-700/70"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-xs font-mono font-bold border border-emerald-500/30">
                              {toArabicNumeral(s.number)}
                            </span>
                            <div className="flex flex-col text-right">
                              <span className="font-bold text-sm text-white">سورة {s.name}</span>
                              <span className="text-[10px] text-slate-400">
                                {s.revelationType === "Meccan" ? "مكية" : "مدنية"} • {toArabicNumeral(s.numberOfAyahs)} آية
                              </span>
                            </div>
                          </div>
                          <span className="text-[11px] font-mono font-bold text-amber-300 bg-black/40 px-2 py-1 rounded-md">
                            ص {toArabicNumeral(s.startPage)}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Juz Icon Button */}
              <div className="relative">
                <button
                  onClick={() => {
                    if (!canNavigate) return;
                    setActivePopover(activePopover === "juz" ? null : "juz");
                  }}
                  disabled={!canNavigate}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
                    !canNavigate
                      ? "opacity-60 cursor-not-allowed bg-slate-800/60 text-slate-400 border border-slate-700/50"
                      : activePopover === "juz"
                      ? "bg-amber-600 text-white ring-2 ring-amber-400"
                      : "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                  }`}
                  title={!canNavigate ? "المصحف مدار تلقائياً من قبل المعلم" : "انقر لاختيار الجزء"}
                >
                  {!canNavigate && <Lock className="w-3.5 h-3.5 text-slate-400" />}
                  <Layers className="w-4 h-4 text-amber-400" />
                  <span>الجزء:</span>
                  <span className="text-amber-300 font-extrabold">{toArabicNumeral(currentJuzNumber)}</span>
                </button>

                {/* Juz List Column Popover */}
                {activePopover === "juz" && (
                  <div className="absolute top-full right-0 mt-2 z-50 w-80 sm:w-96 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-3 flex flex-col gap-2 max-h-96 overflow-hidden animate-in fade-in zoom-in-95">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5" />
                        فهرس الأجزاء (٣٠ جزءاً)
                      </span>
                      <button
                        onClick={() => setActivePopover(null)}
                        className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Search */}
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute right-2.5 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="ابحث برقم الجزء أو الآية..."
                        value={juzSearch}
                        onChange={(e) => setJuzSearch(e.target.value)}
                        className="w-full text-xs pr-8 pl-2 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>

                    {/* Vertical Column List of Juzs */}
                    <div className="flex flex-col gap-1.5 overflow-y-auto max-h-72 pr-1">
                      {JUZS.filter((j) => {
                        if (!juzSearch.trim()) return true;
                        const q = juzSearch.trim();
                        return (
                          j.name.includes(q) ||
                          j.number.toString() === q ||
                          j.startSurahName.includes(q) ||
                          j.startAyahText.includes(q)
                        );
                      }).map((j) => (
                        <button
                          key={j.number}
                          onClick={() => {
                            handleJuzChange(j.number);
                            setActivePopover(null);
                          }}
                          className={`w-full text-right p-2.5 rounded-xl text-xs font-medium flex items-center justify-between transition border ${
                            currentJuzNumber === j.number
                              ? "bg-amber-600 text-white border-amber-400 font-bold shadow-md ring-1 ring-amber-300"
                              : "bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border-slate-700/70"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center text-xs font-mono font-bold border border-amber-500/30">
                              {toArabicNumeral(j.number)}
                            </span>
                            <div className="flex flex-col text-right">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-white">{j.name}</span>
                                <span className="text-[10px] text-amber-300/80">({j.startSurahName})</span>
                              </div>
                              <span className="text-[11px] font-amiri text-amber-200 truncate max-w-[190px] sm:max-w-[240px]">
                                « {j.startAyahText} »
                              </span>
                            </div>
                          </div>
                          <span className="text-[11px] font-mono font-bold text-amber-300 bg-black/40 px-2 py-1 rounded-md">
                            ص {toArabicNumeral(j.startPage)}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Hizb Icon Button */}
              <div className="relative">
                <button
                  onClick={() => {
                    if (!canNavigate) return;
                    setActivePopover(activePopover === "hizb" ? null : "hizb");
                  }}
                  disabled={!canNavigate}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
                    !canNavigate
                      ? "opacity-60 cursor-not-allowed bg-slate-800/60 text-slate-400 border border-slate-700/50"
                      : activePopover === "hizb"
                      ? "bg-blue-600 text-white ring-2 ring-blue-400"
                      : "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                  }`}
                  title={!canNavigate ? "المصحف مدار تلقائياً من قبل المعلم" : "انقر لاختيار الحزب"}
                >
                  {!canNavigate && <Lock className="w-3.5 h-3.5 text-slate-400" />}
                  <Compass className="w-4 h-4 text-blue-400" />
                  <span>الحزب:</span>
                  <span className="text-blue-300 font-extrabold">{toArabicNumeral(currentHizbNumber)}</span>
                </button>

                {/* Hizb List Column Popover */}
                {activePopover === "hizb" && (
                  <div className="absolute top-full right-0 mt-2 z-50 w-80 sm:w-96 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-3 flex flex-col gap-2 max-h-96 overflow-hidden animate-in fade-in zoom-in-95">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
                        <Compass className="w-3.5 h-3.5" />
                        فهرس الأحزاب (٦٠ حزباً)
                      </span>
                      <button
                        onClick={() => setActivePopover(null)}
                        className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Search */}
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute right-2.5 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="ابحث برقم الحزب أو بدايته..."
                        value={hizbSearch}
                        onChange={(e) => setHizbSearch(e.target.value)}
                        className="w-full text-xs pr-8 pl-2 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    {/* Vertical Column List of Hizbs */}
                    <div className="flex flex-col gap-1.5 overflow-y-auto max-h-72 pr-1">
                      {HIZBS.filter((h) => {
                        if (!hizbSearch.trim()) return true;
                        const q = hizbSearch.trim();
                        return (
                          h.name.includes(q) ||
                          h.number.toString() === q ||
                          h.startSurahName.includes(q) ||
                          h.startAyahText.includes(q)
                        );
                      }).map((h) => (
                        <button
                          key={h.number}
                          onClick={() => {
                            handleHizbChange(h.number);
                            setActivePopover(null);
                          }}
                          className={`w-full text-right p-2.5 rounded-xl text-xs font-medium flex items-center justify-between transition border ${
                            currentHizbNumber === h.number
                              ? "bg-blue-600 text-white border-blue-400 font-bold shadow-md ring-1 ring-blue-300"
                              : "bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border-slate-700/70"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-300 flex items-center justify-center text-xs font-mono font-bold border border-blue-500/30">
                              {toArabicNumeral(h.number)}
                            </span>
                            <div className="flex flex-col text-right">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-white">{h.name}</span>
                                <span className="text-[10px] text-blue-300/80">({h.startSurahName})</span>
                              </div>
                              <span className="text-[11px] font-amiri text-blue-200 truncate max-w-[190px] sm:max-w-[240px]">
                                « {h.startAyahText} »
                              </span>
                            </div>
                          </div>
                          <span className="text-[11px] font-mono font-bold text-blue-300 bg-black/40 px-2 py-1 rounded-md">
                            ص {toArabicNumeral(h.startPage)}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 4. Rub' (Quarter) Icon Button */}
              <div className="relative">
                <button
                  onClick={() => {
                    if (!canNavigate) return;
                    setActivePopover(activePopover === "rub" ? null : "rub");
                  }}
                  disabled={!canNavigate}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
                    !canNavigate
                      ? "opacity-60 cursor-not-allowed bg-slate-800/60 text-slate-400 border border-slate-700/50"
                      : activePopover === "rub"
                      ? "bg-purple-600 text-white ring-2 ring-purple-400"
                      : "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                  }`}
                  title={!canNavigate ? "المصحف مدار تلقائياً من قبل المعلم" : "انقر لاختيار ربع الحزب مع بداية الآية"}
                >
                  {!canNavigate && <Lock className="w-3.5 h-3.5 text-slate-400" />}
                  <Bookmark className="w-4 h-4 text-purple-400" />
                  <span>الربع:</span>
                  <span className="text-purple-300 font-extrabold">
                    {currentQuarter?.typeLabel || `الربع ${toArabicNumeral(currentRubNumber)}`}
                  </span>
                  <span className="hidden sm:inline-block text-[10px] text-purple-300/80 font-normal">
                    ({toArabicNumeral(currentQuarter?.rubInHizb || 1)}/٤)
                  </span>
                </button>

                {/* Rub' List Column Popover */}
                {activePopover === "rub" && (
                  <div className="absolute top-full right-0 mt-2 z-50 w-88 sm:w-[480px] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-3.5 flex flex-col gap-2.5 max-h-[460px] overflow-hidden animate-in fade-in zoom-in-95">
                    {/* Popover Header */}
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="text-xs font-bold text-purple-400 flex items-center gap-1.5">
                        <Bookmark className="w-3.5 h-3.5" />
                        أرباع القرآن الكريم (مصحف المدينة المنورة)
                      </span>
                      <button
                        onClick={() => setActivePopover(null)}
                        className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Scope Filter Tabs */}
                    <div className="grid grid-cols-3 gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
                      <button
                        onClick={() => setRubViewScope("hizb")}
                        className={`py-1 text-[11px] font-bold rounded-lg transition ${
                          rubViewScope === "hizb"
                            ? "bg-purple-600 text-white shadow-sm"
                            : "text-slate-400 hover:text-white"
                        }`}
                      >
                        أرباع الحزب ({toArabicNumeral(currentHizbNumber)})
                      </button>
                      <button
                        onClick={() => setRubViewScope("juz")}
                        className={`py-1 text-[11px] font-bold rounded-lg transition ${
                          rubViewScope === "juz"
                            ? "bg-purple-600 text-white shadow-sm"
                            : "text-slate-400 hover:text-white"
                        }`}
                      >
                        أرباع الجزء ({toArabicNumeral(currentJuzNumber)})
                      </button>
                      <button
                        onClick={() => setRubViewScope("all")}
                        className={`py-1 text-[11px] font-bold rounded-lg transition ${
                          rubViewScope === "all"
                            ? "bg-purple-600 text-white shadow-sm"
                            : "text-slate-400 hover:text-white"
                        }`}
                      >
                        جميع الأرباع (٢٤٠)
                      </button>
                    </div>

                    {/* Search Input */}
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute right-2.5 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="ابحث ببداية الربع (مثال: يستحي، أتأمرون، سيقول)..."
                        value={rubSearch}
                        onChange={(e) => setRubSearch(e.target.value)}
                        className="w-full text-xs pr-8 pl-2 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-purple-500"
                      />
                    </div>

                    {/* Vertical Column of Quarters */}
                    <div className="flex flex-col gap-2 overflow-y-auto max-h-72 pr-1">
                      {getFilteredQuarters().map((q) => {
                        const isSelected = currentQuarter?.number === q.number;
                        return (
                          <button
                            key={q.number}
                            onClick={() => {
                              handlePageChange(q.page);
                              setActivePopover(null);
                            }}
                            className={`w-full text-right p-3 rounded-xl transition border flex flex-col gap-1.5 ${
                              isSelected
                                ? "bg-purple-950/70 border-purple-400 shadow-md ring-1 ring-purple-400"
                                : "bg-slate-800/80 hover:bg-slate-700/80 border-slate-700/80"
                            }`}
                          >
                            {/* Header row: Quarter Tag, Hizb info, Surah name, Page badge */}
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 font-bold text-[11px] border border-purple-500/30">
                                  {q.typeLabel}
                                </span>
                                <span className="text-[11px] text-slate-400">
                                  (حزب {toArabicNumeral(q.hizbNumber)} - جزء {toArabicNumeral(q.juzNumber)})
                                </span>
                                <span className="text-xs font-bold text-slate-200">
                                  سورة {q.surahName} • آية {toArabicNumeral(q.ayahNumber)}
                                </span>
                              </div>
                              <span className="text-[11px] font-mono font-bold text-amber-300 bg-black/40 px-2 py-0.5 rounded-md border border-slate-700">
                                ص {toArabicNumeral(q.page)}
                              </span>
                            </div>

                            {/* Quranic Opening Verse Text with Amiri Font */}
                            <div className="text-right pt-0.5">
                              <p className="font-amiri text-sm sm:text-base text-amber-200 font-bold leading-relaxed">
                                « {q.ayahText} »
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Page Nav Controls & Zoom */}
            <div className="flex items-center gap-2">
              {/* Zoom In / Zoom Out */}
              <div className="flex items-center bg-slate-800 border border-slate-700 rounded-xl p-0.5">
                <button
                  onClick={() => setZoomLevel((z) => Math.min(1.4, Number((z + 0.1).toFixed(2))))}
                  className="p-1 hover:bg-slate-700 rounded text-slate-300 hover:text-white"
                  title="تكبير الصفحة"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setZoomLevel((z) => Math.max(0.85, Number((z - 0.1).toFixed(2))))}
                  className="p-1 hover:bg-slate-700 rounded text-slate-300 hover:text-white"
                  title="تصغير الصفحة"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                {zoomLevel !== 1 && (
                  <button
                    onClick={() => setZoomLevel(1)}
                    className="p-1 hover:bg-slate-700 rounded text-amber-400 text-[10px] font-bold px-1"
                    title="إعادة الحجم الافتراضي"
                  >
                    100%
                  </button>
                )}
              </div>

              {/* Page Number input */}
              <div className="flex items-center gap-1 bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-xl">
                <span className="text-xs text-slate-400">ص:</span>
                <input
                  type="number"
                  min="1"
                  max="604"
                  value={currentPage}
                  disabled={!canNavigate || isStudentLocked}
                  onChange={(e) => handlePageChange(Number(e.target.value))}
                  className="w-12 text-center text-xs font-black bg-transparent text-amber-300 focus:outline-none disabled:opacity-40"
                  title={!canNavigate ? "المصحف مدار تلقائياً من قبل المعلم" : "أدخل رقم الصفحة"}
                />
                <span className="text-xs text-slate-500 font-mono">/ ٦٠٤</span>
              </div>

              {/* Right / Left Page Badge (صفحة يمين أو يسار) */}
              <div
                className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border transition ${
                  isRightPage
                    ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                    : "bg-blue-500/10 border-blue-500/30 text-blue-300"
                }`}
                title={
                  isRightPage
                    ? "صفحة يمنى (تقع على جهة اليمين في مصحف المدينة المفتوح - أرقام فردية)"
                    : "صفحة يسرى (تقع على جهة اليسار في مصحف المدينة المفتوح - أرقام زوجية)"
                }
              >
                <div className="flex items-center gap-0.5">
                  <span
                    className={`w-2 h-3.5 rounded-r-[2px] transition ${
                      isRightPage ? "bg-amber-400 shadow-sm" : "bg-slate-700 opacity-40"
                    }`}
                  />
                  <span
                    className={`w-2 h-3.5 rounded-l-[2px] transition ${
                      !isRightPage ? "bg-blue-400 shadow-sm" : "bg-slate-700 opacity-40"
                    }`}
                  />
                </div>
                <span>{isRightPage ? "صفحة يَمِين" : "صفحة يَسَار"}</span>
              </div>

              {/* Prev / Next Arrows */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1 || !canNavigate || isStudentLocked}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition"
                  title={!canNavigate ? "المصحف مدار تلقائياً من قبل المعلم" : "الصفحة السابقة"}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= 604 || !canNavigate || isStudentLocked}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition"
                  title={!canNavigate ? "المصحف مدار تلقائياً من قبل المعلم" : "الصفحة التالية"}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>

      {/* Main Content Area */}
      {isStudentLocked ? (
        /* STRICT SERVER-ENFORCED CLOSED TASMEE' CURTAIN FOR STUDENT */
        <div className="p-6 sm:p-16 flex flex-col items-center justify-center text-center bg-slate-900 text-white min-h-[450px] relative overflow-hidden select-none">
          <div className="absolute inset-0 bg-[radial-gradient(#064e3b_1px,transparent_1px)] opacity-30 [background-size:16px_16px]" />

          <div className="relative z-10 max-w-lg flex flex-col items-center">
            {/* Animated Padlock emblem */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-red-950/70 border-2 border-red-500/50 flex items-center justify-center mb-4 sm:mb-6 shadow-2xl animate-pulse">
              <Lock className="w-8 h-8 sm:w-10 sm:h-10 text-red-400" />
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-amber-300 mb-2 tracking-tight">
              وضع التسميع المغلق نشط الآن
            </h2>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-900/40 border border-red-700/60 rounded-full text-xs font-bold text-red-300 mb-6">
              <ShieldAlert className="w-3.5 h-3.5" />
              مصحف المدينة محجوب بقرار من المعلم
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6 sm:mb-8">
              {lockMessage ||
                "تم إخفاء صفحات مصحف المدينة المنورة تلقائياً لتمكينك من استظهار الحفظ والتسميع عن ظهر قلب أمام المعلم. سيُعاد فتح المصحف بأمر المعلم فور انتهاء جلسة التسميع."}
            </p>

            {/* Recitation Live Status Indicator */}
            <div className="w-full bg-slate-800/90 rounded-2xl p-3 sm:p-4 border border-slate-700/80 shadow-lg flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-emerald-500 animate-ping" />
                <div className="text-right">
                  <span className="block text-xs font-bold text-white">المعلم يستمع لتسميعك الآن</span>
                  <span className="block text-[10px] sm:text-[11px] text-slate-400">تحدث بوضوح عبر الميكروفون</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 text-xs font-mono text-amber-300 bg-slate-900 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg border border-slate-700">
                <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                تسميع مباشر
              </div>
            </div>

            {/* Inspirational Quranic Verse */}
            <p className="text-xs text-amber-400/90 mt-6 sm:mt-8 font-amiri text-base italic">
              « خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ »
            </p>
          </div>
        </div>
      ) : (
        /* MADINAH MUSHAF AUTHENTIC PAGE VIEW (مصحف المدينة المنورة العادي) */
        <div
          ref={mushafScrollRef}
          style={{ overflowAnchor: "none" }}
          className="flex-1 min-h-0 overflow-y-auto p-1 sm:p-4 md:p-6 bg-[#fbf8f1] dark:bg-slate-950 flex flex-col items-center select-none"
        >
          {/* Authentic Mushaf Book Display Frame */}
          <div
            className={`relative w-full max-w-4xl bg-[#fffdf9] dark:bg-slate-900 rounded-2xl border-4 border-[#c2a661]/40 dark:border-[#c2a661]/20 p-1.5 sm:p-4 transition-all duration-300 ${
              isRightPage
                ? "border-l-[6px] border-l-[#a68641] shadow-[-10px_0_25px_-5px_rgba(0,0,0,0.15)]"
                : "border-r-[6px] border-r-[#a68641] shadow-[10px_0_25px_-5px_rgba(0,0,0,0.15)]"
            }`}
          >
            {/* Top Page Header (Surah name right, Juz & Hizb left + Right/Left Page Badge) */}
            <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-[#8c6b2d] dark:text-[#d4af37] border-b border-[#c2a661]/30 pb-2 mb-3 px-3">
              <span className="flex items-center gap-2 flex-wrap">
                <Layers className="w-3.5 h-3.5" />
                {currentJuzMeta?.name || `الجزء ${toArabicNumeral(currentJuzNumber)}`}
                <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">
                  ({currentHizbMeta?.name} - {currentQuarter?.typeLabel || `الربع ${toArabicNumeral(currentRubNumber)}`})
                </span>
                {/* Right / Left page pill inside header */}
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#f4ebd0] dark:bg-slate-800 text-[#8c6b2d] dark:text-[#d4af37] border border-[#c2a661]/40 shadow-sm">
                  {isRightPage ? "صفحة يَمِين (جهة اليمين)" : "صفحة يَسَار (جهة اليسار)"}
                </span>
              </span>
              <span className="text-base sm:text-lg font-amiri font-black">
                سُورَةُ {currentSurahMeta?.name}
              </span>
            </div>

            {/* Madinah Mushaf Page Image Container */}
            <div className="relative flex justify-center items-center min-h-[480px] sm:min-h-[680px] bg-white dark:bg-slate-900 rounded-xl overflow-auto shadow-inner border border-slate-200/80 dark:border-slate-800 w-full max-w-full">
              {/* Spinner while loading */}
              {imageLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#fffdf9]/90 dark:bg-slate-900/90 z-10 gap-3">
                  <div className="w-10 h-10 border-4 border-[#c2a661] border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs font-bold text-[#8c6b2d] dark:text-[#d4af37]">
                    جارٍ فتح صفحة مصحف المدينة {toArabicNumeral(currentPage)}...
                  </span>
                </div>
              )}

              {/* Genuine Madinah Mushaf Page Image */}
              {!imageError ? (
                <img
                  key={currentPage}
                  src={getMadinahMushafPageUrl(currentPage)}
                  alt={`مصحف المدينة المنورة - صفحة ${currentPage}`}
                  onLoad={() => setImageLoading(false)}
                  onError={() => {
                    setImageLoading(false);
                    setImageError(true);
                  }}
                  style={{ transform: `scale(${zoomLevel})`, transformOrigin: "top center" }}
                  className="w-full max-w-full h-auto object-contain transition-transform duration-200"
                />
              ) : (
                /* Fallback if image fails or offline: Authentic Quran text inside Madinah frame */
                <div className="p-4 sm:p-8 w-full text-center space-y-4">
                  {pageData.map(({ surah, ayahs }, idx) => (
                    <div key={surah.number + "-" + idx} className="space-y-4">
                      {currentPage === surah.startPage && (
                        <div className="py-2 px-4 bg-[#f8f3e6] rounded-xl border-2 border-[#c2a661]/40 inline-block mx-auto mb-2">
                          <h3 className="font-amiri text-xl font-bold text-[#6b4e18]">سُورَةُ {surah.name}</h3>
                        </div>
                      )}
                      {surah.number !== 9 && (currentPage === surah.startPage || ayahs[0]?.numberInSurah === 1) && (
                        <p className="font-amiri text-lg text-slate-800 font-bold my-2">بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ</p>
                      )}
                      <div className="quran-text text-xl sm:text-2xl text-slate-900 leading-loose text-justify text-justify-arabic">
                        {ayahs.map((ayah) => (
                          <span key={ayah.numberInSurah} className="inline px-1">
                            {ayah.text}{" "}
                            <span className="inline-block text-[#c2a661] font-amiri font-bold mx-1">
                              ﴿{toArabicNumeral(ayah.numberInSurah)}﴾
                            </span>
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Clickable Page Flip Overlays (Right = Next, Left = Prev) */}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= 604 || isStudentLocked}
                className="absolute right-0 top-0 bottom-0 w-12 hover:bg-black/5 opacity-0 hover:opacity-100 flex items-center justify-end pr-2 text-slate-500 transition cursor-pointer"
                title="الصفحة التالية"
              >
                <ChevronLeft className="w-8 h-8 text-[#8c6b2d]" />
              </button>
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1 || isStudentLocked}
                className="absolute left-0 top-0 bottom-0 w-12 hover:bg-black/5 opacity-0 hover:opacity-100 flex items-center justify-start pl-2 text-slate-500 transition cursor-pointer"
                title="الصفحة السابقة"
              >
                <ChevronRight className="w-8 h-8 text-[#8c6b2d]" />
              </button>
            </div>

            {/* Bottom Page Footer (Page number in authentic circular badge + Right/Left side indicator) */}
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 border-t border-[#c2a661]/30 pt-2 mt-3 px-3">
              <span>{halaqaName}</span>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-[#8c6b2d] dark:text-[#d4af37]">
                  {isRightPage ? "جهة اليمين 📖" : "📖 جهة اليسار"}
                </span>
                <span className="font-bold text-sm bg-[#f8f3e6] dark:bg-slate-800 text-[#8c6b2d] dark:text-[#d4af37] px-3.5 py-0.5 rounded-full border border-[#c2a661]/40 shadow-sm font-amiri">
                  {toArabicNumeral(currentPage)}
                </span>
              </div>
              <span className="text-[11px] font-medium text-slate-400">مصحف المدينة النبوية الشريف</span>
            </div>
          </div>

          {/* Bottom Page Flip & Navigation Card (خيار التقليب للصفحة الأخرى عند النزول لأسفل) */}
          <div className="w-full max-w-2xl mt-4 mb-8 bg-slate-900 text-white rounded-2xl p-3 border border-slate-800 shadow-2xl flex items-center justify-between gap-2 select-none">
            {/* 1. Button to Previous Page */}
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1 || isStudentLocked}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 border border-slate-700 text-xs font-bold transition shadow-sm text-slate-200 hover:text-white"
              title="الانتقال إلى الصفحة السابقة"
            >
              <ChevronRight className="w-4 h-4 text-amber-400 shrink-0" />
              <div className="flex flex-col text-right">
                <span className="text-xs">الصفحة السابقة</span>
                <span className="text-[10px] text-slate-400 font-mono">
                  ص {toArabicNumeral(Math.max(1, currentPage - 1))} ({((currentPage - 1) % 2 !== 0 ? "يمنى" : "يسرى")})
                </span>
              </div>
            </button>

            {/* 2. Center: Position (Right/Left) + Scroll to top */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  mushafScrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium transition"
                title="الرجوع إلى أعلى الصفحة الحالية"
              >
                <span>↑ أعلى الصفحة</span>
              </button>

              <div
                className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                  isRightPage
                    ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                    : "bg-blue-500/10 border-blue-500/30 text-blue-300"
                }`}
              >
                <div className="flex items-center gap-0.5">
                  <span
                    className={`w-2 h-3.5 rounded-r-[2px] transition ${
                      isRightPage ? "bg-amber-400 shadow-sm" : "bg-slate-700 opacity-40"
                    }`}
                  />
                  <span
                    className={`w-2 h-3.5 rounded-l-[2px] transition ${
                      !isRightPage ? "bg-blue-400 shadow-sm" : "bg-slate-700 opacity-40"
                    }`}
                  />
                </div>
                <span>{isRightPage ? "صفحة يمنى (يمين)" : "صفحة يسرى (يسار)"}</span>
              </div>
            </div>

            {/* 3. Button to Next Page */}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= 604 || isStudentLocked}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 disabled:opacity-30 border border-emerald-500 text-xs font-bold transition shadow-md shadow-emerald-900/30 text-white"
              title="الانتقال إلى الصفحة التالية"
            >
              <div className="flex flex-col text-left">
                <span className="text-xs">الصفحة التالية</span>
                <span className="text-[10px] text-emerald-200 font-mono">
                  ص {toArabicNumeral(Math.min(604, currentPage + 1))} ({((currentPage + 1) % 2 !== 0 ? "يمنى" : "يسرى")})
                </span>
              </div>
              <ChevronLeft className="w-4 h-4 text-emerald-200 shrink-0" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
