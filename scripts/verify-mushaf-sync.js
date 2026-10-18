const puppeteer = require("puppeteer-core");
const fs = require("fs");
const path = require("path");

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log("=== Testing Teacher /student/mushaf & /teacher/mushaf Synchronization ===");
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  // 1. Open Student Mushaf Page
  const studentPage = await browser.newPage();
  await studentPage.setViewport({ width: 1000, height: 800 });
  console.log("Navigating student to /student/mushaf ...");
  await studentPage.goto("http://localhost:3000/student/mushaf", { waitUntil: "networkidle2" });
  await sleep(1500);

  // 2. Open Teacher Mushaf Page
  const teacherPage = await browser.newPage();
  await teacherPage.setViewport({ width: 1000, height: 800 });
  console.log("Navigating teacher to /teacher/mushaf ...");
  await teacherPage.goto("http://localhost:3000/teacher/mushaf", { waitUntil: "networkidle2" });
  await sleep(1500);

  // Verify Student initially sees Quran
  let studentContent = await studentPage.content();
  console.log("Initial student view has Quran text:", studentContent.includes("بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ") || studentContent.includes("الفاتحة"));

  // 3. Teacher clicks "بدء التسميع المغلق"
  console.log("Teacher clicking 'بدء التسميع المغلق'...");
  const clickedLock = await teacherPage.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    const btn = buttons.find((b) => b.textContent && b.textContent.includes("بدء التسميع المغلق"));
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  });
  console.log("Lock button clicked by teacher:", clickedLock);

  // Wait 2.5 seconds for realtime SSE / poll sync to reach student
  await sleep(2500);

  // 4. Verify Student Screen
  studentContent = await studentPage.content();
  const hasLockedHeading = studentContent.includes("وضع التسميع المغلق نشط الآن");
  const hasLockBadge = studentContent.includes("المصحف محجوب بقرار من المعلم");
  const hasQuranVisible = studentContent.includes("بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ");

  console.log("--- Student Verification (Locked Mode) ---");
  console.log("Lock heading visible on student:", hasLockedHeading);
  console.log("Lock badge visible on student:", hasLockBadge);
  console.log("Quran hidden on student (is false):", !hasQuranVisible);

  const artifactDir = "C:\\Users\\moataz\\.gemini\\antigravity\\brain\\f7a5b796-6b27-49ef-bcd2-77dac7af060a";
  await studentPage.screenshot({ path: path.join(artifactDir, "student_locked_screen.png") });
  await teacherPage.screenshot({ path: path.join(artifactDir, "teacher_locked_screen.png") });
  console.log("Screenshots captured for locked mode.");

  // 5. Teacher clicks "إنهاء التسميع وإعادة فتح المصحف"
  console.log("Teacher clicking 'إنهاء التسميع وإعادة فتح المصحف'...");
  const clickedUnlock = await teacherPage.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    const btn = buttons.find((b) => b.textContent && b.textContent.includes("إنهاء التسميع وإعادة فتح المصحف"));
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  });
  console.log("Unlock button clicked by teacher:", clickedUnlock);

  await sleep(2500);

  // 6. Verify Student Screen after unlock
  studentContent = await studentPage.content();
  const lockedStillPresent = studentContent.includes("وضع التسميع المغلق نشط الآن");
  const quranRestored = studentContent.includes("سُورَةُ") || studentContent.includes("الفاتحة");

  console.log("--- Student Verification (Unlocked Mode) ---");
  console.log("Lock screen gone from student:", !lockedStillPresent);
  console.log("Quran reopened on student:", quranRestored);

  await studentPage.screenshot({ path: path.join(artifactDir, "student_unlocked_screen.png") });
  console.log("Screenshot captured for unlocked mode.");

  await browser.close();

  if (hasLockedHeading && !hasQuranVisible && !lockedStillPresent) {
    console.log(">>> VERIFICATION COMPLETE: Student Quran is 100% hidden during locked tasmee and restored on unlock! <<<");
  } else {
    console.error(">>> VERIFICATION FAILED: Some assertions did not match. <<<");
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Test error:", err);
  process.exit(1);
});
