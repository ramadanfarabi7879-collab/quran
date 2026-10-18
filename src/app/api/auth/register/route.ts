import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AUTH_COOKIE_NAME } from "@/lib/auth";

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

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password,
        role: userRole,
        phone,
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
