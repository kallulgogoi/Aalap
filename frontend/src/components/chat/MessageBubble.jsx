"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Trash2, RotateCcw } from "lucide-react";

export default function MessageBubble({ message, isMe, onDelete, onRestore }) {
  const [showUndo, setShowUndo] = useState(false);

  // --- 5 SECOND UNDO TIMER LOGIC ---
  useEffect(() => {
    if (message.isDeleted) {
      // If the backend provided a deletedAt timestamp, calculate how much time is left
      if (message.deletedAt) {
        const deletedTime = new Date(message.deletedAt).getTime();
        const timePassed = Date.now() - deletedTime;

        if (timePassed < 5000) {
          setShowUndo(true);
          const timer = setTimeout(() => setShowUndo(false), 5000 - timePassed);
          return () => clearTimeout(timer);
        } else {
          setShowUndo(false); // More than 5 seconds passed, hide forever
        }
      } else {
        // Optimistic UI fallback: If deletedAt isn't available yet, just count 5 seconds from now
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

  // State: Deleted Message
  if (message.isDeleted) {
    return (
      <div
        className={cn(
          "flex w-full mb-4",
          isMe ? "justify-end" : "justify-start",
        )}
      >
        <div className="px-4 py-2 rounded-2xl text-sm bg-zinc-900/50 border border-zinc-800 text-zinc-500 italic flex items-center gap-3 transition-all">
          <span>This message was deleted</span>

          {/* Only render the Undo button if the 5 second window is open */}
          {isMe && showUndo && (
            <button
              onClick={() => onRestore(message._id)}
              className="text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 text-xs bg-indigo-500/10 px-2 py-1 rounded-md transition-colors"
            >
              <RotateCcw className="w-3 h-3" /> Undo
            </button>
          )}
        </div>
      </div>
    );
  }

  // State: Normal/Image Message
  return (
    <div
      className={cn(
        "flex w-full mb-4 group",
        isMe ? "justify-end" : "justify-start",
      )}
    >
      {/* Delete Button */}
      {isMe && message._id && (
        <button
          onClick={() => onDelete(message._id)}
          className="mr-2 self-center opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-400 transition-all"
          title="Delete Message"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}

      <div
        className={cn(
          "max-w-[70%] px-4 py-2.5 rounded-2xl shadow-sm text-sm relative flex flex-col",
          isMe
            ? "bg-indigo-600 text-white rounded-br-sm"
            : "bg-zinc-800/80 text-zinc-100 rounded-bl-sm border border-zinc-700/50",
        )}
      >
        {/* Render Image if exists */}
        {message.mediaUrl && (
          <img
            src={message.mediaUrl}
            alt="Uploaded media"
            className="w-full max-w-[250px] rounded-lg mb-2 object-cover border border-black/10"
          />
        )}

        {/* Render Text if exists */}
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
                <svg
                  className="w-4 h-4 text-blue-300"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 6 7 17l-5-5"></path>
                  <path d="m22 10-7.5 7.5L13 16"></path>
                </svg>
              ) : (
                <svg
                  className="w-3.5 h-3.5 text-indigo-300/50"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
