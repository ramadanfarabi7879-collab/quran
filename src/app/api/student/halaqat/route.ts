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

    const halaqat = await prisma.halaqa.findMany({
      where: { status: "ACTIVE" },
      include: {
        teacher: { include: { user: true } },
        enrollments: {
          where: { status: "ACTIVE" },
          include: { student: { include: { user: true } } },
        },
        joinRequests: {
          include: { student: { include: { user: true } } },
        },
        liveSessions: {
          where: { status: "ACTIVE" },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const annotatedHalaqat = halaqat.map((h) => {
      const activeSession = h.liveSessions?.[0];
      const isLiveNow = Boolean(activeSession);
      const activeSessionId = activeSession?.id || h.currentLiveSessionId || null;

      let studentStatus = "NOT_ENROLLED";
      let isApprovedBySheikh = false;

      if (studentProfileId) {
        const isEnrolled = h.enrollments.some(
          (e: any) => e.studentId === studentProfileId
        );
        if (isEnrolled) {
          studentStatus = "ENROLLED";
          isApprovedBySheikh = true;
        } else {
          const pendingReq = h.joinRequests.find(
            (r: any) => r.studentId === studentProfileId && r.status === "PENDING"
          );
          if (pendingReq) {
            studentStatus = "PENDING";
          } else {
            const rejectedReq = h.joinRequests.find(
              (r: any) => r.studentId === studentProfileId && r.status === "REJECTED"
            );
            studentStatus = rejectedReq ? "REJECTED" : "NOT_ENROLLED";
          }
        }
      }

      return {
        ...h,
        isLiveNow,
        currentLiveSessionId: activeSessionId,
        studentStatus,
        isApprovedBySheikh,
      };
    });

    return NextResponse.json({ halaqat: annotatedHalaqat });
  } catch (error) {
    console.error("Get student halaqat error:", error);
    return NextResponse.json({ error: "فشل استرداد الحلقات" }, { status: 500 });
  }
}
