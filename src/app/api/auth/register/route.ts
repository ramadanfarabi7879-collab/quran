import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AUTH_COOKIE_NAME } from "@/lib/auth";
import { realtimeHub } from "@/lib/realtime";

function normalizeDigits(str: string): string {
  if (!str) return str;
  return str
    .replace(/[٠۰]/g, "0")
    .replace(/[١۱]/g, "1")
    .replace(/[٢۲]/g, "2")
    .replace(/[٣۳]/g, "3")
    .replace(/[٤۴]/g, "4")
    .replace(/[٥۵]/g, "5")
    .replace(/[٦۶]/g, "6")
    .replace(/[٧۷]/g, "7")
    .replace(/[٨۸]/g, "8")
    .replace(/[٩۹]/g, "9");
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      name,
      email,
      password,
      role,
      phone,
      age,
      currentLevel,
      preferredTrack,
      guardianName,
      guardianPhone,
      registrationNotes,
    } = body;

    const trimmedName = (name || "").trim();
    const trimmedPhone = normalizeDigits((phone || "").trim());
    const trimmedPassword = (password || "").trim();
    const trimmedEmail = (email || "").trim().toLowerCase();
    const trimmedGuardianPhone = guardianPhone ? normalizeDigits((guardianPhone || "").trim()) : null;

    if (!trimmedName || !trimmedPhone || !trimmedPassword) {
      return NextResponse.json(
        { error: "الاسم ورقم الجوال وكلمة المرور حقول أساسية مطلوبة" },
        { status: 400 }
      );
    }

    const cleanDigits = trimmedPhone.replace(/\D/g, "");
    // Auto-generate unique placeholder email if not provided by student
    const finalEmail =
      trimmedEmail ||
      `stu_${cleanDigits || Date.now()}@quran.local`;

    // Parse age safely
    let parsedAgeNumber: number | null = null;
    if (age !== undefined && age !== null && String(age).trim() !== "") {
      const normalizedAgeStr = normalizeDigits(String(age).trim());
      const val = parseInt(normalizedAgeStr, 10);
      if (!isNaN(val) && val > 0 && val < 120) {
        parsedAgeNumber = val;
      }
    }

    // Check if phone or email already registered
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          ...(trimmedEmail ? [{ email: trimmedEmail }] : []),
          { phone: trimmedPhone },
          ...(cleanDigits ? [{ phone: { contains: cleanDigits } }] : []),
          { email: finalEmail },
        ],
      },
      include: {
        studentProfile: true,
      },
    });

    if (existing) {
      if (!existing.isActive) {
        return NextResponse.json(
          {
            error:
              "لديك طلب تسجيل مرسل بالفعل وهو قيد المراجعة والاعتماد لدى فضيلة الشيخ. سيتم التواصل معك قريباً.",
            requiresApproval: true,
            isExistingPending: true,
            user: {
              id: existing.id,
              name: existing.name,
              phone: existing.phone,
              role: existing.role,
            },
          },
          { status: 200 }
        );
      }
      return NextResponse.json(
        { error: "رقم الجوال أو البريد الإلكتروني مسجل بالفعل على المنصة" },
        { status: 400 }
      );
    }

    const userRole = role === "TEACHER" ? "TEACHER" : "STUDENT";
    const isStudent = userRole === "STUDENT";

    const user = await prisma.user.create({
      data: {
        name: trimmedName,
        email: finalEmail,
        password: trimmedPassword,
        role: userRole,
        phone: trimmedPhone,
        isActive: !isStudent, // Students require Sheikh review and approval
        ...(userRole === "TEACHER"
          ? {
              teacherProfile: {
                create: {
                  title: "المعلم",
                  bio: "معلم ومقرئ قرآن كريم",
                },
              },
            }
          : {
              studentProfile: {
                create: {
                  studentNumber: `STU-${Math.floor(1000 + Math.random() * 9000)}`,
                  guardianName: guardianName?.trim() || null,
                  guardianPhone: trimmedGuardianPhone,
                  age: parsedAgeNumber,
                  currentLevel: currentLevel || "مبتدئ / تأسيس",
                  preferredTrack: preferredTrack || "GROUP",
                  registrationNotes: registrationNotes?.trim() || null,
                },
              },
            }),
      },
      include: {
        teacherProfile: true,
        studentProfile: true,
      },
    });

    if (isStudent) {
      const parsedAge = age ? `${age} سنة` : "";
      const trackLabel =
        preferredTrack === "INDIVIDUAL"
          ? "مسار فردي"
          : preferredTrack === "FOUNDATION"
          ? "مسار تأسيس"
          : "حلقة جماعية";

      // 1. Notify Teachers and Admin in DB
      try {
        const teachersAndAdmins = await prisma.user.findMany({
          where: { role: { in: ["TEACHER", "ADMIN"] } },
        });

        for (const t of teachersAndAdmins) {
          await prisma.notification.create({
            data: {
              userId: t.id,
              title: "طلب تسجيل طالب جديد",
              body: `سجّل الطالب الجديد ${trimmedName} (${parsedAge || "طالب"} - ${currentLevel || "مبتدئ"} - رغبة: ${trackLabel})، بانتظار اعتمادك وتحديد مساره وموعده.`,
              type: "STUDENT_REGISTRATION_SUBMITTED",
              link: "/teacher/requests",
            },
          });
        }
      } catch (err) {
        console.error("Failed to create notifications for teacher:", err);
      }

      // 2. Broadcast realtime event so Sheikh hears chime & gets instant floating toast
      realtimeHub.broadcast("global", {
        type: "STUDENT_REGISTRATION_SUBMITTED",
        payload: {
          studentId: user.id,
          studentUserId: user.id,
          studentName: user.name,
          phone: user.phone || "",
          age: age || "",
          currentLevel: currentLevel || "",
          preferredTrack: preferredTrack || "GROUP",
          guardianName: guardianName || "",
          guardianPhone: guardianPhone || "",
          notes: registrationNotes || "",
          time: new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }),
        },
      });

      const studentResponse = NextResponse.json({
        success: true,
        requiresApproval: true,
        message:
          "تم استلام طلب تسجيلك بنجاح! انتهى دورك هنا، وطلبك الآن قيد المعالجة والمراجعة لدى فضيلة الشيخ لتحديد المسار والموعد المناسب.",
        user: {
          id: user.id,
          name: user.name,
          phone: user.phone,
          role: user.role,
        },
      });

      // Set session cookie so the student can receive the Sheikh decision overlay in real time
      studentResponse.cookies.set(AUTH_COOKIE_NAME, user.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
        sameSite: "lax",
      });

      return studentResponse;
    }

    // Teachers get logged in immediately
    const response = NextResponse.json({ success: true, user });
    response.cookies.set(AUTH_COOKIE_NAME, user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      sameSite: "lax",
    });

    return response;
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ error: "فشل إنشاء الحساب" }, { status: 500 });
  }
}
