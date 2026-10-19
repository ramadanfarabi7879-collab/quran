import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET() {
  const cwd = process.cwd();
  const prismaDir = path.join(cwd, "prisma");
  const devDbPath = path.join(prismaDir, "dev.db");
  
  const debugInfo: any = {
    cwd,
    isVercel: !!process.env.VERCEL,
    databaseUrl: process.env.DATABASE_URL,
    devDbExists: fs.existsSync(devDbPath),
    tmpExists: fs.existsSync("/tmp"),
  };

  try {
    const userCount = await prisma.user.count();
    debugInfo.userCount = userCount;
    debugInfo.status = "SUCCESS";
  } catch (err: any) {
    debugInfo.status = "ERROR";
    debugInfo.errorName = err?.name;
    debugInfo.errorMessage = err?.message;
    debugInfo.errorStack = err?.stack;
  }

  return NextResponse.json(debugInfo);
}
