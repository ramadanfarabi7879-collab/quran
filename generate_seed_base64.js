const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'prisma', 'dev.db');
const outPath = path.join(__dirname, 'src', 'lib', 'seedDbBase64.ts');

const data = fs.readFileSync(dbPath);
const b64 = data.toString('base64');

fs.writeFileSync(outPath, `// Auto-generated SQLite seed fallback for Vercel Serverless
export const SEED_DB_BASE64 = "${b64}";
`);

console.log("Successfully generated seedDbBase64.ts. Length:", b64.length);
