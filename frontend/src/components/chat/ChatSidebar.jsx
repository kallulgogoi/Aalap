"use client";

import { useState } from "react";
import { useChatStore } from "@/store/chatStore";
import { useAuthStore } from "@/store/authStore";
import { Search, Clock, Sparkles, Check, CheckCheck } from "lucide-react";
import NewChatDialog from "./NewChatDialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export default function ChatSidebar() {
  const { chats, activeChat, setActiveChat, clearUnreadCount } = useChatStore();
  const { user } = useAuthStore();
  const [search, setSearch] = useState("");

  const currentUserId = user?.id || user?._id;

  const filteredChats = chats.filter((chat) =>
    chat.chatName?.toLowerCase().includes(search.toLowerCase()),
  );

  const handleSelectChat = (chat) => {
    setActiveChat(chat);
    clearUnreadCount(chat._id);
  };

  // Helper to format timestamps gracefully
  const formatTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const today = new Date();

    // If the message is from today, show the time (e.g., 2:30 PM)
    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    // If older, show the date (e.g., Oct 24)
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-zinc-950 to-zinc-900 border-r border-zinc-800/50">
      {/* Search Header */}
      <div className="p-4 border-b border-zinc-800/50 shrink-0 bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <Input
            placeholder="Search conversations..."
            className="w-full pl-9 bg-zinc-900/50 border-zinc-700/50 text-zinc-200 placeholder:text-zinc-500 focus-visible:ring-indigo-500 rounded-xl transition-all duration-200 hover:border-zinc-600"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="mt-3">
          <NewChatDialog />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {filteredChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="w-16 h-16 rounded-full bg-zinc-800/50 flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-zinc-600" />
            </div>
            <p className="text-sm text-zinc-500">No conversations yet</p>
            <p className="text-xs text-zinc-600 mt-1">
              Start a new chat to connect
            </p>
          </div>
        ) : (
          filteredChats.map((chat) => {
            // Determine preview text, authorship, and read status
            let messagePreview = "Start a new conversation...";
            let isMe = false;
            let msgStatus = null;
            const messageTime = chat.updatedAt || chat.latestMessage?.createdAt;

            if (chat.isPendingInvite) {
              messagePreview = "⏳ Invite sent...";
            } else if (chat.latestMessage) {
              const msg = chat.latestMessage;
              messagePreview = msg.isDeleted
                ? "🚫 This message was deleted"
                : msg.text || msg.content || (msg.mediaUrl ? "📷 Image" : "");

              const senderIdStr =
                typeof msg.senderId === "object" && msg.senderId !== null
                  ? msg.senderId._id
                  : msg.senderId;

              isMe = senderIdStr === currentUserId;
              msgStatus = msg.status;
            }

            return (
              <button
                key={chat._id}
                onClick={() => handleSelectChat(chat)}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 text-left relative group",
                  "hover:bg-zinc-800/50 hover:scale-[1.02] hover:shadow-lg",
                  activeChat?._id === chat._id
                    ? "bg-gradient-to-r from-indigo-600/20 to-purple-600/10 border border-indigo-500/20 shadow-lg shadow-indigo-500/5"
                    : "border border-transparent",
                )}
              >
                {/* Avatar */}
                <div className="relative shrink-0">
                  <div
                    className={cn(
                      "absolute inset-0 rounded-full blur-md transition-opacity duration-300",
                      chat.isOnline
                        ? "bg-green-500/20 opacity-100"
                        : "opacity-0",
                    )}
                  />
                  {/* FIX: Directly use the pre-computed chat.avatar so it pulls the uploaded profile pic properly */}
                  <img
                    src={chat.avatar}
                    alt="Avatar"
                    className="w-12 h-12 rounded-full object-cover border-2 border-zinc-700/50 relative z-10"
                  />
                  {!chat.isPendingInvite && (
                    <span
                      className={cn(
                        "absolute bottom-0 right-0 w-3.5 h-3.5 border-2 border-zinc-950 rounded-full transition-all duration-300 z-20",
                        chat.isOnline
                          ? "bg-green-500 ring-2 ring-green-500/30"
                          : "bg-zinc-600",
                      )}
                    />
                  )}
                </div>

                {/* Chat Info & Read Receipts */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="font-semibold text-zinc-100 truncate group-hover:text-white transition-colors">
                      {chat.chatName}
                    </h3>
                    <span className="text-[10px] font-medium text-zinc-500 shrink-0">
                      {/* Formatted Date/Time */}
                      {formatTime(messageTime) ||
                        (chat.latestMessage ? "Now" : "New")}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-sm text-zinc-400 group-hover:text-zinc-300 transition-colors">
                    {/* Read Receipts Indicator (Only shown if I sent the last message) */}
                    {isMe &&
                      !chat.isPendingInvite &&
                      !chat.latestMessage?.isDeleted && (
                        <span className="shrink-0">
                          {msgStatus === "read" ? (
                            <CheckCheck className="w-3.5 h-3.5 text-blue-400" />
                          ) : msgStatus === "delivered" ? (
                            <Check className="w-3.5 h-3.5 text-zinc-400" />
                          ) : (
                            <Check className="w-3 h-3 text-zinc-600" />
                          )}
                        </span>
                      )}
                    <p className="truncate flex-1">{messagePreview}</p>
                  </div>
                </div>

                {/* Unread Count Badges */}
                {chat.isPendingInvite ? (
                  <div className="shrink-0 bg-amber-500/20 text-amber-400 p-1.5 rounded-full animate-pulse">
                    <Clock className="w-4 h-4" />
                  </div>
                ) : (
                  chat.unreadCount > 0 && (
                    <div className="shrink-0 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full shadow-lg shadow-indigo-500/30 animate-pulse">
                      {chat.unreadCount}
                    </div>
                  )
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
