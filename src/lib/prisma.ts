import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import { SEED_DB_BASE64 } from "./seedDbBase64";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function ensureVercelDatabase(): string {
  const isVercel = !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
  
  if (!isVercel) {
    return process.env.DATABASE_URL || "file:./dev.db";
  }

  const tmpDbPath = "/tmp/dev.db";
  
  try {
    const exists = fs.existsSync(tmpDbPath);
    const isEmpty = exists && fs.statSync(tmpDbPath).size === 0;

    if (!exists || isEmpty) {
      // 1. Try copying from filesystem if bundled
      const srcPaths = [
        path.join(process.cwd(), "prisma", "dev.db"),
        path.join(__dirname, "dev.db"),
        path.join(__dirname, "..", "prisma", "dev.db"),
      ];

      let copied = false;
      for (const p of srcPaths) {
        if (fs.existsSync(p) && fs.statSync(p).size > 0) {
          fs.copyFileSync(p, tmpDbPath);
          copied = true;
          break;
        }
      }

      // 2. Fallback to embedded base64 seed if filesystem copy failed
      if (!copied && SEED_DB_BASE64) {
        const buffer = Buffer.from(SEED_DB_BASE64, "base64");
        fs.writeFileSync(tmpDbPath, buffer);
      }
    }
  } catch (err) {
    console.error("Error setting up Vercel SQLite database:", err);
  }

  const fileUrl = `file:${tmpDbPath}`;
  process.env.DATABASE_URL = fileUrl;
  return fileUrl;
}

const dbUrl = ensureVercelDatabase();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: dbUrl,
      },
    },
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
