import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AUTH_COOKIE_NAME } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { role, userId } = await req.json();

    let user = null;
    if (userId) {
      user = await prisma.user.findFirst({
        where: {
          OR: [{ id: userId }, { email: userId }],
        },
        include: { teacherProfile: true, studentProfile: true },
      });
    } else if (role) {
      user = await prisma.user.findFirst({
        where: { role },
        include: { teacherProfile: true, studentProfile: true },
      });
    }

    if (!user) {
      return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 });
    }

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        teacherProfile: user.teacherProfile,
        studentProfile: user.studentProfile,
      },
    });

    response.cookies.set(AUTH_COOKIE_NAME, user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      sameSite: "lax",
    });

    return response;
  } catch (error) {
    console.error("switch-user error:", error);
    return NextResponse.json({ error: "فشل تبديل المستخدم" }, { status: 500 });
  }
}
