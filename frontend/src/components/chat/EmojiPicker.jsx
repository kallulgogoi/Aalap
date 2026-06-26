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
      className="absolute bottom-full right-0 mb-2 w-72 max-h-64 overflow-y-auto rounded-xl border border-zinc-700 bg-zinc-900 shadow-2xl p-3 z-50"
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
                className="h-9 w-9 rounded-lg text-xl hover:bg-zinc-800 transition-colors"
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
