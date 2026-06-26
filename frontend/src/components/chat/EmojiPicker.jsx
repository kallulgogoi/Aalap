"use client";

import { useEffect, useRef } from "react";

const EMOJI_GROUPS = [
  {
    label: "Smileys",
    emojis: ["😀", "😁", "😂", "🤣", "😊", "😍", "😘", "😎", "🤩", "🥳", "😇", "🙂"],
  },
  {
    label: "Reactions",
    emojis: ["👍", "👎", "👏", "🙌", "🤝", "🙏", "💪", "✌️", "🤞", "👌", "🫶", "❤️"],
  },
  {
    label: "Fun",
    emojis: ["🔥", "✨", "🎉", "💯", "⚡", "🚀", "🎯", "💡", "🎮", "🎵", "🏆", "⭐"],
  },
  {
    label: "Moods",
    emojis: ["😢", "😭", "😡", "🤔", "😴", "🤯", "😱", "🥺", "😬", "🫡", "🤗", "😏"],
  },
];

export default function EmojiPicker({ open, onClose, onSelect }) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={panelRef}
      className="absolute bottom-full right-0 mb-2 w-80 max-h-72 overflow-y-auto rounded-[22px] border border-white/10 glass-panel-strong shadow-[0_20px_60px_rgba(0,0,0,0.35)] p-4 z-50"
    >
      {EMOJI_GROUPS.map((group) => (
        <div key={group.label} className="mb-3 last:mb-0">
          <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2 px-1">
            {group.label}
          </p>
          <div className="grid grid-cols-6 gap-1">
            {group.emojis.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => {
                  onSelect(emoji);
                  onClose();
                }}
                className="h-10 w-10 rounded-xl text-xl hover:bg-blue-500/10 hover:scale-110 transition-all"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
