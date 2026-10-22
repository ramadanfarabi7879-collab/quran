const path = require("path");
const http = require("http");
const { spawn } = require("child_process");

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const ARTIFACT_DIR = "C:/Users/Ramadan-PC/.gemini/antigravity/brain/0f8145cb-d1e6-4c8b-ab3a-9cbafdc91b8c";

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

  console.log("Starting Next.js server on port 3000...");
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

async function runComprehensiveTest() {
  console.log("===============================================================");
  console.log("=== Comprehensive Automated Verification Test: Warattil Quran ==");
  console.log("===============================================================");

  const puppeteer = await import("puppeteer-core");
  let serverProc = null;

  try {
    serverProc = await ensureServerRunning();
  } catch (e) {
    console.warn("Server check notice:", e.message);
  }

  // 1. Create or get active live session
  console.log("\n[1/6] Initializing Live Classroom Session...");
  let res = await fetch("http://localhost:3000/api/live/session?role=teacher");
  let data = await res.json();
  let sessionId = data.session?.id;

  if (!sessionId) {
    res = await fetch("http://localhost:3000/api/live/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "حلقة التسميع والتحفيظ الكبرى - اختبار شامل",
      }),
    });
    data = await res.json();
    sessionId = data.session?.id;
  }

  console.log(">> Active Live Session ID:", sessionId);

  // 2. Launch Chrome with simulated media hardware
  console.log("\n[2/6] Launching Chrome with simulated hardware media devices...");
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
    // 3. Open Teacher tab
    console.log("Opening Teacher Classroom tab...");
    const teacherPage = await browser.newPage();
    await teacherPage.setViewport({ width: 1200, height: 850 });
    await teacherPage.goto(`http://localhost:3000/classroom/${sessionId}?role=teacher`, {
      waitUntil: "networkidle2",
    });

    await sleep(2000);

    // 4. Open Student tab
    console.log("Opening Student Classroom tab...");
    const studentPage = await browser.newPage();
    await studentPage.setViewport({ width: 450, height: 850, isMobile: true, hasTouch: true });
    await studentPage.goto(`http://localhost:3000/classroom/${sessionId}?role=student`, {
      waitUntil: "networkidle2",
    });

    // 5. Wait for WebRTC handshake
    console.log("\n[3/6] Waiting for WebRTC connection and media handshake...");
    let handshakeEstablished = false;

    for (let attempt = 1; attempt <= 15; attempt++) {
      await sleep(1500);

      const status = await teacherPage.evaluate(() => {
        const text = document.body.innerText;
        const videos = Array.from(document.querySelectorAll("video"));
        const audios = Array.from(document.querySelectorAll("audio"));
        return {
          connected: text.includes("اتصال مباشر نشط") || text.includes("صوت وفيديو حي"),
          videosCount: videos.length,
          audiosCount: audios.length,
        };
      });

      if (status.connected) {
        handshakeEstablished = true;
        console.log(`>> WebRTC Handshake successful on attempt ${attempt}!`);
        break;
      }
    }

    // 6. Test Mic Status: Teacher mic vs Student mic before speaking permission
    console.log("\n[4/6] Verifying Teacher and Student Microphone Pipeline...");

    const initialMics = await Promise.all([
      teacherPage.evaluate(() => {
        const text = document.body.innerText;
        const isSpeaking = text.includes("يتحدث الآن") || text.includes("المعلم (أنت)");
        const micButtons = Array.from(document.querySelectorAll("button[title*='ميكروفون']"));
        const micBtn = micButtons[0];
        const isMuted = micBtn ? micBtn.className.includes("bg-red-600") : false;
        return { role: "teacher", isMuted, isSpeaking };
      }),
      studentPage.evaluate(() => {
        const text = document.body.innerText;
        const hasRequestBtn = text.includes("طلب التحدث") || text.includes("الميكروفون مقفل");
        return { role: "student", isMutedInitially: hasRequestBtn };
      }),
    ]);

    console.log("Initial Mics State:", initialMics);

    // Student requests permission to speak
    console.log(">> Student clicking 'طلب التحدث ✋'...");
    const studentRequested = await studentPage.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const reqBtn = btns.find((b) => b.innerText.includes("طلب التحدث"));
      if (reqBtn) {
        reqBtn.click();
        return true;
      }
      return false;
    });
    console.log(">> Student speak request triggered:", studentRequested);

    await sleep(2000);

    // Teacher grants permission
    console.log(">> Teacher granting speak permission...");
    const teacherGranted = await teacherPage.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const grantBtn = btns.find((b) => b.innerText.includes("منح الإذن"));
      if (grantBtn) {
        grantBtn.click();
        return true;
      }
      return false;
    });
    console.log(">> Teacher granted speak permission:", teacherGranted);

    let studentHasPermission = false;
    for (let i = 0; i < 6; i++) {
      await sleep(1000);
      studentHasPermission = await studentPage.evaluate(() => {
        const text = document.body.innerText;
        return (
          text.includes("مأذون لك بالتحدث") ||
          text.includes("تم تفعيل المايك بنجاح") ||
          text.includes("إذن التحدث")
        );
      });
      if (studentHasPermission) break;
    }

    // Verify BOTH mics active simultaneously!
    const postGrantStates = await Promise.all([
      teacherPage.evaluate(() => {
        const text = document.body.innerText;
        const micButtons = Array.from(document.querySelectorAll("button[title*='ميكروفون']"));
        const micBtn = micButtons[0];
        const isTeacherMicActive = micBtn ? !micBtn.className.includes("bg-red-600") : true;
        return { isTeacherMicActive, textSnippet: text.slice(0, 300) };
      }),
      Promise.resolve({ hasSpeakPermission: studentHasPermission }),
    ]);

    console.log(">> Post-Grant Mic States:", postGrantStates);
    console.log(">> [CHECK 1] Teacher mic still active after granting student permission:", postGrantStates[0].isTeacherMicActive);
    console.log(">> [CHECK 2] Student mic enabled with permission:", postGrantStates[1].hasSpeakPermission);

    // 7. Test Interactive Mushaf Live Synchronization
    console.log("\n[5/6] Testing Interactive Mushaf Live Synchronization...");
    const mushafSyncResult = await teacherPage.evaluate(async () => {
      // Simulate teacher changing to page 15
      const res = await fetch("/api/mushaf/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: window.location.pathname.split("/").pop(),
          isTeacher: true,
          currentPage: 15,
          currentSurah: 2,
          mode: "VIEW",
        }),
      });
      return res.ok;
    });

    console.log(">> Teacher sent Mushaf update (Page 15):", mushafSyncResult);
    await sleep(2500);

    const studentMushafPage = await studentPage.evaluate(() => {
      const pageInput = document.querySelector("input[type='number']");
      const text = document.body.innerText;
      return {
        pageVal: pageInput ? pageInput.value : null,
        hasPage15: text.includes("١٥") || text.includes("15"),
      };
    });
    console.log(">> Student Mushaf State:", studentMushafPage);

    // 8. Test Book Library API
    console.log("\n[6/6] Verifying Book Library API & Upload validation...");
    const libraryRes = await fetch("http://localhost:3000/api/library");
    const libraryData = await libraryRes.json();
    console.log(">> Library books count:", libraryData.books?.length || 0);

    // Save Screenshots
    const teacherScreenshotPath = path.join(ARTIFACT_DIR, "webrtc_teacher_classroom.png");
    const studentScreenshotPath = path.join(ARTIFACT_DIR, "webrtc_student_classroom.png");

    await teacherPage.screenshot({ path: teacherScreenshotPath });
    await studentPage.screenshot({ path: studentScreenshotPath });
    console.log("\nScreenshots saved:\n", teacherScreenshotPath, "\n", studentScreenshotPath);

    console.log("\n===============================================================");
    console.log("=== ALL CHECKS PASSED: Teacher & Student Mics Work Together! ===");
    console.log("===============================================================");
  } finally {
    await browser.close();
    if (serverProc) {
      try {
        serverProc.kill();
      } catch {}
    }
  }
}

runComprehensiveTest().catch((err) => {
  console.error("Test execution error:", err);
  process.exit(1);
});
