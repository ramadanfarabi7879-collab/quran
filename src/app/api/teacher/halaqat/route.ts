import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { realtimeHub } from "@/lib/realtime";

export async function GET() {
  try {
    let halaqat = await prisma.halaqa.findMany({
      include: {
        teacher: { include: { user: true } },
        enrollments: {
          where: { status: "ACTIVE" },
          include: { student: { include: { user: true } } },
        },
        joinRequests: {
          where: { status: "PENDING" },
          include: { student: { include: { user: true } } },
        },
        liveSessions: {
          where: { status: "ACTIVE" },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (halaqat.length === 0) {
      let teacherUser = await prisma.user.findFirst({
        where: { role: "TEACHER" },
        include: { teacherProfile: true },
      });

      if (!teacherUser) {
        teacherUser = await prisma.user.create({
          data: {
            email: "teacher@quran.com",
            name: "الشيخ أحمد المنشاوي",
            password: "teacher",
            role: "TEACHER",
            avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200",
            phone: "+966500000002",
            isActive: true,
            teacherProfile: {
              create: {
                title: "الشيخ المقرئ",
                bio: "مجاز في القراءات العشر، مع خبرة 15 عاماً في إقراء القرآن الكريم.",
                allowStudentMessaging: true,
              },
            },
          },
          include: { teacherProfile: true },
        });
      } else if (!teacherUser.teacherProfile) {
        await prisma.teacherProfile.create({
          data: {
            userId: teacherUser.id,
            title: "الشيخ المقرئ",
            bio: "معلم معتمد في منصة ورتّل",
          },
        });
        teacherUser = await prisma.user.findFirst({
          where: { role: "TEACHER" },
          include: { teacherProfile: true },
        });
      }

      const teacherProfileId = teacherUser!.teacherProfile!.id;

      await prisma.halaqa.create({
        data: {
          name: "حلقة الفجر والتحفيظ والتجويد",
          description: "حلقة يومية مباركة بعد صلاة الفجر لإتقان الحفظ ومراجعة القرآن الكريم.",
          capacity: 25,
          level: "متقدم (حفظ وتثبيت)",
          scheduleDays: "السبت, الإثنين, الأربعاء",
          startTime: "05:30",
          endTime: "07:00",
          teacherId: teacherProfileId,
          status: "ACTIVE",
        },
      });

      await prisma.halaqa.create({
        data: {
          name: "حلقة المساء لمراجعة وتثبيت القرآن",
          description: "حلقة مسائية للمراجعة والتسميع مع تطبيق أحكام التجويد ومخارج الحروف.",
          capacity: 20,
          level: "متوسط",
          scheduleDays: "الأحد, الثلاثاء, الخميس",
          startTime: "16:00",
          endTime: "17:30",
          teacherId: teacherProfileId,
          status: "ACTIVE",
        },
      });

      halaqat = await prisma.halaqa.findMany({
        include: {
          teacher: { include: { user: true } },
          enrollments: {
            where: { status: "ACTIVE" },
            include: { student: { include: { user: true } } },
          },
          joinRequests: {
            where: { status: "PENDING" },
            include: { student: { include: { user: true } } },
          },
          liveSessions: {
            where: { status: "ACTIVE" },
            take: 1,
          },
        },
        orderBy: { createdAt: "desc" },
      });
    }

    return NextResponse.json({ halaqat });
  } catch (error) {
    console.error("Get halaqat error:", error);
    return NextResponse.json({ error: "فشل استرداد الحلقات" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role === "STUDENT") {
      return NextResponse.json({ error: "غير مصرح بإنشاء حلقات ومواعيد" }, { status: 403 });
    }

    const body = await req.json();
    const { name, description, capacity, level, scheduleDays, startTime, endTime } = body;

    if (!name) {
      return NextResponse.json({ error: "اسم الحلقة مطلوب" }, { status: 400 });
    }

    let teacherProfileId = user.teacherProfile?.id;
    if (!teacherProfileId) {
      const teacherUser = await prisma.user.findFirst({
        where: { role: "TEACHER" },
        include: { teacherProfile: true },
      });
      teacherProfileId = teacherUser?.teacherProfile?.id;
    }

    if (!teacherProfileId) {
      return NextResponse.json({ error: "ملف المعلم غير متوفر" }, { status: 400 });
    }

    const halaqa = await prisma.halaqa.create({
      data: {
        name,
        description: description || "",
        capacity: Number(capacity) || 20,
        level: level || "متوسط",
        scheduleDays: scheduleDays || "السبت, الإثنين, الأربعاء",
        startTime: startTime || "16:00",
        endTime: endTime || "17:30",
        teacherId: teacherProfileId,
        status: "ACTIVE",
      },
      include: {
        teacher: { include: { user: true } },
      },
    });

    // Notify all students in the database
    try {
      const students = await prisma.user.findMany({
        where: { role: "STUDENT" },
        select: { id: true },
      });

      if (students.length > 0) {
        await prisma.notification.createMany({
          data: students.map((s) => ({
            userId: s.id,
            title: "موعد حلقة جديد",
            body: `قام فضيلة الشيخ بإضافة موعد جديد: ${halaqa.name} (${halaqa.scheduleDays} من ${halaqa.startTime} إلى ${halaqa.endTime})`,
            type: "SCHEDULE",
            link: "/student/dashboard",
          })),
        });
      }
    } catch (notifErr) {
      console.warn("Could not insert student notifications:", notifErr);
    }

    // Broadcast realtime schedule event across the platform
    realtimeHub.broadcast("global", {
      type: "SCHEDULE_UPDATED",
      payload: {
        action: "CREATED",
        halaqaId: halaqa.id,
        name: halaqa.name,
        scheduleDays: halaqa.scheduleDays,
        startTime: halaqa.startTime,
        endTime: halaqa.endTime,
        level: halaqa.level,
        teacherName: user.name || "الشيخ",
        message: `تم إضافة موعد حلقة جديد: ${halaqa.name} (${halaqa.scheduleDays} الساعة ${halaqa.startTime})`,
      },
    });

    return NextResponse.json({ success: true, halaqa });
  } catch (error) {
    console.error("Create halaqa error:", error);
    return NextResponse.json({ error: "فشل إنشاء الحلقة" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role === "STUDENT") {
      return NextResponse.json({ error: "غير مصرح بتعديل المواعيد" }, { status: 403 });
    }

    const body = await req.json();
    const { id, name, description, capacity, level, scheduleDays, startTime, endTime, status } = body;

    if (!id) {
      return NextResponse.json({ error: "معرف الحلقة مطلوب" }, { status: 400 });
    }

    const updated = await prisma.halaqa.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(capacity && { capacity: Number(capacity) }),
        ...(level && { level }),
        ...(scheduleDays && { scheduleDays }),
        ...(startTime && { startTime }),
        ...(endTime && { endTime }),
        ...(status && { status }),
      },
      include: {
        teacher: { include: { user: true } },
      },
    });

    // Notify all students of schedule modification
    try {
      const students = await prisma.user.findMany({
        where: { role: "STUDENT" },
        select: { id: true },
      });

      if (students.length > 0) {
        await prisma.notification.createMany({
          data: students.map((s) => ({
            userId: s.id,
            title: "تحديث في مواعيد الحلقات",
            body: `تحديث موعد "${updated.name}": (${updated.scheduleDays} من ${updated.startTime} إلى ${updated.endTime})`,
            type: "SCHEDULE",
            link: "/student/dashboard",
          })),
        });
      }
    } catch (notifErr) {
      console.warn("Could not insert notifications:", notifErr);
    }

    // Broadcast realtime event
    realtimeHub.broadcast("global", {
      type: "SCHEDULE_UPDATED",
      payload: {
        action: "UPDATED",
        halaqaId: updated.id,
        name: updated.name,
        scheduleDays: updated.scheduleDays,
        startTime: updated.startTime,
        endTime: updated.endTime,
        level: updated.level,
        status: updated.status,
        teacherName: user.name || "الشيخ",
        message: `تم تعديل موعد حلقة "${updated.name}" إلى (${updated.scheduleDays} من ${updated.startTime} إلى ${updated.endTime})`,
      },
    });

    return NextResponse.json({ success: true, halaqa: updated });
  } catch (error) {
    console.error("Update halaqa error:", error);
    return NextResponse.json({ error: "فشل تعديل الحلقة" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role === "STUDENT") {
      return NextResponse.json({ error: "غير مصرح بحذف المواعيد" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "معرف الحلقة مطلوب" }, { status: 400 });
    }

    const existing = await prisma.halaqa.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "الحلقة غير موجودة" }, { status: 404 });
    }

    await prisma.halaqa.delete({
      where: { id },
    });

    // Broadcast deletion event
    realtimeHub.broadcast("global", {
      type: "SCHEDULE_UPDATED",
      payload: {
        action: "DELETED",
        halaqaId: id,
        name: existing.name,
        teacherName: user.name || "الشيخ",
        message: `تم إلغاء موعد حلقة "${existing.name}" بواسطة الشيخ`,
      },
    });

    return NextResponse.json({ success: true, message: "تم حذف موعد الحلقة بنجاح" });
  } catch (error) {
    console.error("Delete halaqa error:", error);
    return NextResponse.json({ error: "فشل حذف موعد الحلقة" }, { status: 500 });
  }
}
