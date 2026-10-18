import { NextResponse } from "next/server";
import { getCurrentUser, AUTH_COOKIE_NAME } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const preferredRole = searchParams.get("role");

    let user = null;
    if (preferredRole) {
      user = await prisma.user.findFirst({
        where: { role: preferredRole },
        include: { teacherProfile: true, studentProfile: true },
      });
    }

    if (!user) {
      user = await getCurrentUser();
    }

    if (!user) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const res = NextResponse.json({ user });

    // If role was explicitly specified and matches found user, set session cookie
    if (preferredRole && user.id) {
      res.cookies.set(AUTH_COOKIE_NAME, user.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
        sameSite: "lax",
      });
    }

    return res;
  } catch (error) {
    console.error("api/auth/me error:", error);
    return NextResponse.json({ user: null }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const body = await req.json();
    const { name, phone, avatar, title, bio, specialties } = body;

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(name ? { name } : {}),
        ...(phone !== undefined ? { phone } : {}),
        ...(avatar !== undefined ? { avatar } : {}),
        ...(user.role === "TEACHER"
          ? {
              teacherProfile: {
                upsert: {
                  create: {
                    title: title || "الشيخ المقرئ",
                    bio: bio || "",
                    specialties: specialties || "",
                  },
                  update: {
                    ...(title ? { title } : {}),
                    ...(bio !== undefined ? { bio } : {}),
                    ...(specialties !== undefined ? { specialties } : {}),
                  },
                },
              },
            }
          : {}),
      },
      include: { teacherProfile: true, studentProfile: true },
    });

    return NextResponse.json({ user: updated, message: "تم تحديث البيانات بنجاح" });
  } catch (error) {
    console.error("api/auth/me PUT error:", error);
    return NextResponse.json({ error: "فشل تحديث البيانات" }, { status: 500 });
  }
}
