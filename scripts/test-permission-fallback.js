const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

async function testPermissionRejection() {
  console.log("=== Testing Device Denial / Fallback Behavior ===");
  const puppeteer = await import("puppeteer-core");

  // Ensure clean session state
  await fetch("http://localhost:3000/api/live/session?endAll=true");

  // Create fresh session
  const res = await fetch("http://localhost:3000/api/live/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "حلقة تجربة رفض الصلاحيات",
    }),
  });
  const data = await res.json();
  const sessionId = data.session?.id;

  // Launch browser with fake devices disabled and permissions denied
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--deny-permission-prompts",
    ],
  });

  try {
    const page = await browser.newPage();
    const context = browser.defaultBrowserContext();
    await context.overridePermissions("http://localhost:3000", []);

    await page.goto(`http://localhost:3000/classroom/${sessionId}?role=student`, {
      waitUntil: "networkidle2",
    });

    await new Promise((r) => setTimeout(r, 2500));

    const result = await page.evaluate(() => {
      const text = document.body.innerText;
      const videos = Array.from(document.querySelectorAll("video"));

      // Check whether user-facing UI accurately reports device unavailability
      const showsPermissionWarning =
        text.includes("لم نتمكن من الوصول للكاميرا أو الميكروفون") ||
        text.includes("الكاميرا غير متوفرة") ||
        text.includes("الميكروفون غير متوفر");

      const showsRetryButton = text.includes("إعادة المحاولة");

      // Verify that local video element has NO audio tracks and NO active camera track
      const localVideosWithTracks = videos.filter(
        (v) => v.srcObject && v.srcObject.getTracks().length > 0
      );

      return {
        showsPermissionWarning,
        showsRetryButton,
        localVideosWithTracksCount: localVideosWithTracks.length,
        hasAudioOrVideoText: text.includes("اتصال مباشر"),
        textSnippet: text.slice(0, 300),
      };
    });

    console.log("Denial Test Evaluation:", result);

    if (!result.showsPermissionWarning) {
      throw new Error("FAIL: Expected permission warning banner or device status in UI!");
    }
    if (!result.showsRetryButton) {
      throw new Error("FAIL: Expected 'إعادة المحاولة' button to allow user to retry device access!");
    }
    if (result.localVideosWithTracksCount > 0) {
      throw new Error("FAIL: Expected 0 local tracks when camera is denied, but found active tracks!");
    }

    console.log("✓ Correctly handled device denial without crashes, fake tracks, or false status!");
  } finally {
    await browser.close();
    await fetch("http://localhost:3000/api/live/session?endAll=true");
  }
}

testPermissionRejection().catch((err) => {
  console.error("Denial test error:", err);
  process.exit(1);
});
