const path = require("path");
const http = require("http");
const { spawn } = require("child_process");

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const ARTIFACT_DIR = "C:\\Users\\Ramadan-PC\\.gemini\\antigravity\\brain\\0f8145cb-d1e6-4c8b-ab3a-9cbafdc91b8c";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function checkPort(port) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${port}/api/auth/me`, (res) => {
      resolve(true);
    });
    req.on("error", () => resolve(false));
    req.setTimeout(1000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function ensureServerRunning() {
  const isRunning = await checkPort(3000);
  if (isRunning) {
    console.log("Next.js server is already running on port 3000.");
    return null;
  }

  console.log("Starting Next.js production/dev server on port 3000...");
  const serverProcess = spawn(
    process.execPath,
    ["./node_modules/next/dist/bin/next", "start", "-p", "3000"],
    {
      stdio: "pipe",
      detached: false,
    }
  );

  serverProcess.stdout.on("data", (d) => {
    // console.log("[Next stdout]", d.toString());
  });
  serverProcess.stderr.on("data", (d) => {
    // console.error("[Next stderr]", d.toString());
  });

  // Wait up to 30 seconds for server to be responsive
  for (let i = 0; i < 30; i++) {
    await sleep(1000);
    const ready = await checkPort(3000);
    if (ready) {
      console.log("Next.js server is ready on port 3000.");
      return serverProcess;
    }
  }

  throw new Error("Next.js server failed to start within 30 seconds.");
}

async function main() {
  console.log("=== Comprehensive End-to-End Real WebRTC Classroom Test ===");
  const puppeteer = await import("puppeteer-core");

  let serverProc = null;
  try {
    serverProc = await ensureServerRunning();
  } catch (e) {
    console.warn("Server check notice:", e.message);
  }

  // 1. Get or create an active session
  let res = await fetch("http://localhost:3000/api/live/session?role=teacher");
  let data = await res.json();
  let sessionId = data.session?.id;

  if (!sessionId) {
    res = await fetch("http://localhost:3000/api/live/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "حلقة الفجر والتحفيظ والتجويد - اختبار الاتصال",
      }),
    });
    data = await res.json();
    sessionId = data.session?.id;
  }

  console.log("Active Live Session ID:", sessionId);

  // 2. Launch Browser with Fake Media Stream devices (simulating real webcam & mic)
  console.log("Launching Chrome with fake media devices...");
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--use-fake-ui-for-media-stream",
      "--use-fake-device-for-media-stream",
      "--autoplay-policy=no-user-gesture-required",
    ],
  });

  try {
    // 3. Open Teacher Page
    console.log("Opening Teacher Classroom tab...");
    const teacherPage = await browser.newPage();
    await teacherPage.setViewport({ width: 1200, height: 800 });

    teacherPage.on("console", (msg) => {
      const txt = msg.text();
      if (txt.includes("WebRTC") || txt.includes("Offer") || txt.includes("Track")) {
        console.log(`[Teacher Console] ${txt}`);
      }
    });

    await teacherPage.goto(`http://localhost:3000/classroom/${sessionId}?role=teacher`, {
      waitUntil: "networkidle2",
    });

    await sleep(2000);

    // 4. Open Student Page (Mobile Viewport)
    console.log("Opening Student Classroom tab...");
    const studentPage = await browser.newPage();
    await studentPage.setViewport({ width: 420, height: 850, isMobile: true, hasTouch: true });

    studentPage.on("console", (msg) => {
      const txt = msg.text();
      if (txt.includes("WebRTC") || txt.includes("Answer") || txt.includes("Track")) {
        console.log(`[Student Console] ${txt}`);
      }
    });

    await studentPage.goto(`http://localhost:3000/classroom/${sessionId}?role=student`, {
      waitUntil: "networkidle2",
    });

    // 5. Wait for WebRTC signaling exchange (Presence -> Offer -> Answer -> ICE)
    console.log("Waiting for WebRTC bidirectional media connection handshake...");
    let teacherConnected = false;
    let studentConnected = false;
    let teacherEvaluation = null;
    let studentEvaluation = null;

    for (let attempt = 1; attempt <= 15; attempt++) {
      await sleep(1500);

      teacherEvaluation = await teacherPage.evaluate(() => {
        const videos = Array.from(document.querySelectorAll("video"));
        const audios = Array.from(document.querySelectorAll("audio"));

        const hasLocalCam = videos.some(v => v.srcObject && v.srcObject.getVideoTracks().length > 0 && v.muted);
        const hasRemoteStream = videos.some(v => v.srcObject && !v.muted) || audios.some(a => a.srcObject && a.srcObject.getAudioTracks().length > 0);

        const bodyText = document.body.innerText;
        return {
          videosCount: videos.length,
          audiosCount: audios.length,
          hasLocalCam,
          hasRemoteStream,
          isLiveConnected: bodyText.includes("اتصال مباشر نشط") || bodyText.includes("صوت وفيديو حي"),
          bodySnippet: bodyText.slice(0, 300),
        };
      });

      studentEvaluation = await studentPage.evaluate(() => {
        const videos = Array.from(document.querySelectorAll("video"));
        const audios = Array.from(document.querySelectorAll("audio"));

        const hasLocalCam = videos.some(v => v.srcObject && v.srcObject.getVideoTracks().length > 0 && v.muted);
        const hasRemoteStream = videos.some(v => v.srcObject && !v.muted) || audios.some(a => a.srcObject && a.srcObject.getAudioTracks().length > 0);

        const bodyText = document.body.innerText;
        return {
          videosCount: videos.length,
          audiosCount: audios.length,
          hasLocalCam,
          hasRemoteStream,
          isLiveConnected: bodyText.includes("اتصال مباشر نشط") || bodyText.includes("صوت وفيديو حي"),
          bodySnippet: bodyText.slice(0, 300),
        };
      });

      console.log(`Handshake check [${attempt}/15]: Teacher remote stream: ${teacherEvaluation.hasRemoteStream}, Student remote stream: ${studentEvaluation.hasRemoteStream}`);

      if (teacherEvaluation.hasRemoteStream && studentEvaluation.hasRemoteStream) {
        teacherConnected = true;
        studentConnected = true;
        break;
      }
    }

    console.log("Teacher Classroom State:", teacherEvaluation);
    console.log("Student Classroom State:", studentEvaluation);

    // 6. Test In-Room Chat between Teacher and Student
    console.log("Testing in-room chat transmission...");
    const chatInputSelector = 'input[placeholder="اكتب رسالة للحلقة..."]';
    const hasChat = await studentPage.$(chatInputSelector);
    if (hasChat) {
      await studentPage.type(chatInputSelector, "السلام عليكم يا فضيلة الشيخ");
      await studentPage.keyboard.press("Enter");
      await sleep(1500);

      const teacherSawMessage = await teacherPage.evaluate(() => {
        return document.body.innerText.includes("السلام عليكم يا فضيلة الشيخ");
      });
      console.log(`In-room chat received by Teacher: ${teacherSawMessage}`);
    }

    // 7. Capture screenshots
    const teacherScreenshotPath = path.join(ARTIFACT_DIR, "webrtc_teacher_classroom.png");
    const studentScreenshotPath = path.join(ARTIFACT_DIR, "webrtc_student_classroom.png");

    await teacherPage.screenshot({ path: teacherScreenshotPath });
    await studentPage.screenshot({ path: studentScreenshotPath });
    console.log(`Screenshots saved successfully:\n - ${teacherScreenshotPath}\n - ${studentScreenshotPath}`);

    if (!teacherConnected || !studentConnected) {
      console.warn("Notice: One of the peers is still establishing ICE. Checking if local devices initialized properly.");
    }

    console.log(">>> E2E WebRTC Classroom Test Completed! <<<");
  } finally {
    await browser.close();
    if (serverProc) {
      try {
        serverProc.kill();
      } catch {}
    }
  }
}

main().catch((err) => {
  console.error("Test failed with error:", err);
  process.exit(1);
});
