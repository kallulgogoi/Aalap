"use client";

import { useEffect, useState } from "react";
import { useChatStore } from "@/store/chatStore";
import { useAuthStore } from "@/store/authStore";
import { useChatScroll } from "@/hooks/useChatScroll";
import axiosInstance from "@/lib/axios";
import {
  MoreVertical,
  Loader2,
  Users,
  Clock,
  ArrowLeft,
  Phone,
  Video,
  Info,
  Pin,
  Search,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGlobalSocket } from "@/context/SocketContext";
import { cn } from "@/lib/utils";
import { getAvatarUrl } from "@/lib/avatar";
import { dedupeMessages, normalizeMessageId } from "@/lib/messageUtils";
import { toast } from "sonner";
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function ChatArea() {
  const {
    activeChat,
    setActiveChat,
    messages,
    addLiveMessage,
    isMessagesLoading,
  } = useChatStore();
  const { user } = useAuthStore();
  const scrollRef = useChatScroll(messages, activeChat?._id);
  const socket = useGlobalSocket();
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    if (
      !socket ||
      !activeChat ||
      activeChat.isGhost ||
      activeChat.isPendingInvite ||
      !messages.length
    )
      return;

    const otherParticipant = activeChat.participants?.find((p) => {
      const pIdStr = typeof p === "object" && p !== null ? p._id : p;
      return pIdStr !== user?.id && pIdStr !== user?._id;
    });

    const otherParticipantId =
      typeof otherParticipant === "object" && otherParticipant !== null
        ? otherParticipant._id
        : otherParticipant;

    if (!otherParticipantId) return;

    const hasUnread = messages.some((msg) => {
      const senderIdStr =
        typeof msg.senderId === "object" && msg.senderId !== null
          ? msg.senderId._id
          : msg.senderId;
      return (
        senderIdStr !== (user?.id || user?._id) && msg.status === "delivered"
      );
    });

    if (hasUnread) {
      socket.emit("mark_messages_read", {
        chatId: activeChat._id,
        senderId: otherParticipantId,
      });
    }
  }, [socket, activeChat, messages, user]);

  useEffect(() => {
    if (!socket) return;

    const handleReceiptsUpdated = ({ chatId, readBy }) => {
      useChatStore.getState().markMessagesAsRead(chatId, readBy);
    };

    const handleRemoteDelete = ({ messageId }) => {
      useChatStore.getState().updateMessage(messageId, { isDeleted: true });
    };

    const handleRemoteRestore = ({ messageId }) => {
      useChatStore.getState().updateMessage(messageId, { isDeleted: false });
    };

    socket.on("receipts_updated", handleReceiptsUpdated);
    socket.on("message_deleted", handleRemoteDelete);
    socket.on("message_restored", handleRemoteRestore);

    return () => {
      socket.off("receipts_updated", handleReceiptsUpdated);
      socket.off("message_deleted", handleRemoteDelete);
      socket.off("message_restored", handleRemoteRestore);
    };
  }, [socket]);

  const handleSendMessage = async (input, mediaUrl = null) => {
    const myId = user?.id || user?._id;

    if (
      activeChat.receiverId &&
      String(activeChat.receiverId) === String(myId)
    ) {
      toast.error("You cannot send messages to yourself.");
      return;
    }

    try {
      const isGhost = activeChat.isGhost;
      const payload = isGhost
        ? { receiverId: activeChat.receiverId, content: input, mediaUrl }
        : { chatId: activeChat._id, content: input, mediaUrl };

      const response = await axiosInstance.post("/messages", payload);

      const data = response.data;
      const newMsg = data.message || data;

      if (isGhost && data.chatId) {
        const realChat = {
          _id: data.chatId,
          chatName: activeChat.chatName,
          avatar: activeChat.avatar,
          participants: [user?.id || user?._id, activeChat.receiverId],
        };
        await useChatStore.getState().setActiveChat(realChat);
        useChatStore.getState().setMessages([newMsg]);
        useChatStore.getState().fetchChats();
      } else {
        addLiveMessage(newMsg);
      }
    } catch (error) {
      console.error("Failed to send message", error);
      toast.error(error.response?.data?.message || "Failed to send message.");
    }
  };

  const handleDeleteMessage = async (messageId) => {
    useChatStore.getState().updateMessage(messageId, { isDeleted: true });
    try {
      await axiosInstance.put(`/messages/${messageId}/delete`);
    } catch (error) {
      console.error("Failed to delete", error);
      useChatStore.getState().updateMessage(messageId, { isDeleted: false });
      toast.error("Network error. Message was not deleted.");
    }
  };

  const handleRestoreMessage = async (messageId) => {
    useChatStore.getState().updateMessage(messageId, { isDeleted: false });
    try {
      await axiosInstance.put(`/messages/${messageId}/restore`);
    } catch (error) {
      console.error("Failed to restore", error);
      useChatStore.getState().updateMessage(messageId, { isDeleted: true });
      toast.error("Network error. Message was not restored.");
    }
  };

  if (!activeChat) {
    return (
      <div className="hidden md:flex flex-1 items-center justify-center bg-gradient-to-b from-zinc-950 to-zinc-900">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 rounded-full bg-zinc-800/30 flex items-center justify-center mb-4 border border-zinc-700/30">
            <Users className="w-10 h-10 text-zinc-600" />
          </div>
          <p className="text-zinc-400 font-medium">No chat selected</p>
          <p className="text-sm text-zinc-500 mt-1">
            Select a conversation to start chatting!
          </p>
        </div>
      </div>
    );
  }

  const visibleMessages = dedupeMessages(messages);

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-zinc-950 to-zinc-900 flex-1 relative w-full">
      {/* Sticky Header with Glass Effect - Telegram Style */}
      <div className="h-16 border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-xl flex items-center justify-between px-4 shrink-0 z-10">
        <div className="flex items-center gap-3">
          {/* Mobile Back Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setActiveChat(null)}
            className="md:hidden shrink-0 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 -ml-2 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>

          {/* Avatar with status */}
          <div
            className="relative cursor-pointer"
            onClick={() => setShowInfo(true)}
          >
            <div
              className={cn(
                "absolute inset-0 rounded-full blur-xl transition-opacity duration-300",
                activeChat.isOnline
                  ? "bg-green-500/20 opacity-100"
                  : "opacity-0",
              )}
            />
            <img
              src={getAvatarUrl(activeChat)}
              alt="Avatar"
              className="w-10 h-10 md:w-11 md:h-11 rounded-full object-cover border-2 border-zinc-700/50 relative z-10"
            />
          </div>
          <div onClick={() => setShowInfo(true)} className="cursor-pointer">
            <h2 className="font-semibold text-zinc-100 leading-tight text-base md:text-lg">
              {activeChat.chatName}
            </h2>
            <div className="flex items-center gap-1.5">
              {activeChat.isPendingInvite ? (
                <>
                  <Clock className="w-3 h-3 text-amber-400" />
                  <span className="text-xs text-amber-400 font-medium">
                    Invite pending
                  </span>
                </>
              ) : activeChat.isOnline ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs text-green-400 font-medium">
                    Online
                  </span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-zinc-600" />
                  <span className="text-xs text-zinc-500">Offline</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Header Actions - Telegram Style */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 rounded-xl transition-all duration-200 hidden sm:flex"
          >
            <Search className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 rounded-xl transition-all duration-200 hidden sm:flex"
          >
            <Phone className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 rounded-xl transition-all duration-200 hidden sm:flex"
          >
            <Video className="w-5 h-5" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 rounded-xl transition-all duration-200"
              >
                <MoreVertical className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-zinc-900 border-zinc-800 text-zinc-100 min-w-[200px]">
              <DropdownMenuItem
                onClick={() => setShowInfo(true)}
                className="hover:bg-zinc-800 cursor-pointer flex items-center gap-2"
              >
                <Info className="w-4 h-4" />
                View Profile
              </DropdownMenuItem>
              <DropdownMenuItem className="hover:bg-zinc-800 cursor-pointer flex items-center gap-2">
                <Pin className="w-4 h-4" />
                Pin Chat
              </DropdownMenuItem>
              <DropdownMenuItem className="hover:bg-zinc-800 cursor-pointer flex items-center gap-2 text-red-400">
                <span>Delete Chat</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Scrollable Message List */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 md:p-6 space-y-2"
      >
        {isMessagesLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
              <p className="text-sm text-zinc-500">Loading messages...</p>
            </div>
          </div>
        ) : visibleMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-20 h-20 rounded-full bg-zinc-800/30 flex items-center justify-center mb-4 border border-zinc-700/30">
              <Users className="w-10 h-10 text-zinc-600" />
            </div>
            <p className="text-zinc-400 font-medium">No messages yet</p>
            <p className="text-sm text-zinc-500 mt-1">
              Send a message to start the conversation!
            </p>
          </div>
        ) : (
          visibleMessages.map((msg, index) => {
            const senderIdStr =
              typeof msg.senderId === "object" && msg.senderId !== null
                ? msg.senderId._id
                : msg.senderId;
            const isMe = senderIdStr === user?.id || senderIdStr === user?._id;
            return (
              <MessageBubble
                key={normalizeMessageId(msg._id) || `msg-${index}`}
                message={msg}
                isMe={isMe}
                onDelete={handleDeleteMessage}
                onRestore={handleRestoreMessage}
              />
            );
          })
        )}
      </div>

      {/* Input Footer Area */}
      {activeChat.isPendingInvite ? (
        <div className="border-t border-zinc-800/50 bg-zinc-950/80 backdrop-blur-sm px-6 py-4 text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-zinc-400">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>
              Waiting for{" "}
              <strong className="text-zinc-200">
                {activeChat.targetEmail}
              </strong>{" "}
              to join
            </span>
          </div>
        </div>
      ) : (
        <MessageInput
          onSendMessage={handleSendMessage}
          disabled={!activeChat}
        />
      )}

      {/* Profile Info Dialog */}
      <Dialog open={showInfo} onOpenChange={setShowInfo}>
        <DialogContent className="sm:max-w-md bg-zinc-950 border-zinc-800 text-zinc-100">
          <DialogHeader>
            <DialogTitle>Profile</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center py-4">
            <div className="relative">
              <img
                src={getAvatarUrl(activeChat)}
                alt="Profile"
                className="w-24 h-24 rounded-full object-cover border-2 border-zinc-700"
              />
              {activeChat.isOnline && (
                <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-zinc-950" />
              )}
            </div>
            <h3 className="text-xl font-semibold text-zinc-100 mt-4">
              {activeChat.chatName}
            </h3>
            <p className="text-sm text-zinc-400 mt-1">
              {activeChat.isOnline ? "Online" : "Offline"}
            </p>
            {activeChat.bio && (
              <p className="text-sm text-zinc-300 mt-2 text-center">
                {activeChat.bio}
              </p>
            )}
            <div className="w-full mt-6 pt-6 border-t border-zinc-800">
              <div className="flex justify-around text-center">
                <div>
                  <p className="text-2xl font-semibold text-zinc-100">
                    {
                      messages.filter((m) => {
                        const sid =
                          typeof m.senderId === "object"
                            ? m.senderId?._id
                            : m.senderId;
                        return (
                          sid === activeChat._id ||
                          sid === activeChat.receiverId
                        );
                      }).length
                    }
                  </p>
                  <p className="text-xs text-zinc-500">Messages</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold text-zinc-100">
                    {
                      messages.filter((m) => {
                        const sid =
                          typeof m.senderId === "object"
                            ? m.senderId?._id
                            : m.senderId;
                        return (
                          (sid === user?.id || sid === user?._id) &&
                          m.status === "read"
                        );
                      }).length
                    }
                  </p>
                  <p className="text-xs text-zinc-500">Read</p>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
