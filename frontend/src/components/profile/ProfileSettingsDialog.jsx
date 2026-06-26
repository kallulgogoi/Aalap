"use client";

import { useEffect, useRef, useState } from "react";
import axiosInstance from "@/lib/axios";
import { useAuthStore } from "@/store/authStore";
import { useChatStore } from "@/store/chatStore";
import { getAvatarUrl } from "@/lib/avatar";
import { Camera, Loader2, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function ProfileSettingsDialog({ children }) {
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);
  const fetchChats = useChatStore((state) => state.fetchChats);

  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatarPreview, setAvatarPreview] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!open || !user) return;

    setUsername(user.username || "");
    setBio(user.bio || "");
    setAvatarPreview(getAvatarUrl(user));
    setAvatarFile(null);
  }, [open, user]);

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
      setOpen(false);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to update profile.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent className="sm:max-w-md bg-zinc-950 border-zinc-800 text-zinc-100">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserRound className="w-5 h-5 text-indigo-400" />
            Edit Profile
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-2">
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <img
                src={avatarPreview || getAvatarUrl(user)}
                alt="Profile preview"
                className="w-24 h-24 rounded-full object-cover border-2 border-zinc-700"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 p-2 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg transition-colors"
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
            <p className="text-xs text-zinc-500">JPG, PNG or WEBP up to 5MB</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              maxLength={50}
              className="bg-zinc-900 border-zinc-800 focus-visible:ring-indigo-500"
              placeholder="Your display name"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="bio">Bio</Label>
              <span className="text-xs text-zinc-500">{bio.length}/150</span>
            </div>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={150}
              rows={4}
              placeholder="Tell others a little about yourself..."
              className="w-full rounded-md bg-zinc-900 border border-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 resize-none"
            />
          </div>

          <Button
            onClick={handleSave}
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
