const puppeteer = require("puppeteer-core");

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log("Starting Puppeteer test for Locked Tasmee Mode...");
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  console.log("Navigating to simulation split-screen page: http://localhost:3000/simulation ...");
  await page.goto("http://localhost:3000/simulation", { waitUntil: "networkidle2" });
  await sleep(3000);

  // Check initial state
  let content = await page.content();
  console.log("Initial page loaded. Content length:", content.length);

  // Click on "بدء التسميع المغلق"
  console.log("Teacher clicking 'بدء التسميع المغلق'...");
  const clickedLock = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    const btn = buttons.find((b) => b.textContent && b.textContent.includes("بدء التسميع المغلق"));
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  });
  console.log("Lock button clicked:", clickedLock);

  await sleep(3000);

  // Inspect page content for student locked curtain
  content = await page.content();
  const hasLockHeadline = content.includes("وضع التسميع المغلق نشط الآن");
  const hasLockSub = content.includes("المصحف محجوب بقرار من المعلم");
  console.log("Locked headline present:", hasLockHeadline);
  console.log("Locked subtitle present:", hasLockSub);

  await page.screenshot({ path: "locked_state_success.png" });
  console.log("Captured locked_state_success.png");

  // Click "إنهاء التسميع وإعادة فتح المصحف"
  console.log("Teacher clicking 'إنهاء التسميع وإعادة فتح المصحف'...");
  const clickedUnlock = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    const btn = buttons.find((b) => b.textContent && b.textContent.includes("إنهاء التسميع وإعادة فتح المصحف"));
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  });
  console.log("Unlock button clicked:", clickedUnlock);

  await sleep(3000);

  // Inspect page content after unlock
  content = await page.content();
  const isStillLocked = content.includes("وضع التسميع المغلق نشط الآن");
  console.log("Curtain still visible after unlock:", isStillLocked);

  await page.screenshot({ path: "unlocked_state_success.png" });
  console.log("Captured unlocked_state_success.png");

  await browser.close();

  if (clickedLock && hasLockHeadline && !isStillLocked) {
    console.log(">>> SUCCESS: Tasmee' lock and unlock works flawlessly end-to-end! <<<");
  } else {
    console.log(">>> Details: Lock clicked:", clickedLock, "Headline:", hasLockHeadline, "Unlocked clean:", !isStillLocked);
  }
}

main().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
