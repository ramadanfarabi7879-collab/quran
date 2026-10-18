"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Library, BookOpen, Eye, Download, FileText, XCircle } from "lucide-react";

export default function StudentLibraryPage() {
  const [books, setBooks] = useState<any[]>([]);
  const [readingBook, setReadingBook] = useState<any | null>(null);

  useEffect(() => {
    fetch("/api/library")
      .then((r) => r.json())
      .then((d) => setBooks(d.books || []))
      .catch(console.error);
  }, []);

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Library className="w-6 h-6 text-emerald-600" />
            المكتبة الإسلامية والمقررات الدراسية
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            الكتب والمذكرات المعتمدة من المعلم لتعليم التجويد ونور البيان والفقه.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {books.map((b) => (
            <div
              key={b.id}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="h-40 bg-slate-100 dark:bg-slate-800 overflow-hidden relative">
                  <img
                    src={b.coverUrl || "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=400"}
                    alt={b.title}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-2 right-2 bg-islamic-900/80 backdrop-blur text-gold-accent text-[10px] font-bold px-2.5 py-1 rounded-lg">
                    {b.category}
                  </span>
                </div>
                <div className="p-4 space-y-1">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">{b.title}</h3>
                  <span className="text-xs text-slate-500 block">المؤلف: {b.author}</span>
                  <p className="text-[11px] text-slate-400 line-clamp-2">{b.description}</p>
                </div>
              </div>

              <div className="p-4 pt-0 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 mt-2">
                <button
                  onClick={() => setReadingBook(b)}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs py-2 rounded-xl transition"
                >
                  <Eye className="w-3.5 h-3.5 text-emerald-600" />
                  قراءة الكتاب
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Modal: Book Reader */}
        {readingBook && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-center space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  {readingBook.title}
                </span>
                <button onClick={() => setReadingBook(null)} className="text-slate-400">
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-2xl space-y-3">
                <FileText className="w-12 h-12 text-emerald-600 mx-auto" />
                <h4 className="font-bold text-sm">{readingBook.title}</h4>
                <p className="text-xs text-slate-500">{readingBook.description}</p>
                <div className="text-xs text-emerald-600 font-bold">
                  عدد الصفحات: {readingBook.pagesCount} صفحة
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setReadingBook(null)}
                  className="px-5 py-2 rounded-xl bg-slate-800 text-white font-bold text-xs"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
