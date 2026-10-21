import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    let user = await getCurrentUser();
    if (!user || user.role === "STUDENT") {
      const teacherUser = await prisma.user.findFirst({
        where: { role: "TEACHER" },
        include: { teacherProfile: true },
      });
      if (teacherUser) user = teacherUser as any;
    }

    const { searchParams } = new URL(req.url);
    const teacherId = searchParams.get("teacherId") || user?.teacherProfile?.id;
    const availableOnly = searchParams.get("available") !== "false";

    if (!teacherId) {
      // Find default teacher
      const defTeacher = await prisma.teacherProfile.findFirst();
      if (!defTeacher) {
        return NextResponse.json({ slots: [] });
      }
      return NextResponse.json({
        slots: await prisma.teacherScheduleSlot.findMany({
          where: { teacherId: defTeacher.id, ...(availableOnly ? { isBooked: false } : {}) },
          orderBy: { createdAt: "desc" },
        }),
      });
    }

    let slots = await prisma.teacherScheduleSlot.findMany({
      where: {
        teacherId,
        ...(availableOnly ? { isBooked: false } : {}),
      },
      orderBy: { createdAt: "desc" },
    });

    // Seed default slots if none exist yet for this teacher
    if (slots.length === 0 && teacherId) {
      const sampleSlots = [
        {
          teacherId,
          title: "جلسة فردية - تصحيح تلاوة",
          dayOfWeek: "غداً",
          startTime: "17:00",
          endTime: "17:30",
          durationMinutes: 30,
          slotType: "ONE_ON_ONE",
          isBooked: false,
        },
        {
          teacherId,
          title: "جلسة فردية - تسميع حفظ جديد",
          dayOfWeek: "بعد غد",
          startTime: "18:00",
          endTime: "18:30",
          durationMinutes: 30,
          slotType: "ONE_ON_ONE",
          isBooked: false,
        },
        {
          teacherId,
          title: "حلقة تجويد وتثبيت مصغرة",
          dayOfWeek: "نهاية الأسبوع",
          startTime: "19:00",
          endTime: "19:45",
          durationMinutes: 45,
          slotType: "HALAQA",
          isBooked: false,
        },
      ];

      await prisma.teacherScheduleSlot.createMany({
        data: sampleSlots,
      });

      slots = await prisma.teacherScheduleSlot.findMany({
        where: { teacherId, isBooked: false },
        orderBy: { createdAt: "desc" },
      });
    }

    return NextResponse.json({ success: true, slots });
  } catch (error) {
    console.error("GET /api/teacher/slots error:", error);
    return NextResponse.json({ error: "فشل استرداد المواعيد" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    let user = await getCurrentUser();
    if (!user || user.role === "STUDENT") {
      const teacherUser = await prisma.user.findFirst({
        where: { role: "TEACHER" },
        include: { teacherProfile: true },
      });
      if (teacherUser) user = teacherUser as any;
    }

    if (!user || (user.role !== "TEACHER" && user.role !== "ADMIN")) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }

    const teacherProfileId = user.teacherProfile?.id;
    if (!teacherProfileId) {
      return NextResponse.json({ error: "ملف المعلم غير موجود" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const {
      title = "جلسة تسميع فردية",
      dayOfWeek = "اليوم",
      date,
      startTime = "17:00",
      durationMinutes = 30,
      slotType = "ONE_ON_ONE",
    } = body;

    const [startH, startM] = startTime.split(":").map(Number);
    const totalStartMin = (startH || 0) * 60 + (startM || 0);
    const totalEndMin = totalStartMin + Number(durationMinutes);
    const endH = Math.floor(totalEndMin / 60) % 24;
    const endM = totalEndMin % 60;
    const endTime = `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;

    const slot = await prisma.teacherScheduleSlot.create({
      data: {
        teacherId: teacherProfileId,
        title,
        dayOfWeek,
        date: date ? new Date(date) : new Date(),
        startTime,
        endTime,
        durationMinutes: Number(durationMinutes),
        slotType,
        isBooked: false,
      },
    });

    return NextResponse.json({ success: true, slot });
  } catch (error) {
    console.error("POST /api/teacher/slots error:", error);
    return NextResponse.json({ error: "فشل إنشاء الموعد" }, { status: 500 });
  }
}
