"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Trash2, RotateCcw, CheckCheck, Check } from "lucide-react";

export default function MessageBubble({ message, isMe, onDelete, onRestore }) {
  const [showUndo, setShowUndo] = useState(false);

  useEffect(() => {
    if (message.isDeleted) {
      if (message.deletedAt) {
        const deletedTime = new Date(message.deletedAt).getTime();
        const timePassed = Date.now() - deletedTime;

        if (timePassed < 5000) {
          setShowUndo(true);
          const timer = setTimeout(() => setShowUndo(false), 5000 - timePassed);
          return () => clearTimeout(timer);
        } else {
          setShowUndo(false);
        }
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

  if (message.isDeleted) {
    return (
      <div
        className={cn(
          "flex w-full mb-3",
          isMe ? "justify-end" : "justify-start",
        )}
      >
        <div className="px-4 py-2.5 rounded-2xl text-sm bg-zinc-800/30 border border-zinc-700/30 text-zinc-500 italic flex items-center gap-3 backdrop-blur-sm transition-all">
          <span>This message was deleted</span>
          {isMe && showUndo && (
            <button
              onClick={() => onRestore(message._id)}
              className="text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1.5 text-xs bg-indigo-500/10 px-3 py-1.5 rounded-lg transition-all hover:bg-indigo-500/20"
            >
              <RotateCcw className="w-3 h-3" /> Undo
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex w-full mb-3 group",
        isMe ? "justify-end" : "justify-start",
      )}
    >
      {isMe && message._id && (
        <button
          onClick={() => onDelete(message._id)}
          className="mr-2 self-center opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-400 transition-all duration-200 hover:scale-110"
          title="Delete Message"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}

      <div
        className={cn(
          "max-w-[70%] px-4 py-2.5 rounded-2xl shadow-lg text-sm relative flex flex-col transition-all duration-200",
          isMe
            ? "bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-br-sm shadow-indigo-500/20"
            : "bg-zinc-800/80 text-zinc-100 rounded-bl-sm border border-zinc-700/30 backdrop-blur-sm",
        )}
      >
        {message.mediaUrl && (
          <img
            src={message.mediaUrl}
            alt="Uploaded media"
            className="w-full max-w-[250px] rounded-lg mb-2 object-cover border border-black/10 shadow-lg"
          />
        )}

        {(message.text || message.content) && (
          <p className="leading-relaxed whitespace-pre-wrap break-words">
            {message.text || message.content}
          </p>
        )}

        <div
          className={cn(
            "text-[10px] mt-1.5 flex items-center justify-end gap-1 select-none",
            isMe ? "text-indigo-200" : "text-zinc-500",
          )}
        >
          <span>{formatTime(message.createdAt)}</span>

          {isMe && (
            <div className="ml-0.5 flex items-center">
              {message.status === "read" ? (
                <CheckCheck className="w-4 h-4 text-blue-300" />
              ) : message.status === "delivered" ? (
                <Check className="w-4 h-4 text-indigo-300/50" />
              ) : (
                <Check className="w-3.5 h-3.5 text-indigo-300/30" />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
