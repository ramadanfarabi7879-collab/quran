"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { InAppBookReader } from "@/components/library/InAppBookReader";
import {
  Library,
  BookOpen,
  Eye,
  Download,
  FileText,
  Search,
  Sparkles,
} from "lucide-react";

export default function StudentLibraryPage() {
  const [books, setBooks] = useState<any[]>([]);
  const [readingBook, setReadingBook] = useState<any | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/library")
      .then((r) => r.json())
      .then((d) => setBooks(d.books || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const categories = [
    "ALL",
    "نور البيان",
    "أحكام التجويد",
    "التفسير",
    "الفقه",
    "العقيدة والسيرة",
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
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Library className="w-6 h-6 text-emerald-600" />
              المكتبة الإسلامية والمقررات الدراسية
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              الكتب والمذكرات المعتمدة من المعلم لتعليم التجويد ونور البيان والتفسير.
            </p>
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="ابحث عن كتاب أو مؤلف..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pr-9 pl-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-sm"
            />
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
              {cat === "ALL" ? "جميع المقررات" : cat}
            </button>
          ))}
        </div>

        {/* Books Grid */}
        {loading ? (
          <div className="p-12 text-center text-sm text-slate-400">جارٍ تحميل مكتبة الكتب...</div>
        ) : filteredBooks.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
            <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
              لم يتم العثور على كتب تطابق البحث
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredBooks.map((b) => (
              <div
                key={b.id}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between group"
              >
                <div>
                  <div className="h-44 bg-slate-100 dark:bg-slate-800 overflow-hidden relative">
                    <img
                      src={
                        b.coverUrl ||
                        "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=400"
                      }
                      alt={b.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute top-2 right-2 bg-islamic-900/80 backdrop-blur text-gold-accent text-[10px] font-bold px-2.5 py-1 rounded-lg">
                      {b.category}
                    </span>
                  </div>
                  <div className="p-4 space-y-1.5">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 line-clamp-1">
                      {b.title}
                    </h3>
                    <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">
                      المؤلف: {b.author || "غير محدد"}
                    </span>
                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                      {b.description || "مقرر دراسي معتمد في الحلقات القرآنية."}
                    </p>
                  </div>
                </div>

                <div className="p-4 pt-0 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-2 mt-2">
                  <button
                    onClick={() => setReadingBook(b)}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-islamic-800 hover:bg-islamic-700 text-white font-bold text-xs py-2.5 rounded-xl shadow-sm transition active:scale-95"
                  >
                    <Eye className="w-3.5 h-3.5 text-amber-300" />
                    قراءة في القارئ الرقمي
                  </button>
                  <a
                    href={b.fileUrl || "/books/tuhfat-al-atfal.pdf"}
                    download
                    className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-emerald-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                    title="تحميل PDF"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal: Interactive Digital Book Reader */}
        {readingBook && (
          <InAppBookReader book={readingBook} onClose={() => setReadingBook(null)} />
        )}
      </div>
    </AppShell>
  );
}
