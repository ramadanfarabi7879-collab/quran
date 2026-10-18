import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AUTH_COOKIE_NAME } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const identifier = (body.email || body.phone || body.identifier || "").trim();
    const password = (body.password || "").trim();

    if (!identifier || !password) {
      return NextResponse.json(
        { error: "يرجى إدخال رقم الجوال أو البريد الإلكتروني وكلمة المرور" },
        { status: 400 }
      );
    }

    const cleanPhone = identifier.replace(/[\s\-\+]/g, "");

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { phone: identifier },
          { phone: { contains: cleanPhone } },
          { email: `stu_${cleanPhone}@quran.local` },
        ],
      },
      include: {
        teacherProfile: true,
        studentProfile: true,
      },
    });

    if (!user || user.password !== password) {
      return NextResponse.json(
        { error: "رقم الجوال / البريد الإلكتروني أو كلمة المرور غير صحيحة" },
        { status: 401 }
      );
    }

    if (!user.isActive) {
      const msg =
        user.role === "STUDENT"
          ? "طلبك لا يزال قيد المراجعة والاعتماد لدى فضيلة الشيخ. سيتم تفعيل حسابك فور الموافقة والتواصل معك عبر رقم هاتفك المسجل."
          : "هذا الحساب موقوف، يرجى التواصل مع إدارة المنصة";
      return NextResponse.json(
        { error: msg, isPendingApproval: user.role === "STUDENT" },
        { status: 403 }
      );
    }

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    });

    response.cookies.set(AUTH_COOKIE_NAME, user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      sameSite: "lax",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "حدث خطأ أثناء تسجيل الدخول" }, { status: 500 });
  }
}
