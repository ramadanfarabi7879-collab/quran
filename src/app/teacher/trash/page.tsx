"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Trash2, RotateCcw, AlertTriangle, Users, Calendar } from "lucide-react";

export default function TeacherTrashPage() {
  const [deletedStudents, setDeletedStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTrash = async () => {
    try {
      const res = await fetch("/api/teacher/students");
      if (res.ok) {
        const d = await res.json();
        setDeletedStudents(d.deletedStudents || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrash();
  }, []);

  const handleRestore = async (enrollmentId: string) => {
    try {
      const res = await fetch("/api/teacher/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "RESTORE_STUDENT",
          enrollmentId,
        }),
      });

      if (res.ok) {
        fetchTrash();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Trash2 className="w-6 h-6 text-red-500" />
            سلة مهملات الطلاب المحذوفين
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            يتم الاحتفاظ بجميع بيانات الطلاب المحذوفين مع سبب وتاريخ الحذف، ويمكنك استرجاع أي طالب بضغطة زر واحدة.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              إجمالي الطلاب في قائمة الحذف: {deletedStudents.length}
            </span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {deletedStudents.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                لا يوجد طلاب محذوفين حالياً، القائمة فارغة.
              </div>
            ) : (
              deletedStudents.map((enr) => (
                <div
                  key={enr.id}
                  className="p-4 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold flex items-center justify-center text-sm shrink-0">
                      {enr.student?.user?.name?.[0] || "ط"}
                    </div>
                    <div>
                      <span className="font-bold text-sm text-slate-900 dark:text-slate-100 block">
                        {enr.student?.user?.name}
                      </span>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                        <span>الحلقة السابقة: {enr.halaqa?.name}</span>
                        <span>•</span>
                        <span className="text-red-500 font-semibold">
                          سبب الحذف: {enr.deleteReason || "غير محدد"}
                        </span>
                      </div>
                      {enr.deletedAt && (
                        <span className="text-[10px] text-slate-400 block mt-1 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          تاريخ الحذف: {new Date(enr.deletedAt).toLocaleDateString("ar-SA")}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleRestore(enr.id)}
                    className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-sm transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    استرجاع وتفعيل الطالب
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
