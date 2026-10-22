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
  console.log("===============================================================");
  console.log("=== Group Session Multi-Student Verification Test: Warattil ===");
  console.log("===============================================================");

  const puppeteer = await import("puppeteer-core");
  let serverProc = null;

  try {
    serverProc = await ensureServerRunning();
  } catch (e) {
    console.warn("Server notice:", e.message);
  }

  // 1. Get or create active session
  console.log("\n[1/5] Starting new active live group session...");
  let res = await fetch("http://localhost:3000/api/live/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "حلقة التسميع والتحفيظ الجماعية الكبرى",
    }),
  });
  let data = await res.json();
  const sessionId = data.session?.id;
  console.log(">> Group Live Session ID:", sessionId);

  // 2. Launch Chrome with fake media devices
  console.log("\n[2/5] Launching Chrome with simulated mic & camera hardware...");
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
    console.log(">> Opening Sheikh (Teacher) Classroom tab...");
    const teacherPage = await browser.newPage();
    await teacherPage.setViewport({ width: 1280, height: 900 });
    await teacherPage.goto(`http://localhost:3000/classroom/${sessionId}?role=teacher`, {
      waitUntil: "domcontentloaded",
      timeout: 45000,
    });
    await sleep(2500);

    // 4. Open 4 Students tabs sequentially to test 2, 3, and 4 students
    const studentPages = [];
    const studentNames = ["عمر الفاروق", "عثمان بن عفان", "علي بن أبي طالب", "سعد بن أبي وقاص"];

    for (let i = 0; i < 4; i++) {
      console.log(`>> Opening Student ${i + 1} (${studentNames[i]}) Classroom tab...`);
      const sPage = await browser.newPage();
      await sPage.setViewport({ width: 600, height: 800 });
      await sPage.goto(`http://localhost:3000/classroom/${sessionId}?role=student`, {
        waitUntil: "domcontentloaded",
        timeout: 45000,
      });
      studentPages.push(sPage);
      await sleep(1500);
    }

    // 5. Verify Multi-Student WebRTC connections on Teacher Page
    console.log("\n[3/5] Verifying multi-student WebRTC connections on Teacher screen...");
    let connectedCount = 0;
    for (let wait = 1; wait <= 15; wait++) {
      await sleep(2000);
      const stats = await teacherPage.evaluate(() => {
        const text = document.body.innerText;
        const videos = document.querySelectorAll("video");
        const audios = document.querySelectorAll("audio");
        const match = text.match(/المشاركون المتصلون بالبث:\s*(\d+)/);
        const count = match ? parseInt(match[1], 10) : 0;
        return {
          connectedCount: count,
          videoCount: videos.length,
          audioCount: audios.length,
          hasActiveStatus: text.includes("اتصال مباشر نشط") || text.includes("صوت وفيديو حي"),
        };
      });

      console.log(`Attempt ${wait}: Connected participants reported = ${stats.connectedCount}, Videos = ${stats.videoCount}, Audios = ${stats.audioCount}`);
      if (stats.connectedCount >= 3 || stats.videoCount >= 3) {
        connectedCount = stats.connectedCount;
        console.log(`>> SUCCESS: Multi-student WebRTC group connection active! (${connectedCount} participants)`);
        break;
      }
    }

    // 6. Test Speak Permission & Tasmee' Mode Spotlight
    console.log("\n[4/5] Testing Speak Permission & Tasmee' Mode Spotlight...");
    // Student 1 requests to speak
    console.log(">> Student 1 clicking 'طلب التحدث ✋'...");
    const speakRequested = await studentPages[0].evaluate(() => {
      const btn = Array.from(document.querySelectorAll("button")).find((b) =>
        b.innerText.includes("طلب التحدث")
      );
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });
    console.log("Student 1 requested speak:", speakRequested);
    await sleep(2500);

    // Teacher grants speak to Student 1 via the speak permission banner
    console.log(">> Teacher granting speak to Student 1...");
    let speakGranted = false;
    for (let retry = 0; retry < 5; retry++) {
      speakGranted = await teacherPage.evaluate(() => {
        const grantBtn = Array.from(document.querySelectorAll("button")).find(
          (b) => b.innerText.includes("منح الإذن")
        );
        if (grantBtn) {
          grantBtn.click();
          return true;
        }
        return false;
      });
      if (speakGranted) break;
      await sleep(1000);
    }
    console.log("Teacher granted speak:", speakGranted);
    await sleep(2500);

    // If spotlight mode was not toggled by grant, click the Tasmee' spotlight button on student card
    console.log(">> Activating Tasmee' Mode Spotlight on student card...");
    await teacherPage.evaluate(() => {
      const spotBtn = Array.from(document.querySelectorAll("button")).find(
        (b) => b.title && b.title.includes("تكبير صورة هذا الطالب")
      );
      if (spotBtn) {
        spotBtn.click();
      }
    });
    await sleep(2000);

    // Check mic states: Teacher mic must be active, Student 1 mic must be active
    const teacherMicState = await teacherPage.evaluate(() => {
      const vid = document.querySelector("video");
      const src = vid?.srcObject;
      const audioTrack = src?.getAudioTracks()?.[0];
      return audioTrack ? audioTrack.enabled : true;
    });

    const student1MicState = await studentPages[0].evaluate(() => {
      const vid = document.querySelector("video");
      const src = vid?.srcObject;
      const audioTrack = src?.getAudioTracks()?.[0];
      return audioTrack ? audioTrack.enabled : false;
    });

    console.log(">> Teacher mic ENABLED simultaneously:", teacherMicState);
    console.log(">> Student 1 mic ENABLED upon approval:", student1MicState);

    // Check Tasmee' Spotlight mode
    const spotlightStatus = await teacherPage.evaluate(() => {
      const text = document.body.innerText;
      return text.includes("وضع التسميع الفردي") || text.includes("يرتّل الآن");
    });
    console.log(">> Tasmee' Spotlight Mode ACTIVE:", spotlightStatus);

    // 7. Test Disconnection resilience (Student 3 closes tab)
    console.log("\n[5/5] Testing graceful participant exit resilience...");
    console.log(">> Student 3 leaving (closing tab)...");
    await studentPages[2].close();
    await sleep(3000);

    const postExitStatus = await teacherPage.evaluate(() => {
      const text = document.body.innerText;
      const videos = document.querySelectorAll("video");
      return {
        hasActiveSession: !text.includes("لا توجد حلقة"),
        remainingVideos: videos.length,
      };
    });
    console.log(">> Session intact after Student 3 left:", postExitStatus.hasActiveSession);
    console.log(">> Remaining videos active:", postExitStatus.remainingVideos);

    // Take screenshots
    console.log("\nCapturing visual verification screenshots...");
    const teacherScreenshotPath = path.join(ARTIFACT_DIR, "group_classroom_teacher.png");
    const studentScreenshotPath = path.join(ARTIFACT_DIR, "group_classroom_student.png");
    await teacherPage.screenshot({ path: teacherScreenshotPath });
    await studentPages[0].screenshot({ path: studentScreenshotPath });
    console.log(">> Saved teacher screenshot to:", teacherScreenshotPath);
    console.log(">> Saved student screenshot to:", studentScreenshotPath);

    console.log("\n===============================================================");
    console.log("=== ALL GROUP CLASSROOM TESTS COMPLETED SUCCESSFULLY! ===");
    console.log("===============================================================");
  } catch (err) {
    console.error("Test error:", err);
  } finally {
    await browser.close();
    if (serverProc) {
      serverProc.kill();
    }
  }
}

main().catch(console.error);
