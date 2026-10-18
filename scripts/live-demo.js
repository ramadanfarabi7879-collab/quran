const puppeteer = require("puppeteer-core");
const path = require("path");
const fs = require("fs");

const ARTIFACT_DIR = "C:\\Users\\moataz\\.gemini\\antigravity\\brain\\f7a5b796-6b27-49ef-bcd2-77dac7af060a";
const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runDemo() {
  console.log("Starting Puppeteer browser...");
  if (!fs.existsSync(ARTIFACT_DIR)) {
    fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  }

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--autoplay-policy=no-user-gesture-required",
      "--window-size=1280,850",
    ],
    defaultViewport: { width: 1280, height: 850 },
  });

  try {
    // 1. Create Student Context
    const studentContext = await browser.createBrowserContext();
    const studentPage = await studentContext.newPage();
    console.log("1. Student opening /student/dashboard...");
    await studentPage.goto("http://localhost:3000/student/dashboard", { waitUntil: "networkidle2" });
    await sleep(1500);

    const s1Path = path.join(ARTIFACT_DIR, "step1_student_initial.png");
    await studentPage.screenshot({ path: s1Path });
    console.log("Saved Screenshot 1 (Student Initial):", s1Path);

    // 2. Create Teacher Context
    const teacherContext = await browser.createBrowserContext();
    const teacherPage = await teacherContext.newPage();
    console.log("2. Teacher opening /teacher/dashboard...");
    await teacherPage.goto("http://localhost:3000/teacher/dashboard", { waitUntil: "networkidle2" });
    await sleep(1500);

    // Teacher clicks "إنشاء جلسة الآن"
    console.log("3. Teacher opening Start Session modal...");
    await teacherPage.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      const btn = buttons.find((b) => b.textContent && b.textContent.includes("إنشاء جلسة الآن"));
      if (btn) btn.click();
    });
    await sleep(1000);

    const s2Path = path.join(ARTIFACT_DIR, "step2_teacher_modal.png");
    await teacherPage.screenshot({ path: s2Path });
    console.log("Saved Screenshot 2 (Teacher Modal):", s2Path);

    // Teacher clicks "دخول الغرفة وبث الإشعار"
    console.log("4. Teacher clicking 'دخول الغرفة وبث الإشعار'...");
    await teacherPage.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      const btn = buttons.find((b) => b.textContent && b.textContent.includes("دخول الغرفة وبث الإشعار"));
      if (btn) btn.click();
    });

    // Wait for teacher classroom to load
    await sleep(2500);
    const s3Path = path.join(ARTIFACT_DIR, "step3_teacher_classroom.png");
    await teacherPage.screenshot({ path: s3Path });
    console.log("Saved Screenshot 3 (Teacher Live Classroom):", s3Path);

    // 5. Back to Student Page: wait for SSE live popup to appear!
    console.log("5. Waiting for Student Dashboard to receive Live SSE Notification + Chime...");
    await sleep(2000);

    const s4Path = path.join(ARTIFACT_DIR, "step4_student_alert_popup.png");
    await studentPage.screenshot({ path: s4Path });
    console.log("Saved Screenshot 4 (Student Live Pop-up with Sound Chime):", s4Path);

    // 6. Student clicks "انضم للجلسة مباشرة الآن"
    console.log("6. Student clicks Join button...");
    await studentPage.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      const btn = buttons.find((b) => b.textContent && b.textContent.includes("انضم للجلسة مباشرة الآن"));
      if (btn) btn.click();
    });

    await sleep(2500);
    const s5Path = path.join(ARTIFACT_DIR, "step5_student_joined_classroom.png");
    await studentPage.screenshot({ path: s5Path });
    console.log("Saved Screenshot 5 (Student Inside Classroom):", s5Path);

    console.log("DEMO FINISHED SUCCESSFULLY!");
  } catch (err) {
    console.error("Demo failed:", err);
  } finally {
    await browser.close();
  }
}

runDemo();
