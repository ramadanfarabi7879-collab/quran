import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { realtimeHub } from "@/lib/realtime";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    const { searchParams } = new URL(req.url);
    const halaqaId = searchParams.get("halaqaId");
    let studentId = searchParams.get("studentId");
    const sessionId = searchParams.get("sessionId");

    if (!studentId && user?.role === "STUDENT" && user.studentProfile) {
      studentId = user.studentProfile.id;
    }

    const where: any = {};
    if (sessionId) where.sessionId = sessionId;
    if (studentId) where.studentId = studentId;
    if (halaqaId) {
      where.session = { halaqaId };
    }

    const attendances = await prisma.sessionAttendance.findMany({
      where,
      include: {
        student: {
          include: { user: true },
        },
        session: {
          include: { halaqa: true },
        },
      },
      orderBy: { checkInTime: "desc" },
    });

    // Calculate statistics
    const total = attendances.length;
    const present = attendances.filter((a) => a.status === "PRESENT").length;
    const late = attendances.filter((a) => a.status === "LATE").length;
    const excused = attendances.filter((a) => a.status === "EXCUSED").length;
    const absent = attendances.filter((a) => a.status === "ABSENT").length;
    const commitmentRate = total > 0 ? Math.round(((present + late * 0.8) / total) * 100) : 100;

    return NextResponse.json({
      attendances,
      stats: {
        total,
        present,
        late,
        excused,
        absent,
        commitmentRate,
      },
    });
  } catch (error) {
    console.error("Get attendance error:", error);
    return NextResponse.json({ error: "فشل استرداد سجلات الحضور" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const body = await req.json();
    const { action, sessionId, studentId, status, notes } = body;

    // Action 1: Student self check-in request
    if (action === "STUDENT_CHECKIN") {
      let studentProfileId = user.studentProfile?.id || studentId;
      if (!studentProfileId) {
        const studentProfile = await prisma.studentProfile.findFirst({
          where: { userId: user.id },
        });
        studentProfileId = studentProfile?.id;
      }
      if (!studentProfileId) {
        const anyStudent = await prisma.studentProfile.findFirst();
        studentProfileId = anyStudent?.id;
      }
      if (!studentProfileId) {
        return NextResponse.json({ error: "معرف الطالب مفقود" }, { status: 400 });
      }

      const attendance = await prisma.sessionAttendance.upsert({
        where: {
          sessionId_studentId: {
            sessionId,
            studentId: studentProfileId,
          },
        },
        update: {
          requestedCheckIn: true,
          checkInTime: new Date(),
          status: "PRESENT",
          isVerifiedByTeacher: true, // auto-verified on join
        },
        create: {
          sessionId,
          studentId: studentProfileId,
          requestedCheckIn: true,
          checkInTime: new Date(),
          status: "PRESENT",
          isVerifiedByTeacher: true,
        },
        include: {
          student: { include: { user: true } },
        },
      });

      realtimeHub.broadcast(`session-${sessionId}`, {
        type: "STUDENT_ATTENDANCE_CHECKIN",
        payload: {
          sessionId,
          studentId: studentProfileId,
          studentName: user.name,
          checkInTime: new Date().toISOString(),
        },
      });

      return NextResponse.json({ success: true, attendance });
    }

    // Action 2: Teacher manual verification or update
    if (user.role === "STUDENT") {
      return NextResponse.json({ error: "غير مصرح بتعديل الحضور" }, { status: 403 });
    }

    const updated = await prisma.sessionAttendance.upsert({
      where: {
        sessionId_studentId: {
          sessionId,
          studentId,
        },
      },
      update: {
        status: status || "PRESENT",
        isVerifiedByTeacher: true,
        notes: notes !== undefined ? notes : undefined,
      },
      create: {
        sessionId,
        studentId,
        status: status || "PRESENT",
        isVerifiedByTeacher: true,
        checkInTime: new Date(),
        notes,
      },
      include: {
        student: { include: { user: true } },
      },
    });

    realtimeHub.broadcast(`session-${sessionId}`, {
      type: "STUDENT_ATTENDANCE_VERIFIED",
      payload: {
        sessionId,
        studentId,
        status: updated.status,
      },
    });

    return NextResponse.json({ success: true, attendance: updated });
  } catch (error) {
    console.error("Attendance POST error:", error);
    return NextResponse.json({ error: "فشل تحديث الحضور" }, { status: 500 });
  }
}
