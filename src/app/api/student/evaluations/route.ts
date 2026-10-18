import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    let user = await getCurrentUser();
    let studentProfileId = user?.studentProfile?.id;

    if (!studentProfileId) {
      const studentUser = await prisma.user.findFirst({
        where: { role: "STUDENT" },
        include: { studentProfile: true },
      });
      studentProfileId = studentUser?.studentProfile?.id;
    }

    if (!studentProfileId) {
      return NextResponse.json({ evaluations: [] });
    }

    const evaluations = await prisma.evaluation.findMany({
      where: { studentId: studentProfileId },
      include: {
        teacher: { include: { user: true } },
      },
      orderBy: { date: "desc" },
      take: 10,
    });

    return NextResponse.json({ evaluations });
  } catch (error) {
    console.error("Get evaluations error:", error);
    return NextResponse.json({ evaluations: [] });
  }
}
