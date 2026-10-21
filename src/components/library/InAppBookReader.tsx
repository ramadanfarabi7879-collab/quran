"use client";

import React, { useState, useMemo } from "react";
import { BookDetail, BookChapter, CURRICULUM_BOOKS } from "@/lib/booksData";
import {
  BookOpen,
  X,
  ChevronRight,
  ChevronLeft,
  Search,
  Download,
  FileText,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Sun,
  Moon,
  Coffee,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Layers,
  Sparkles,
} from "lucide-react";

interface InAppBookReaderProps {
  book: {
    id?: string;
    title: string;
    author?: string;
    category?: string;
    description?: string;
    fileUrl?: string;
    coverUrl?: string;
    pagesCount?: number;
  };
  onClose: () => void;
}

export function InAppBookReader({ book, onClose }: InAppBookReaderProps) {
  // Find pre-authored rich book chapters if available
  const matchedCurriculum = useMemo(() => {
    return (
      CURRICULUM_BOOKS.find(
        (b) =>
          b.id === book.id ||
          b.title.trim().includes(book.title.trim()) ||
          book.title.trim().includes(b.title.trim()) ||
          (book.fileUrl && b.fileUrl === book.fileUrl)
      ) || null
    );
  }, [book]);

  const chapters: BookChapter[] = useMemo(() => {
    if (matchedCurriculum && matchedCurriculum.chapters?.length > 0) {
      return matchedCurriculum.chapters;
    }
    // Fallback default chapters for newly uploaded teacher books
    return [
      {
        id: "overview",
        title: "مقدمة ومستخلص الكتاب",
        subtitle: `تصنيف الكتاب: ${book.category || "العلوم الشرعية والقرآن الكريم"}`,
        content: [
          `كتاب: « ${book.title} »`,
          `المؤلف: فضيلة الشيخ / ${book.author || "غير محدد"}`,
          book.description ||
            "هذا الكتاب من المراجع التعليمية المقررة في المنصة لمدارسة القرآن الكريم وتجويده وتفسيره.",
          "يمكنك قراءة ملخص الكتاب هنا أو الضغط على تبويب (معاينة وتحميل النسخة الأصلية PDF) لقراءة المستند بالكامل.",
        ],
      },
    ];
  }, [matchedCurriculum, book]);

  const [activeChapterIndex, setActiveChapterIndex] = useState(0);
  const [activeViewMode, setActiveViewMode] = useState<"TEXT" | "PDF">("TEXT");
  const [searchQuery, setSearchQuery] = useState("");
  const [fontSize, setFontSize] = useState<number>(18);
  const [themeMode, setThemeMode] = useState<"light" | "sepia" | "dark">("light");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [pdfLoadError, setPdfLoadError] = useState(false);

  const activeChapter = chapters[activeChapterIndex] || chapters[0];

  // Filter chapters by search
  const filteredChapters = useMemo(() => {
    if (!searchQuery.trim()) return chapters;
    const q = searchQuery.trim().toLowerCase();
    return chapters.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        (c.subtitle && c.subtitle.toLowerCase().includes(q)) ||
        c.content.some((p) => p.toLowerCase().includes(q))
    );
  }, [chapters, searchQuery]);

  const themeClasses = {
    light: "bg-white text-slate-900 border-slate-200",
    sepia: "bg-[#fbf0d9] text-[#5f4b32] border-[#ecd8b5]",
    dark: "bg-slate-950 text-slate-100 border-slate-800",
  }[themeMode];

  const readerPaperClasses = {
    light: "bg-amber-50/40 text-slate-900 shadow-sm border-amber-100/60",
    sepia: "bg-[#f4e4c1] text-[#423321] border-[#dfcaa1] shadow-inner",
    dark: "bg-slate-900/90 text-slate-100 border-slate-800 shadow-inner",
  }[themeMode];

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-2 sm:p-4 transition-all animate-in fade-in duration-200 select-text ${
        isFullscreen ? "p-0" : ""
      }`}
    >
      <div
        className={`w-full ${
          isFullscreen ? "h-screen rounded-none" : "max-w-5xl h-[92vh] rounded-3xl"
        } flex flex-col shadow-2xl border overflow-hidden transition-colors ${themeClasses}`}
      >
        {/* Top Navbar */}
        <div className="bg-slate-900 text-white p-3 sm:px-5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-islamic-800 text-gold-accent border border-gold-accent/30 flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-black truncate max-w-xs sm:max-w-md">
                {book.title}
              </h2>
              <div className="flex items-center gap-2 text-[10px] text-slate-400">
                <span className="truncate">{book.author || "غير محدد"}</span>
                <span>•</span>
                <span className="bg-emerald-900/80 text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                  {book.category || "تعليم القرآن"}
                </span>
              </div>
            </div>
          </div>

          {/* Controls: Mode switch, Font Size, Theme, Fullscreen, Close */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* View Mode Toggle */}
            <div className="flex bg-slate-800 p-0.5 rounded-xl border border-slate-700 text-xs">
              <button
                onClick={() => setActiveViewMode("TEXT")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold transition ${
                  activeViewMode === "TEXT"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>القارئ الرقمي</span>
              </button>
              <button
                onClick={() => setActiveViewMode("PDF")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold transition ${
                  activeViewMode === "PDF"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                <Download className="w-3.5 h-3.5" />
                <span>ملف PDF الأصلي</span>
              </button>
            </div>

            {/* Font Size Buttons (Text mode only) */}
            {activeViewMode === "TEXT" && (
              <div className="hidden sm:flex items-center bg-slate-800 p-0.5 rounded-xl border border-slate-700">
                <button
                  onClick={() => setFontSize((s) => Math.max(14, s - 2))}
                  className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white"
                  title="تصغير الخط"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[11px] font-mono font-bold px-1.5 text-amber-300">
                  {fontSize}px
                </span>
                <button
                  onClick={() => setFontSize((s) => Math.min(28, s + 2))}
                  className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white"
                  title="تكبير الخط"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Theme switcher */}
            <div className="flex bg-slate-800 p-0.5 rounded-xl border border-slate-700">
              <button
                onClick={() => setThemeMode("light")}
                className={`p-1.5 rounded-lg transition ${
                  themeMode === "light"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
                title="وضع نهاري فاتح"
              >
                <Sun className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setThemeMode("sepia")}
                className={`p-1.5 rounded-lg transition ${
                  themeMode === "sepia"
                    ? "bg-[#eedcb8] text-[#553c20] shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
                title="وضع مريح للعين (كريمي)"
              >
                <Coffee className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setThemeMode("dark")}
                className={`p-1.5 rounded-lg transition ${
                  themeMode === "dark"
                    ? "bg-slate-900 text-amber-400 shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
                title="وضع ليلي داكن"
              >
                <Moon className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Fullscreen toggle */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
              title={isFullscreen ? "تصغير النافذة" : "ملء الشاشة"}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-red-950/60 hover:bg-red-900 text-red-200 border border-red-800/40 transition"
              title="إغلاق القارئ"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Reader Body */}
        {activeViewMode === "TEXT" ? (
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
            {/* Sidebar: Table of Contents & Search */}
            <div className="w-full md:w-80 border-b md:border-b-0 md:border-l border-inherit flex flex-col shrink-0 bg-slate-500/5 max-h-60 md:max-h-none overflow-hidden">
              {/* Search in Book */}
              <div className="p-3 border-b border-inherit">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute right-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="ابحث في فصول ومحتوى الكتاب..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full text-xs pr-8 pl-2 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-inherit focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Chapters list */}
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                <div className="px-2 py-1 text-[11px] font-black text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>فهرس الأبواب والفصول</span>
                  <span className="font-mono">{filteredChapters.length}</span>
                </div>

                {filteredChapters.map((chap, idx) => {
                  const actualIndex = chapters.findIndex((c) => c.id === chap.id);
                  const isSelected = activeChapterIndex === actualIndex;
                  return (
                    <button
                      key={chap.id}
                      onClick={() => setActiveChapterIndex(actualIndex)}
                      className={`w-full text-right p-3 rounded-2xl transition border flex flex-col gap-1 ${
                        isSelected
                          ? "bg-emerald-600 text-white font-bold border-emerald-500 shadow-md ring-1 ring-emerald-400"
                          : "hover:bg-slate-500/10 border-transparent text-inherit"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold line-clamp-1">{chap.title}</span>
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                            isSelected ? "bg-white/20 text-white" : "bg-slate-500/10 text-slate-400"
                          }`}
                        >
                          {actualIndex + 1}
                        </span>
                      </div>
                      {chap.subtitle && (
                        <span
                          className={`text-[10px] line-clamp-1 ${
                            isSelected ? "text-emerald-100" : "text-slate-400"
                          }`}
                        >
                          {chap.subtitle}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Footer info in sidebar */}
              <div className="p-3 border-t border-inherit text-[11px] text-slate-400 flex items-center justify-between bg-slate-500/5">
                <span>الصفحات التقديرية: {book.pagesCount || 24} ص</span>
                <span className="text-emerald-600 font-bold">منصة ورتّل</span>
              </div>
            </div>

            {/* Main Reading Screen */}
            <div className="flex-1 flex flex-col overflow-hidden min-h-0">
              <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex flex-col items-center">
                <div
                  className={`max-w-2xl w-full p-6 sm:p-10 rounded-3xl border transition-all ${readerPaperClasses}`}
                >
                  {/* Chapter Header */}
                  <div className="text-center pb-6 mb-6 border-b border-inherit/40 space-y-2">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-bold">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>
                        الباب {activeChapterIndex + 1} من {chapters.length}
                      </span>
                    </div>
                    <h3 className="text-lg sm:text-2xl font-black font-amiri tracking-wide text-inherit">
                      {activeChapter?.title}
                    </h3>
                    {activeChapter?.subtitle && (
                      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                        {activeChapter.subtitle}
                      </p>
                    )}
                  </div>

                  {/* Chapter Verses / Paragraphs */}
                  <div className="space-y-4 font-amiri leading-loose text-justify text-right">
                    {activeChapter?.content?.map((paragraph, pIdx) => {
                      const isPoetry = paragraph.includes("*");
                      return (
                        <div
                          key={pIdx}
                          style={{ fontSize: `${fontSize}px` }}
                          className={`transition-all ${
                            isPoetry
                              ? "bg-emerald-500/5 p-3 rounded-2xl border border-emerald-500/10 text-center font-bold text-emerald-950 dark:text-emerald-200"
                              : "leading-relaxed text-inherit"
                          }`}
                        >
                          {isPoetry ? (
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6 py-1">
                              <span>{paragraph.split("*")[0]?.trim()}</span>
                              <span className="text-emerald-500 font-black hidden sm:inline">•</span>
                              <span>{paragraph.split("*")[1]?.trim()}</span>
                            </div>
                          ) : (
                            <p className="leading-relaxed">{paragraph}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Bottom Pagination Bar */}
              <div className="p-3 border-t border-inherit flex items-center justify-between gap-3 bg-slate-500/5 shrink-0 text-xs font-bold">
                <button
                  onClick={() => setActiveChapterIndex((i) => Math.max(0, i - 1))}
                  disabled={activeChapterIndex <= 0}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 text-white disabled:opacity-30 disabled:cursor-not-allowed transition hover:bg-slate-700 shadow-sm"
                >
                  <ChevronRight className="w-4 h-4" />
                  <span>الباب السابق</span>
                </button>

                <div className="text-center text-slate-400 font-medium text-[11px]">
                  <span>
                    الفصل {activeChapterIndex + 1} من {chapters.length}
                  </span>
                </div>

                <button
                  onClick={() => setActiveChapterIndex((i) => Math.min(chapters.length - 1, i + 1))}
                  disabled={activeChapterIndex >= chapters.length - 1}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 text-white disabled:opacity-30 disabled:cursor-not-allowed transition hover:bg-emerald-600 shadow-sm"
                >
                  <span>الباب التالي</span>
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* PDF Preview & Download View */
          <div className="flex-1 flex flex-col p-4 sm:p-6 overflow-hidden min-h-0 bg-slate-900 text-white">
            <div className="flex-1 flex flex-col rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 relative">
              {book.fileUrl && !pdfLoadError ? (
                <iframe
                  src={book.fileUrl}
                  title={book.title}
                  className="w-full h-full border-0 rounded-2xl"
                  onError={() => setPdfLoadError(true)}
                />
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
                    <AlertCircle className="w-8 h-8" />
                  </div>
                  <h4 className="text-lg font-bold text-white">معاينة الملف الأصلي</h4>
                  <p className="text-xs text-slate-400 max-w-md leading-relaxed">
                    يمكنك تنزيل النسخة الأصلية مباشرة أو تصفح الكتاب من خلال القارئ الرقمي السريع المدمج.
                  </p>
                </div>
              )}

              {/* Floating Action Strip */}
              <div className="p-3 bg-slate-900/90 backdrop-blur border-t border-slate-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>المستند متوفر بصيغة PDF المعتمدة للطباعة والدراسة</span>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={book.fileUrl || "/books/tuhfat-al-atfal.pdf"}
                    download
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg transition active:scale-95"
                  >
                    <Download className="w-4 h-4" />
                    <span>تحميل النسخة PDF</span>
                  </a>
                  <button
                    onClick={() => setActiveViewMode("TEXT")}
                    className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-4 py-2.5 rounded-xl transition"
                  >
                    <FileText className="w-4 h-4" />
                    <span>العودة للقارئ الرقمي</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
