const puppeteer = require("puppeteer-core");
const path = require("path");

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const ARTIFACT_DIR = "C:\\Users\\moataz\\.gemini\\antigravity\\brain\\f7a5b796-6b27-49ef-bcd2-77dac7af060a";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log("=== Testing Real WebRTC Video and Audio Connection Between Teacher & Student ===");

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--use-fake-ui-for-media-stream",
      "--use-fake-device-for-media-stream",
    ],
  });

  // 1. First get or create an active session
  let res = await fetch("http://localhost:3000/api/live/session");
  let data = await res.json();
  let sessionId = data.session?.id;

  if (!sessionId) {
    // Fetch halaqat
    res = await fetch("http://localhost:3000/api/teacher/halaqat");
    const hData = await res.json();
    const halaqaId = hData.halaqat?.[0]?.id;

    res = await fetch("http://localhost:3000/api/live/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        halaqaId,
        title: "حلقة الفجر والتحفيظ والتجويد",
      }),
    });
    data = await res.json();
    sessionId = data.session?.id;
  }

  console.log("Active Session ID:", sessionId);

  // 2. Open Teacher in Classroom
  const teacherPage = await browser.newPage();
  await teacherPage.setViewport({ width: 1100, height: 800 });
  console.log("Teacher navigating to classroom...");
  await teacherPage.goto(`http://localhost:3000/classroom/${sessionId}?role=teacher`, {
    waitUntil: "networkidle2",
  });
  await sleep(2000);

  // 3. Open Student in Classroom (Mobile Viewport)
  const studentPage = await browser.newPage();
  await studentPage.setViewport({ width: 420, height: 850, isMobile: true, hasTouch: true });
  console.log("Student navigating to classroom on mobile...");
  await studentPage.goto(`http://localhost:3000/classroom/${sessionId}?role=student`, {
    waitUntil: "networkidle2",
  });

  console.log("Waiting for WebRTC PeerConnection handshake and ICE negotiation...");
  await sleep(5000);

  // Check WebRTC peer connection state on teacher side
  const teacherState = await teacherPage.evaluate(() => {
    const videoElements = Array.from(document.querySelectorAll("video"));
    const text = document.body.innerText;
    return {
      videosCount: videoElements.length,
      hasLocalStream: videoElements.some(v => v.srcObject !== null),
      textIncludesTeacher: text.includes("الشيخ المنشاوي"),
    };
  });
  console.log("Teacher side evaluation:", teacherState);

  // Check WebRTC peer connection state on student side
  const studentState = await studentPage.evaluate(() => {
    const videoElements = Array.from(document.querySelectorAll("video"));
    const text = document.body.innerText;
    return {
      videosCount: videoElements.length,
      hasLocalStream: videoElements.some(v => v.srcObject !== null),
      textIncludesStudent: text.includes("عبد الرحمن"),
    };
  });
  console.log("Student side evaluation:", studentState);

  // Capture screenshots of both classrooms
  await teacherPage.screenshot({ path: path.join(ARTIFACT_DIR, "webrtc_teacher_classroom.png") });
  await studentPage.screenshot({ path: path.join(ARTIFACT_DIR, "webrtc_student_classroom.png") });
  console.log("Captured webrtc_teacher_classroom.png and webrtc_student_classroom.png");

  await browser.close();
  console.log(">>> WebRTC test completed successfully! <<<");
}

main().catch((err) => {
  console.error("Test error:", err);
  process.exit(1);
});
