"use client";

import { useState, useRef } from "react";
import {
  Send,
  Paperclip,
  Smile,
  X,
  Loader2,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import axiosInstance from "@/lib/axios";
import { toast } from "sonner"; // For size limit warnings

export default function MessageInput({ onSendMessage, disabled }) {
  const [text, setText] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Set your max file size here (5MB = 5 * 1024 * 1024 bytes)
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    // 1. Guard clause: Ensure there is content to send
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

        // 2. Safeguard: Check if the backend actually returned the URL
        if (uploadRes.data && uploadRes.data.mediaUrl) {
          finalMediaUrl = uploadRes.data.mediaUrl;
        }
      } catch (error) {
        console.error("Upload error:", error);
        toast.error("Failed to upload image");
        setIsUploading(false); // MUST reset state here
        return; // Exit early
      }
    }

    // 3. Execution: Pass the data. If no image was selected, finalMediaUrl remains null
    try {
      await onSendMessage(text, finalMediaUrl);
    } catch (sendError) {
      toast.error("Failed to send message");
    } finally {
      // 4. Cleanup: Always reset state regardless of success/fail of send
      setText("");
      clearImage();
      setIsUploading(false);
    }
  };

  return (
    <div className="p-4 bg-zinc-950 border-t border-zinc-800 shrink-0 flex flex-col gap-2">
      {/* Image Preview Area */}
      {previewUrl && (
        <div className="relative w-20 h-20 ml-12 mb-2 group">
          <img
            src={previewUrl}
            alt="Preview"
            className="w-full h-full object-cover rounded-lg border border-zinc-700"
          />
          <button
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
        {/* Hidden File Input */}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          ref={fileInputRef}
          onChange={handleImageSelect}
          disabled={disabled || isUploading}
        />

        {/* Attachment Button */}
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

        {/* Main Input Field */}
        <div className="relative flex-1">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={
              disabled ? "Select a chat to message..." : "Type a message..."
            }
            disabled={disabled || isUploading}
            className="w-full bg-zinc-900 border-zinc-800 text-zinc-100 focus-visible:ring-indigo-500 min-h-[44px] rounded-2xl pl-4 pr-10"
          />
        </div>

        {/* Send Button */}
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
