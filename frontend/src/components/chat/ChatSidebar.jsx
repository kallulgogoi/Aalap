"use client";

import { useState } from "react";
import { useChatStore } from "@/store/chatStore";
import { Search, Clock } from "lucide-react";
import NewChatDialog from "./NewChatDialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { getAvatarUrl } from "@/lib/avatar";

export default function ChatSidebar() {
  const { chats, activeChat, setActiveChat, clearUnreadCount } = useChatStore();
  const [search, setSearch] = useState("");

  // Filter chats based on the search bar
  const filteredChats = chats.filter((chat) =>
    chat.chatName?.toLowerCase().includes(search.toLowerCase()),
  );

  const handleSelectChat = (chat) => {
    setActiveChat(chat);
    clearUnreadCount(chat._id); // Wipe the badge when they open it
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 border-r border-zinc-800">
      {/* Search Header */}
      <div className="p-4 border-b border-zinc-800 shrink-0">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <Input
            placeholder="Filter active chats..."
            className="w-full pl-9 bg-zinc-900 border-zinc-800 text-zinc-200 placeholder:text-zinc-500 focus-visible:ring-indigo-500 rounded-full"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Inject the New Chat Button here! */}
        <NewChatDialog />
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {filteredChats.length === 0 ? (
          <div className="p-4 text-center text-sm text-zinc-500">
            No chats found.
          </div>
        ) : (
          filteredChats.map((chat) => (
            <button
              key={chat._id}
              onClick={() => handleSelectChat(chat)}
              className={cn(
                "w-full flex items-center gap-3 p-4 hover:bg-zinc-900/50 transition-colors text-left border-b border-zinc-800/50",
                activeChat?._id === chat._id && "bg-zinc-900", // Highlight active chat
              )}
            >
              {/* Avatar */}
              <div className="relative shrink-0">
                <img
                  src={getAvatarUrl(chat)}
                  alt="Avatar"
                  className="w-12 h-12 rounded-full object-cover border border-zinc-700"
                />
                {/* Online Status Indicator */}
                {!chat.isPendingInvite && (
                  <span
                    className={cn(
                      "absolute bottom-0 right-0 w-3 h-3 border-2 border-zinc-950 rounded-full transition-colors",
                      chat.isOnline ? "bg-green-500" : "bg-zinc-600",
                    )}
                  />
                )}
              </div>

              {/* Chat Info */}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className="font-medium text-zinc-100 truncate">
                    {chat.chatName}
                  </h3>
                  <span className="text-xs text-zinc-500 shrink-0">
                    {/* If you have a real date from latestMessage, format it here */}
                    {chat.latestMessage ? "Recent" : "New"}
                  </span>
                </div>
                <p className="text-sm text-zinc-400 truncate">
                  {chat.isPendingInvite
                    ? chat.latestMessage?.text || "Invite sent — waiting to join"
                    : chat.latestMessage?.text ||
                      chat.latestMessage?.content ||
                      "Start a new conversation..."}
                </p>
              </div>

              {chat.isPendingInvite ? (
                <div
                  className="shrink-0 bg-amber-500/15 text-amber-400 p-1.5 rounded-full"
                  title="Waiting for user to join"
                >
                  <Clock className="w-4 h-4" />
                </div>
              ) : (
                chat.unreadCount > 0 && (
                  <div className="shrink-0 bg-indigo-600 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-md">
                    {chat.unreadCount}
                  </div>
                )
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
