async function testRemoteCloudEndpoints() {
  console.log("=== Testing Live Production Cloud Deployment: https://quran-platform.onrender.com ===");

  try {
    const resHome = await fetch("https://quran-platform.onrender.com");
    console.log("1. Homepage HTTP Status:", resHome.status);

    const resLib = await fetch("https://quran-platform.onrender.com/api/library");
    const dataLib = await resLib.json();
    console.log("2. Library Books API HTTP Status:", resLib.status, "| Books Count:", dataLib.books?.length || 0);

    const resSession = await fetch("https://quran-platform.onrender.com/api/live/session");
    const dataSession = await resSession.json();
    console.log("3. Live Session API HTTP Status:", resSession.status, "| Session:", dataSession.session?.title || "No active session");

    const resRec = await fetch("https://quran-platform.onrender.com/api/recordings");
    const dataRec = await resRec.json();
    console.log("4. Recordings API HTTP Status:", resRec.status, "| Recordings Count:", dataRec.recordings?.length || 0);

    console.log("=== Remote Cloud Deployment is Live and Responding via HTTPS! ===");
  } catch (e) {
    console.error("Cloud test error:", e.message);
  }
}

testRemoteCloudEndpoints();
