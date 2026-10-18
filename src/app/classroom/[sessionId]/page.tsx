"use client";

import React from "react";
import { useParams } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { LiveClassroom } from "@/components/classroom/LiveClassroom";

export default function ClassroomPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Navbar />
      <div className="flex-1 p-2 sm:p-4 max-w-7xl mx-auto w-full">
        <LiveClassroom sessionId={sessionId} />
      </div>
    </div>
  );
}
