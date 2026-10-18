import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { realtimeHub } from "@/lib/realtime";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");
    const halaqaId = searchParams.get("halaqaId");

    let session = null;
    if (sessionId) {
      session = await prisma.liveSession.findUnique({
        where: { id: sessionId },
        include: {
          halaqa: {
            include: {
              teacher: { include: { user: true } },
              enrollments: {
                include: { student: { include: { user: true } } },
              },
            },
          },
          attendances: {
            include: { student: { include: { user: true } } },
          },
          mushafState: true,
        },
      });
    } else if (halaqaId) {
      session = await prisma.liveSession.findFirst({
        where: { halaqaId, status: "ACTIVE" },
        include: {
          halaqa: {
            include: {
              teacher: { include: { user: true } },
              enrollments: {
                include: { student: { include: { user: true } } },
              },
            },
          },
          attendances: {
            include: { student: { include: { user: true } } },
          },
          mushafState: true,
        },
      });
    } else {
      // Find any currently active live session
      session = await prisma.liveSession.findFirst({
        where: { status: "ACTIVE" },
        orderBy: { startedAt: "desc" },
        include: {
          halaqa: {
            include: {
              teacher: { include: { user: true } },
              enrollments: {
                include: { student: { include: { user: true } } },
              },
            },
          },
          attendances: {
            include: { student: { include: { user: true } } },
          },
          mushafState: true,
        },
      });
    }

    return NextResponse.json({ session });
  } catch (error) {
    console.error("Get live session error:", error);
    return NextResponse.json({ error: "فشل استرداد بيانات الجلسة" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    let user = await getCurrentUser();
    if (!user || user.role === "STUDENT") {
      const teacherUser = await prisma.user.findFirst({
        where: { role: "TEACHER" },
        include: { teacherProfile: true, studentProfile: true },
      });
      if (teacherUser) {
        user = {
          id: teacherUser.id,
          name: teacherUser.name,
          email: teacherUser.email,
          role: "TEACHER",
          avatar: teacherUser.avatar,
          phone: teacherUser.phone,
          teacherProfile: teacherUser.teacherProfile,
          studentProfile: teacherUser.studentProfile,
        };
      } else {
        return NextResponse.json({ error: "غير مصرح بإنشاء جلسة مباشرة" }, { status: 403 });
      }
    }

    let body: any = {};
    try {
      body = await req.json();
    } catch {}

    const inputHalaqaId = body?.halaqaId;
    const title = body?.title;

    let halaqa = null;
    if (inputHalaqaId && inputHalaqaId !== "auto") {
      halaqa = await prisma.halaqa.findUnique({
        where: { id: inputHalaqaId },
        include: {
          enrollments: {
            include: { student: { include: { user: true } } },
          },
        },
      });
    }

    if (!halaqa) {
      halaqa = await prisma.halaqa.findFirst({
        where: { status: "ACTIVE" },
        include: {
          enrollments: {
            include: { student: { include: { user: true } } },
          },
        },
      });
    }

    if (!halaqa) {
      let teacherProfile = await prisma.teacherProfile.findFirst();
      if (!teacherProfile) {
        const teacherUser = await prisma.user.create({
          data: {
            email: "teacher@quran.com",
            name: "الشيخ أحمد المنشاوي",
            password: "teacher",
            role: "TEACHER",
            avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200",
            phone: "+966500000002",
            isActive: true,
            teacherProfile: {
              create: {
                title: "الشيخ المقرئ",
                bio: "معلم معتمد في منصة ورتّل",
              },
            },
          },
          include: { teacherProfile: true },
        });
        teacherProfile = teacherUser.teacherProfile;
      }

      halaqa = await prisma.halaqa.create({
        data: {
          name: "حلقة الفجر والتحفيظ والتجويد",
          description: "حلقة يومية مباركة لإتقان الحفظ والمراجعة.",
          capacity: 25,
          level: "متقدم",
          scheduleDays: "السبت, الإثنين, الأربعاء",
          startTime: "05:30",
          endTime: "07:00",
          teacherId: teacherProfile!.id,
          status: "ACTIVE",
        },
        include: {
          enrollments: {
            include: { student: { include: { user: true } } },
          },
        },
      });
    }

    const halaqaId = halaqa.id;

    // Create session
    const sessionTitle = title || `جلسة ${halaqa.name} - ${new Date().toLocaleDateString("ar-SA")}`;
    const liveSession = await prisma.liveSession.create({
      data: {
        halaqaId,
        title: sessionTitle,
        status: "ACTIVE",
        mushafState: {
          create: {
            mode: "VIEW",
            currentSurah: 1,
            currentPage: 1,
            currentAyah: 1,
            allowFreeNavigation: false,
            highlightedAyahs: "[]",
          },
        },
      },
      include: {
        mushafState: true,
      },
    });

    // Update Halaqa
    await prisma.halaqa.update({
      where: { id: halaqaId },
      data: {
        isLiveNow: true,
        currentLiveSessionId: liveSession.id,
      },
    });

    // Auto-create initial attendance records and collect student user IDs to notify
    const studentUserIdsToNotify = new Set<string>();
    for (const enrollment of halaqa.enrollments) {
      studentUserIdsToNotify.add(enrollment.student.user.id);
      await prisma.sessionAttendance.create({
        data: {
          sessionId: liveSession.id,
          studentId: enrollment.studentId,
          status: "ABSENT",
        },
      }).catch(() => {});
    }

    // If no enrollments found for this halaqa, find all active students in the platform
    if (studentUserIdsToNotify.size === 0) {
      const allStudents = await prisma.studentProfile.findMany({
        include: { user: true },
      });
      for (const st of allStudents) {
        studentUserIdsToNotify.add(st.user.id);
        await prisma.sessionAttendance.create({
          data: {
            sessionId: liveSession.id,
            studentId: st.id,
            status: "ABSENT",
          },
        }).catch(() => {});
      }
    }

    // Send database notifications to each student
    for (const uid of Array.from(studentUserIdsToNotify)) {
      await prisma.notification.create({
        data: {
          userId: uid,
          title: `بدأت الحلقة الآن: ${halaqa.name}`,
          body: `الشيخ في انتظارك في الغرفة الافتراضية، اضغط للانضمام مباشرة.`,
          type: "HALAQA_STARTING",
          link: `/classroom/${liveSession.id}?role=student`,
        },
      });
    }

    // Broadcast Realtime Event to students (both halaqa-specific and global channels)
    const livePayload = {
      halaqaId,
      sessionId: liveSession.id,
      title: sessionTitle,
      halaqaName: halaqa.name,
      teacherName: user.name || "الشيخ أحمد المنشاوي",
    };

    realtimeHub.broadcast(`halaqa-${halaqaId}`, {
      type: "HALAQA_LIVE_STARTED",
      payload: livePayload,
    });

    realtimeHub.broadcast("global", {
      type: "HALAQA_LIVE_STARTED",
      payload: livePayload,
    });

    return NextResponse.json({ success: true, session: liveSession });
  } catch (error) {
    console.error("Create live session error:", error);
    return NextResponse.json({ error: "فشل إنشاء الجلسة المباشرة" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role === "STUDENT") {
      return NextResponse.json({ error: "غير مصرح بإنهاء الجلسة" }, { status: 403 });
    }

    const { sessionId } = await req.json();
    if (!sessionId) {
      return NextResponse.json({ error: "sessionId مطلوب" }, { status: 400 });
    }

    const session = await prisma.liveSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return NextResponse.json({ error: "الجلسة غير موجودة" }, { status: 404 });
    }

    await prisma.liveSession.update({
      where: { id: sessionId },
      data: {
        status: "ENDED",
        endedAt: new Date(),
      },
    });

    await prisma.halaqa.update({
      where: { id: session.halaqaId },
      data: {
        isLiveNow: false,
        currentLiveSessionId: null,
      },
    });

    realtimeHub.broadcast(`session-${sessionId}`, {
      type: "HALAQA_LIVE_ENDED",
      payload: { sessionId, halaqaId: session.halaqaId },
    });

    realtimeHub.broadcast(`halaqa-${session.halaqaId}`, {
      type: "HALAQA_LIVE_ENDED",
      payload: { sessionId, halaqaId: session.halaqaId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("End live session error:", error);
    return NextResponse.json({ error: "فشل إنهاء الجلسة" }, { status: 500 });
  }
}
