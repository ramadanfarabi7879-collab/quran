import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting Clean Factory Reset of Database...");

  // 1. Clean all existing operational and test data
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

  // 2. Foundational Platform Settings
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

  // 3. Central System Admin (مدير المنصة العام)
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

  // 4. Official Quran Teacher / Sheikh
  const teacherUser = await prisma.user.create({
    data: {
      email: "teacher@quran.com",
      name: "معلم ومقرئ الحلقة",
      password: "teacher",
      role: "TEACHER",
      avatar: null,
      phone: "+966500000002",
      teacherProfile: {
        create: {
          title: "المقرئ الشيخ",
          bio: "مجاز في القراءات العشر بسند متصل، حاصل على إجازة في الجزرية وتحفة الأطفال، مع خبرة في إقراء القرآن الكريم.",
          specialties: "القراءات العشر، مخارج الحروف، التجويد النظري والتطبيقي",
          allowStudentMessaging: true,
          messagingStartHour: 8,
          messagingEndHour: 22,
          defaultAttendanceGraceMinutes: 15,
          recordingsRetentionDays: 30,
          autoApproveStudents: false,
        },
      },
    },
    include: { teacherProfile: true },
  });

  // 5. Standard Core Library Reference Books (كتب المنهج القرآني الأساسية)
  const standardBooks = [
    {
      title: "نور البيان في تعليم القراءة وترتيل القرآن",
      author: "الشيخ طارق السعيد",
      category: "نور البيان",
      description: "المنهج المعتمد لتعليم التهجي القرآني الصحيح وتدرج القراءة والتجويد.",
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
      description: "المنظومة الأم في أحكام التجويد ومخارج الحروف وصفاتها للطلاب والمجازين.",
      fileUrl: "/books/jazariyyah.pdf",
      coverUrl: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&q=80&w=400",
      pagesCount: 32,
      uploadedBy: teacherUser.name,
    },
  ];

  for (const b of standardBooks) {
    await prisma.libraryBook.create({ data: b });
  }

  console.log("Clean Factory Reset completed successfully!");
  console.log("-----------------------------------------");
  console.log("Admin Portal:   admin@quran.com / admin");
  console.log("Teacher Portal: teacher@quran.com / teacher");
  console.log("Student Data:   Clean slate (0 students, 0 fake halaqat, 0 notifications)");
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
