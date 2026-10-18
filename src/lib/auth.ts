import { cookies, headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { CurrentUser, UserRole } from "@/types";

export const AUTH_COOKIE_NAME = "quran_session";

export async function getCurrentUser(): Promise<CurrentUser | null> {
  try {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get(AUTH_COOKIE_NAME);

    let userId = sessionCookie?.value;
    let user = null;

    if (userId) {
      user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          teacherProfile: true,
          studentProfile: true,
        },
      });
    }

    // Determine target role hint from request headers
    let roleHint: "STUDENT" | "TEACHER" | "ADMIN" | null = null;
    try {
      const reqHeaders = headers();
      const referer = reqHeaders.get("referer") || "";
      const nextUrl = reqHeaders.get("x-url") || reqHeaders.get("next-url") || "";
      if (referer.includes("/student") || nextUrl.includes("/student")) {
        roleHint = "STUDENT";
      } else if (referer.includes("/admin") || nextUrl.includes("/admin")) {
        roleHint = "ADMIN";
      } else if (referer.includes("/teacher") || nextUrl.includes("/teacher")) {
        roleHint = "TEACHER";
      }
    } catch {
      // Not in request scope
    }

    // If no cookie set or invalid user, fallback based on roleHint
    if (!user) {
      user = await prisma.user.findFirst({
        where: { role: roleHint || "TEACHER" },
        include: {
          teacherProfile: true,
          studentProfile: true,
        },
      });
    }

    // If accessing route with explicit roleHint, match the corresponding user
    if (roleHint && user && user.role !== roleHint) {
      const matchedUser = await prisma.user.findFirst({
        where: { role: roleHint },
        include: {
          teacherProfile: true,
          studentProfile: true,
        },
      });
      if (matchedUser) {
        user = matchedUser;
      }
    }

    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as UserRole,
      avatar: user.avatar,
      phone: user.phone,
      teacherProfile: user.teacherProfile,
      studentProfile: user.studentProfile,
    };
  } catch (error) {
    console.error("getCurrentUser error:", error);
    return null;
  }
}

export async function requireAuth(allowedRoles?: UserRole[]): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    throw new Error("FORBIDDEN");
  }

  return user;
}
