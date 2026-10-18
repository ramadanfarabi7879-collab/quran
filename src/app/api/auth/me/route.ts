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
