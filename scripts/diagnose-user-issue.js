const https = require("https");

function get(url, headers = {}) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers }, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve({ status: res.statusCode, headers: res.headers, data }));
    }).on("error", reject);
  });
}

async function main() {
  console.log("=== 1. Checking /api/live/session ===");
  const sess = await get("https://quran-iprj.vercel.app/api/live/session");
  console.log("Status:", sess.status);
  console.log("Body:", sess.data);

  console.log("\n=== 2. Checking /api/teacher/students ===");
  const stu = await get("https://quran-iprj.vercel.app/api/teacher/students");
  console.log("Status:", stu.status);
  try {
    const json = JSON.parse(stu.data);
    console.log("Pending registrations:", json.pendingRegistrations?.length);
    console.log("Join requests:", json.joinRequests?.length);
    console.log("Active session attendances:", json.activeSessionPendingAttendances?.length);
    if (json.activeSessionPendingAttendances?.length > 0) {
      console.log("Active Attendances details:", JSON.stringify(json.activeSessionPendingAttendances));
    }
  } catch (e) {
    console.log("Raw:", stu.data.slice(0, 200));
  }

  console.log("\n=== 3. Checking /api/teacher/halaqat ===");
  const hal = await get("https://quran-iprj.vercel.app/api/teacher/halaqat");
  console.log("Status:", hal.status);
  try {
    const json = JSON.parse(hal.data);
    console.log("Halaqat count:", json.halaqat?.length);
    for (const h of (json.halaqat || [])) {
      console.log(`- Halaqa: ${h.name}, isLiveNow: ${h.isLiveNow}, currentLiveSessionId: ${h.currentLiveSessionId}`);
    }
  } catch (e) {
    console.log("Raw:", hal.data.slice(0, 200));
  }
}

main().catch(console.error);
