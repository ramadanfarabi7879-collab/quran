"use client";

import React, { useState, useEffect, useRef } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { InAppBookReader } from "@/components/library/InAppBookReader";
import {
  Library,
  BookOpen,
  Plus,
  Download,
  Eye,
  FileText,
  Search,
  Upload,
  AlertCircle,
  CheckCircle2,
  X,
  FileCheck,
  ImageIcon,
  Trash2,
  Pencil,
} from "lucide-react";

export default function TeacherLibraryPage() {
  const [books, setBooks] = useState<any[]>([]);
  const [halaqat, setHalaqat] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [readingBook, setReadingBook] = useState<any | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBook, setEditingBook] = useState<any | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editAuthor, setEditAuthor] = useState("");
  const [editCategory, setEditCategory] = useState("أحكام التجويد");
  const [editDescription, setEditDescription] = useState("");
  const [editPagesCount, setEditPagesCount] = useState<number>(1);
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [category, setCategory] = useState("أحكام التجويد");
  const [description, setDescription] = useState("");
  const [pagesCount, setPagesCount] = useState<number>(1);
  const [selectedPdfFile, setSelectedPdfFile] = useState<File | null>(null);
  const [selectedCoverFile, setSelectedCoverFile] = useState<File | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  const pdfInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const fetchData = async () => {
    try {
      const [resB, resH] = await Promise.all([
        fetch("/api/library"),
        fetch("/api/teacher/halaqat"),
      ]);
      if (resB.ok) {
        const d = await resB.json();
        setBooks(d.books || []);
      }
      if (resH.ok) {
        const d = await resH.json();
        setHalaqat(d.halaqat || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setUploadError("عذراً، يجب اختيار ملف بصيغة PDF (.pdf) فقط");
      setSelectedPdfFile(null);
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setUploadError("حجم الملف يتجاوز الحد الأقصى المسموح به (50 ميجابايت)");
      setSelectedPdfFile(null);
      return;
    }

    setSelectedPdfFile(file);
    if (!title) {
      // Auto-fill title from clean filename
      const suggestedTitle = file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
      setTitle(suggestedTitle);
    }
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setUploadError("يرجى اختيار صورة صالحة لغلاف الكتاب");
      return;
    }

    setSelectedCoverFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setCoverPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const resetForm = () => {
    setTitle("");
    setAuthor("");
    setCategory("أحكام التجويد");
    setDescription("");
    setPagesCount(1);
    setSelectedPdfFile(null);
    setSelectedCoverFile(null);
    setCoverPreviewUrl(null);
    setUploadError(null);
    setUploadSuccess(null);
    if (pdfInputRef.current) pdfInputRef.current.value = "";
    if (coverInputRef.current) coverInputRef.current.value = "";
  };

  const handleDeleteBook = async (bookId: string) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا الكتاب نهائياً من المكتبة؟")) return;
    try {
      const res = await fetch(`/api/library?id=${encodeURIComponent(bookId)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setBooks((prev) => prev.filter((b) => b.id !== bookId));
      } else {
        const d = await res.json().catch(() => ({}));
        alert(d.error || "فشل حذف الكتاب");
      }
    } catch (e) {
      console.error(e);
      alert("حدث خطأ أثناء حذف الكتاب");
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBook || !editTitle.trim()) return;
    setEditSubmitting(true);
    try {
      const res = await fetch("/api/library", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingBook.id,
          title: editTitle.trim(),
          author: editAuthor.trim() || "غير محدد",
          category: editCategory,
          description: editDescription.trim(),
          pagesCount: editPagesCount,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "فشل تعديل بيانات الكتاب");
      setBooks((prev) => prev.map((b) => (b.id === editingBook.id ? { ...b, ...d.book } : b)));
      setEditingBook(null);
    } catch (err: any) {
      alert(err.message || "حدث خطأ أثناء تعديل الكتاب");
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError(null);
    setUploadSuccess(null);

    if (!title.trim()) {
      setUploadError("يرجى كتابة عنوان الكتاب");
      return;
    }

    if (!selectedPdfFile) {
      setUploadError("يرجى اختيار ملف PDF للكتاب");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("author", author.trim() || "غير محدد");
      formData.append("category", category);
      formData.append("description", description.trim());
      formData.append("pagesCount", String(pagesCount || 1));
      formData.append("file", selectedPdfFile);
      if (selectedCoverFile) {
        formData.append("cover", selectedCoverFile);
      }

      const res = await fetch("/api/library/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "فشل رفع الكتاب للمكتبة");
      }

      // Add newly uploaded book to top of list immediately
      if (data.book) {
        setBooks((prev) => [data.book, ...prev]);
      }

      setUploadSuccess("تم رفع وإضافة الكتاب بنجاح!");
      setTimeout(() => {
        setShowAddModal(false);
        resetForm();
      }, 1200);
    } catch (e: any) {
      console.error(e);
      setUploadError(e.message || "حدث خطأ أثناء رفع الكتاب");
    } finally {
      setSubmitting(false);
    }
  };

  const categories = [
    "ALL",
    "نور البيان",
    "أحكام التجويد",
    "الفقه",
    "التفسير",
    "العقيدة والسيرة",
    "مذكرات المعلم",
  ];

  const filteredBooks = books.filter((b) => {
    const matchCat = selectedCategory === "ALL" || b.category === selectedCategory;
    const matchSearch =
      !searchQuery.trim() ||
      b.title.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
      (b.author && b.author.toLowerCase().includes(searchQuery.trim().toLowerCase()));
    return matchCat && matchSearch;
  });

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes || bytes <= 0) return null;
    const mb = bytes / (1024 * 1024);
    if (mb < 1) {
      return `${(bytes / 1024).toFixed(0)} كيلوبايت`;
    }
    return `${mb.toFixed(1)} ميجابايت`;
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Library className="w-6 h-6 text-emerald-600" />
              المكتبة الإسلامية والكتب التعليمية
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              إدارة وتخصيص المراجع الشرعية وكتب التجويد ونور البيان وملفات PDF المخصصة للطلاب.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Search */}
            <div className="relative flex-1 sm:w-60">
              <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="ابحث في الكتب أو المؤلفين..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pr-9 pl-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-sm"
              />
            </div>

            <button
              onClick={() => {
                resetForm();
                setShowAddModal(true);
              }}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow transition shrink-0 active:scale-95"
            >
              <Upload className="w-4 h-4" />
              <span>إضافة كتاب PDF</span>
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-semibold">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl transition whitespace-nowrap ${
                selectedCategory === cat
                  ? "bg-islamic-800 text-white shadow-sm dark:bg-emerald-700 font-bold"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100"
              }`}
            >
              {cat === "ALL" ? "جميع التصنيفات" : cat}
            </button>
          ))}
        </div>

        {/* Books Grid */}
        {loading ? (
          <div className="p-12 text-center text-sm text-slate-400">جارٍ تحميل المكتبة...</div>
        ) : filteredBooks.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">
              لا توجد كتب مطابقة للبحث أو التصنيف
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              يمكنك رفع كتاب PDF جديد وتخصيصه للطلاب في الحلقات القرآنية.
            </p>
            <button
              onClick={() => {
                resetForm();
                setShowAddModal(true);
              }}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 px-4 py-2 rounded-xl transition"
            >
              <Plus className="w-4 h-4" />
              رفع أول كتاب الآن
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {filteredBooks.map((book) => {
              const fileSizeStr = formatFileSize(book.fileSizeBytes);
              return (
                <div
                  key={book.id}
                  className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between group"
                >
                  <div>
                    <div className="relative h-44 bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <img
                        src={
                          book.coverUrl ||
                          "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=400"
                        }
                        alt={book.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <span className="absolute top-2 right-2 bg-islamic-900/80 backdrop-blur text-gold-accent text-[10px] font-bold px-2.5 py-1 rounded-lg">
                        {book.category}
                      </span>
                      {fileSizeStr && (
                        <span className="absolute bottom-2 left-2 bg-slate-900/80 backdrop-blur text-slate-200 text-[10px] font-mono px-2 py-0.5 rounded-md">
                          {fileSizeStr}
                        </span>
                      )}
                    </div>

                    <div className="p-4 space-y-1.5">
                      <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 line-clamp-1">
                        {book.title}
                      </h3>
                      <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">
                        المؤلف: {book.author || "غير محدد"}
                      </span>
                      <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                        {book.description || "كتاب تعليمي مخصص للطلاب في الحلقات القرآنية."}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 pt-0 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2 mt-2">
                    <button
                      onClick={() => setReadingBook(book)}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs py-2 rounded-xl transition"
                    >
                      <Eye className="w-3.5 h-3.5 text-emerald-600" />
                      قراءة الكتاب
                    </button>

                    <a
                      href={book.fileUrl}
                      download
                      className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-emerald-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                      title="تحميل PDF"
                    >
                      <Download className="w-4 h-4" />
                    </a>

                    <button
                      onClick={() => {
                        setEditingBook(book);
                        setEditTitle(book.title);
                        setEditAuthor(book.author || "");
                        setEditCategory(book.category || "أحكام التجويد");
                        setEditDescription(book.description || "");
                        setEditPagesCount(book.pagesCount || 1);
                      }}
                      className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-amber-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                      title="تعديل بيانات الكتاب"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDeleteBook(book.id)}
                      className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-red-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                      title="حذف الكتاب"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* In-App Interactive Digital Book Reader */}
        {readingBook && (
          <InAppBookReader
            book={readingBook}
            onClose={() => setReadingBook(null)}
          />
        )}

        {/* Modal: Upload PDF Book */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 my-8">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                    <Upload className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-black text-base text-slate-900 dark:text-slate-100">
                      رفع كتاب PDF جديد
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      إضافة كتاب لمكتبة المنصة وإتاحته للطلاب للدراسة والقراءة.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  disabled={submitting}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {uploadError && (
                <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{uploadError}</span>
                </div>
              )}

              {uploadSuccess && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-xl text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                  <span>{uploadSuccess}</span>
                </div>
              )}

              <form onSubmit={handleAddBook} className="space-y-4 text-xs">
                {/* PDF File Picker Box */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    ملف الـ PDF <span className="text-red-500">*</span> (الحد الأقصى 50 ميجابايت):
                  </label>
                  <div
                    onClick={() => pdfInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 ${
                      selectedPdfFile
                        ? "border-emerald-500 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300"
                        : "border-slate-300 dark:border-slate-700 hover:border-emerald-400 bg-slate-50 dark:bg-slate-800/40"
                    }`}
                  >
                    <input
                      ref={pdfInputRef}
                      type="file"
                      accept=".pdf,application/pdf"
                      onChange={handlePdfChange}
                      className="hidden"
                    />
                    {selectedPdfFile ? (
                      <>
                        <FileCheck className="w-8 h-8 text-emerald-600" />
                        <div>
                          <p className="font-bold text-xs">{selectedPdfFile.name}</p>
                          <p className="text-[11px] opacity-75 font-mono">
                            {(selectedPdfFile.size / (1024 * 1024)).toFixed(2)} ميجابايت - جاهز للرفع
                          </p>
                        </div>
                        <span className="text-[10px] text-emerald-600 underline">اضغط لتغيير الملف</span>
                      </>
                    ) : (
                      <>
                        <FileText className="w-8 h-8 text-slate-400" />
                        <div>
                          <p className="font-bold text-slate-700 dark:text-slate-200">
                            اضغط هنا لاختيار ملف PDF من جهازك
                          </p>
                          <p className="text-[11px] text-slate-400">
                            صيغة .pdf فقط، حتى 50 ميجابايت
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    عنوان الكتاب: <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: تحفة الأطفال والغلمان في تجويد القرآن"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Author */}
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      اسم المؤلف / المحقق:
                    </label>
                    <input
                      type="text"
                      placeholder="مثال: الشيخ سليمان الجمزوري"
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      التصنيف:
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    >
                      <option value="أحكام التجويد">أحكام التجويد</option>
                      <option value="نور البيان">نور البيان</option>
                      <option value="التفسير">التفسير</option>
                      <option value="الفقه">الفقه</option>
                      <option value="العقيدة والسيرة">العقيدة والسيرة</option>
                      <option value="مذكرات المعلم">مذكرات المعلم</option>
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    نبذة مختصرة عن الكتاب:
                  </label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="محتوى الكتاب ومناسبته للطلاب في الحلقات..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                {/* Cover Image (Optional) */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    صورة الغلاف (اختياري):
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      ref={coverInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleCoverChange}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => coverInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-1.5 hover:bg-slate-100 transition"
                    >
                      <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
                      <span>{selectedCoverFile ? "تغيير الصورة" : "اختيار صورة غلاف"}</span>
                    </button>
                    {coverPreviewUrl ? (
                      <div className="flex items-center gap-2">
                        <img
                          src={coverPreviewUrl}
                          alt="معاينة الغلاف"
                          className="w-9 h-9 rounded-lg object-cover border border-slate-300"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCoverFile(null);
                            setCoverPreviewUrl(null);
                          }}
                          className="text-red-500 hover:text-red-700 text-[10px]"
                        >
                          إلغاء الغلاف
                        </button>
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-400">
                        سيتم توليد غلاف افتراضي أنيق تلقائياً في حال عدم إرفاق صورة
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    disabled={submitting}
                    className="px-4 py-2 rounded-xl text-slate-500 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2 rounded-xl shadow transition flex items-center gap-2 disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>جارٍ رفع وحفظ الكتاب...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        <span>حفظ ورفع الكتاب</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {/* Modal: Edit Book Details */}
        {editingBook && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 my-8">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                    <Pencil className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                      تعديل بيانات الكتاب
                    </h3>
                    <p className="text-[11px] text-slate-400">تحديث عنوان وتصنيف ومعلومات الكتاب</p>
                  </div>
                </div>
                <button
                  onClick={() => setEditingBook(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    عنوان الكتاب *
                  </label>
                  <input
                    type="text"
                    required
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      اسم المؤلف / المحقق
                    </label>
                    <input
                      type="text"
                      value={editAuthor}
                      onChange={(e) => setEditAuthor(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      التصنيف *
                    </label>
                    <select
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    >
                      {categories.filter((c) => c !== "ALL").map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    عدد الصفحات
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={editPagesCount}
                    onChange={(e) => setEditPagesCount(parseInt(e.target.value, 10) || 1)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    نبذة عن الكتاب
                  </label>
                  <textarea
                    rows={3}
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setEditingBook(null)}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold transition"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={editSubmitting}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition disabled:opacity-50"
                  >
                    {editSubmitting ? "جارٍ الحفظ..." : "حفظ التعديلات"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
