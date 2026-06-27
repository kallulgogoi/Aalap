"use client";

import { useState, useEffect } from "react";
import { useChatStore } from "@/store/chatStore";
import { useAuthStore } from "@/store/authStore";
import { useGlobalSocket } from "@/context/SocketContext";
import {
  Search,
  Clock,
  MessageCircleWarning,
  Check,
  CheckCheck,
  MessageSquarePlus,
  SlidersHorizontal,
} from "lucide-react";
import NewChatDialog from "./NewChatDialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { getAvatarUrl } from "@/lib/avatar";
import { ChatListSkeleton } from "@/components/ui/ChatSkeleton";

export default function ChatSidebar({ onChatSelect, isLoading = false }) {
  const { chats, activeChat, setActiveChat, clearUnreadCount } = useChatStore();
  const { user } = useAuthStore();
  const socket = useGlobalSocket();
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [typingChats, setTypingChats] = useState({});

  useEffect(() => {
    if (!socket) return;
    const handleUserTyping = ({ chatId, isTyping }) => {
      setTypingChats((prev) => ({ ...prev, [chatId]: isTyping }));
    };
    socket.on("user_typing", handleUserTyping);
    return () => {
      socket.off("user_typing", handleUserTyping);
    };
  }, [socket]);

  const currentUserId = user?.id || user?._id;

  const filteredChats = chats.filter((chat) => {
    const matchesSearch = chat.chatName
      ?.toLowerCase()
      .includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (filter === "unread") return chat.unreadCount > 0;
    return true;
  });

  const handleSelectChat = (chat) => {
    setActiveChat(chat);
    clearUnreadCount(chat._id);
    if (onChatSelect) onChatSelect();
  };

  const formatTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  return (
    <div className="flex flex-col h-full relative">
      <div className="p-3 border-b border-white/5 shrink-0 glass-panel-strong rounded-none">
        <div className="relative group">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-telegram-soft flex items-center justify-center pointer-events-none">
            <Search className="w-4 h-4 text-telegram" strokeWidth={2} />
          </div>
          <Input
            placeholder="Search conversations..."
            className="w-full pl-12 pr-4 h-11 rounded-full premium-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 mt-3">
          <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
          {["all", "unread"].map((tab) => (
            <Button
              key={tab}
              variant="ghost"
              size="sm"
              onClick={() => setFilter(tab)}
              className={cn(
                "h-8 rounded-full px-4 text-xs capitalize",
                filter === tab
                  ? "bg-telegram-soft text-telegram border border-telegram"
                  : "text-zinc-400 hover:text-zinc-100 hover:bg-white/5",
              )}
            >
              {tab}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-24">
        {isLoading ? (
          <ChatListSkeleton />
        ) : filteredChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="w-16 h-16 rounded-[22px]  flex items-center justify-center mb-4">
              <MessageCircleWarning className="w-12 h-12 text-zinc-300" />
            </div>
            <p className="text-xl font-medium text-zinc-100">
              No Unread conversations
            </p>
            <p className="text-md text-zinc-500 mt-1 max-w-[220px]">
              Start a new chat to connect with someone instantly.
            </p>
          </div>
        ) : (
          filteredChats.map((chat) => {
            let messagePreview = "Start a new conversation...";
            let isMe = false;
            let msgStatus = null;
            const messageTime = chat.updatedAt || chat.latestMessage?.createdAt;

            if (chat.isPendingInvite) {
              messagePreview = "Invite sent — waiting to join";
            } else if (typingChats[chat._id]) {
              messagePreview = <span className="text-telegram font-medium italic">typing...</span>;
              isMe = false;
            } else if (chat.latestMessage) {
              const msg = chat.latestMessage;
              messagePreview = msg.isDeleted
                ? "This message was deleted"
                : msg.text || msg.content || (msg.mediaUrl ? "Photo" : "");

              const senderIdStr =
                typeof msg.senderId === "object" && msg.senderId !== null
                  ? msg.senderId._id
                  : msg.senderId;
              isMe = senderIdStr === currentUserId;
              msgStatus = msg.status;
            }

            const isActive = activeChat?._id === chat._id;
// console.log("Avatar Debug:", chat);
            return (
              <button
                key={chat._id}
                type="button"
                onClick={() => handleSelectChat(chat)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-3 text-left transition-all duration-200 group",
                  isActive
                    ? "bg-telegram-soft border-l-2 border-[#24A1DE]"
                    : "border-l-2 border-transparent hover:bg-white/[0.04]",
                )}
              >
                <div className="relative shrink-0">
                  <img
                    src={chat.avatar||getAvatarUrl(chat)}
                    alt="Avatar"
                    className="w-12 h-12 rounded-full object-cover border border-white/10"
                  />
                  {!chat.isPendingInvite && (
                    <span
                      className={cn(
                        "absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#0a1020]",
                        chat.isOnline ? "bg-emerald-400" : "bg-zinc-600",
                      )}
                    />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline gap-2 mb-1">
                    <h3 className="font-medium text-zinc-100 truncate text-sm group-hover:text-white">
                      {chat.chatName}
                    </h3>
                    <span className="text-[10px] text-zinc-500 shrink-0">
                      {formatTime(messageTime) || "New"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-zinc-400">
                    {isMe &&
                      !chat.isPendingInvite &&
                      !chat.latestMessage?.isDeleted && (
                        <span className="shrink-0">
                          {msgStatus === "read" ? (
                            <CheckCheck className="w-3.5 h-3.5 text-[#24A1DE]" />
                          ) : (
                            <Check className="w-3.5 h-3.5 text-zinc-500" />
                          )}
                        </span>
                      )}
                    <p className="truncate">{messagePreview}</p>
                  </div>
                </div>

                {chat.isPendingInvite ? (
                  <div className="shrink-0 p-2 rounded-xl bg-amber-500/10 text-amber-400">
                    <Clock className="w-4 h-4" />
                  </div>
                ) : (
                  chat.unreadCount > 0 && (
                    <div className="shrink-0 min-w-5 h-5 px-1.5 rounded-full bg-[#24A1DE] text-[#FFFFFF] text-[11px] font-semibold flex items-center justify-center shadow-lg shadow-[rgba(36,161,222,0.25)]">
                      {chat.unreadCount}
                    </div>
                  )
                )}
              </button>
            );
          })
        )}
      </div>

      <div className="absolute right-5 bottom-5 max-md:bottom-[90px]">
        <NewChatDialog>
          <Button
            className="w-14 h-14 rounded-full btn-telegram hover:scale-105 transition-transform shadow-[0_16px_40px_rgba(36,161,222,0.35)]"
            title="New chat"
          >
            <MessageSquarePlus className="w-6 h-6" strokeWidth={1.75} />
          </Button>
        </NewChatDialog>
      </div>
    </div>
  );
}
