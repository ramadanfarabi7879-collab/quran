import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=========================================");
  console.log("   تصفير قاعدة البيانات بالكامل وتجهيز الحسابين   ");
  console.log("=========================================");

  // 1. Delete all existing records
  console.log("1. جاري حذف جميع البيانات السابقة (تصفير شامل)...");
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.message.deleteMany();
  await prisma.sessionRecording.deleteMany();
  await prisma.halaqaBook.deleteMany();
  await prisma.libraryBook.deleteMany();
  await prisma.evaluation.deleteMany();
  await prisma.memorizationRecord.deleteMany();
  await prisma.assignmentSubmission.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.mushafSessionState.deleteMany();
  await prisma.sessionAttendance.deleteMany();
  await prisma.liveSession.deleteMany();
  await prisma.joinRequest.deleteMany();
  await prisma.halaqaEnrollment.deleteMany();
  await prisma.halaqa.deleteMany();
  await prisma.studentProfile.deleteMany();
  await prisma.teacherProfile.deleteMany();
  await prisma.user.deleteMany();
  await prisma.platformSetting.deleteMany();

  console.log("تم تصفير جميع الجداول بنجاح.");

  // 2. Platform Settings
  console.log("2. إنشاء الإعدادات العامة للمنصة...");
  await prisma.platformSetting.createMany({
    data: [
      { key: "platform_name", value: "وَرَتِّلْ - منصة تحفيظ القرآن الكريم" },
      {
        key: "platform_description",
        value: "أكاديمية تعليمية متكاملة لتحفيظ القرآن الكريم والتجويد والعلوم الشرعية عن بُعد",
      },
      { key: "logo_url", value: "/images/quran-logo.svg" },
      { key: "primary_color", value: "#064e3b" },
      { key: "accent_gold", value: "#d4af37" },
      { key: "allow_registration", value: "true" },
      { key: "default_retention_days", value: "30" },
      { key: "contact_email", value: "support@warattel.com" },
    ],
  });

  // 3. User 1: المعلم (الشيخ أحمد المنشاوي)
  console.log("3. إنشاء حساب المعلم الوحيد...");
  const teacherUser = await prisma.user.create({
    data: {
      email: "teacher@quran.com",
      name: "الشيخ أحمد المنشاوي",
      password: "teacher",
      role: "TEACHER",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200",
      phone: "+966500000002",
      teacherProfile: {
        create: {
          title: "المقرئ الشيخ",
          bio: "مجاز في القراءات العشر بسند متصل، حاصل على إجازة في الجزرية، مع خبرة 15 عاماً في إقراء القرآن الكريم.",
          specialties: "القراءات العشر، مخارج الحروف، التجويد النظري والتطبيقي",
          allowStudentMessaging: true,
          messagingStartHour: 8,
          messagingEndHour: 22,
          defaultAttendanceGraceMinutes: 15,
          recordingsRetentionDays: 30,
        },
      },
    },
    include: { teacherProfile: true },
  });

  // 4. User 2: الطالب (عبد الرحمن العلي)
  console.log("4. إنشاء حساب الطالب الوحيد...");
  const studentUser = await prisma.user.create({
    data: {
      email: "student@quran.com",
      name: "عبد الرحمن محمد العلي",
      password: "student",
      role: "STUDENT",
      avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200",
      phone: "+966500000011",
      studentProfile: {
        create: {
          studentNumber: "STU-1001",
          guardianName: "محمد العلي",
          guardianPhone: "+966500000012",
          currentJuz: 1,
          totalMemorizedAyahs: 0,
          totalReviewedAyahs: 0,
        },
      },
    },
    include: { studentProfile: true },
  });

  // 5. Create 1 Main Halaqa belonging to the Teacher and enroll the Student
  console.log("5. إنشاء حلقة قرآنية نشطة وتسكين الطالب بها...");
  const halaqa = await prisma.halaqa.create({
    data: {
      name: "حلقة الفجر والتحفيظ والتجويد",
      description: "حلقة مخصصة للحفظ المتقن وتثبيت القرآن الكريم مع أحكام التجويد العملية اليومية.",
      teacherId: teacherUser.teacherProfile!.id,
      capacity: 10,
      level: "متقدم",
      scheduleDays: "السبت, الإثنين, الأربعاء",
      startTime: "16:00",
      endTime: "17:30",
      status: "ACTIVE",
      isLiveNow: false,
    },
  });

  // Enroll student in this halaqa
  await prisma.halaqaEnrollment.create({
    data: {
      halaqaId: halaqa.id,
      studentId: studentUser.studentProfile!.id,
      status: "ACTIVE",
    },
  });

  console.log("=========================================");
  console.log("   تم بنجاح تصفير المنصة وإنشاء الحسابين:   ");
  console.log("   1. حساب المعلم: teacher@quran.com / teacher");
  console.log("   2. حساب الطالب: student@quran.com / student");
  console.log(`   3. الحلقة: ${halaqa.name} (مسجل بها الطالب)`);
  console.log("=========================================");
}

main()
  .catch((e) => {
    console.error("Error resetting data:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
