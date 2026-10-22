const http = require("http");
const { spawn } = require("child_process");

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
  if (isRunning) return null;

  const serverProcess = spawn(
    process.execPath,
    ["./node_modules/next/dist/bin/next", "start", "-p", "3000"],
    { stdio: "pipe", detached: false }
  );

  for (let i = 0; i < 30; i++) {
    await sleep(1000);
    const ready = await checkPort(3000);
    if (ready) return serverProcess;
  }
  throw new Error("Next.js server failed to start.");
}

async function testRecordings() {
  console.log("=== Testing Recordings API (AUDIO_ONLY & AUDIO_VIDEO) ===");
  const serverProc = await ensureServerRunning();

  try {
    // 1. Get active session
    const sessRes = await fetch("http://localhost:3000/api/live/session?role=teacher");
    const sessData = await sessRes.json();
    const sessionId = sessData.session?.id || "cmvhu7jfb00133fvxymqmsqhr";

    // 2. Test Audio-Only Upload
    console.log(">> Uploading Audio-Only Recording...");
    const fakeAudioBuffer = Buffer.from("RIFF....WAVEfmt ....data....");
    const audioFormData = new FormData();
    const audioBlob = new Blob([fakeAudioBuffer], { type: "audio/webm" });
    audioFormData.append("file", audioBlob, `rec_audio_${Date.now()}.webm`);
    audioFormData.append("sessionId", sessionId);
    audioFormData.append("title", "تسجيل حلقة الفجر - صوت فقط");
    audioFormData.append("recordingType", "AUDIO_ONLY");
    audioFormData.append("durationSeconds", "120");

    const audioRes = await fetch("http://localhost:3000/api/recordings", {
      method: "POST",
      headers: {
        Cookie: "quran_session=cmve7fi6w0009tu94h5azguah",
      },
      body: audioFormData,
    });

    const audioJson = await audioRes.json();
    console.log(">> Audio-Only upload response:", audioJson.success ? "SUCCESS" : audioJson);

    // 3. Test Audio+Video Upload
    console.log(">> Uploading Audio+Video Recording...");
    const fakeVideoBuffer = Buffer.from("....matroska....");
    const videoFormData = new FormData();
    const videoBlob = new Blob([fakeVideoBuffer], { type: "video/webm" });
    videoFormData.append("file", videoBlob, `rec_video_${Date.now()}.webm`);
    videoFormData.append("sessionId", sessionId);
    videoFormData.append("title", "تسجيل حلقة الفجر - صوت وصورة");
    videoFormData.append("recordingType", "AUDIO_VIDEO");
    videoFormData.append("durationSeconds", "300");

    const videoRes = await fetch("http://localhost:3000/api/recordings", {
      method: "POST",
      headers: {
        Cookie: "quran_session=cmve7fi6w0009tu94h5azguah",
      },
      body: videoFormData,
    });

    const videoJson = await videoRes.json();
    console.log(">> Audio+Video upload response:", videoJson.success ? "SUCCESS" : videoJson);

    // 4. Retrieve recordings list
    const listRes = await fetch("http://localhost:3000/api/recordings");
    const listData = await listRes.json();
    console.log(">> Total saved recordings in library:", listData.recordings?.length);
    const latest = listData.recordings?.slice(0, 2);
    console.log(">> Latest recordings:", latest?.map((r) => ({ title: r.title, type: r.recordingType, url: r.videoUrl })));

    console.log("=== Recordings Test Complete! ===");
  } finally {
    if (serverProc) {
      try { serverProc.kill(); } catch {}
    }
  }
}

testRecordings().catch(console.error);
