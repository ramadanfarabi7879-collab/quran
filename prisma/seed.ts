import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Clean existing data
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

  // Platform Settings
  await prisma.platformSetting.createMany({
    data: [
      { key: "platform_name", value: "منصة ورتّل لتحفيظ القرآن الكريم" },
      {
        key: "platform_description",
        value: "أكاديمية تعليمية متكاملة لتحفيظ القرآن الكريم والتجويد والعلوم الشرعية عن بُعد مع إدارة الحلقات الحية والتحكم التفاعلي بالمصحف",
      },
      { key: "logo_url", value: "/images/quran-logo.svg" },
      { key: "primary_color", value: "#064e3b" },
      { key: "accent_gold", value: "#d4af37" },
      { key: "allow_registration", value: "true" },
      { key: "default_retention_days", value: "30" },
      { key: "contact_email", value: "support@warattel.com" },
    ],
  });

  // 1. Admin
  const admin = await prisma.user.create({
    data: {
      email: "admin@quran.com",
      name: "مدير المنصة العام",
      password: "admin",
      role: "ADMIN",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
      phone: "+966500000001",
    },
  });

  // 2. Teacher الشيخ أحمد المنشاوي
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
          bio: "مجاز في القراءات العشر الصغرى والكبرى بسند متصل، حاصل على إجازة في الجزرية وتحفة الأطفال، مع خبرة 15 عاماً في إقراء القرآن الكريم.",
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

  const teacherProfileId = teacherUser.teacherProfile!.id;

  // 3. Students
  // Student 1: عبد الرحمن العلي
  const student1User = await prisma.user.create({
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
          currentJuz: 3,
          totalMemorizedAyahs: 286,
          totalReviewedAyahs: 140,
        },
      },
    },
    include: { studentProfile: true },
  });
  const student1ProfileId = student1User.studentProfile!.id;

  // Student 2: عمر السعيد
  const student2User = await prisma.user.create({
    data: {
      email: "omar@quran.com",
      name: "عمر خالد السعيد",
      password: "student",
      role: "STUDENT",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200",
      phone: "+966500000021",
      studentProfile: {
        create: {
          studentNumber: "STU-1002",
          guardianName: "خالد السعيد",
          guardianPhone: "+966500000022",
          currentJuz: 1,
          totalMemorizedAyahs: 141,
          totalReviewedAyahs: 75,
        },
      },
    },
    include: { studentProfile: true },
  });
  const student2ProfileId = student2User.studentProfile!.id;

  // Student 3: فاطمة الشامي
  const student3User = await prisma.user.create({
    data: {
      email: "fatima@quran.com",
      name: "فاطمة إبراهيم الشامي",
      password: "student",
      role: "STUDENT",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200",
      phone: "+966500000031",
      studentProfile: {
        create: {
          studentNumber: "STU-1003",
          guardianName: "إبراهيم الشامي",
          guardianPhone: "+966500000032",
          currentJuz: 5,
          totalMemorizedAyahs: 450,
          totalReviewedAyahs: 300,
        },
      },
    },
    include: { studentProfile: true },
  });
  const student3ProfileId = student3User.studentProfile!.id;

  // Student 4 (New Request): زياد الحربي
  const student4User = await prisma.user.create({
    data: {
      email: "ziad@quran.com",
      name: "زياد أحمد الحربي",
      password: "student",
      role: "STUDENT",
      avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=200",
      phone: "+966500000041",
      studentProfile: {
        create: {
          studentNumber: "STU-1004",
          guardianName: "أحمد الحربي",
          guardianPhone: "+966500000042",
          currentJuz: 1,
        },
      },
    },
    include: { studentProfile: true },
  });
  const student4ProfileId = student4User.studentProfile!.id;

  // 4. Halaqat
  const halaqaFajr = await prisma.halaqa.create({
    data: {
      name: "حلقة الفجر لتحفيظ القرآن",
      description: "حلقة مخصصة للحفظ المتقن وتثبيت القرآن الكريم مع أحكام التجويد العملية اليومية في وقت الفجر المبارك.",
      teacherId: teacherProfileId,
      capacity: 15,
      level: "متقدم",
      scheduleDays: "السبت, الإثنين, الأربعاء",
      startTime: "05:30",
      endTime: "07:00",
      status: "ACTIVE",
      isLiveNow: false,
    },
  });

  const halaqaFurqan = await prisma.halaqa.create({
    data: {
      name: "حلقة الفرقان لتصحيح التلاوة وتلقين جزء عم",
      description: "حلقة تركز على تصحيح مخارج الحروف وقواعد الوقف والابتداء للمبتدئين والناشئة.",
      teacherId: teacherProfileId,
      capacity: 20,
      level: "مبتدئ",
      scheduleDays: "الأحد, الثلاثاء, الخميس",
      startTime: "16:30",
      endTime: "18:00",
      status: "ACTIVE",
      isLiveNow: false,
    },
  });

  // Enrollments
  await prisma.halaqaEnrollment.create({
    data: {
      halaqaId: halaqaFajr.id,
      studentId: student1ProfileId,
      status: "ACTIVE",
    },
  });

  await prisma.halaqaEnrollment.create({
    data: {
      halaqaId: halaqaFajr.id,
      studentId: student2ProfileId,
      status: "ACTIVE",
    },
  });

  await prisma.halaqaEnrollment.create({
    data: {
      halaqaId: halaqaFurqan.id,
      studentId: student3ProfileId,
      status: "ACTIVE",
    },
  });

  // Pending Join Request for Ziad
  await prisma.joinRequest.create({
    data: {
      halaqaId: halaqaFajr.id,
      studentId: student4ProfileId,
      status: "PENDING",
      notes: "طالب حريص على الالتزام بحلقة الفجر، أتم حفظ جزأي عم وتبارك ويريد البدء في سورة البقرة.",
    },
  });

  // 5. Assignments
  const assignment1 = await prisma.assignment.create({
    data: {
      halaqaId: halaqaFajr.id,
      teacherId: teacherProfileId,
      title: "حفظ سورة البقرة من الآية 1 إلى الآية 25",
      type: "NEW_MEMORIZATION",
      surahNumber: 2,
      startAyah: 1,
      endAyah: 25,
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // in 2 days
      instructions: "يرجى مراعاة أحكام النون الساكنة والتنوين والمدود، وتسجيل التسميع بصوت واضح.",
    },
  });

  const assignment2 = await prisma.assignment.create({
    data: {
      halaqaId: halaqaFajr.id,
      teacherId: teacherProfileId,
      title: "مراجعة سورة النبأ وسورة النازعات",
      type: "REVIEW",
      surahNumber: 78,
      startAyah: 1,
      endAyah: 40,
      dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      instructions: "تثبيت وضبط أوائل الآيات ومخارج الحروف.",
    },
  });

  // Submissions
  await prisma.assignmentSubmission.create({
    data: {
      assignmentId: assignment1.id,
      studentId: student1ProfileId,
      status: "GRADED",
      grade: 96,
      notes: "تم الحفظ بفضل الله وتم تسجيل المقطع الصوتي.",
      teacherFeedback: "ما شاء الله، قراءة ممتازة وأداء رائع، فقط انتبه لغنّة الإخفاء في قوله تعالى (كُنتُمْ). بارك الله فيك.",
    },
  });

  // 6. Memorization & Evaluations Records
  await prisma.memorizationRecord.create({
    data: {
      studentId: student1ProfileId,
      teacherId: teacherProfileId,
      halaqaId: halaqaFajr.id,
      surahNumber: 2,
      startAyah: 1,
      endAyah: 20,
      recordType: "NEW_MEMORIZATION",
      mistakesCount: 1,
      alertsCount: 2,
      tajweedLevel: "ممتاز",
      memorizationScore: 97.0,
      notes: "حفظ متين، ضبط جيد للمتشابهات.",
    },
  });

  await prisma.evaluation.create({
    data: {
      studentId: student1ProfileId,
      teacherId: teacherProfileId,
      score: 95.0,
      gradeLabel: "ممتاز",
      tajweedScore: 94.0,
      memorizationScore: 96.0,
      notes: "تسميع متقن والتزام تام بآداب الحلقة.",
      nextAssignmentText: "سورة البقرة من الآية 26 إلى الآية 45",
    },
  });

  // 7. Library Books
  const books = [
    {
      title: "نور البيان في تعليم القراءة وترتيل القرآن",
      author: "الشيخ طارق السعيد",
      category: "نور البيان",
      description: "المنهج المعتمد لتعليم الأطفال والمبتدئين التهجي القرآني الصحيح وتدرج القراءة والتجويد.",
      fileUrl: "/books/noor-al-bayan.pdf",
      coverUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=400",
      pagesCount: 88,
      uploadedBy: teacherUser.name,
    },
    {
      title: "تحفة الأطفال والغلمان في تجويد القرآن",
      author: "الشيخ سليمان الجمزوري",
      category: "أحكام التجويد",
      description: "منظومة شعرية ميسرة في علم التجويد تشمل أحكام النون الساكنة والتنوين والميم المشددة والمدود.",
      fileUrl: "/books/tuhfat-al-atfal.pdf",
      coverUrl: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80&w=400",
      pagesCount: 24,
      uploadedBy: teacherUser.name,
    },
    {
      title: "التفسير الميسر - جزء عم",
      author: "نخبة من العلماء - مجمع الملك فهد",
      category: "التفسير",
      description: "بيان معاني المفردات وتفسير ميسر لآيات جزء عم للمساعدة على فهم معاني الآيات أثناء الحفظ.",
      fileUrl: "/books/tafsir-muyassar.pdf",
      coverUrl: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=400",
      pagesCount: 65,
      uploadedBy: teacherUser.name,
    },
    {
      title: "المقدمة الجزرية في علم التجويد",
      author: "الإمام شمس الدين ابن الجزري",
      category: "أحكام التجويد",
      description: "المنظومة الأم في أحكام التجويد ومخارج الحروف وصفاتها للطلاب المتقدمين.",
      fileUrl: "/books/jazariyyah.pdf",
      coverUrl: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&q=80&w=400",
      pagesCount: 32,
      uploadedBy: teacherUser.name,
    },
  ];

  for (const b of books) {
    const createdBook = await prisma.libraryBook.create({ data: b });
    await prisma.halaqaBook.create({
      data: {
        halaqaId: halaqaFajr.id,
        bookId: createdBook.id,
      },
    });
  }

  // 8. Notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: student1User.id,
        title: "تكليف جديد في حلقة الفجر",
        body: "أضاف الشيخ أحمد المنشاوي واجباً جديداً: حفظ سورة البقرة (1 - 25).",
        type: "ASSIGNMENT_NEW",
        link: "/student/assignments",
      },
      {
        userId: student1User.id,
        title: "تقييم جديد لتسميعك الأخير",
        body: "حصلت على تقدير ممتاز (95%) في التسميع الأخير مع ملاحظات المشرف.",
        type: "EVALUATION_NEW",
        link: "/student/achievements",
      },
      {
        userId: teacherUser.id,
        title: "طلب انضمام جديد لحلقة الفجر",
        body: "قدم الطالب زياد الحربي طلباً للانضمام إلى حلقة الفجر لتحفيظ القرآن.",
        type: "JOIN_REQUEST",
        link: "/teacher/students?tab=requests",
      },
    ],
  });

  // 9. Initial Messages
  await prisma.message.create({
    data: {
      senderId: teacherUser.id,
      receiverId: student1User.id,
      content: "السلام عليكم ورحمة الله يا عبد الرحمن، أداؤك في حلقة اليوم كان ممتازاً ومتقناً، واصل على هذا الهمّة وفقك الله.",
    },
  });

  await prisma.message.create({
    data: {
      senderId: student1User.id,
      receiverId: teacherUser.id,
      content: "وعليكم السلام ورحمة الله وبركاته يا شيخنا الفاضل، جزاكم الله خيراً ونفع بكم وبعلمكم.",
    },
  });

  console.log("Database seeded successfully!");
  console.log("-----------------------------------------");
  console.log("Admin:   admin@quran.com / admin");
  console.log("Teacher: teacher@quran.com / teacher");
  console.log("Student: student@quran.com / student");
  console.log("-----------------------------------------");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
