"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { getAvatarUrl } from "@/lib/avatar";
import {
  Trash2,
  RotateCcw,
  CheckCheck,
  Check,
  MoreVertical,
  Copy,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

export default function MessageBubble({
  message,
  isMe,
  onDelete,
  onRestore,
  activeChat,
}) {
  const [showUndo, setShowUndo] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const pressTimer = useRef(null);

  const handlePressStart = () => {
    pressTimer.current = setTimeout(() => {
      setDropdownOpen(true);
      if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(50);
      }
    }, 500);
  };

  const handlePressEnd = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
    }
  };

  useEffect(() => {
    if (message.isDeleted) {
      if (message.deletedAt) {
        const deletedTime = new Date(message.deletedAt).getTime();
        const timePassed = Date.now() - deletedTime;

        if (timePassed < 5000) {
          setShowUndo(true);
          const timer = setTimeout(() => setShowUndo(false), 5000 - timePassed);
          return () => clearTimeout(timer);
        }
        setShowUndo(false);
      } else {
        setShowUndo(true);
        const timer = setTimeout(() => setShowUndo(false), 5000);
        return () => clearTimeout(timer);
      }
    }
  }, [message.isDeleted, message.deletedAt]);

  const formatTime = (dateString) => {
    if (!dateString) return "Sending...";
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const handleCopy = () => {
    const text = message.text || message.content || "";
    if (text) {
      toast.success("Message copied to clipboard");
      navigator.clipboard.writeText(text);
    }
  };

  if (message.isDeleted) {
    return (
      <div
        className={cn(
          "flex w-full mb-2",
          isMe ? "justify-end" : "justify-start",
        )}
      >
        <div className="px-4 py-2.5 rounded-[20px] text-sm bg-white/[0.04] border border-white/8 text-zinc-500 italic flex items-center gap-3 backdrop-blur-md max-w-[70%]">
          <span>This message was deleted</span>
          {isMe && showUndo && (
            <button
              type="button"
              onClick={() => onRestore(message._id)}
              className="text-blue-300 hover:text-blue-200 font-medium flex items-center gap-1.5 text-xs bg-blue-500/10 px-3 py-1.5 rounded-xl transition-all hover:bg-blue-500/20"
            >
              <RotateCcw className="w-3 h-3" /> Undo
            </button>
          )}
        </div>
      </div>
    );
  }

  let senderObj =
    typeof message.senderId === "object" && message.senderId !== null
      ? message.senderId
      : null;

  if (!senderObj && activeChat?.participants?.length) {
    const senderIdStr =
      typeof message.senderId === "string"
        ? message.senderId
        : String(message.senderId);
    const matchedParticipant = activeChat.participants.find((p) => {
      const pId = typeof p === "object" && p !== null ? p._id : p;
      return String(pId) === senderIdStr;
    });
    if (matchedParticipant && typeof matchedParticipant === "object") {
      senderObj = matchedParticipant;
    }
  }

  if (!senderObj) {
    senderObj = { username: message.senderName };
  }

  const displayName =
    senderObj.username || message.senderName || senderObj.email?.split("@")[0];

  return (
    <div
      className={cn(
        "flex w-full mb-2 group",
        isMe ? "justify-end" : "justify-start",
      )}
    >
      {!isMe && (
        <div className="w-8 h-8 rounded-xl shrink-0 mr-2 mt-1 overflow-hidden border border-white/10">
          <img
            src={getAvatarUrl(senderObj)}
            alt="avatar"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="relative flex flex-col max-w-[72%]">
        {!isMe && displayName && (
          <span className="text-[11px] font-medium text-blue-300 mb-1 ml-2">
            {displayName}
          </span>
        )}

        <div
          onTouchStart={handlePressStart}
          onTouchEnd={handlePressEnd}
          onTouchMove={handlePressEnd}
          onMouseDown={handlePressStart}
          onMouseUp={handlePressEnd}
          onMouseLeave={handlePressEnd}
          onContextMenu={(e) => {
            e.preventDefault();
            setDropdownOpen(true);
          }}
          className={cn(
            "px-4 py-3 rounded-[20px] text-sm relative transition-all duration-200 select-none",
            isMe ? "bubble-me rounded-br-md" : "bubble-them rounded-bl-md",
          )}
        >
          {message.mediaUrl && (
            <img
              src={message.mediaUrl}
              alt="Uploaded media"
              className="w-full max-w-[280px] rounded-2xl mb-2 object-cover border border-black/10"
            />
          )}

          {(message.text || message.content) && (
            <p className="leading-relaxed whitespace-pre-wrap break-words text-[15px]">
              {message.text || message.content}
            </p>
          )}

          <div
            className={cn(
              "text-[10px] mt-2 flex items-center justify-end gap-1 select-none",
              isMe ? "text-blue-100/80" : "text-zinc-500",
            )}
          >
            <span>{formatTime(message.createdAt)}</span>
            {isMe && (
              <div className="ml-0.5 flex items-center">
                {message.status === "read" ? (
                  <CheckCheck className="w-4 h-4 text-sky-200" />
                ) : message.status === "delivered" ? (
                  <Check className="w-4 h-4 text-blue-100/70" />
                ) : (
                  <Check className="w-3.5 h-3.5 text-blue-100/40" />
                )}
              </div>
            )}
          </div>
        </div>

        <div
          className={cn(
            "absolute top-1/2 -translate-y-1/2 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-all duration-200",
            isMe ? "-left-12" : "-right-12",
          )}
        >
          <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="w-8 h-8 rounded-xl glass-panel text-zinc-400 hover:text-zinc-100 flex items-center justify-center transition-all"
              >
                <MoreVertical className="w-3.5 h-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="glass-panel-strong text-zinc-600 min-w-[150px]">
              <DropdownMenuItem
                onClick={handleCopy}
                className="hover:bg-white/5 cursor-pointer flex items-center gap-2"
              >
                <Copy className="w-4 h-4" />
                Copy
              </DropdownMenuItem>
              {isMe && (
                <DropdownMenuItem
                  onClick={() => onDelete(message._id)}
                  className="hover:bg-white/5 cursor-pointer flex items-center gap-2 text-red-400"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
