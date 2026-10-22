import puppeteer from 'puppeteer-core';

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTest() {
  console.log("=== COMPREHENSIVE END-TO-END NOTIFICATION & CLASSROOM TEST ===");

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

  const teacherContext = await browser.createBrowserContext();
  const studentContext = await browser.createBrowserContext();

  try {
    // 1. Teacher Log In
    console.log("\n[1] Teacher login...");
    const teacherPage = await teacherContext.newPage();
    await teacherPage.goto("http://localhost:3000/login?role=TEACHER", { waitUntil: "domcontentloaded" });
    await sleep(1000);
    await teacherPage.click('button[type="submit"]');
    await sleep(2500);
    console.log("Teacher logged in. URL:", teacherPage.url());

    // 2. Student Log In
    console.log("\n[2] Student login...");
    const studentPage = await studentContext.newPage();
    await studentPage.goto("http://localhost:3000/login?role=STUDENT", { waitUntil: "domcontentloaded" });
    await sleep(1000);
    await studentPage.click('button[type="submit"]');
    await sleep(2500);
    console.log("Student logged in. URL:", studentPage.url());

    // 3. Confirm student dashboard initial state
    await studentPage.goto("http://localhost:3000/student/dashboard", { waitUntil: "domcontentloaded" });
    await sleep(2000);

    // 4. Teacher Starts Session via API inside Teacher context
    console.log("\n[3] Teacher starts live session via teacher dashboard...");
    const sessionResult = await teacherPage.evaluate(async () => {
      const res = await fetch("/api/live/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ halaqaId: "auto" }),
      });
      return await res.json();
    });

    console.log("Teacher start session API result:", sessionResult?.success, "Session ID:", sessionResult?.session?.id);
    const sessionId = sessionResult?.session?.id;

    if (!sessionId) {
      throw new Error("Failed to create session!");
    }

    // Teacher navigates to classroom
    await teacherPage.goto(`http://localhost:3000/classroom/${sessionId}?role=teacher`, { waitUntil: "domcontentloaded" });
    await sleep(3000);
    console.log("Teacher entered classroom:", teacherPage.url());

    // 5. Check if Student Dashboard immediately receives the live invitation overlay
    console.log("\n[4] Checking Student Dashboard for Instant Notification Overlay...");
    let overlayFound = false;
    for (let i = 0; i < 15; i++) {
      const overlays = await studentPage.evaluate(() => {
        const dialogs = Array.from(document.querySelectorAll('[class*="fixed"], [role="dialog"], [class*="animate-"]'));
        return dialogs.map(d => d.innerText || "").filter(t => t.includes("بدأت الحلقة") || t.includes("دعوة لحضور") || t.includes("الشيخ في انتظارك"));
      });

      if (overlays.length > 0) {
        console.log("SUCCESS! Student received instant popup overlay:");
        console.log(overlays[0].substring(0, 250).replace(/\n+/g, " "));
        overlayFound = true;
        break;
      }
      await sleep(1000);
    }

    if (!overlayFound) {
      console.log("Overlay not detected via DOM query, checking body text:");
      const sBody = await studentPage.evaluate(() => document.body.innerText);
      console.log("Body snippet:", sBody.substring(0, 300).replace(/\n+/g, " "));
    }

    // 6. Student Clicks Accept & Enters Classroom
    console.log("\n[5] Student entering classroom for sessionId:", sessionId);
    await studentPage.goto(`http://localhost:3000/classroom/${sessionId}?role=student`, { waitUntil: "domcontentloaded" });
    await sleep(5000);

    const teacherClassroomText = await teacherPage.evaluate(() => document.body.innerText);
    const studentClassroomText = await studentPage.evaluate(() => document.body.innerText);

    console.log("Teacher classroom snippet:", teacherClassroomText.substring(0, 250).replace(/\n+/g, " "));
    console.log("Student classroom snippet:", studentClassroomText.substring(0, 250).replace(/\n+/g, " "));

    // 7. Verify WebRTC media tracks in student page
    const studentMedia = await studentPage.evaluate(() => {
      const videos = Array.from(document.querySelectorAll("video")).map(v => ({
        src: v.src,
        hasSrcObject: Boolean(v.srcObject),
        tracks: v.srcObject ? v.srcObject.getTracks().map(t => ({ kind: t.kind, readyState: t.readyState, enabled: t.enabled })) : null,
        paused: v.paused,
      }));
      return { videos };
    });
    console.log("Student Media Elements:", JSON.stringify(studentMedia, null, 2));

    // 8. Test Part 2: Student Join Request Flow
    console.log("\n[6] Testing Student Join Request Flow...");
    // Let's have student navigate to /student/my-halaqat
    await studentPage.goto("http://localhost:3000/student/my-halaqat", { waitUntil: "domcontentloaded" });
    await sleep(2000);

    // Click "طلب انضمام" or trigger join request
    const joinResult = await studentPage.evaluate(async () => {
      const resH = await fetch("/api/teacher/halaqat");
      const dH = await resH.json();
      const targetH = dH.halaqat?.[1] || dH.halaqat?.[0]; // e.g. Evening halaqa
      if (!targetH) return { error: "No halaqa found" };

      const res = await fetch("/api/student/join-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ halaqaId: targetH.id }),
      });
      return await res.json();
    });

    console.log("Student join-request sent:", joinResult.success, "Message:", joinResult.message);

    // 9. Check if Teacher receives the join request notification
    console.log("\n[7] Checking Teacher Dashboard & Requests for the student request...");
    await teacherPage.goto("http://localhost:3000/teacher/requests", { waitUntil: "domcontentloaded" });
    await sleep(3000);

    const requestsText = await teacherPage.evaluate(() => document.body.innerText);
    console.log("Teacher requests page snippet:", requestsText.substring(0, 350).replace(/\n+/g, " "));
    const hasStudentName = requestsText.includes("عبدالرحمن") || requestsText.includes("طالب") || requestsText.includes("حلقة");
    console.log("Teacher requests page shows the request?", hasStudentName);

    console.log("\n=== ALL TEST STEPS FINISHED ===");
  } catch (err) {
    console.error("Test encountered error:", err);
  } finally {
    await browser.close();
  }
}

runTest();
