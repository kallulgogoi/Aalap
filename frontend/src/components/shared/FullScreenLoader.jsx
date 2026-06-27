"use client";

import { MessageSquare } from "lucide-react";

export default function FullScreenLoader({
  text = "Connecting to Enterprise Chat...",
}) {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-zinc-950 z-50">
      <div className="relative flex items-center justify-center w-20 h-20 mb-8">
        <div className="absolute inset-0 border-4 border-zinc-800 rounded-full"></div>

        <div className="absolute inset-0 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>

        <MessageSquare className="w-8 h-8 text-indigo-400 animate-pulse" />
      </div>
      <h3 className="text-zinc-200 font-medium tracking-tight mb-2">{text}</h3>
      <p className="text-sm text-zinc-500">Securing your connection</p>
    </div>
  );
}
