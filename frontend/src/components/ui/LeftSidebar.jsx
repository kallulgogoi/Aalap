"use client";

import Image from "next/image";
import ChatBubblesSVG from "@/components/ui/ChatBubblesSVG";
import MessageSentSVG from "@/components/ui/MessageSentSVG";
import LowLatencySVG from "@/components/ui/LowLatencySVG";

export default function LeftSidebar() {
  return (
    <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-indigo-950/30 via-zinc-950 to-zinc-950 p-12 flex-col justify-center items-center border-r border-zinc-800">
      {/* Background elements */}
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]" />
      <div className="absolute top-20 left-20 w-72 h-72 bg-indigo-600/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-3xl" />

      <div className="relative z-10 max-w-lg w-full space-y-8">
        {/* Logo*/}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Image src="/images/logo.png" alt="Logo" width={48} height={48} />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-white">Aalap</h1>
            <p className="text-xs text-zinc-400">Real-time messaging</p>
          </div>
        </div>

        {/* Hero Title */}
        <div className="space-y-4">
          <h2 className="text-4xl font-bold tracking-tight text-white leading-tight">
            Connect with your
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
              team in real-time
            </span>
          </h2>
          <p className="text-zinc-400 text-lg leading-relaxed">
            Experience seamless communication with your team members, share
            files, and collaborate effortlessly.
          </p>
        </div>

        {/* Features List */}
        <div className="space-y-4 mt-6">
          <div className="flex items-center gap-4 p-3 rounded-xl bg-zinc-800/30 border border-zinc-700/30">
            <div className="w-12 h-12 flex-shrink-0">
              <ChatBubblesSVG />
            </div>
            <div>
              <p className="text-sm font-medium text-white">
                Instant Messaging
              </p>
              <p className="text-xs text-zinc-400">Real-time conversations</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-3 rounded-xl bg-zinc-800/30 border border-zinc-700/30">
            <div className="w-12 h-12 flex-shrink-0">
              <MessageSentSVG />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Delivery Status</p>
              <p className="text-xs text-zinc-400">Read receipts & more</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-3 rounded-xl bg-zinc-800/30 border border-zinc-700/30">
            <div className="w-12 h-12 flex-shrink-0">
              <LowLatencySVG />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Low Latency</p>
              <p className="text-xs text-zinc-400">Lightning fast delivery</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
