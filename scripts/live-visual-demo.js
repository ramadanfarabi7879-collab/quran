const puppeteer = require("puppeteer-core");

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runVisualDemo() {
  console.log("==================================================");
  console.log("   بدء العرض التفاعلي الحي أمام المستخدم في المتصفح   ");
  console.log("==================================================");

  // 1. Launch Student Browser (Left Half of Screen)
  console.log("1. فتح نافذة الطالب (يسار الشاشة)...");
  const studentBrowser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: false,
    defaultViewport: null,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--autoplay-policy=no-user-gesture-required",
      "--window-position=20,40",
      "--window-size=920,960",
      "--app=http://localhost:3000/student/dashboard",
    ],
  });

  const [studentPage] = await studentBrowser.pages();
  await sleep(2000);

  // Click on page to ensure audio context is active
  await studentPage.click("body").catch(() => {});

  // 2. Launch Teacher Browser (Right Half of Screen)
  console.log("2. فتح نافذة المعلم (يمين الشاشة)...");
  const teacherBrowser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: false,
    defaultViewport: null,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--autoplay-policy=no-user-gesture-required",
      "--window-position=960,40",
      "--window-size=920,960",
      "--app=http://localhost:3000/teacher/dashboard",
    ],
  });

  const [teacherPage] = await teacherBrowser.pages();
  await sleep(3000);

  // 3. Teacher initiates live session
  console.log("3. المعلم يضغط على زر 'إنشاء جلسة الآن'...");
  await teacherPage.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    const btn = buttons.find((b) => b.textContent && b.textContent.includes("إنشاء جلسة الآن"));
    if (btn) btn.click();
  });

  await sleep(2500);

  console.log("4. المعلم يضغط على 'دخول الغرفة وبث الإشعار'...");
  await teacherPage.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    const btn = buttons.find((b) => b.textContent && b.textContent.includes("دخول الغرفة وبث الإشعار"));
    if (btn) btn.click();
  });

  console.log("5. تم بث حدث البث المباشر! راقب نافذة الطالب الآن لسماع رنين التنبيه ومشاهدة النافذة المنبثقة...");
  await sleep(4000);

  // 6. Student sees popup and clicks join
  console.log("6. الطالب يضغط على 'انضم للجلسة مباشرة الآن'...");
  await studentPage.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    const btn = buttons.find((b) => b.textContent && b.textContent.includes("انضم للجلسة مباشرة الآن"));
    if (btn) btn.click();
  });

  console.log("==================================================");
  console.log("   اكتمل العرض بنجاح! كلا النافذتين متاحتان أمامك الآن   ");
  console.log("==================================================");

  // Keep browsers open so the user can see and interact with both
  // We keep the process alive for 3 minutes (or until user closes them)
  await sleep(180000);
}

runVisualDemo().catch(console.error);
