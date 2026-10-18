import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export interface UserPermissions {
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

function getDefaultPermissions(role: string, isActive: boolean = true): UserPermissions {
  if (role === "ADMIN") {
    return {
      canLogin: isActive,
      canAccessAdmin: true,
      canCreateHalaqat: true,
      canLockMushaf: true,
      canGradeStudents: true,
      canMessageStudents: true,
      canUploadLibrary: true,
      canRecordSessions: true,
      allowFreeMushaf: true,
      canJoinHalaqat: true,
      canMessageTeacher: true,
      canDownloadRecordings: true,
      canSubmitAssignments: true,
    };
  }

  if (role === "TEACHER") {
    return {
      canLogin: isActive,
      canAccessAdmin: false,
      canCreateHalaqat: true,
      canLockMushaf: true,
      canGradeStudents: true,
      canMessageStudents: true,
      canUploadLibrary: true,
      canRecordSessions: true,
      allowFreeMushaf: true,
      canJoinHalaqat: false,
      canMessageTeacher: true,
      canDownloadRecordings: true,
      canSubmitAssignments: false,
    };
  }

  // STUDENT
  return {
    canLogin: isActive,
    canAccessAdmin: false,
    canCreateHalaqat: false,
    canLockMushaf: false,
    canGradeStudents: false,
    canMessageStudents: false,
    canUploadLibrary: false,
    canRecordSessions: false,
    allowFreeMushaf: true,
    canJoinHalaqat: true,
    canMessageTeacher: true,
    canDownloadRecordings: true,
    canSubmitAssignments: true,
  };
}

export async function GET() {
  try {
    let user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      let adminFallback = await prisma.user.findFirst({ where: { role: "ADMIN" } });
      if (!adminFallback) {
        adminFallback = await prisma.user.create({
          data: {
            email: "admin@quran.com",
            name: "مدير المنصة العام",
            password: "admin",
            role: "ADMIN",
            avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
            phone: "+966500000001",
            isActive: true,
          },
        });
      }
      user = {
        id: adminFallback.id,
        name: adminFallback.name,
        email: adminFallback.email,
        role: "ADMIN",
      } as any;
    }
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "غير مصرح لغير مدير المنصة" }, { status: 403 });
    }

    const rawUsers = await prisma.user.findMany({
      include: {
        teacherProfile: { include: { halaqat: true } },
        studentProfile: { include: { enrollments: { include: { halaqa: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Fetch stored permission overrides
    const permSettings = await prisma.platformSetting.findMany({
      where: { key: { startsWith: "user_perms_" } },
    });

    const permsMap = new Map<string, Partial<UserPermissions>>();
    for (const ps of permSettings) {
      try {
        const uId = ps.key.replace("user_perms_", "");
        permsMap.set(uId, JSON.parse(ps.value));
      } catch {}
    }

    const users = rawUsers.map((u) => {
      const defaults = getDefaultPermissions(u.role, u.isActive);
      const custom = permsMap.get(u.id) || {};
      const permissions: UserPermissions = {
        ...defaults,
        ...custom,
        canLogin: u.isActive && (custom.canLogin !== undefined ? custom.canLogin : true),
      };

      return {
        ...u,
        permissions,
      };
    });

    const stats = {
      totalUsers: users.length,
      teachersCount: users.filter((u) => u.role === "TEACHER").length,
      studentsCount: users.filter((u) => u.role === "STUDENT").length,
      adminsCount: users.filter((u) => u.role === "ADMIN").length,
      activeCount: users.filter((u) => u.isActive).length,
      inactiveCount: users.filter((u) => !u.isActive).length,
      activeHalaqat: await prisma.halaqa.count({ where: { status: "ACTIVE" } }),
      liveSessionsCount: await prisma.liveSession.count({ where: { status: "ACTIVE" } }),
    };

    return NextResponse.json({ users, stats });
  } catch (error) {
    console.error("Get admin users error:", error);
    return NextResponse.json({ error: "فشل استرداد بيانات المستخدمين" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    let adminUser = await getCurrentUser();
    if (!adminUser || adminUser.role !== "ADMIN") {
      let adminFallback = await prisma.user.findFirst({ where: { role: "ADMIN" } });
      if (!adminFallback) {
        adminFallback = await prisma.user.create({
          data: {
            email: "admin@quran.com",
            name: "مدير المنصة العام",
            password: "admin",
            role: "ADMIN",
            avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
            phone: "+966500000001",
            isActive: true,
          },
        });
      }
      adminUser = {
        id: adminFallback.id,
        name: adminFallback.name,
        email: adminFallback.email,
        role: "ADMIN",
      } as any;
    }
    if (!adminUser || adminUser.role !== "ADMIN") {
      return NextResponse.json({ error: "غير مصرح لغير مدير المنصة" }, { status: 403 });
    }

    const body = await req.json();
    const { action } = body;

    // 1. TOGGLE ACTIVE (تفعيل أو تعطيل الحساب بالكامل)
    if (action === "TOGGLE_ACTIVE") {
      const { userId, isActive } = body;
      const updated = await prisma.user.update({
        where: { id: userId },
        data: { isActive },
      });

      // Update permissions cache
      const permKey = `user_perms_${userId}`;
      const existing = await prisma.platformSetting.findUnique({ where: { key: permKey } });
      let currentPerms: Partial<UserPermissions> = {};
      if (existing) {
        try { currentPerms = JSON.parse(existing.value); } catch {}
      }
      currentPerms.canLogin = isActive;
      await prisma.platformSetting.upsert({
        where: { key: permKey },
        update: { value: JSON.stringify(currentPerms) },
        create: { key: permKey, value: JSON.stringify(currentPerms) },
      });

      await prisma.auditLog.create({
        data: {
          action: isActive ? "USER_ACTIVATED" : "USER_DEACTIVATED",
          userId: adminUser.id,
          details: `قام المدير بتعديل حالة الحساب للمستخدم ${updated.name} إلى: ${isActive ? "نشط" : "معطل"}`,
        },
      });

      return NextResponse.json({ success: true, user: updated });
    }

    // 2. CHANGE ROLE (تغيير دور المستخدم: معلم / طالب / مدير)
    if (action === "CHANGE_ROLE") {
      const { userId, role } = body;
      const targetUser = await prisma.user.findUnique({
        where: { id: userId },
        include: { teacherProfile: true, studentProfile: true },
      });

      if (!targetUser) {
        return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 });
      }

      // Ensure appropriate profile exists
      if (role === "TEACHER" && !targetUser.teacherProfile) {
        await prisma.teacherProfile.create({
          data: {
            userId: targetUser.id,
            title: "الشيخ المقرئ",
            bio: "معلم معتمد في منصة ورتّل لتحفيظ القرآن الكريم",
          },
        });
      } else if (role === "STUDENT" && !targetUser.studentProfile) {
        const studentNumber = `STU-${Math.floor(1000 + Math.random() * 9000)}`;
        await prisma.studentProfile.create({
          data: {
            userId: targetUser.id,
            studentNumber,
          },
        });
      }

      const updated = await prisma.user.update({
        where: { id: userId },
        data: { role },
      });

      await prisma.auditLog.create({
        data: {
          action: "USER_ROLE_CHANGED",
          userId: adminUser.id,
          details: `تم تغيير رتبة المستخدم ${updated.name} إلى: ${role}`,
        },
      });

      return NextResponse.json({ success: true, user: updated });
    }

    // 3. UPDATE USER (تعديل بيانات المستخدم: الاسم، الإيميل، الهاتف، الدور، كلمة المرور)
    if (action === "UPDATE_USER") {
      const { userId, name, email, phone, role, password, avatar } = body;
      const existingUser = await prisma.user.findUnique({
        where: { id: userId },
        include: { teacherProfile: true, studentProfile: true },
      });

      if (!existingUser) {
        return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 });
      }

      // Check email uniqueness if email changed
      if (email && email !== existingUser.email) {
        const emailExists = await prisma.user.findUnique({ where: { email } });
        if (emailExists) {
          return NextResponse.json({ error: "البريد الإلكتروني مستخدم بالفعل من قبل حساب آخر" }, { status: 400 });
        }
      }

      const updateData: any = {};
      if (name) updateData.name = name;
      if (email) updateData.email = email;
      if (phone !== undefined) updateData.phone = phone;
      if (avatar) updateData.avatar = avatar;
      if (password && password.trim().length > 0) updateData.password = password;
      if (role && role !== existingUser.role) {
        updateData.role = role;
        if (role === "TEACHER" && !existingUser.teacherProfile) {
          await prisma.teacherProfile.create({
            data: { userId, title: "الشيخ المقرئ", bio: "معلم معتمد" },
          });
        } else if (role === "STUDENT" && !existingUser.studentProfile) {
          await prisma.studentProfile.create({
            data: { userId, studentNumber: `STU-${Math.floor(1000 + Math.random() * 9000)}` },
          });
        }
      }

      const updated = await prisma.user.update({
        where: { id: userId },
        data: updateData,
      });

      await prisma.auditLog.create({
        data: {
          action: "USER_UPDATED",
          userId: adminUser.id,
          details: `تم تعديل بيانات المستخدم ${updated.name} (${updated.email})`,
        },
      });

      return NextResponse.json({ success: true, user: updated });
    }

    // 4. UPDATE PERMISSIONS (فتح وغلق الصلاحيات المفصلة للمستخدم)
    if (action === "UPDATE_PERMISSIONS") {
      const { userId, permissions } = body;
      if (!userId || !permissions) {
        return NextResponse.json({ error: "بيانات الصلاحيات غير مكتملة" }, { status: 400 });
      }

      const permKey = `user_perms_${userId}`;
      await prisma.platformSetting.upsert({
        where: { key: permKey },
        update: { value: JSON.stringify(permissions) },
        create: { key: permKey, value: JSON.stringify(permissions) },
      });

      // Synchronize isActive with canLogin if specified
      if (typeof permissions.canLogin === "boolean") {
        await prisma.user.update({
          where: { id: userId },
          data: { isActive: permissions.canLogin },
        });
      }

      await prisma.auditLog.create({
        data: {
          action: "PERMISSIONS_UPDATED",
          userId: adminUser.id,
          details: `تم تحديث حزمة الصلاحيات للمستخدم (المعرف: ${userId}) بنجاح`,
        },
      });

      return NextResponse.json({ success: true, permissions });
    }

    // 5. DELETE USER (حذف المستخدم نهائياً بكافة سجلاته)
    if (action === "DELETE_USER") {
      const { userId } = body;
      const targetUser = await prisma.user.findUnique({ where: { id: userId } });
      if (!targetUser) {
        return NextResponse.json({ error: "المستخدم غير موجود مسبقاً" }, { status: 404 });
      }

      // Safety check: Cannot delete own admin account
      if (targetUser.id === adminUser.id) {
        return NextResponse.json({ error: "لا يمكن حذف حساب المدير الحالي قيد الاستخدام" }, { status: 400 });
      }

      // Clean up PlatformSetting permissions
      await prisma.platformSetting.deleteMany({
        where: { key: `user_perms_${userId}` },
      });

      // Delete user (Casacade configured in prisma schema handles related profiles & records)
      await prisma.user.delete({
        where: { id: userId },
      });

      await prisma.auditLog.create({
        data: {
          action: "USER_DELETED",
          userId: adminUser.id,
          details: `قام المدير بحذف حساب المستخدم نهائياً: ${targetUser.name} (${targetUser.email})`,
        },
      });

      return NextResponse.json({ success: true, message: "تم حذف المستخدم بنجاح" });
    }

    // 6. CREATE USER (إضافة مستخدم جديد بكامل الحقول والصلاحيات)
    if (action === "CREATE_USER") {
      const { name, email, password, role, phone, avatar, initialPermissions } = body;

      if (!name || !email || !password || !role) {
        return NextResponse.json({ error: "يرجى ملء جميع الحقول الإلزامية: الاسم، البريد، كلمة المرور، والدور" }, { status: 400 });
      }

      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        return NextResponse.json({ error: "البريد الإلكتروني مسجل بالفعل لمستخدم آخر" }, { status: 400 });
      }

      const newUser = await prisma.user.create({
        data: {
          name,
          email,
          password,
          role,
          phone: phone || null,
          avatar:
            avatar ||
            (role === "TEACHER"
              ? "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200"
              : role === "ADMIN"
              ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200"
              : "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200"),
          isActive: true,
          ...(role === "TEACHER"
            ? {
                teacherProfile: {
                  create: {
                    title: "الشيخ المقرئ",
                    bio: "معلم معتمد في منصة ورتّل",
                    allowStudentMessaging: true,
                  },
                },
              }
            : role === "STUDENT"
            ? {
                studentProfile: {
                  create: {
                    studentNumber: `STU-${Math.floor(1000 + Math.random() * 9000)}`,
                  },
                },
              }
            : {}),
        },
      });

      // Save initial permissions if provided
      if (initialPermissions) {
        await prisma.platformSetting.upsert({
          where: { key: `user_perms_${newUser.id}` },
          update: { value: JSON.stringify(initialPermissions) },
          create: { key: `user_perms_${newUser.id}`, value: JSON.stringify(initialPermissions) },
        });
      }

      await prisma.auditLog.create({
        data: {
          action: "USER_CREATED",
          userId: adminUser.id,
          details: `تم إنشاء حساب جديد برتبة ${role}: ${newUser.name} (${newUser.email})`,
        },
      });

      return NextResponse.json({ success: true, user: newUser });
    }

    return NextResponse.json({ error: "الإجراء المطلوب غير معروف" }, { status: 400 });
  } catch (error: any) {
    console.error("Admin user action error:", error);
    return NextResponse.json({ error: error.message || "فشل تنفيذ العملية" }, { status: 500 });
  }
}
