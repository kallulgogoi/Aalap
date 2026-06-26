"use client";

import { useChatStore } from "@/store/chatStore";
import { MessageSquare, Settings, UserCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function MobileTabBar({
  activeTab = "chats",
  onTabChange,
}) {
  const chats = useChatStore((state) => state.chats);
  const unreadCount = chats.filter((chat) => chat.unreadCount > 0).length;

  const tabs = [
    { id: "chats", icon: MessageSquare, label: "Chats" },
    { id: "profile", icon: UserCircle, label: "Profile" },
    { id: "settings", icon: Settings, label: "Settings" },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#17212b] border-t border-black/25 flex items-center justify-around py-2 px-6 z-50">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onTabChange?.(tab.id)}
          className={cn(
            "flex flex-col items-center gap-0.5 p-2 rounded-full transition-all relative min-w-[64px]",
            activeTab === tab.id
              ? "text-[#24A1DE]"
              : "text-zinc-500 hover:text-zinc-300",
          )}
        >
          <tab.icon
            className="w-5 h-5"
            strokeWidth={activeTab === tab.id ? 2.25 : 1.75}
          />
          <span className="text-[10px] font-medium">{tab.label}</span>
          {tab.id === "chats" && unreadCount > 0 && (
            <span className="absolute top-0.5 right-2 bg-red-500 text-white text-[10px] font-bold min-w-[16px] h-4 flex items-center justify-center rounded-full px-1">
              {unreadCount}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
