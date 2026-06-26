"use client";

import { cn } from "@/lib/utils";

export function ChatListSkeleton({ count = 6 }) {
  return (
    <div className="space-y-2 p-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/5 animate-pulse"
        >
          <div className="w-12 h-12 rounded-full bg-white/10" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-28 rounded-full bg-white/10" />
            <div className="h-2.5 w-40 rounded-full bg-white/5" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function MessageListSkeleton() {
  return (
    <div className="space-y-4 p-6">
      {[false, true, false, true, false].map((isMe, i) => (
        <div
          key={i}
          className={cn("flex", isMe ? "justify-end" : "justify-start")}
        >
          <div
            className={cn(
              "h-14 rounded-[20px] bg-white/[0.05] border border-white/5 animate-pulse",
              isMe ? "w-[58%]" : "w-[48%]",
            )}
          />
        </div>
      ))}
    </div>
  );
}
