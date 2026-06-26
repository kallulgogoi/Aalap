"use client";

import { useEffect, useRef, useState } from "react";
import axiosInstance from "@/lib/axios";
import { useAuthStore } from "@/store/authStore";
import { useChatStore } from "@/store/chatStore";
import { getAvatarUrl } from "@/lib/avatar";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { TelegramSection, TelegramFieldRow } from "@/components/ui/TelegramSettings";

export default function ProfileSettingsForm({ onSuccess } = {}) {
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);
  const fetchChats = useChatStore((state) => state.fetchChats);

  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatarPreview, setAvatarPreview] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    setUsername(user.username || "");
    setBio(user.bio || "");
    setAvatarPreview(getAvatarUrl(user));
    setAvatarFile(null);
  }, [user]);

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be smaller than 5MB.");
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    const trimmedUsername = username.trim();
    const trimmedBio = bio.trim();

    if (!trimmedUsername) {
      toast.error("Username is required.");
      return;
    }

    if (trimmedUsername.length > 50) {
      toast.error("Username cannot exceed 50 characters.");
      return;
    }

    if (trimmedBio.length > 150) {
      toast.error("Bio cannot exceed 150 characters.");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("username", trimmedUsername);
      formData.append("bio", trimmedBio);
      if (avatarFile) {
        formData.append("profilePic", avatarFile);
      }

      const response = await axiosInstance.put("/users/profile", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const updatedUser = response.data?.user;
      if (!updatedUser) {
        throw new Error("Invalid profile update response");
      }

      updateUser({
        ...updatedUser,
        id: updatedUser._id || updatedUser.id,
      });
      await fetchChats();
      toast.success("Profile updated successfully.");
      onSuccess?.();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to update profile.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      <div className="tg-profile-hero">
        <div className="tg-avatar-wrap">
          <img
            src={avatarPreview || getAvatarUrl(user)}
            alt="Profile preview"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="tg-avatar-btn"
            title="Change profile photo"
          >
            <Camera className="w-4 h-4" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="mt-4 text-[15px] font-medium text-telegram hover:text-[#0088CC] transition-colors"
        >
          Set New Photo
        </button>
        <p className="mt-2 text-[13px] text-tg-muted">
          {user?.email}
        </p>
      </div>

      <TelegramSection title="Account Info" className="mt-2">
        <TelegramFieldRow label="Username">
          <input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            maxLength={50}
            className="tg-input"
            placeholder="Display name"
          />
        </TelegramFieldRow>
        <TelegramFieldRow label="Bio">
          <textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={150}
            rows={3}
            placeholder="Any details such as age, occupation or city."
            className="tg-textarea"
          />
          <p className="text-right text-[12px] text-tg-muted mt-2 px-1">
            {bio.length}/150
          </p>
        </TelegramFieldRow>
      </TelegramSection>

      <p className="px-5 mt-3 text-[13px] text-tg-muted leading-relaxed">
        Your profile photo and bio are visible to people you message on Aalap.
      </p>

      <div className="px-4 mt-6">
        <button
          type="button"
          onClick={handleSave}
          disabled={loading}
          className="tg-save-btn"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Profile"
          )}
        </button>
      </div>
    </div>
  );
}
