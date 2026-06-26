"use client";

import { useState, useRef } from "react";
import {
  Send,
  Paperclip,
  Smile,
  X,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import axiosInstance from "@/lib/axios";
import { toast } from "sonner";
import EmojiPicker from "./EmojiPicker";

export default function MessageInput({ onSendMessage, disabled }) {
  const [text, setText] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef(null);
  const inputRef = useRef(null);

  const MAX_FILE_SIZE = 5 * 1024 * 1024;

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      toast.error("Image exceeds 5MB limit. Please choose a smaller file.");
      return;
    }

    setSelectedImage(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const clearImage = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const insertEmoji = (emoji) => {
    const input = inputRef.current;
    if (!input) {
      setText((prev) => prev + emoji);
      return;
    }

    const start = input.selectionStart ?? text.length;
    const end = input.selectionEnd ?? text.length;
    const nextValue = text.slice(0, start) + emoji + text.slice(end);
    setText(nextValue);

    requestAnimationFrame(() => {
      input.focus();
      const cursor = start + emoji.length;
      input.setSelectionRange(cursor, cursor);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if ((!text.trim() && !selectedImage) || disabled || isUploading) return;

    let finalMediaUrl = null;

    if (selectedImage) {
      setIsUploading(true);
      try {
        const formData = new FormData();
        formData.append("chatImage", selectedImage);

        const uploadRes = await axiosInstance.post(
          "/messages/upload",
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
          },
        );

        if (uploadRes.data && uploadRes.data.mediaUrl) {
          finalMediaUrl = uploadRes.data.mediaUrl;
        }
      } catch (error) {
        console.error("Upload error:", error);
        toast.error("Failed to upload image");
        setIsUploading(false);
        return;
      }
    }

    try {
      await onSendMessage(text, finalMediaUrl);
    } catch (sendError) {
      toast.error("Failed to send message");
    } finally {
      setText("");
      clearImage();
      setIsUploading(false);
      setShowEmojiPicker(false);
    }
  };

  return (
    <div className="p-4 bg-zinc-950 border-t border-zinc-800 shrink-0 flex flex-col gap-2">
      {previewUrl && (
        <div className="relative w-20 h-20 ml-12 mb-2 group">
          <img
            src={previewUrl}
            alt="Preview"
            className="w-full h-full object-cover rounded-lg border border-zinc-700"
          />
          <button
            type="button"
            onClick={clearImage}
            className="absolute -top-2 -right-2 bg-zinc-800 text-zinc-300 rounded-full p-1 shadow-md hover:bg-zinc-700 hover:text-white"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="flex items-end gap-2 max-w-4xl mx-auto w-full"
      >
        <input
          type="file"
          accept="image/*"
          className="hidden"
          ref={fileInputRef}
          onChange={handleImageSelect}
          disabled={disabled || isUploading}
        />

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          className="text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 shrink-0 mb-1"
          disabled={disabled || isUploading}
        >
          <Paperclip className="w-5 h-5" />
        </Button>

        <div className="relative flex-1">
          <Input
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={
              disabled ? "Select a chat to message..." : "Type a message..."
            }
            disabled={disabled || isUploading}
            className="w-full bg-zinc-900 border-zinc-800 text-zinc-100 focus-visible:ring-indigo-500 min-h-[44px] rounded-2xl pl-4 pr-12"
          />

          <div className="absolute right-1 top-1/2 -translate-y-1/2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setShowEmojiPicker((prev) => !prev)}
              className="text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 h-9 w-9"
              disabled={disabled || isUploading}
              title="Add emoji"
            >
              <Smile className="w-5 h-5" />
            </Button>
            <EmojiPicker
              open={showEmojiPicker}
              onClose={() => setShowEmojiPicker(false)}
              onSelect={insertEmoji}
            />
          </div>
        </div>

        <Button
          type="submit"
          size="icon"
          disabled={(!text.trim() && !selectedImage) || disabled || isUploading}
          className="bg-indigo-600 hover:bg-indigo-700 text-white shrink-0 rounded-full w-11 h-11 mb-0.5 shadow-md transition-all disabled:opacity-50"
        >
          {isUploading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5 ml-1" />
          )}
        </Button>
      </form>
    </div>
  );
}
