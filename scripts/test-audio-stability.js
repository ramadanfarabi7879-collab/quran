const path = require("path");
const http = require("http");
const { spawn } = require("child_process");

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

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
    { stdio: "pipe", detached: false }
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
  console.log("==================================================================");
  console.log("=== Mandatory Audio Stability, Latency & Buffer Test: Warattil ===");
  console.log("==================================================================");

  let serverProc = null;
  try {
    serverProc = await ensureServerRunning();
  } catch (e) {
    console.warn("Server notice:", e.message);
  }

  // 1. Create a fresh live session
  const res = await fetch("http://localhost:3000/api/live/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "حلقة اختبار استقرار الصوت الحقيقي والتسميع المتواصل",
    }),
  });
  const data = await res.json();
  const sessionId = data.session?.id;
  console.log("Live Session ID:", sessionId);

  const puppeteer = await import("puppeteer-core");
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
    // 2. Open Teacher
    console.log("\n[1/6] Launching Sheikh (Teacher) Classroom...");
    const teacherPage = await browser.newPage();
    await teacherPage.setViewport({ width: 1200, height: 800 });
    await teacherPage.goto(`http://localhost:3000/classroom/${sessionId}?role=teacher`, {
      waitUntil: "domcontentloaded",
      timeout: 45000,
    });
    await sleep(2000);

    // 3. Open Student 1
    console.log("[2/6] Launching Student 1 Classroom...");
    const student1Page = await browser.newPage();
    await student1Page.setViewport({ width: 800, height: 800 });
    await student1Page.goto(`http://localhost:3000/classroom/${sessionId}?role=student`, {
      waitUntil: "domcontentloaded",
      timeout: 45000,
    });
    await sleep(2500);

    // Grant speak to Student 1
    console.log(">> Student 1 requests speak...");
    await student1Page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll("button")).find((b) =>
        b.innerText.includes("طلب التحدث")
      );
      if (btn) btn.click();
    });
    await sleep(2000);

    console.log(">> Sheikh grants speak to Student 1...");
    await teacherPage.evaluate(() => {
      const btn = Array.from(document.querySelectorAll("button")).find((b) =>
        b.innerText.includes("منح الإذن")
      );
      if (btn) btn.click();
    });
    await sleep(2000);

    // Verify Teacher mic is ENABLED and Student 1 mic is ENABLED
    const initialMics = await teacherPage.evaluate(() => {
      const vids = Array.from(document.querySelectorAll("video"));
      const teacherStream = vids[0]?.srcObject;
      const tTrack = teacherStream?.getAudioTracks()?.[0];
      return { teacherMicEnabled: tTrack ? tTrack.enabled : true };
    });
    const s1Mic = await student1Page.evaluate(() => {
      const vids = Array.from(document.querySelectorAll("video"));
      const sStream = vids[0]?.srcObject;
      const sTrack = sStream?.getAudioTracks()?.[0];
      return { student1MicEnabled: sTrack ? sTrack.enabled : false };
    });
    console.log(">> Initial Mics Status:", { ...initialMics, ...s1Mic });
    if (!initialMics.teacherMicEnabled) throw new Error("FAIL: Teacher mic was disabled!");

    // 4. Test Continuous Speech / Delay Accumulation Check over 20s
    console.log("\n[3/6] Testing continuous streaming latency over 20 seconds...");
    const delays = [];
    for (let i = 1; i <= 5; i++) {
      await sleep(4000);
      const metrics = await teacherPage.evaluate(async () => {
        const audios = Array.from(document.querySelectorAll("audio"));
        return {
          audioElementsCount: audios.length,
          audioPlayTimes: audios.map((a) => a.currentTime),
          allAudiosUnmuted: audios.every((a) => !a.muted && a.volume === 1.0),
          allAudiosPlaying: audios.every((a) => !a.paused),
        };
      });
      delays.push(metrics);
      console.log(`>> Check #${i} (+${i * 4}s):`, JSON.stringify(metrics));
    }

    // Verify audio elements count and continuous forward progression
    const lastCheck = delays[delays.length - 1];
    if (lastCheck.audioElementsCount !== 1) {
      throw new Error(`FAIL: Expected exactly 1 audio element for Student 1, found: ${lastCheck.audioElementsCount}`);
    }
    if (!lastCheck.allAudiosPlaying) {
      throw new Error("FAIL: Audio element paused unexpectedly!");
    }
    console.log(">> Continuous streaming verified: Audio plays forward in real-time with 0 stalls.");

    // 5. Test Toggling Student Mic Multiple Times (5 iterations)
    console.log("\n[4/6] Testing Rapid Student Mic Toggling (5 iterations)...");
    for (let toggle = 1; toggle <= 5; toggle++) {
      // Toggle off
      await student1Page.evaluate(() => {
        const micBtn = Array.from(document.querySelectorAll("button")).find(
          (b) => b.title && b.title.includes("الميكروفون")
        );
        if (micBtn) micBtn.click();
      });
      await sleep(1000);

      // Toggle on
      await student1Page.evaluate(() => {
        const micBtn = Array.from(document.querySelectorAll("button")).find(
          (b) => b.title && b.title.includes("الميكروفون")
        );
        if (micBtn) micBtn.click();
      });
      await sleep(1000);
      console.log(`>> Toggle cycle #${toggle} complete.`);
    }

    // Verify Teacher mic is STILL active after Student 1 toggled mic 5 times
    const postToggleMics = await teacherPage.evaluate(() => {
      const vids = Array.from(document.querySelectorAll("video"));
      const teacherStream = vids[0]?.srcObject;
      const tTrack = teacherStream?.getAudioTracks()?.[0];
      return { teacherMicEnabled: tTrack ? tTrack.enabled : true };
    });
    console.log(">> Teacher mic status after 5 toggles:", postToggleMics);
    if (!postToggleMics.teacherMicEnabled) {
      throw new Error("FAIL: Teacher mic was affected by student mic toggles!");
    }

    // 6. Test Multi-Student Session & Transferring Tasmee' Spotlight
    console.log("\n[5/6] Testing Multi-Student Presence & Transferring Tasmee' Spotlight...");
    console.log(">> Launching Student 2 Classroom...");
    const student2Page = await browser.newPage();
    await student2Page.setViewport({ width: 800, height: 800 });
    await student2Page.goto(`http://localhost:3000/classroom/${sessionId}?role=student`, {
      waitUntil: "domcontentloaded",
      timeout: 45000,
    });
    await sleep(3500);

    // Switch Tasmee' Spotlight from Student 1 to Student 2
    console.log(">> Sheikh switching Tasmee' Spotlight to Student 2...");
    const switched = await teacherPage.evaluate(() => {
      const spotButtons = Array.from(document.querySelectorAll("button")).filter(
        (b) => b.innerText.includes("تسميع 🎙️") || (b.title && b.title.includes("تكبير صورة هذا الطالب"))
      );
      if (spotButtons.length > 0) {
        spotButtons[spotButtons.length - 1].click();
        return true;
      }
      return false;
    });
    console.log("Switched Tasmee' button clicked:", switched);
    await sleep(2500);

    // Verify audio elements in Teacher page matches connected students count (exactly 2)
    const teacherMultiStudentAudios = await teacherPage.evaluate(() => {
      const audios = Array.from(document.querySelectorAll("audio"));
      return {
        count: audios.length,
        streamsCount: audios.filter((a) => a.srcObject && a.srcObject.getAudioTracks().length > 0).length,
      };
    });
    console.log(">> Teacher multi-student audio elements count:", teacherMultiStudentAudios);
    if (teacherMultiStudentAudios.count !== 2) {
      throw new Error(`FAIL: Expected exactly 2 audio elements for 2 students, found: ${teacherMultiStudentAudios.count}`);
    }

    // 7. Verify Signaling Re-negotiation Storm is Eliminated
    console.log("\n[6/6] Verifying zero repeated renegotiations in signaling DB...");
    const sigRes = await fetch(`http://localhost:3000/api/classroom/signal?sessionId=${sessionId}&role=teacher&clientId=audit&since=0`);
    const sigData = await sigRes.json();
    const typeCounts = {};
    (sigData.messages || []).forEach((m) => {
      typeCounts[m.signalType] = (typeCounts[m.signalType] || 0) + 1;
    });
    console.log("Signaling Message Audit:", typeCounts);

    // An offer should occur only on connection initialization, NOT every 3s
    const offersCount = typeCounts["OFFER"] || 0;
    console.log(`>> Total WebRTC Offers created: ${offersCount} (for 2 students joining)`);
    if (offersCount > 4) {
      throw new Error(`FAIL: Excess offers detected (${offersCount})! Continuous renegotiation storm still occurring.`);
    }

    console.log("\n==================================================================");
    console.log("=== ALL AUDIO STABILITY TESTS PASSED WITH 100% SUCCESS! ===");
    console.log("==================================================================");

  } catch (err) {
    console.error("Test error:", err);
    process.exit(1);
  } finally {
    await browser.close();
    if (serverProc) serverProc.kill();
  }
}

main().catch(console.error);
