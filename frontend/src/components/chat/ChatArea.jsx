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
  Search as SearchIcon,
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

import { MessageListSkeleton } from "@/components/ui/ChatSkeleton";

export default function ChatArea({ onOpenDetails, detailsOpen = true }) {
  const {
    activeChat,
    setActiveChat,
    messages,
    addLiveMessage,
    isMessagesLoading,
    fetchMoreMessages,
    isFetchingMore,
  } = useChatStore();
  const { user } = useAuthStore();
  
  const handleLoadMore = () => {
    if (!isFetchingMore && !isMessagesLoading) {
      fetchMoreMessages();
    }
  };
  
  const scrollRef = useChatScroll(messages, activeChat?._id, handleLoadMore);
  const socket = useGlobalSocket();
  const [showInfo, setShowInfo] = useState(false);
  const [isUserTyping, setIsUserTyping] = useState(false);
  const [optimisticMsgs, setOptimisticMsgs] = useState([]);

  const groupMessagesByDate = (msgs) => {
    const groups = [];
    let currentDate = "";
    let currentGroup = [];
    
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    msgs.forEach((msg) => {
      const msgDate = new Date(msg.createdAt || Date.now());
      let displayDate = "";
      
      if (msgDate.toDateString() === today.toDateString()) {
        displayDate = "Today";
      } else if (msgDate.toDateString() === yesterday.toDateString()) {
        displayDate = "Yesterday";
      } else {
        displayDate = msgDate.toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });
      }
      
      if (displayDate !== currentDate) {
        if (currentGroup.length > 0) {
          groups.push({ date: currentDate, messages: currentGroup });
        }
        currentDate = displayDate;
        currentGroup = [msg];
      } else {
        currentGroup.push(msg);
      }
    });
    if (currentGroup.length > 0) {
      groups.push({ date: currentDate, messages: currentGroup });
    }
    return groups;
  };

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

    const handleUserTyping = ({ chatId, senderId, isTyping }) => {
      if (activeChat && activeChat._id === chatId) {
        setIsUserTyping(isTyping);
      }
    };

    socket.on("receipts_updated", handleReceiptsUpdated);
    socket.on("message_deleted", handleRemoteDelete);
    socket.on("message_restored", handleRemoteRestore);
    socket.on("user_typing", handleUserTyping);

    return () => {
      socket.off("receipts_updated", handleReceiptsUpdated);
      socket.off("message_deleted", handleRemoteDelete);
      socket.off("message_restored", handleRemoteRestore);
      socket.off("user_typing", handleUserTyping);
    };
  }, [socket, activeChat]);

  const handleTyping = (isTyping) => {
    if (!socket || !activeChat || activeChat.isGhost || activeChat.isPendingInvite) return;
    const otherParticipant = activeChat.participants?.find((p) => {
      const id = typeof p === "object" && p !== null ? p._id : p;
      return String(id) !== String(user?.id) && String(id) !== String(user?._id);
    });
    const receiverId = typeof otherParticipant === "object" && otherParticipant !== null ? otherParticipant._id : otherParticipant;
    if (receiverId) {
      socket.emit("typing", { receiverId, chatId: activeChat._id, isTyping });
    }
  };

  // Handle ghost chat transition smoothly
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
      
      const tempId = `temp-${Date.now()}`;
      const optimisticMsg = {
        _id: tempId,
        text: input,
        content: input,
        mediaUrl,
        senderId: myId,
        chatId: activeChat._id,
        createdAt: new Date().toISOString(),
        status: "sending",
      };

      if (!isGhost) {
        setOptimisticMsgs((prev) => [...prev, optimisticMsg]);
      }

      const payload = isGhost
        ? { receiverId: activeChat.receiverId, content: input, mediaUrl }
        : { chatId: activeChat._id, content: input, mediaUrl };

      const response = await axiosInstance.post("/messages", payload);

      const data = response.data;
      const newMsg = data.message || data;

      if (isGhost && data.chatId) {
        // Refresh the sidebar to get the new chat object
        await useChatStore.getState().fetchChats();

        // Find the real chat in the newly fetched store
        const realChat = useChatStore
          .getState()
          .chats.find((c) => c._id === data.chatId);

        if (realChat) {
          // Setting the active chat automatically fetches the clean message history
          await useChatStore.getState().setActiveChat(realChat);
        } else {
          // Fallback if the fetch missed it
          const fallbackChat = {
            _id: data.chatId,
            chatName: activeChat.chatName,
            avatar: activeChat.avatar,
            participants: [user?.id || user?._id, activeChat.receiverId],
          };
          await useChatStore.getState().setActiveChat(fallbackChat);
        }
      } else {
        if (!isGhost) {
          setOptimisticMsgs((prev) => prev.filter((m) => m._id !== tempId));
        }
        addLiveMessage(newMsg);
      }
    } catch (error) {
      if (!activeChat.isGhost) {
        setOptimisticMsgs((prev) => prev.filter((m) => m._id !== tempId));
      }
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

  const visibleMessages = dedupeMessages([...messages, ...optimisticMsgs]);

  return (
    <div className="flex flex-col h-full flex-1 relative w-full">
      <div className="h-16 border-b border-white/5 glass-panel-strong flex items-center justify-between px-4 shrink-0 z-10">
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

          
          <div
            className="relative cursor-pointer"
            onClick={() => {
              if (onOpenDetails) onOpenDetails();
              else setShowInfo(true);
            }}
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
              {isUserTyping ? (
                <span className="text-xs text-telegram font-medium italic">typing...</span>
              ) : activeChat.isPendingInvite ? (
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

        {/* Header Actions */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="text-zinc-400 hover:text-zinc-100 hover:bg-white/5 rounded-2xl transition-all duration-200 hidden sm:flex"
          >
            <SearchIcon className="w-5 h-5" />
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
                className="rounded-xl text-zinc-400 transition-all duration-200 hover:bg-zinc-800/50 hover:text-zinc-100"
              >
                <MoreVertical className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              alignOffset={-8}
              sideOffset={8}
              className="min-w-[200px] rounded-xl border border-zinc-800 bg-zinc-900 p-1 text-zinc-100 shadow-2xl"
            >
              <DropdownMenuItem
                onClick={() => {
                  if (onOpenDetails) onOpenDetails();
                  else setShowInfo(true);
                }}
                className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 transition-colors hover:bg-white/5 focus:bg-white/5"
              >
                <Info className="h-4 w-4" />
                <span>View Profile</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Scrollable Message List */}
      <div className="flex-1 relative overflow-hidden chat-area-pattern">
        <div
          ref={scrollRef}
          className="absolute inset-0 overflow-y-auto p-4 md:p-6 space-y-2"
        >
          {isMessagesLoading ? (
            <MessageListSkeleton />
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
            <div className="space-y-6 pb-2">
              {isFetchingMore && (
                <div className="flex justify-center py-2">
                  <Loader2 className="w-5 h-5 text-zinc-500 animate-spin" />
                </div>
              )}
              {groupMessagesByDate(visibleMessages).map((group, gIndex) => (
                <div key={`group-${gIndex}`} className="space-y-2">
                  <div className="flex justify-center sticky top-2 z-10 my-4">
                    <span className="px-3 py-1 text-xs font-medium bg-zinc-900/80 text-zinc-300 rounded-full border border-white/10 backdrop-blur-md shadow-sm">
                      {group.date}
                    </span>
                  </div>
                  {group.messages.map((msg, index) => {
                    const senderIdStr =
                      typeof msg.senderId === "object" && msg.senderId !== null
                        ? msg.senderId._id
                        : msg.senderId;
                    const isMe =
                      senderIdStr === user?.id || senderIdStr === user?._id;
                    return (
                      <MessageBubble
                        key={normalizeMessageId(msg._id) || `msg-${index}`}
                        message={msg}
                        isMe={isMe}
                        activeChat={activeChat}
                        onDelete={handleDeleteMessage}
                        onRestore={handleRestoreMessage}
                      />
                    );
                  })}
                </div>
              ))}
              {isUserTyping && (
                <div className="flex items-center gap-2 p-2 max-w-[85%] self-start mt-2">
                  <div className="flex items-center gap-1.5 bg-zinc-800/80 backdrop-blur-sm rounded-2xl px-4 py-2.5 border border-white/5 rounded-tl-sm w-fit shadow-md">
                    <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
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
          onTyping={handleTyping}
          disabled={!activeChat}
        />
      )}

      {/* Profile Info Dialog */}
      <Dialog open={showInfo} onOpenChange={setShowInfo}>
        <DialogContent className="sm:max-w-md glass-panel-strong border-telegram text-zinc-100 xl:hidden rounded-[32px]">
          <DialogHeader>
            <DialogTitle className="text-telegram">Profile</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center py-4 px-2">
            <div className="relative p-1 rounded-full profile-avatar-ring">
              <img
                src={getAvatarUrl(activeChat)}
                alt="Profile"
                className="w-28 h-28 rounded-full object-cover"
              />
              {activeChat.isOnline && (
                <span className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-zinc-950" />
              )}
            </div>
            <h3 className="text-xl font-semibold text-[#FFFFFF] mt-5">
              {activeChat.chatName}
            </h3>
            <p className="text-sm text-zinc-400 mt-2 px-4 py-1 rounded-full bg-telegram-soft">
              {activeChat.isOnline ? "Online" : "Offline"}
            </p>
            {activeChat.bio && (
              <p className="text-sm text-zinc-300 mt-3 text-center px-5 py-3 rounded-[24px] bg-white/5 max-w-sm">
                {activeChat.bio}
              </p>
            )}
            <div className="w-full mt-6 pt-6 border-t border-white/10">
              <div className="flex justify-around text-center gap-3">
                <div className="flex-1 rounded-full bg-telegram-soft py-3">
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
                <div className="flex-1 rounded-full bg-telegram-soft py-3">
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
