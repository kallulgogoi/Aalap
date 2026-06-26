"use client";

import { useEffect } from "react";
import { useChatStore } from "@/store/chatStore";
import { useAuthStore } from "@/store/authStore";
import { useChatScroll } from "@/hooks/useChatScroll";
import axiosInstance from "@/lib/axios";
import { MoreVertical, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGlobalSocket } from "@/context/SocketContext";
import { cn } from "@/lib/utils";
import { dedupeMessages, normalizeMessageId } from "@/lib/messageUtils";

// Importing the modular components we built earlier
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";

export default function ChatArea() {
  const { activeChat, messages, addLiveMessage, isMessagesLoading } =
    useChatStore();
  const { user } = useAuthStore();

  // Custom hook: Auto-scrolls to bottom whenever 'messages' array changes
  const scrollRef = useChatScroll(messages);
  const socket = useGlobalSocket();

  // Mark incoming messages as read when activeChat changes or new messages arrive
  useEffect(() => {
    if (!socket || !activeChat || activeChat.isGhost || !messages.length)
      return;

    // Resolve the other participant ID
    const otherParticipant = activeChat.participants?.find((p) => {
      const pIdStr = typeof p === "object" && p !== null ? p._id : p;
      return pIdStr !== user?.id && pIdStr !== user?._id;
    });

    const otherParticipantId =
      typeof otherParticipant === "object" && otherParticipant !== null
        ? otherParticipant._id
        : otherParticipant;

    if (!otherParticipantId) return;

    // Check if there are any unread messages from the other user
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

  // 👇 ADD THIS NEW USEEFFECT HERE 👇
  // Listen for real-time read receipts from the backend
  // Listen for real-time read receipts AND remote deletions
  useEffect(() => {
    if (!socket) return;

    const handleReceiptsUpdated = ({ chatId, readBy }) => {
      useChatStore.getState().markMessagesAsRead(chatId, readBy);
    };

    // 👇 ADD THESE TWO LISTENERS 👇
    const handleRemoteDelete = ({ messageId }) => {
      useChatStore.getState().updateMessage(messageId, { isDeleted: true });
    };

    const handleRemoteRestore = ({ messageId }) => {
      useChatStore.getState().updateMessage(messageId, { isDeleted: false });
    };

    // Bind events
    socket.on("receipts_updated", handleReceiptsUpdated);
    socket.on("message_deleted", handleRemoteDelete);
    socket.on("message_restored", handleRemoteRestore);

    // Clean up listeners on unmount
    return () => {
      socket.off("receipts_updated", handleReceiptsUpdated);
      socket.off("message_deleted", handleRemoteDelete);
      socket.off("message_restored", handleRemoteRestore);
    };
  }, [socket]);

  const handleSendMessage = async (input, mediaUrl = null) => {
    try {
      const isGhost = activeChat.isGhost;
      const payload = isGhost
        ? { receiverId: activeChat.receiverId, content: input, mediaUrl }
        : { chatId: activeChat._id, content: input, mediaUrl };

      // Everything routes to your standard message endpoint now
      const response = await axiosInstance.post("/messages", payload);

      const data = response.data;
      const newMsg = data.message || data;

      if (isGhost && data.chatId) {
        // Transition from ghost chat to a real chat
        const realChat = {
          _id: data.chatId,
          chatName: activeChat.chatName,
          avatar: activeChat.avatar,
          participants: [user?.id || user?._id, activeChat.receiverId],
        };
        // Update activeChat and set messages
        await useChatStore.getState().setActiveChat(realChat);
        useChatStore.getState().setMessages([newMsg]);
        // Refresh sidebar chats
        useChatStore.getState().fetchChats();
      } else {
        addLiveMessage(newMsg);
      }
    } catch (error) {
      console.error("Failed to send message", error);
    }
  };
  // Inside ChatArea.jsx

  const handleDeleteMessage = async (messageId) => {
    // 1. OPTIMISTIC UPDATE: Hide it instantly
    useChatStore.getState().updateMessage(messageId, { isDeleted: true });

    try {
      // 2. Fire the network request in the background
      await axiosInstance.put(`/messages/${messageId}/delete`);
    } catch (error) {
      console.error("Failed to delete", error);
      // 3. ROLLBACK: If the server fails, put the message back and warn the user
      useChatStore.getState().updateMessage(messageId, { isDeleted: false });
      toast.error("Network error. Message was not deleted.");
    }
  };

  const handleRestoreMessage = async (messageId) => {
    // 1. OPTIMISTIC UPDATE: Restore it instantly
    useChatStore.getState().updateMessage(messageId, { isDeleted: false });

    try {
      // 2. Fire the network request in the background
      await axiosInstance.put(`/messages/${messageId}/restore`);
    } catch (error) {
      console.error("Failed to restore", error);
      // 3. ROLLBACK: Re-delete it visually if it fails
      useChatStore.getState().updateMessage(messageId, { isDeleted: true });
      toast.error("Network error. Message was not restored.");
    }
  };

  // If no chat is selected, don't render the chat area
  if (!activeChat) return null;

  const visibleMessages = dedupeMessages(messages);

  return (
    <div className="flex flex-col h-full bg-[#09090b]">
      {/* Sticky Header */}
      <div className="h-16 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md flex items-center justify-between px-6 shrink-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <img
            src={
              activeChat.avatar ||
              "https://ui-avatars.com/api/?name=Chat&background=random"
            }
            alt="Avatar"
            className="w-10 h-10 rounded-full object-cover"
          />
          <div>
            <h2 className="font-semibold text-zinc-100 leading-tight">
              {activeChat.chatName}
            </h2>
            <p
              className={cn(
                "text-xs transition-colors",
                activeChat.isOnline
                  ? "text-green-400 font-medium"
                  : "text-zinc-500",
              )}
            >
              {activeChat.isOnline ? "Online" : "Offline"}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="text-zinc-400 hover:text-zinc-100"
        >
          <MoreVertical className="w-5 h-5" />
        </Button>
      </div>

      {/* Scrollable Message List */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6">
        {isMessagesLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          </div>
        ) : visibleMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-zinc-500">
            <p>No messages yet. Send a message to start the conversation!</p>
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
      <MessageInput onSendMessage={handleSendMessage} disabled={!activeChat} />
    </div>
  );
}
