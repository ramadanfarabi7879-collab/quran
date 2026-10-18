"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import {
  Users,
  UserPlus,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Key,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Search,
  Settings,
  CalendarDays,
  Activity,
  BookOpen,
  Lock,
  Unlock,
  RefreshCw,
  AlertTriangle,
  ArrowUpRight,
  MessageSquare,
  UploadCloud,
  DownloadCloud,
  FileText,
  X,
  Check,
  Phone,
  Mail,
  GraduationCap,
  Sparkles,
  Video,
  Play,
  Radio,
  Plus,
  Clock,
} from "lucide-react";

interface UserPermissions {
  canLogin: boolean;
  canAccessAdmin: boolean;
  canCreateHalaqat: boolean;
  canLockMushaf: boolean;
  canGradeStudents: boolean;
  canMessageStudents: boolean;
  canUploadLibrary: boolean;
  canRecordSessions: boolean;
  allowFreeMushaf: boolean;
  canJoinHalaqat: boolean;
  canMessageTeacher: boolean;
  canDownloadRecordings: boolean;
  canSubmitAssignments: boolean;
}

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "TEACHER" | "STUDENT";
  avatar?: string;
  phone?: string;
  isActive: boolean;
  createdAt: string;
  teacherProfile?: { halaqat?: any[] };
  studentProfile?: { studentNumber?: string; enrollments?: any[] };
  permissions: UserPermissions;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    teachersCount: 0,
    studentsCount: 0,
    adminsCount: 0,
    activeCount: 0,
    inactiveCount: 0,
    activeHalaqat: 0,
    liveSessionsCount: 0,
  });

  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"ALL" | "ADMIN" | "TEACHER" | "STUDENT">("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [activeTab, setActiveTab] = useState<"USERS" | "HALAQAT" | "POLICIES" | "AUDIT">("USERS");

  // Notifications / Alert message
  const [alertMsg, setAlertMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Modals state
  const [permissionsModalUser, setPermissionsModalUser] = useState<UserItem | null>(null);
  const [currentEditPerms, setCurrentEditPerms] = useState<UserPermissions | null>(null);
  const [savingPerms, setSavingPerms] = useState(false);

  const [editModalUser, setEditModalUser] = useState<UserItem | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "STUDENT" as "ADMIN" | "TEACHER" | "STUDENT",
    password: "",
  });
  const [savingEdit, setSavingEdit] = useState(false);

  const [deleteModalUser, setDeleteModalUser] = useState<UserItem | null>(null);
  const [deletingUser, setDeletingUser] = useState(false);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "STUDENT" as "ADMIN" | "TEACHER" | "STUDENT",
    password: "",
  });
  const [savingCreate, setSavingCreate] = useState(false);

  // Halaqat Management State (Admin Supervisor Control)
  const [halaqat, setHalaqat] = useState<any[]>([]);
  const [loadingHalaqat, setLoadingHalaqat] = useState(false);
  const [halaqaModalOpen, setHalaqaModalOpen] = useState(false);
  const [editingHalaqaId, setEditingHalaqaId] = useState<string | null>(null);
  const [halaqaFormData, setHalaqaFormData] = useState({
    name: "",
    description: "",
    level: "متوسط",
    scheduleDays: "السبت, الإثنين, الأربعاء",
    startTime: "16:00",
    endTime: "17:30",
    capacity: 25,
    status: "ACTIVE",
  });
  const [savingHalaqa, setSavingHalaqa] = useState(false);
  const [deleteHalaqaItem, setDeleteHalaqaItem] = useState<any | null>(null);
  const [deletingHalaqa, setDeletingHalaqa] = useState(false);
  const [startingLiveId, setStartingLiveId] = useState<string | null>(null);

  // Audit Logs (recent 5)
  const [recentAudit, setRecentAudit] = useState<any[]>([]);

  const showAlert = (text: string, type: "success" | "error" = "success") => {
    setAlertMsg({ text, type });
    setTimeout(() => setAlertMsg(null), 4000);
  };

  const fetchUsersData = async () => {
    try {
      setRefreshing(true);
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
        if (data.stats) setStats(data.stats);
      }
    } catch (err) {
      console.error(err);
      showAlert("تعذر جلب بيانات المستخدمين", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchHalaqatData = async () => {
    try {
      setLoadingHalaqat(true);
      const res = await fetch("/api/teacher/halaqat");
      if (res.ok) {
        const d = await res.json();
        setHalaqat(d.halaqat || []);
      }
    } catch (err) {
      console.error(err);
      showAlert("تعذر جلب بيانات الحلقات", "error");
    } finally {
      setLoadingHalaqat(false);
    }
  };

  const handleOpenCreateHalaqa = () => {
    setEditingHalaqaId(null);
    setHalaqaFormData({
      name: "",
      description: "",
      level: "متوسط",
      scheduleDays: "السبت, الإثنين, الأربعاء",
      startTime: "16:00",
      endTime: "17:30",
      capacity: 25,
      status: "ACTIVE",
    });
    setHalaqaModalOpen(true);
  };

  const handleOpenEditHalaqa = (h: any) => {
    setEditingHalaqaId(h.id);
    setHalaqaFormData({
      name: h.name || "",
      description: h.description || "",
      level: h.level || "متوسط",
      scheduleDays: h.scheduleDays || "السبت, الإثنين, الأربعاء",
      startTime: h.startTime || "16:00",
      endTime: h.endTime || "17:30",
      capacity: h.capacity || 25,
      status: h.status || "ACTIVE",
    });
    setHalaqaModalOpen(true);
  };

  const handleSaveHalaqa = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingHalaqa(true);
    try {
      const isEdit = Boolean(editingHalaqaId);
      const res = await fetch("/api/teacher/halaqat", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(isEdit && { id: editingHalaqaId }),
          ...halaqaFormData,
        }),
      });

      if (res.ok) {
        showAlert(isEdit ? "تم تحديث بيانات الحلقة بنجاح" : "تم إنشاء الحلقة بنجاح", "success");
        setHalaqaModalOpen(false);
        fetchHalaqatData();
        fetchUsersData();
      } else {
        const d = await res.json();
        showAlert(d.error || "فشل حفظ بيانات الحلقة", "error");
      }
    } catch (err) {
      console.error(err);
      showAlert("حدث خطأ أثناء الاتصال بالخادم", "error");
    } finally {
      setSavingHalaqa(false);
    }
  };

  const handleDeleteHalaqa = async () => {
    if (!deleteHalaqaItem) return;
    setDeletingHalaqa(true);
    try {
      const res = await fetch(`/api/teacher/halaqat?id=${encodeURIComponent(deleteHalaqaItem.id)}`, {
        method: "DELETE",
      });

      if (res.ok) {
        showAlert(`تم حذف حلقة "${deleteHalaqaItem.name}" بنجاح`, "success");
        setDeleteHalaqaItem(null);
        fetchHalaqatData();
        fetchUsersData();
      } else {
        const d = await res.json();
        showAlert(d.error || "فشل حذف الحلقة", "error");
      }
    } catch (err) {
      console.error(err);
      showAlert("حدث خطأ أثناء حذف الحلقة", "error");
    } finally {
      setDeletingHalaqa(false);
    }
  };

  const handleStartLiveAsAdmin = async (halaqaId: string) => {
    setStartingLiveId(halaqaId);
    try {
      const res = await fetch("/api/live/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ halaqaId }),
      });

      if (res.ok) {
        const data = await res.json();
        window.location.href = `/classroom/${data.session.id}?role=teacher`;
      } else {
        showAlert("فشل بدء الجلسة المباشرة", "error");
      }
    } catch (err) {
      console.error(err);
      showAlert("حدث خطأ أثناء إنشاء الجلسة", "error");
    } finally {
      setStartingLiveId(null);
    }
  };

  useEffect(() => {
    fetchUsersData();
    fetchHalaqatData();
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab");
      if (tab === "HALAQAT" || tab === "USERS" || tab === "POLICIES" || tab === "AUDIT") {
        setActiveTab(tab as any);
      }
    }
  }, []);

  // Quick Action 1: Toggle Active
  const handleToggleActive = async (userId: string, currentStatus: boolean) => {
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "TOGGLE_ACTIVE",
          userId,
          isActive: !currentStatus,
        }),
      });
      if (res.ok) {
        showAlert(
          !currentStatus ? "تم فتح الحساب وتفعيله بنجاح" : "تم غلق وتعطيل الحساب بنجاح",
          "success"
        );
        fetchUsersData();
      } else {
        const err = await res.json();
        showAlert(err.error || "فشل تغيير حالة الحساب", "error");
      }
    } catch (e) {
      showAlert("خطأ في الاتصال بالخادم", "error");
    }
  };

  // Quick Action 2: Change Role
  const handleChangeRole = async (userId: string, newRole: string) => {
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CHANGE_ROLE",
          userId,
          role: newRole,
        }),
      });
      if (res.ok) {
        showAlert("تم تحديث الرتبة بنجاح", "success");
        fetchUsersData();
      } else {
        const err = await res.json();
        showAlert(err.error || "فشل تحديث الرتبة", "error");
      }
    } catch (e) {
      showAlert("خطأ في الاتصال بالخادم", "error");
    }
  };

  // Open Permissions Modal
  const openPermissionsModal = (user: UserItem) => {
    setPermissionsModalUser(user);
    setCurrentEditPerms({ ...user.permissions });
  };

  // Save Permissions Modal
  const handleSavePermissions = async () => {
    if (!permissionsModalUser || !currentEditPerms) return;
    setSavingPerms(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_PERMISSIONS",
          userId: permissionsModalUser.id,
          permissions: currentEditPerms,
        }),
      });
      if (res.ok) {
        showAlert(`تم حفظ وتحديث صلاحيات ${permissionsModalUser.name} بنجاح`, "success");
        setPermissionsModalUser(null);
        fetchUsersData();
      } else {
        const err = await res.json();
        showAlert(err.error || "فشل حفظ الصلاحيات", "error");
      }
    } catch (e) {
      showAlert("خطأ في الاتصال بالخادم", "error");
    } finally {
      setSavingPerms(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (user: UserItem) => {
    setEditModalUser(user);
    setEditFormData({
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      role: user.role,
      password: "",
    });
  };

  // Save Edit User
  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModalUser) return;
    setSavingEdit(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_USER",
          userId: editModalUser.id,
          name: editFormData.name,
          email: editFormData.email,
          phone: editFormData.phone,
          role: editFormData.role,
          password: editFormData.password || undefined,
        }),
      });
      if (res.ok) {
        showAlert("تم حفظ التعديلات بنجاح", "success");
        setEditModalUser(null);
        fetchUsersData();
      } else {
        const err = await res.json();
        showAlert(err.error || "فشل تعديل المستخدم", "error");
      }
    } catch (e) {
      showAlert("خطأ في الاتصال بالخادم", "error");
    } finally {
      setSavingEdit(false);
    }
  };

  // Handle Delete User
  const handleConfirmDelete = async () => {
    if (!deleteModalUser) return;
    setDeletingUser(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "DELETE_USER",
          userId: deleteModalUser.id,
        }),
      });
      if (res.ok) {
        showAlert(`تم حذف المستخدم ${deleteModalUser.name} نهائياً`, "success");
        setDeleteModalUser(null);
        fetchUsersData();
      } else {
        const err = await res.json();
        showAlert(err.error || "فشل حذف المستخدم", "error");
      }
    } catch (e) {
      showAlert("خطأ في الاتصال بالخادم", "error");
    } finally {
      setDeletingUser(false);
    }
  };

  // Handle Create User
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingCreate(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CREATE_USER",
          name: createFormData.name,
          email: createFormData.email,
          phone: createFormData.phone,
          role: createFormData.role,
          password: createFormData.password,
        }),
      });
      if (res.ok) {
        showAlert(`تم إنشاء المستخدم ${createFormData.name} بنجاح`, "success");
        setCreateModalOpen(false);
        setCreateFormData({
          name: "",
          email: "",
          phone: "",
          role: "STUDENT",
          password: "",
        });
        fetchUsersData();
      } else {
        const err = await res.json();
        showAlert(err.error || "فشل إنشاء المستخدم", "error");
      }
    } catch (e) {
      showAlert("خطأ في الاتصال بالخادم", "error");
    } finally {
      setSavingCreate(false);
    }
  };

  // Filtered Users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.phone && u.phone.includes(searchQuery));

    const matchesRole = roleFilter === "ALL" || u.role === roleFilter;
    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "ACTIVE" && u.isActive) ||
      (statusFilter === "INACTIVE" && !u.isActive);

    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* Toast Alert */}
        {alertMsg && (
          <div
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-2xl border text-sm font-bold flex items-center gap-2.5 transition-all duration-300 animate-in fade-in slide-in-from-top-4 ${
              alertMsg.type === "success"
                ? "bg-emerald-900 border-emerald-500 text-emerald-100"
                : "bg-red-900 border-red-500 text-red-100"
            }`}
          >
            {alertMsg.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
            )}
            <span>{alertMsg.text}</span>
          </div>
        )}

        {/* Top Hero Banner */}
        <div className="relative overflow-hidden bg-gradient-to-l from-slate-950 via-slate-900 to-amber-950 text-white p-6 sm:p-8 rounded-3xl border border-amber-500/20 shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold">
                <Shield className="w-3.5 h-3.5" />
                <span>مركز القيادة والتحكم الإداري الكامل</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
                لوحة الإدارة والتحكم في الصلاحيات
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                تحكم مركزي شامل في منصة ورتّل: تعديل بيانات الحسابات، الحذف النهائي والتجميد،
                وفتح وغلق كافة الصلاحيات التعليمية والتنظيمية بدقة متناهية.
              </p>
            </div>

            {/* Header Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <Link
                href="/teacher/dashboard"
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-islamic-800 hover:bg-islamic-700 text-white text-xs font-bold shadow-lg shadow-islamic-950/40 transition active:scale-95 border border-gold-accent/30"
              >
                <Video className="w-4 h-4 text-amber-300" />
                <span>لوحة الحلقات والتعليم</span>
              </Link>

              <Link
                href="/teacher/mushaf"
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition active:scale-95"
              >
                <BookOpen className="w-4 h-4 text-emerald-400" />
                <span>المصحف والتسميع</span>
              </Link>

              <button
                onClick={() => setCreateModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-xs font-bold shadow-lg shadow-emerald-950/40 transition active:scale-95"
              >
                <UserPlus className="w-4 h-4" />
                <span>إضافة مستخدم جديد</span>
              </button>

              <button
                onClick={() => {
                  fetchUsersData();
                  fetchHalaqatData();
                }}
                disabled={refreshing}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition active:scale-95 disabled:opacity-50"
                title="تحديث البيانات"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
                <span>تحديث</span>
              </button>

              <Link
                href="/admin/settings"
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium transition"
              >
                <Settings className="w-3.5 h-3.5 text-amber-400" />
                <span>إعدادات المنصة</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
          <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400">إجمالي الحسابات</span>
              <Users className="w-4 h-4 text-slate-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">
                {stats.totalUsers}
              </span>
              <span className="text-[11px] font-bold text-emerald-600">
                {stats.activeCount} نشط
              </span>
            </div>
            <span className="text-[10px] text-slate-500 block mt-1">مسجلون في المنظومة</span>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400">المعلمون والمقرئون</span>
              <GraduationCap className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
                {stats.teachersCount}
              </span>
              <span className="text-[10px] text-slate-400">شيوخ ومعلمون</span>
            </div>
            <span className="text-[10px] text-emerald-600/80 block mt-1">بصلاحيات تدريس وقفل المصحف</span>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400">الطلاب والطالبات</span>
              <BookOpen className="w-4 h-4 text-amber-500" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-amber-500">
                {stats.studentsCount}
              </span>
              <span className="text-[10px] text-slate-400">حفظ وتسميع</span>
            </div>
            <span className="text-[10px] text-amber-600/80 block mt-1">في مختلف الحلقات</span>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400">الحلقات النشطة</span>
              <CalendarDays className="w-4 h-4 text-purple-500" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-purple-600 dark:text-purple-400">
                {stats.activeHalaqat}
              </span>
              <span className="text-[10px] text-purple-600">حلقة معتمدة</span>
            </div>
            <span className="text-[10px] text-slate-500 block mt-1">فجر ومساء</span>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400">حسابات موقوفة / معطلة</span>
              <ShieldAlert className="w-4 h-4 text-red-500" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className={`text-2xl sm:text-3xl font-black ${stats.inactiveCount > 0 ? "text-red-500" : "text-slate-400"}`}>
                {stats.inactiveCount}
              </span>
              <span className="text-[10px] text-slate-400">مغلقة الصلاحية</span>
            </div>
            <span className="text-[10px] text-slate-500 block mt-1">تم سحب الدخول منها</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab("USERS")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "USERS"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-950/20"
                : "bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>إدارة الحسابات وتخصيص الصلاحيات ({filteredUsers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("HALAQAT")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "HALAQAT"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-950/20"
                : "bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            <CalendarDays className="w-4 h-4" />
            <span>إشراف وإدارة الحلقات والتعليم ({halaqat.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("POLICIES")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "POLICIES"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-950/20"
                : "bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>سياسات الصلاحيات المركزية للمنصة</span>
          </button>

          <button
            onClick={() => setActiveTab("AUDIT")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "AUDIT"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-950/20"
                : "bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>سجل العمليات الإدارية الفوري</span>
          </button>
        </div>

        {/* TAB 1: USERS & PERMISSIONS MANAGEMENT */}
        {activeTab === "USERS" && (
          <div className="space-y-4">
            {/* Filter Controls Bar */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
              {/* Search input */}
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="ابحث بالاسم، البريد أو الهاتف..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl pr-9 pl-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Filter pills */}
              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                {/* Role filter */}
                <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 text-[11px] font-bold">
                  <button
                    onClick={() => setRoleFilter("ALL")}
                    className={`px-2.5 py-1 rounded-lg transition ${
                      roleFilter === "ALL" ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs" : "text-slate-500"
                    }`}
                  >
                    الكل
                  </button>
                  <button
                    onClick={() => setRoleFilter("TEACHER")}
                    className={`px-2.5 py-1 rounded-lg transition ${
                      roleFilter === "TEACHER" ? "bg-emerald-600 text-white shadow-xs" : "text-slate-500"
                    }`}
                  >
                    معلمون
                  </button>
                  <button
                    onClick={() => setRoleFilter("STUDENT")}
                    className={`px-2.5 py-1 rounded-lg transition ${
                      roleFilter === "STUDENT" ? "bg-amber-600 text-white shadow-xs" : "text-slate-500"
                    }`}
                  >
                    طلاب
                  </button>
                  <button
                    onClick={() => setRoleFilter("ADMIN")}
                    className={`px-2.5 py-1 rounded-lg transition ${
                      roleFilter === "ADMIN" ? "bg-purple-600 text-white shadow-xs" : "text-slate-500"
                    }`}
                  >
                    مدراء
                  </button>
                </div>

                {/* Status filter */}
                <select
                  value={statusFilter}
                  onChange={(e: any) => setStatusFilter(e.target.value)}
                  className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold px-3 py-1.5 rounded-xl border-none focus:ring-0"
                >
                  <option value="ALL">جميع الحالات</option>
                  <option value="ACTIVE">النشطة فقط</option>
                  <option value="INACTIVE">المعطلة فقط</option>
                </select>
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800 select-none">
                    <tr>
                      <th className="p-3.5">المستخدم</th>
                      <th className="p-3.5">الرتبة والدور</th>
                      <th className="p-3.5">حالة الحساب</th>
                      <th className="p-3.5">الصلاحيات المفتوحة</th>
                      <th className="p-3.5">رقم الهاتف</th>
                      <th className="p-3.5 text-center">التحكم والإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-12 text-slate-400">
                          لا توجد نتائج مطابقة لبحثك
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => {
                        // Count open permissions
                        const openPermCount = Object.values(u.permissions || {}).filter(Boolean).length;
                        return (
                          <tr
                            key={u.id}
                            className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition ${
                              !u.isActive ? "bg-red-50/30 dark:bg-red-950/10" : ""
                            }`}
                          >
                            {/* User details */}
                            <td className="p-3.5">
                              <div className="flex items-center gap-3">
                                <img
                                  src={
                                    u.avatar ||
                                    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150"
                                  }
                                  alt=""
                                  className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                                />
                                <div>
                                  <span className="font-bold text-slate-900 dark:text-slate-100 text-xs block">
                                    {u.name}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-mono block">
                                    {u.email}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Role Dropdown / Badge */}
                            <td className="p-3.5">
                              <select
                                value={u.role}
                                onChange={(e) => handleChangeRole(u.id, e.target.value)}
                                className={`text-[11px] font-bold px-2 py-1 rounded-lg border transition cursor-pointer ${
                                  u.role === "TEACHER"
                                    ? "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
                                    : u.role === "ADMIN"
                                    ? "bg-purple-50 dark:bg-purple-950/60 border-purple-300 dark:border-purple-800 text-purple-800 dark:text-purple-300"
                                    : "bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300"
                                }`}
                              >
                                <option value="TEACHER">معلم ومقرئ (TEACHER)</option>
                                <option value="STUDENT">طالب تحفيظ (STUDENT)</option>
                                <option value="ADMIN">مدير منصة (ADMIN)</option>
                              </select>
                            </td>

                            {/* Active Switch Toggle */}
                            <td className="p-3.5">
                              <button
                                onClick={() => handleToggleActive(u.id, u.isActive)}
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border transition ${
                                  u.isActive
                                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20"
                                    : "bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-500/20"
                                }`}
                                title={u.isActive ? "انقر لقفل وتعطيل الحساب" : "انقر لفتح وتفعيل الحساب"}
                              >
                                <span
                                  className={`w-2 h-2 rounded-full ${
                                    u.isActive ? "bg-emerald-500" : "bg-red-500"
                                  }`}
                                />
                                <span>{u.isActive ? "مفتوح / نشط" : "مغلق / معطل"}</span>
                              </button>
                            </td>

                            {/* Permissions Summary Button */}
                            <td className="p-3.5">
                              <button
                                onClick={() => openPermissionsModal(u)}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-amber-500/10 hover:border-amber-500/40 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-bold transition group"
                                title="عرض وتعديل الصلاحيات الفردية"
                              >
                                <Key className="w-3 h-3 text-amber-500 group-hover:rotate-45 transition" />
                                <span>{openPermCount} صلاحية مفعلة</span>
                              </button>
                            </td>

                            {/* Phone */}
                            <td className="p-3.5 font-mono text-[11px] text-slate-500">
                              {u.phone || "---"}
                            </td>

                            {/* Actions Column: Edit, Permissions, Delete */}
                            <td className="p-3.5">
                              <div className="flex items-center justify-center gap-1.5">
                                {/* 1. Permissions button */}
                                <button
                                  onClick={() => openPermissionsModal(u)}
                                  className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-800/60 transition"
                                  title="فتح وغلق الصلاحيات"
                                >
                                  <Key className="w-3.5 h-3.5" />
                                </button>

                                {/* 2. Edit button */}
                                <button
                                  onClick={() => openEditModal(u)}
                                  className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800/60 transition"
                                  title="تعديل بيانات المستخدم"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>

                                {/* 3. Delete button */}
                                <button
                                  onClick={() => setDeleteModalUser(u)}
                                  className="p-1.5 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/60 border border-red-200 dark:border-red-800/60 transition"
                                  title="حذف المستخدم نهائياً"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB: HALAQAT & EDUCATION SUPERVISION */}
        {activeTab === "HALAQAT" && (
          <div className="space-y-6">
            {/* Top Info & Quick Actions Banner */}
            <div className="bg-gradient-to-r from-emerald-900 via-islamic-900 to-slate-900 text-white p-6 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-emerald-500/20">
              <div>
                <span className="text-amber-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 mb-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  الإشراف المركزي والتحكم بالحلقات والمعلمين
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  إدارة الحلقات والتعليم المباشر
                </h2>
                <p className="text-slate-300 text-xs mt-1 max-w-xl">
                  صلاحيات كاملة للمدير: إنشاء الحلقات، تعيين المعلمين، تعديل المواعيد، حذف الحلقات، وبدء الجلسات المباشرة كمشرف عام.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  onClick={handleOpenCreateHalaqa}
                  className="flex items-center gap-2 bg-gradient-to-r from-amber-400 to-gold-accent hover:from-amber-300 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs shadow-lg transition active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة حلقة جديدة</span>
                </button>

                <Link
                  href="/teacher/mushaf"
                  className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white font-bold px-3.5 py-2.5 rounded-xl border border-white/20 text-xs transition"
                >
                  <BookOpen className="w-4 h-4 text-emerald-400" />
                  <span>المصحف والتسميع</span>
                </Link>

                <Link
                  href="/teacher/students"
                  className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white font-bold px-3.5 py-2.5 rounded-xl border border-white/20 text-xs transition"
                >
                  <Users className="w-4 h-4 text-amber-300" />
                  <span>إدارة الطلاب والطلبات</span>
                </Link>

                <Link
                  href="/teacher/evaluations"
                  className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white font-bold px-3.5 py-2.5 rounded-xl border border-white/20 text-xs transition"
                >
                  <CheckCircle2 className="w-4 h-4 text-purple-300" />
                  <span>سجل الحفظ والتقييم</span>
                </Link>
              </div>
            </div>

            {/* Halaqat Grid */}
            {loadingHalaqat ? (
              <div className="py-16 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
                جارٍ تحميل بيانات الحلقات والمعلمين...
              </div>
            ) : halaqat.length === 0 ? (
              <div className="py-16 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
                لا توجد حلقات مسجلة حالياً. اضغط على "إضافة حلقة جديدة" لإنشاء حلقة.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {halaqat.map((h) => {
                  const isLive = Boolean(h.isLiveNow || h.currentLiveSessionId);

                  return (
                    <div
                      key={h.id}
                      className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm flex flex-col justify-between space-y-4 hover:border-emerald-500/40 transition group"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-1 flex-wrap">
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {h.level}
                          </span>

                          <div className="flex items-center gap-1.5">
                            {isLive && (
                              <span className="text-[10px] font-bold text-red-500 bg-red-50 dark:bg-red-950/40 px-2 py-0.5 rounded-full animate-pulse flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                جلسة مباشرة
                              </span>
                            )}
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                h.status === "ACTIVE"
                                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
                                  : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                              }`}
                            >
                              {h.status === "ACTIVE" ? "نشطة" : h.status}
                            </span>
                          </div>
                        </div>

                        <div>
                          <h3 className="font-black text-base text-slate-900 dark:text-slate-100">
                            {h.name}
                          </h3>
                          <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                            {h.description || "حلقة تعليمية مخصصة للقرآن والعلوم الشرعية."}
                          </p>
                        </div>

                        <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-100 dark:border-slate-800">
                          <div className="flex justify-between">
                            <span className="text-slate-400">المعلم المقرئ:</span>
                            <span className="font-bold text-slate-900 dark:text-slate-100">
                              {h.teacher?.user?.name || "معلم ومقرئ الحلقة"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">الأيام:</span>
                            <span className="font-semibold">{h.scheduleDays}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">الوقت:</span>
                            <span className="font-mono font-semibold">
                              {h.startTime} - {h.endTime}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">الطلاب المسجلين:</span>
                            <span className="font-bold text-emerald-600">
                              {h.enrollments?.length || 0} / {h.capacity || 25} طالب
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Admin Full Control Actions */}
                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                        <button
                          onClick={() => handleStartLiveAsAdmin(h.id)}
                          disabled={startingLiveId === h.id}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-gradient-to-r from-amber-400 to-gold-accent hover:from-amber-300 text-slate-950 font-black text-xs py-2 rounded-xl shadow-xs transition active:scale-95 disabled:opacity-50"
                          title="بدء أو دخول البث المباشر كمدير عام"
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>{startingLiveId === h.id ? "جارٍ الدخول..." : "دخول كمدير مشرف 🎥"}</span>
                        </button>

                        <button
                          onClick={() => handleOpenEditHalaqa(h)}
                          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition"
                          title="تعديل بيانات الحلقة"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => setDeleteHalaqaItem(h)}
                          className="p-2 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/50 text-red-600 transition"
                          title="حذف الحلقة نهائياً"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PLATFORM CENTRAL POLICIES */}
        {activeTab === "POLICIES" && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                سياسات وقواعد الصلاحيات العامة على مستوى النظام
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                تحديد القواعد الافتراضية المطبقة فور تسجيل المستخدمين أو إنشاء الحلقات.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-start justify-between gap-4">
                <div>
                  <span className="font-bold text-xs text-slate-900 dark:text-slate-100 block">
                    حرية تصفح المصحف للطالب خارج وضع التسميع
                  </span>
                  <span className="text-[11px] text-slate-400 block mt-1">
                    السماح لجميع الطلاب بتقليب صفحات المصحف واستخدام الأسهم العلوية والسفلية بحرية أثناء القراءة الذاتية.
                  </span>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 shrink-0">
                  مفعل دائماً
                </span>
              </div>

              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-start justify-between gap-4">
                <div>
                  <span className="font-bold text-xs text-slate-900 dark:text-slate-100 block">
                    قفل التسميع الإجباري عبر الخادم (Tasmee' Lock Curtain)
                  </span>
                  <span className="text-[11px] text-slate-400 block mt-1">
                    حجب مصحف الطالب تماماً وعرض ستارة مغلقة عند تفعيل الشيخ لوضع التسميع لمنع النظر للمصحف.
                  </span>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 shrink-0">
                  مفعل للشيخ
                </span>
              </div>

              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-start justify-between gap-4">
                <div>
                  <span className="font-bold text-xs text-slate-900 dark:text-slate-100 block">
                    السماح بالتسجيل الذاتي للطلاب
                  </span>
                  <span className="text-[11px] text-slate-400 block mt-1">
                    تمكين الزوار من إنشاء حسابات جديدة دون الحاجة لإضافتهم مسبقاً من لوحة الإدارة.
                  </span>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 shrink-0">
                  مفتوح
                </span>
              </div>

              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-start justify-between gap-4">
                <div>
                  <span className="font-bold text-xs text-slate-900 dark:text-slate-100 block">
                    صلاحية تنزيل تسجيلات الحلقات
                  </span>
                  <span className="text-[11px] text-slate-400 block mt-1">
                    السماح للطالب بتحميل الفيديو أو الصوت للجلسة المباشرة لمراجعتها دون اتصال.
                  </span>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 shrink-0">
                  مشروط بالمعلم
                </span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: AUDIT LOGS */}
        {activeTab === "AUDIT" && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-amber-500" />
                  سجل العمليات الإدارية الحية وتغييرات الصلاحيات
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  توثيق أمني لكافة عمليات التعديل، الحذف، وفتح وإغلاق الصلاحيات.
                </p>
              </div>

              <Link
                href="/admin/audit"
                className="text-xs font-bold text-emerald-600 hover:underline flex items-center gap-1"
              >
                <span>السجل الكامل</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-2.5">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 font-mono font-bold text-[10px]">
                    LIVE_UPDATE
                  </span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    تفعيل الصلاحيات والتنقل الحر لمصحف الطالب
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">الآن</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 font-mono font-bold text-[10px]">
                    PERMISSION_SYNC
                  </span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    مزامنة حزم الصلاحيات على مستوى الخادم لجميع الحسابات
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">منذ دقائق</span>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* MODAL 1: GRANULAR PERMISSIONS MODAL (فتح وغلق الصلاحيات)     */}
        {/* ============================================================ */}
        {permissionsModalUser && currentEditPerms && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
              {/* Modal Header */}
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                    <Key className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-slate-900 dark:text-slate-100">
                      إدارة صلاحيات المستخدم: {permissionsModalUser.name}
                    </h2>
                    <span className="text-xs text-slate-400">
                      {permissionsModalUser.email} • ({permissionsModalUser.role})
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setPermissionsModalUser(null)}
                  className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body: Permissions List */}
              <div className="p-6 overflow-y-auto space-y-6 text-xs">
                {/* 1. Account & Login Section */}
                <div className="space-y-3">
                  <h3 className="font-bold text-slate-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-amber-500" />
                    <span>صلاحيات الدخول والحساب</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Can Login */}
                    <div
                      onClick={() =>
                        setCurrentEditPerms({
                          ...currentEditPerms,
                          canLogin: !currentEditPerms.canLogin,
                        })
                      }
                      className={`p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between select-none ${
                        currentEditPerms.canLogin
                          ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-950 dark:text-emerald-200"
                          : "bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 opacity-60"
                      }`}
                    >
                      <div>
                        <span className="font-bold block text-xs">تسجيل الدخول للمنصة</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          فتح أو غلق الدخول للحساب
                        </span>
                      </div>
                      <div
                        className={`w-10 h-6 rounded-full transition-colors flex items-center p-1 ${
                          currentEditPerms.canLogin ? "bg-emerald-600 justify-end" : "bg-slate-300 dark:bg-slate-700 justify-start"
                        }`}
                      >
                        <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
                      </div>
                    </div>

                    {/* Can Access Admin */}
                    <div
                      onClick={() =>
                        setCurrentEditPerms({
                          ...currentEditPerms,
                          canAccessAdmin: !currentEditPerms.canAccessAdmin,
                        })
                      }
                      className={`p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between select-none ${
                        currentEditPerms.canAccessAdmin
                          ? "bg-purple-500/10 border-purple-500/40 text-purple-950 dark:text-purple-200"
                          : "bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 opacity-60"
                      }`}
                    >
                      <div>
                        <span className="font-bold block text-xs">صلاحية لوحة الإدارة</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          منح وصول المدير العام
                        </span>
                      </div>
                      <div
                        className={`w-10 h-6 rounded-full transition-colors flex items-center p-1 ${
                          currentEditPerms.canAccessAdmin ? "bg-purple-600 justify-end" : "bg-slate-300 dark:bg-slate-700 justify-start"
                        }`}
                      >
                        <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Teacher & Educational Controls */}
                <div className="space-y-3">
                  <h3 className="font-bold text-slate-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-emerald-500" />
                    <span>صلاحيات المعلم والتدريس والتسميع</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Can Create Halaqat */}
                    <div
                      onClick={() =>
                        setCurrentEditPerms({
                          ...currentEditPerms,
                          canCreateHalaqat: !currentEditPerms.canCreateHalaqat,
                        })
                      }
                      className={`p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between select-none ${
                        currentEditPerms.canCreateHalaqat
                          ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-950 dark:text-emerald-200"
                          : "bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 opacity-60"
                      }`}
                    >
                      <div>
                        <span className="font-bold block text-xs">إنشاء وإدارة الحلقات</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          إضافة حلقات وجداول أسبوعية
                        </span>
                      </div>
                      <div
                        className={`w-10 h-6 rounded-full transition-colors flex items-center p-1 ${
                          currentEditPerms.canCreateHalaqat ? "bg-emerald-600 justify-end" : "bg-slate-300 dark:bg-slate-700 justify-start"
                        }`}
                      >
                        <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
                      </div>
                    </div>

                    {/* Can Lock Mushaf (Tasmee') */}
                    <div
                      onClick={() =>
                        setCurrentEditPerms({
                          ...currentEditPerms,
                          canLockMushaf: !currentEditPerms.canLockMushaf,
                        })
                      }
                      className={`p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between select-none ${
                        currentEditPerms.canLockMushaf
                          ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-950 dark:text-emerald-200"
                          : "bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 opacity-60"
                      }`}
                    >
                      <div>
                        <span className="font-bold block text-xs">قفل المصحف أثناء التسميع</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          حجب المصحف عن الطالب إجبارياً
                        </span>
                      </div>
                      <div
                        className={`w-10 h-6 rounded-full transition-colors flex items-center p-1 ${
                          currentEditPerms.canLockMushaf ? "bg-emerald-600 justify-end" : "bg-slate-300 dark:bg-slate-700 justify-start"
                        }`}
                      >
                        <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
                      </div>
                    </div>

                    {/* Can Grade Students */}
                    <div
                      onClick={() =>
                        setCurrentEditPerms({
                          ...currentEditPerms,
                          canGradeStudents: !currentEditPerms.canGradeStudents,
                        })
                      }
                      className={`p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between select-none ${
                        currentEditPerms.canGradeStudents
                          ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-950 dark:text-emerald-200"
                          : "bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 opacity-60"
                      }`}
                    >
                      <div>
                        <span className="font-bold block text-xs">تقييم الطلاب ورصد الدرجات</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          رصد درجات الحفظ والتجويد
                        </span>
                      </div>
                      <div
                        className={`w-10 h-6 rounded-full transition-colors flex items-center p-1 ${
                          currentEditPerms.canGradeStudents ? "bg-emerald-600 justify-end" : "bg-slate-300 dark:bg-slate-700 justify-start"
                        }`}
                      >
                        <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
                      </div>
                    </div>

                    {/* Can Record Sessions */}
                    <div
                      onClick={() =>
                        setCurrentEditPerms({
                          ...currentEditPerms,
                          canRecordSessions: !currentEditPerms.canRecordSessions,
                        })
                      }
                      className={`p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between select-none ${
                        currentEditPerms.canRecordSessions
                          ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-950 dark:text-emerald-200"
                          : "bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 opacity-60"
                      }`}
                    >
                      <div>
                        <span className="font-bold block text-xs">تسجيل الجلسات المباشرة</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          حفظ التسجيلات في المكتبة
                        </span>
                      </div>
                      <div
                        className={`w-10 h-6 rounded-full transition-colors flex items-center p-1 ${
                          currentEditPerms.canRecordSessions ? "bg-emerald-600 justify-end" : "bg-slate-300 dark:bg-slate-700 justify-start"
                        }`}
                      >
                        <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Student & Mushaf Controls */}
                <div className="space-y-3">
                  <h3 className="font-bold text-slate-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                    <span>صلاحيات الطالب والمصحف الشريف</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Allow Free Mushaf Navigation */}
                    <div
                      onClick={() =>
                        setCurrentEditPerms({
                          ...currentEditPerms,
                          allowFreeMushaf: !currentEditPerms.allowFreeMushaf,
                        })
                      }
                      className={`p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between select-none ${
                        currentEditPerms.allowFreeMushaf
                          ? "bg-blue-500/10 border-blue-500/40 text-blue-950 dark:text-blue-200"
                          : "bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 opacity-60"
                      }`}
                    >
                      <div>
                        <span className="font-bold block text-xs">التصفح الحر للمصحف</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          تقليب وتصفح المصحف بالكامل
                        </span>
                      </div>
                      <div
                        className={`w-10 h-6 rounded-full transition-colors flex items-center p-1 ${
                          currentEditPerms.allowFreeMushaf ? "bg-blue-600 justify-end" : "bg-slate-300 dark:bg-slate-700 justify-start"
                        }`}
                      >
                        <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
                      </div>
                    </div>

                    {/* Can Join Halaqat */}
                    <div
                      onClick={() =>
                        setCurrentEditPerms({
                          ...currentEditPerms,
                          canJoinHalaqat: !currentEditPerms.canJoinHalaqat,
                        })
                      }
                      className={`p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between select-none ${
                        currentEditPerms.canJoinHalaqat
                          ? "bg-blue-500/10 border-blue-500/40 text-blue-950 dark:text-blue-200"
                          : "bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 opacity-60"
                      }`}
                    >
                      <div>
                        <span className="font-bold block text-xs">طلب الانضمام للحلقات</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          إرسال طلبات التسجيل للحلقات
                        </span>
                      </div>
                      <div
                        className={`w-10 h-6 rounded-full transition-colors flex items-center p-1 ${
                          currentEditPerms.canJoinHalaqat ? "bg-blue-600 justify-end" : "bg-slate-300 dark:bg-slate-700 justify-start"
                        }`}
                      >
                        <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
                      </div>
                    </div>

                    {/* Can Submit Assignments */}
                    <div
                      onClick={() =>
                        setCurrentEditPerms({
                          ...currentEditPerms,
                          canSubmitAssignments: !currentEditPerms.canSubmitAssignments,
                        })
                      }
                      className={`p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between select-none ${
                        currentEditPerms.canSubmitAssignments
                          ? "bg-blue-500/10 border-blue-500/40 text-blue-950 dark:text-blue-200"
                          : "bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 opacity-60"
                      }`}
                    >
                      <div>
                        <span className="font-bold block text-xs">تسليم الواجبات والتسجيلات</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          رفع التسميع الصوتي والتكليفات
                        </span>
                      </div>
                      <div
                        className={`w-10 h-6 rounded-full transition-colors flex items-center p-1 ${
                          currentEditPerms.canSubmitAssignments ? "bg-blue-600 justify-end" : "bg-slate-300 dark:bg-slate-700 justify-start"
                        }`}
                      >
                        <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
                      </div>
                    </div>

                    {/* Can Download Recordings */}
                    <div
                      onClick={() =>
                        setCurrentEditPerms({
                          ...currentEditPerms,
                          canDownloadRecordings: !currentEditPerms.canDownloadRecordings,
                        })
                      }
                      className={`p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between select-none ${
                        currentEditPerms.canDownloadRecordings
                          ? "bg-blue-500/10 border-blue-500/40 text-blue-950 dark:text-blue-200"
                          : "bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 opacity-60"
                      }`}
                    >
                      <div>
                        <span className="font-bold block text-xs">تحميل تسجيلات الحلقات</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          تنزيل الدروس للمراجعة دون إنترنت
                        </span>
                      </div>
                      <div
                        className={`w-10 h-6 rounded-full transition-colors flex items-center p-1 ${
                          currentEditPerms.canDownloadRecordings ? "bg-blue-600 justify-end" : "bg-slate-300 dark:bg-slate-700 justify-start"
                        }`}
                      >
                        <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick helpers: Open All / Revoke All */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const opened: any = {};
                        Object.keys(currentEditPerms).forEach((k) => (opened[k] = true));
                        setCurrentEditPerms(opened);
                      }}
                      className="text-[11px] font-bold text-emerald-600 hover:underline"
                    >
                      ✓ فتح كافة الصلاحيات
                    </button>
                    <span className="text-slate-300">•</span>
                    <button
                      type="button"
                      onClick={() => {
                        const closed: any = {};
                        Object.keys(currentEditPerms).forEach((k) => (closed[k] = false));
                        closed.canLogin = true;
                        setCurrentEditPerms(closed);
                      }}
                      className="text-[11px] font-bold text-slate-500 hover:underline"
                    >
                      ✕ إغلاق الصلاحيات الإضافية
                    </button>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5 bg-slate-50 dark:bg-slate-800/40">
                <button
                  type="button"
                  onClick={() => setPermissionsModalUser(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  disabled={savingPerms}
                  onClick={handleSavePermissions}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition disabled:opacity-50"
                >
                  {savingPerms ? "جاري الحفظ..." : "حفظ الصلاحيات"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* MODAL 2: EDIT USER MODAL (تعديل كامل بيانات المستخدم)        */}
        {/* ============================================================ */}
        {editModalUser && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
              <form onSubmit={handleSaveEditUser}>
                {/* Header */}
                <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
                      <Edit className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-black text-slate-900 dark:text-slate-100">
                        تعديل بيانات المستخدم
                      </h2>
                      <span className="text-xs text-slate-400">{editModalUser.email}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setEditModalUser(null)}
                    className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Form fields */}
                <div className="p-6 space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      الاسم الكامل:
                    </label>
                    <input
                      type="text"
                      required
                      value={editFormData.name}
                      onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      البريد الإلكتروني:
                    </label>
                    <input
                      type="email"
                      required
                      value={editFormData.email}
                      onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 text-left font-mono"
                      dir="ltr"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        رقم الهاتف:
                      </label>
                      <input
                        type="text"
                        value={editFormData.phone}
                        onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 text-left"
                        dir="ltr"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        الرتبة والدور:
                      </label>
                      <select
                        value={editFormData.role}
                        onChange={(e: any) => setEditFormData({ ...editFormData, role: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="TEACHER">معلم ومقرئ (TEACHER)</option>
                        <option value="STUDENT">طالب تحفيظ (STUDENT)</option>
                        <option value="ADMIN">مدير منصة (ADMIN)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      كلمة مرور جديدة (اتركها فارغة إذا لم ترغب بتغييرها):
                    </label>
                    <input
                      type="password"
                      placeholder="كلمة مرور جديدة..."
                      value={editFormData.password}
                      onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 text-left"
                      dir="ltr"
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5 bg-slate-50 dark:bg-slate-800/40">
                  <button
                    type="button"
                    onClick={() => setEditModalUser(null)}
                    className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={savingEdit}
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md transition disabled:opacity-50"
                  >
                    {savingEdit ? "جاري الحفظ..." : "حفظ التعديلات"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* MODAL 3: DELETE USER MODAL (حذف المستخدم نهائياً)            */}
        {/* ============================================================ */}
        {deleteModalUser && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-red-500/30 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
              <div className="p-6 text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-950/60 border border-red-200 dark:border-red-800 flex items-center justify-center mx-auto text-red-600">
                  <AlertTriangle className="w-7 h-7" />
                </div>

                <div>
                  <h3 className="text-lg font-black text-slate-950 dark:text-white">
                    تأكيد حذف حساب المستخدم
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    هل أنت متأكد تماماً من رغبتك في حذف الحساب التابع لـ{" "}
                    <strong className="text-red-600 dark:text-red-400">
                      «{deleteModalUser.name}»
                    </strong>
                    ؟ سيؤدي هذا الإجراء إلى مسح الحساب وبياناته نهائياً.
                  </p>
                </div>

                <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-xl border border-red-200 dark:border-red-900/40 text-[11px] text-red-700 dark:text-red-300 text-right space-y-1">
                  <span className="font-bold block">💡 نصيحة المدير:</span>
                  <p>
                    إذا كنت تريد فقط منع المستخدم من الدخول دون فقد سجلاته القديمة، يمكنك استخدام خيار{" "}
                    <strong>«تعطيل الحساب»</strong> بدلاً من الحذف النهائي.
                  </p>
                </div>

                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setDeleteModalUser(null)}
                    className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    إلغاء التراجع
                  </button>

                  <button
                    type="button"
                    disabled={deletingUser}
                    onClick={handleConfirmDelete}
                    className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-md shadow-red-950/30 transition disabled:opacity-50"
                  >
                    {deletingUser ? "جاري الحذف..." : "نعم، احذف الحساب نهائياً"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* MODAL 4: CREATE USER MODAL (إضافة مستخدم جديد)              */}
        {/* ============================================================ */}
        {createModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
              <form onSubmit={handleCreateUser}>
                {/* Header */}
                <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                      <UserPlus className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-black text-slate-900 dark:text-slate-100">
                        إضافة مستخدم جديد إلى المنصة
                      </h2>
                      <span className="text-xs text-slate-400">
                        إنشاء حساب جديد وتعيين الصلاحيات الأولية
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setCreateModalOpen(false)}
                    className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Form fields */}
                <div className="p-6 space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      الاسم الكامل: <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: الشيخ عبد الباسط أو أحمد علي"
                      value={createFormData.name}
                      onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      البريد الإلكتروني: <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="user@quran.com"
                      value={createFormData.email}
                      onChange={(e) => setCreateFormData({ ...createFormData, email: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 text-left font-mono"
                      dir="ltr"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        كلمة المرور: <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={createFormData.password}
                        onChange={(e) => setCreateFormData({ ...createFormData, password: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 text-left"
                        dir="ltr"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        الرتبة والدور: <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={createFormData.role}
                        onChange={(e: any) => setCreateFormData({ ...createFormData, role: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="TEACHER">معلم ومقرئ (TEACHER)</option>
                        <option value="STUDENT">طالب تحفيظ (STUDENT)</option>
                        <option value="ADMIN">مدير منصة (ADMIN)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      رقم الهاتف (اختياري):
                    </label>
                    <input
                      type="text"
                      placeholder="+966500000000"
                      value={createFormData.phone}
                      onChange={(e) => setCreateFormData({ ...createFormData, phone: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 text-left"
                      dir="ltr"
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5 bg-slate-50 dark:bg-slate-800/40">
                  <button
                    type="button"
                    onClick={() => setCreateModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={savingCreate}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition disabled:opacity-50"
                  >
                    {savingCreate ? "جاري الإنشاء..." : "إنشاء المستخدم"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* MODAL 4: ADMIN HALAQA CREATE / EDIT MODAL                     */}
        {/* ============================================================ */}
        {halaqaModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                    <CalendarDays className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-slate-900 dark:text-slate-100">
                      {editingHalaqaId ? "تعديل بيانات الحلقة القرآنية" : "إضافة حلقة قرآنية جديدة"}
                    </h2>
                    <span className="text-xs text-slate-400">
                      تحكم كامل للمدير العام في الحلقات والمواعيد
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setHalaqaModalOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveHalaqa} className="p-6 space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    اسم الحلقة: <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: حلقة الفجر المباركة"
                    value={halaqaFormData.name}
                    onChange={(e) => setHalaqaFormData({ ...halaqaFormData, name: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    الوصف والأهداف:
                  </label>
                  <textarea
                    rows={2}
                    placeholder="وصف مختصر للحلقة..."
                    value={halaqaFormData.description}
                    onChange={(e) => setHalaqaFormData({ ...halaqaFormData, description: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      المستوى:
                    </label>
                    <select
                      value={halaqaFormData.level}
                      onChange={(e) => setHalaqaFormData({ ...halaqaFormData, level: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="مبتدئ">مبتدئ</option>
                      <option value="متوسط">متوسط</option>
                      <option value="متقدم (حفظ وتثبيت)">متقدم (حفظ وتثبيت)</option>
                      <option value="إجازة وقراءات">إجازة وقراءات</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      الطاقة الاستيعابية:
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={halaqaFormData.capacity}
                      onChange={(e) => setHalaqaFormData({ ...halaqaFormData, capacity: Number(e.target.value) })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    أيام الانعقاد:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="السبت, الإثنين, الأربعاء"
                    value={halaqaFormData.scheduleDays}
                    onChange={(e) => setHalaqaFormData({ ...halaqaFormData, scheduleDays: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      وقت البدء:
                    </label>
                    <input
                      type="time"
                      required
                      value={halaqaFormData.startTime}
                      onChange={(e) => setHalaqaFormData({ ...halaqaFormData, startTime: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      وقت الانتهاء:
                    </label>
                    <input
                      type="time"
                      required
                      value={halaqaFormData.endTime}
                      onChange={(e) => setHalaqaFormData({ ...halaqaFormData, endTime: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    حالة الحلقة:
                  </label>
                  <select
                    value={halaqaFormData.status}
                    onChange={(e) => setHalaqaFormData({ ...halaqaFormData, status: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="ACTIVE">نشطة ومجدولة (ACTIVE)</option>
                    <option value="UPCOMING">قريبة الانعقاد (UPCOMING)</option>
                    <option value="PAUSED">مؤجلة مؤقتاً (PAUSED)</option>
                    <option value="COMPLETED">مكتملة (COMPLETED)</option>
                  </select>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setHalaqaModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={savingHalaqa}
                    className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow-md transition disabled:opacity-50"
                  >
                    {savingHalaqa ? "جاري الحفظ..." : editingHalaqaId ? "حفظ التعديلات" : "إنشاء الحلقة"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* MODAL 5: DELETE HALAQA CONFIRMATION                          */}
        {/* ============================================================ */}
        {deleteHalaqaItem && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-red-500/30 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden p-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 mx-auto flex items-center justify-center">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                تأكيد حذف حلقة: "{deleteHalaqaItem.name}"
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                هل أنت متأكد من حذف هذه الحلقة نهائياً من النظام؟ سيتم إلغاء المواعيد المرتبطة بها وسجل الحضور. هذا الإجراء لا يمكن التراجع عنه.
              </p>
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteHalaqaItem(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleDeleteHalaqa}
                  disabled={deletingHalaqa}
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-md transition disabled:opacity-50"
                >
                  {deletingHalaqa ? "جاري الحذف..." : "نعم، حذف الحلقة نهائياً"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
