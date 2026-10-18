const puppeteer = require("puppeteer-core");
const path = require("path");

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const ARTIFACT_DIR = "C:\\Users\\moataz\\.gemini\\antigravity\\brain\\f7a5b796-6b27-49ef-bcd2-77dac7af060a";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log("=== 1. Starting Puppeteer Mobile & Notification Test ===");
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  // --- PART 1: TEST MOBILE RESPONSIVENESS (iPhone 14 viewport: 390x844) ---
  console.log("Testing mobile responsiveness (390 x 844)...");
  const mobilePage = await browser.newPage();
  await mobilePage.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

  await mobilePage.goto("http://localhost:3000/student/dashboard", { waitUntil: "networkidle2" });
  await sleep(2500);

  // Take screenshot of student dashboard on mobile
  await mobilePage.screenshot({ path: path.join(ARTIFACT_DIR, "mobile_student_dashboard.png") });
  console.log("Saved mobile_student_dashboard.png");

  // Check mobile bottom navigation presence
  const hasBottomNav = await mobilePage.evaluate(() => {
    const nav = document.querySelector("nav.md\\:hidden");
    return nav !== null;
  });
  console.log("Mobile bottom nav bar present:", hasBottomNav);

  // Test opening mobile hamburger drawer
  console.log("Testing mobile hamburger drawer...");
  const openedDrawer = await mobilePage.evaluate(() => {
    const btn = document.querySelector("button[aria-label='فتح القائمة الجانبية']");
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  });
  console.log("Hamburger button clicked:", openedDrawer);
  await sleep(1000);

  await mobilePage.screenshot({ path: path.join(ARTIFACT_DIR, "mobile_drawer_opened.png") });
  console.log("Saved mobile_drawer_opened.png");

  // Close drawer
  await mobilePage.evaluate(() => {
    const closeBtn = document.querySelector("button[title='إغلاق القائمة']");
    if (closeBtn) closeBtn.click();
  });
  await sleep(500);

  // Navigate to student mushaf on mobile
  await mobilePage.goto("http://localhost:3000/student/mushaf", { waitUntil: "networkidle2" });
  await sleep(2000);
  await mobilePage.screenshot({ path: path.join(ARTIFACT_DIR, "mobile_student_mushaf.png") });
  console.log("Saved mobile_student_mushaf.png");

  // --- PART 2: TEST LIVE SESSION NOTIFICATION DISPATCH TO STUDENT ---
  console.log("\n--- PART 2: Testing Teacher creating session & Student receiving notification ---");

  // Open Teacher Page in desktop view
  const teacherPage = await browser.newPage();
  await teacherPage.setViewport({ width: 1200, height: 800 });
  await teacherPage.goto("http://localhost:3000/teacher/dashboard", { waitUntil: "networkidle2" });
  await sleep(2000);

  // Teacher clicks "إنشاء جلسة الآن"
  console.log("Teacher clicking 'إنشاء جلسة الآن'...");
  const clickedCreate = await teacherPage.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    const btn = buttons.find((b) => b.textContent && b.textContent.includes("إنشاء جلسة الآن"));
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  });
  console.log("Teacher clicked 'إنشاء جلسة الآن':", clickedCreate);
  await sleep(1000);

  // Inside the modal, teacher clicks "دخول الغرفة وبث الإشعار"
  const clickedStartLive = await teacherPage.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    const btn = buttons.find((b) => b.textContent && b.textContent.includes("دخول الغرفة وبث الإشعار"));
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  });
  console.log("Teacher clicked 'بدء البث فوراً':", clickedStartLive);

  // Wait 3.5 seconds for realtime SSE / polling sync to reach student mobile page
  await sleep(3500);

  // Check if Student Mobile Page received the live alert modal or banner!
  const studentPageContent = await mobilePage.content();
  const studentGotModal = studentPageContent.includes("بدأت الجلسة الآن مباشر") || studentPageContent.includes("في انتظارك الآن في الغرفة الافتراضية");
  const studentGotBanner = studentPageContent.includes("حلقة مباشرة منعقدة الآن");

  console.log("Student received live alert modal:", studentGotModal);
  console.log("Student received active session banner:", studentGotBanner);

  // Take screenshot of student receiving notification on mobile!
  await mobilePage.screenshot({ path: path.join(ARTIFACT_DIR, "mobile_student_notification_received.png") });
  console.log("Saved mobile_student_notification_received.png");

  await browser.close();

  if (studentGotModal || studentGotBanner) {
    console.log(">>> SUCCESS: Student received live notification on mobile flawlessly! <<<");
  } else {
    console.log(">>> Details: Modal:", studentGotModal, "Banner:", studentGotBanner);
  }
}

main().catch((err) => {
  console.error("Test error:", err);
  process.exit(1);
});
