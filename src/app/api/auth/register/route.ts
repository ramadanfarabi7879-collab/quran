import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AUTH_COOKIE_NAME } from "@/lib/auth";
import { realtimeHub } from "@/lib/realtime";

export async function POST(req: Request) {
  try {
    const { name, email, password, role, phone, guardianName, guardianPhone } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "جميع الحقول الأساسية مطلوبة" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "البريد الإلكتروني مسجل مسبقاً" }, { status: 400 });
    }

    const userRole = role === "TEACHER" ? "TEACHER" : "STUDENT";
    const isStudent = userRole === "STUDENT";

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password,
        role: userRole,
        phone,
        isActive: !isStudent, // Students require Sheikh approval before activation
        ...(userRole === "TEACHER"
          ? {
              teacherProfile: {
                create: {
                  title: "المعلم",
                  bio: "معلم قرآن كريم وتجويد",
                },
              },
            }
          : {
              studentProfile: {
                create: {
                  studentNumber: `STU-${Math.floor(1000 + Math.random() * 9000)}`,
                  guardianName,
                  guardianPhone,
                },
              },
            }),
      },
      include: {
        teacherProfile: true,
        studentProfile: true,
      },
    });

    if (isStudent) {
      // 1. Notify Teachers and Admin in DB
      try {
        const teachersAndAdmins = await prisma.user.findMany({
          where: { role: { in: ["TEACHER", "ADMIN"] } },
        });

        for (const t of teachersAndAdmins) {
          await prisma.notification.create({
            data: {
              userId: t.id,
              title: "طلب تسجيل طالب جديد",
              body: `سجّل الطالب الجديد ${name} على المنصة، بانتظار اعتمادك وتفعيل حسابه.`,
              type: "STUDENT_REGISTRATION_SUBMITTED",
              link: "/teacher/students",
            },
          });
        }
      } catch (err) {
        console.error("Failed to create notifications for teacher:", err);
      }

      // 2. Broadcast realtime event so Sheikh hears chime & gets instant floating toast
      realtimeHub.broadcast("global", {
        type: "STUDENT_REGISTRATION_SUBMITTED",
        payload: {
          studentId: user.id,
          studentUserId: user.id,
          studentName: user.name,
          phone: user.phone || "",
          time: new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }),
        },
      });

      return NextResponse.json({
        success: true,
        requiresApproval: true,
        message:
          "تم تسجيل بياناتك بنجاح! طلبك الآن قيد المراجعة والاعتماد لدى فضيلة الشيخ أحمد علي. سيتم تفعيله فور الموافقة عليه، ويمكنك تسجيل الدخول بعدها.",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    }

    // Teachers get logged in immediately
    const response = NextResponse.json({ success: true, user });
    response.cookies.set(AUTH_COOKIE_NAME, user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      sameSite: "lax",
    });

    return response;
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ error: "فشل إنشاء الحساب" }, { status: 500 });
  }
}
