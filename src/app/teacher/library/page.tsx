"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { InAppBookReader } from "@/components/library/InAppBookReader";
import {
  Library,
  BookOpen,
  Plus,
  Download,
  Eye,
  FileText,
  Bookmark,
  CheckCircle2,
  XCircle,
  Search,
} from "lucide-react";

export default function TeacherLibraryPage() {
  const [books, setBooks] = useState<any[]>([]);
  const [halaqat, setHalaqat] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [readingBook, setReadingBook] = useState<any | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [category, setCategory] = useState("أحكام التجويد");
  const [description, setDescription] = useState("");
  const [fileUrl, setFileUrl] = useState("/books/tuhfat-al-atfal.pdf");
  const [pagesCount, setPagesCount] = useState(24);
  const [submitting, setSubmitting] = useState(false);

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

  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          author,
          category,
          description,
          fileUrl,
          pagesCount,
        }),
      });
      if (res.ok) {
        setShowAddModal(false);
        setTitle("");
        fetchData();
      }
    } catch (e) {
      console.error(e);
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
              إدارة وتخصيص المراجع الشرعية وكتب التجويد ونور البيان لطلاب الحلقات.
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
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 bg-islamic-800 hover:bg-islamic-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow transition shrink-0"
            >
              <Plus className="w-4 h-4" />
              إضافة كتاب
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {filteredBooks.map((book) => (
            <div
              key={book.id}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between"
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
              </div>
            </div>
          ))}
        </div>

        {/* In-App Interactive Digital Book Reader */}
        {readingBook && (
          <InAppBookReader
            book={readingBook}
            onClose={() => setReadingBook(null)}
          />
        )}

        {/* Modal: Add Book */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
              <h3 className="font-black text-base text-slate-900 dark:text-slate-100">
                إضافة كتاب للمكتبة الإسلامية
              </h3>

              <form onSubmit={handleAddBook} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    عنوان الكتاب:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: غاية المريد في علم التجويد"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      المؤلف:
                    </label>
                    <input
                      type="text"
                      placeholder="اسم الشيخ أو المحقق"
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      التصنيف:
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 font-bold text-slate-900 dark:text-slate-100"
                    >
                      <option value="نور البيان">نور البيان</option>
                      <option value="أحكام التجويد">أحكام التجويد</option>
                      <option value="الفقه">الفقه</option>
                      <option value="التفسير">التفسير</option>
                      <option value="العقيدة والسيرة">العقيدة والسيرة</option>
                      <option value="مذكرات المعلم">مذكرات المعلم</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    نبذة عن الكتاب:
                  </label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="محتوى الكتاب ومناسبته للطلاب..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-xl text-slate-500 font-bold"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-islamic-800 hover:bg-islamic-700 text-white font-bold px-5 py-2 rounded-xl shadow"
                  >
                    {submitting ? "جارٍ الحفظ..." : "حفظ الكتاب"}
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
