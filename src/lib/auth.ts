import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { CurrentUser, UserRole } from "@/types";

export const AUTH_COOKIE_NAME = "quran_session";

export async function getCurrentUser(): Promise<CurrentUser | null> {
  try {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get(AUTH_COOKIE_NAME);

    const userId = sessionCookie?.value;
    if (!userId) return null;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        teacherProfile: true,
        studentProfile: true,
      },
    });

    if (!user || !user.isActive) return null;

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
