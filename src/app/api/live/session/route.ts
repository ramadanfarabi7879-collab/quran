import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { realtimeHub } from "@/lib/realtime";

export const dynamic = "force-dynamic";

async function cleanupStaleSessions() {
  try {
    const activeSessions = await prisma.liveSession.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, startedAt: true, halaqaId: true },
    });

    if (activeSessions.length === 0) return;

    const now = Date.now();
    const staleIds: string[] = [];

    for (const sess of activeSessions) {
      const startedTime = sess.startedAt ? new Date(sess.startedAt).getTime() : 0;
      const ageMs = now - startedTime;

      // Only clean up sessions that started more than 4 hours ago (clearly abandoned)
      if (ageMs > 4 * 60 * 60 * 1000) {
        staleIds.push(sess.id);
      }
    }

    if (staleIds.length > 0) {
      await prisma.liveSession.updateMany({
        where: { id: { in: staleIds } },
        data: { status: "ENDED", endedAt: new Date() },
      });

      await prisma.halaqa.updateMany({
        where: { currentLiveSessionId: { in: staleIds } },
        data: { isLiveNow: false, currentLiveSessionId: null },
      });

      for (const sid of staleIds) {
        await prisma.notification.updateMany({
          where: {
            type: "HALAQA_STARTING",
            link: { contains: sid },
          },
          data: { isRead: true },
        });
      }

      realtimeHub.broadcast("global", {
        type: "HALAQA_LIVE_ENDED",
        payload: { sessionId: staleIds[0] },
      });
    }
  } catch (err) {
    console.warn("Stale session cleanup error:", err);
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    // Administrative quick cleanup to end stale sessions
    if (searchParams.get("endAll") === "true") {
      await prisma.liveSession.updateMany({
        where: { status: "ACTIVE" },
        data: { status: "ENDED", endedAt: new Date() },
      });
      await prisma.halaqa.updateMany({
        data: { isLiveNow: false, currentLiveSessionId: null },
      });
      await prisma.notification.updateMany({
        where: { type: "HALAQA_STARTING", isRead: false },
        data: { isRead: true },
      });
      realtimeHub.broadcast("global", {
        type: "HALAQA_LIVE_ENDED",
        payload: { sessionId: "all" },
      });
      return NextResponse.json({ success: true, message: "تم إنهاء كافة الجلسات النشطة بنجاح" });
    }

    // Auto cleanup stale/abandoned sessions before resolving current state
    await cleanupStaleSessions();

    const sessionId = searchParams.get("sessionId");
    const halaqaId = searchParams.get("halaqaId");
    const roleParam = searchParams.get("role");

    let session = null;
    const includeConfig = {
      halaqa: {
        include: {
          teacher: { include: { user: true } },
          enrollments: {
            where: { status: "ACTIVE" },
            include: { student: { include: { user: true } } },
          },
          joinRequests: {
            include: { student: { include: { user: true } } },
          },
        },
      },
      attendances: {
        include: { student: { include: { user: true } } },
      },
      mushafState: true,
    };

    if (sessionId && sessionId !== "auto") {
      session = await prisma.liveSession.findUnique({
        where: { id: sessionId },
        include: includeConfig,
      });
    }

    if (!session && halaqaId) {
      session = await prisma.liveSession.findFirst({
        where: { halaqaId, status: "ACTIVE" },
        include: includeConfig,
      });
    }

    if (!session) {
      // Find any currently active live session
      session = await prisma.liveSession.findFirst({
        where: { status: "ACTIVE" },
        orderBy: { startedAt: "desc" },
        include: includeConfig,
      });
    }

    // ONLY auto-create a session if the TEACHER explicitly requests it on classroom page with auto
    if (!session && roleParam === "teacher" && sessionId === "auto") {
      try {
        const defaultHalaqa = await prisma.halaqa.findFirst({
          include: includeConfig.halaqa.include,
        });
        if (defaultHalaqa) {
          session = await prisma.liveSession.create({
            data: {
              halaqaId: defaultHalaqa.id,
              title: `جلسة ${defaultHalaqa.name} - ${new Date().toLocaleDateString("ar-SA")}`,
              status: "ACTIVE",
              startedAt: new Date(),
            },
            include: includeConfig,
          });

          await prisma.mushafSessionState.create({
            data: {
              sessionId: session.id,
              mode: "VIEW",
              currentSurah: 1,
              currentPage: 1,
              currentAyah: 1,
            },
          }).catch(() => {});
        }
      } catch (errCreate) {
        console.error("Auto session creation error:", errCreate);
      }
    }

    if (!session || session.status !== "ACTIVE") {
      return NextResponse.json({
        session: null,
        isAuthorized: false,
        authorizationStatus: "NO_ACTIVE_SESSION",
        teacherName: "",
        halaqaName: "",
        halaqaId: "",
      });
    }

    const user = await getCurrentUser();
    let effectiveUser = user;
    if (roleParam === "student" && (!user || user.role === "ADMIN" || user.role === "TEACHER")) {
      const studentUser = await prisma.user.findFirst({
        where: { role: "STUDENT" },
        include: { studentProfile: true },
      });
      if (studentUser) {
        effectiveUser = studentUser as any;
      }
    } else if (roleParam === "teacher" && (!user || user.role === "STUDENT")) {
      const teacherUser = await prisma.user.findFirst({
        where: { role: "TEACHER" },
        include: { teacherProfile: true },
      });
      if (teacherUser) {
        effectiveUser = teacherUser as any;
      }
    }

    let isAuthorized = false;
    let authorizationStatus = "UNAUTHENTICATED"; // "AUTHORIZED" | "PENDING_APPROVAL" | "NEEDS_REQUEST" | "REJECTED" | "UNAUTHENTICATED"
    let followUpReq: any = null;

    if (effectiveUser) {
      if (effectiveUser.role === "TEACHER" || effectiveUser.role === "ADMIN" || session?.halaqa?.teacher?.userId === effectiveUser.id) {
        isAuthorized = true;
        authorizationStatus = "AUTHORIZED";
      } else if (session?.halaqa) {
        const studentProfileId = effectiveUser.studentProfile?.id;
        const sessionAtt = session.attendances?.find(
          (a: any) =>
            (studentProfileId && a.studentId === studentProfileId) ||
            a.student?.userId === effectiveUser.id
        );

        const isEnrolled = session.halaqa.enrollments?.some(
          (e: any) =>
            (studentProfileId && e.studentId === studentProfileId) ||
            e.student?.userId === effectiveUser.id
        );

        // Check if student has a SessionFollowUpRequest
        if (studentProfileId) {
          followUpReq = await prisma.sessionFollowUpRequest.findFirst({
            where: {
              sessionId: session.id,
              studentId: studentProfileId,
            },
            orderBy: { createdAt: "desc" },
            include: { proposedSlot: true },
          });
        }

        if (sessionAtt?.isVerifiedByTeacher || sessionAtt?.status === "PRESENT" || followUpReq?.status === "ACCEPTED") {
          isAuthorized = true;
          authorizationStatus = "AUTHORIZED";
        } else if (followUpReq?.status === "PROPOSED") {
          isAuthorized = false;
          authorizationStatus = "PROPOSED_SLOT";
        } else if (followUpReq?.status === "DEFERRED") {
          isAuthorized = false;
          authorizationStatus = "DEFERRED";
        } else if (followUpReq?.status === "REJECTED") {
          isAuthorized = false;
          authorizationStatus = "REJECTED";
        } else if (followUpReq?.status === "PENDING" || sessionAtt?.requestedCheckIn) {
          isAuthorized = false;
          authorizationStatus = "PENDING_APPROVAL";
        } else {
          // If session is active with existing participants and student hasn't been approved yet:
          const hasPendingHalaqa = session.halaqa.joinRequests?.some(
            (r: any) => (r.student?.userId === effectiveUser.id || r.studentId === studentProfileId) && r.status === "PENDING"
          );
          if (hasPendingHalaqa) {
            isAuthorized = false;
            authorizationStatus = "PENDING_APPROVAL";
          } else {
            isAuthorized = false;
            authorizationStatus = "NEEDS_REQUEST";
          }
        }
      }
    }

    return NextResponse.json({
      session,
      isAuthorized,
      authorizationStatus,
      followUpRequest: followUpReq,
      teacherName: session?.halaqa?.teacher?.user?.name || "معلم ومقرئ الحلقة",
      halaqaName: session?.halaqa?.name || "",
      halaqaId: session?.halaqaId || session?.halaqa?.id || "",
    });
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
            name: "معلم ومقرئ الحلقة",
            password: "teacher",
            role: "TEACHER",
            avatar: null,
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

    // Ensure any previously active sessions are ended before starting a new one
    await prisma.liveSession.updateMany({
      where: { status: "ACTIVE" },
      data: {
        status: "ENDED",
        endedAt: new Date(),
      },
    });
    await prisma.halaqa.updateMany({
      where: { isLiveNow: true },
      data: {
        isLiveNow: false,
        currentLiveSessionId: null,
      },
    });
    // Mark any previous unread HALAQA_STARTING notifications as read to avoid stale invitations
    await prisma.notification.updateMany({
      where: {
        type: "HALAQA_STARTING",
        isRead: false,
      },
      data: { isRead: true },
    });

    // Create session
    const halaqaId = halaqa.id;
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
    // Since Teacher initiates the session, students are pre-verified to join without needing second approval!
    const studentUserIdsToNotify = new Set<string>();
    for (const enrollment of halaqa.enrollments) {
      studentUserIdsToNotify.add(enrollment.student.user.id);
      await prisma.sessionAttendance.create({
        data: {
          sessionId: liveSession.id,
          studentId: enrollment.studentId,
          status: "ABSENT",
          isVerifiedByTeacher: true, // Sheikh invited them; 1-click direct join!
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
            isVerifiedByTeacher: true, // Sheikh invited them; 1-click direct join!
          },
        }).catch(() => {});
      }
    }

    // Send database notifications to each student without duplicate spam
    for (const uid of Array.from(studentUserIdsToNotify)) {
      const existing = await prisma.notification.findFirst({
        where: {
          userId: uid,
          type: "HALAQA_STARTING",
          link: `/classroom/${liveSession.id}?role=student`,
        },
      });

      if (!existing) {
        await prisma.notification.create({
          data: {
            userId: uid,
            title: `بدأت الحلقة الآن: ${halaqa.name}`,
            body: `فضيلة ${user?.name || "الشيخ"} في انتظارك في الغرفة الافتراضية، اضغط للانضمام مباشرة.`,
            type: "HALAQA_STARTING",
            link: `/classroom/${liveSession.id}?role=student`,
          },
        });
      }
    }

    // Broadcast Realtime Event to students (both halaqa-specific and global channels)
    const livePayload = {
      halaqaId,
      sessionId: liveSession.id,
      title: sessionTitle,
      halaqaName: halaqa.name,
      teacherName: user?.name || "معلم ومقرئ الحلقة",
    };

    realtimeHub.broadcast(`halaqa-${halaqaId}`, {
      type: "HALAQA_LIVE_STARTED",
      payload: livePayload,
    });

    realtimeHub.broadcast("global", {
      type: "HALAQA_LIVE_STARTED",
      payload: livePayload,
    });

    realtimeHub.broadcast("global", {
      type: "NEW_NOTIFICATION",
      payload: { sessionId: liveSession.id, halaqaId },
    });

    return NextResponse.json({ success: true, session: liveSession });
  } catch (error) {
    console.error("Create live session error:", error);
    return NextResponse.json({ error: "فشل إنشاء الجلسة المباشرة" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {}

    const sessionId = body?.sessionId;

    // End targeted session or all active sessions
    if (sessionId && sessionId !== "auto" && sessionId !== "all") {
      await prisma.liveSession.updateMany({
        where: { id: sessionId },
        data: { status: "ENDED", endedAt: new Date() },
      });
      await prisma.notification.updateMany({
        where: {
          type: "HALAQA_STARTING",
          link: { contains: sessionId },
        },
        data: { isRead: true },
      });
    } else {
      await prisma.liveSession.updateMany({
        where: { status: "ACTIVE" },
        data: { status: "ENDED", endedAt: new Date() },
      });
      await prisma.notification.updateMany({
        where: {
          type: "HALAQA_STARTING",
          isRead: false,
        },
        data: { isRead: true },
      });
    }

    await prisma.halaqa.updateMany({
      data: {
        isLiveNow: false,
        currentLiveSessionId: null,
      },
    });

    realtimeHub.broadcast("global", {
      type: "HALAQA_LIVE_ENDED",
      payload: { sessionId: sessionId || "all" },
    });

    return NextResponse.json({ success: true, message: "تم إنهاء الجلسة بنجاح" });
  } catch (error) {
    console.error("End live session error:", error);
    return NextResponse.json({ error: "فشل إنهاء الجلسة" }, { status: 500 });
  }
}
