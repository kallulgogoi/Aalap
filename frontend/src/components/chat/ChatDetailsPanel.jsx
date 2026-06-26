"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useChatStore } from "@/store/chatStore";
import { useAuthStore } from "@/store/authStore";
import { getAvatarUrl } from "@/lib/avatar";
import { cn } from "@/lib/utils";
import {
  Bell,
  Clock,
  FileImage,
  Link2,
  Mail,
  Shield,
  User,
  X,
  ChevronRight,
  MoreVertical,
  Phone,
  Video,
  Pin,
  Share2,
  Users,
  Calendar,
  MapPin,
  Globe,
  Lock,
  CheckCircle,
  Camera,
  Image,
  File,
  Music,
  Archive,
  Flag,
  Volume2,
  VolumeX,
  Moon,
  Sun,
  UserPlus,
  UserMinus,
  Settings,
  LogOut,
  Copy,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export default function ChatDetailsPanel({ onClose, isOpen }) {
  const { activeChat, messages } = useChatStore();
  const { user } = useAuthStore();
  const [copied, setCopied] = useState(false);

  const otherParticipant = useMemo(() => {
    if (!activeChat?.participants?.length) return null;
    const myId = user?.id || user?._id;
    const participant = activeChat.participants.find((p) => {
      const id = typeof p === "object" ? p._id : p;
      return String(id) !== String(myId);
    });
    return typeof participant === "object" ? participant : null;
  }, [activeChat, user]);

  const sharedMedia = useMemo(
    () =>
      messages
        .filter((m) => m.mediaUrl && !m.isDeleted)
        .slice(-9)
        .reverse(),
    [messages],
  );

  const sharedFiles = useMemo(
    () =>
      messages
        .filter((m) => m.fileUrl && !m.isDeleted)
        .slice(-6)
        .reverse(),
    [messages],
  );

  // Stats
  const stats = useMemo(() => {
    const total = messages.length;
    const media = sharedMedia.length;
    const files = sharedFiles.length;
    const myId = user?.id || user?._id;
    const sent = messages.filter((m) => {
      const sid = typeof m.senderId === "object" ? m.senderId?._id : m.senderId;
      return String(sid) === String(myId);
    }).length;
    const received = total - sent;
    return { total, media, files, sent, received };
  }, [messages, sharedMedia, sharedFiles, user]);

  if (!activeChat) return null;

  const displayBio =
    otherParticipant?.bio || activeChat.bio || "No bio added yet.";
  const displayEmail =
    otherParticipant?.email || activeChat.targetEmail || "Private contact";
  const displayName = activeChat.chatName || "Unknown";
  const isGroup = activeChat.isGroup || false;

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (date) => {
    if (!date) return "Unknown";
    return new Date(date).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <aside
      className={cn(
        "xl:flex w-[360px] shrink-0 flex-col border-l border-white/5 bg-[rgba(10,14,28,0.92)] backdrop-blur-2xl transition-all duration-300",
        isOpen ? "flex" : "hidden xl:flex",
      )}
    >
      {/* Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-white/5 bg-transparent ">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="xl:hidden rounded-full text-zinc-400 hover:text-zinc-100 hover:bg-white/10"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
          <h3 className="text-sm font-semibold text-zinc-100 tracking-wide">
            Profile Details
          </h3>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="hidden xl:flex rounded-full text-zinc-400 hover:text-zinc-100 hover:bg-white/10"
          >
            <X className="w-6 h-6" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Profile Card */}
        <div className="bg-white/[0.04] rounded-[28px] p-6 text-center border border-white/[0.06] relative overflow-hidden">
          {/* Background glow */}
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-full blur-3xl" />

          <div className="relative">
            <div className="relative mx-auto w-24 h-24 mb-4">
              <div
                className={cn(
                  "absolute inset-0 rounded-full blur-2xl transition-opacity duration-300",
                  activeChat.isOnline
                    ? "bg-emerald-500/30 opacity-100"
                    : "bg-zinc-500/20 opacity-50",
                )}
              />
              <img
                src={getAvatarUrl(activeChat)}
                alt={displayName}
                className="relative z-10 w-24 h-24 rounded-full object-cover ring-4 ring-white/10 shadow-2xl"
              />
              {activeChat.isOnline && !activeChat.isPendingInvite && (
                <span className="absolute bottom-0 right-1 z-20 w-4 h-4 bg-emerald-500 rounded-full ring-4 ring-[rgba(10,14,28,0.92)]" />
              )}
              {activeChat.isPendingInvite && (
                <span className="absolute bottom-0 right-1 z-20 w-4 h-4 bg-amber-500 rounded-full ring-4 ring-[rgba(10,14,28,0.92)] flex items-center justify-center">
                  <Clock className="w-2.5 h-2.5 text-white" />
                </span>
              )}
            </div>

            <div className="flex items-center justify-center gap-2">
              <h4 className="text-lg font-semibold text-white">
                {displayName}
              </h4>
              {isGroup && <Users className="w-4 h-4 text-zinc-400" />}
              {otherParticipant?.isVerified && (
                <CheckCircle className="w-4 h-4 text-blue-400" />
              )}
            </div>

            <div className="flex items-center justify-center gap-1.5 mt-1.5">
              {activeChat.isPendingInvite ? (
                <>
                  <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  <span className="text-xs text-amber-400 font-medium">
                    Invite pending
                  </span>
                </>
              ) : activeChat.isOnline ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs text-emerald-400 font-medium">
                    Online now
                  </span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-zinc-500" />
                  <span className="text-xs text-zinc-500">Offline</span>
                </>
              )}
            </div>

            <p className="text-sm text-zinc-400 mt-3 leading-relaxed max-w-xs mx-auto">
              {displayBio}
            </p>

            {/* Action Buttons */}
            <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-white/5">
              <Button
                variant="ghost"
                size="sm"
                className="rounded-full bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white"
                onClick={() => handleCopy(displayEmail)}
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span className="ml-1.5 text-xs">Copy</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="rounded-full bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white"
              >
                <Phone className="w-3.5 h-3.5" />
                <span className="ml-1.5 text-xs">Call</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="rounded-full bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white"
              >
                <Video className="w-3.5 h-3.5" />
                <span className="ml-1.5 text-xs">Video</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="bg-white/[0.04] rounded-[28px] p-4 space-y-3 border border-white/[0.06]">
          <div className="flex items-center gap-2 mb-1">
            <User className="w-3.5 h-3.5 text-indigo-400" />
            <p className="text-[10px] uppercase tracking-[0.15em] text-zinc-500 font-semibold">
              Contact Information
            </p>
          </div>

          <div className="flex items-center gap-3 text-sm text-zinc-300 p-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group">
            <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center shrink-0">
              <Mail className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <span className="truncate flex-1">{displayEmail}</span>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => handleCopy(displayEmail)}
            >
              <Copy className="w-3 h-3 text-zinc-500" />
            </Button>
          </div>

          {otherParticipant?.phone && (
            <div className="flex items-center gap-3 text-sm text-zinc-300 p-2 rounded-xl hover:bg-white/5 transition-colors">
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <span className="truncate">{otherParticipant.phone}</span>
            </div>
          )}

          {otherParticipant?.location && (
            <div className="flex items-center gap-3 text-sm text-zinc-300 p-2 rounded-xl hover:bg-white/5 transition-colors">
              <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <span className="truncate">{otherParticipant.location}</span>
            </div>
          )}

          <div className="flex items-center gap-3 text-sm text-zinc-300 p-2 rounded-xl">
            <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
              <Lock className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <span>End-to-end encrypted</span>
          </div>
        </div>

        {/* Shared Media */}
        <div className="bg-white/[0.04] rounded-[28px] p-4 border border-white/[0.06]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Image className="w-3.5 h-3.5 text-indigo-400" />
              <p className="text-[10px] uppercase tracking-[0.15em] text-zinc-500 font-semibold">
                Shared Media
              </p>
            </div>
            {sharedMedia.length > 0 && (
              <span className="text-xs text-zinc-400">
                {sharedMedia.length} items
              </span>
            )}
          </div>

          {sharedMedia.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
                <Image className="w-5 h-5 text-zinc-600" />
              </div>
              <p className="text-sm text-zinc-500">No media shared yet</p>
              <p className="text-xs text-zinc-600 mt-1">
                Photos and videos will appear here
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1.5">
              {sharedMedia.map((msg, idx) => (
                <a
                  key={msg._id || idx}
                  href={msg.mediaUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="aspect-square rounded-xl overflow-hidden border border-white/5 hover:border-indigo-500/30 transition-all hover:scale-[1.02] group relative"
                >
                  <img
                    src={msg.mediaUrl}
                    alt="Shared media"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-1.5">
                    <span className="text-[10px] text-white/80">View</span>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="bg-white/[0.04] rounded-[28px] p-4 border border-white/[0.06]">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-3.5 h-3.5 text-indigo-400" />
            <p className="text-[10px] uppercase tracking-[0.15em] text-zinc-500 font-semibold">
              Conversation Stats
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white/5 rounded-xl p-3 text-center hover:bg-white/10 transition-colors">
              <p className="text-xl font-bold text-white">{stats.total}</p>
              <p className="text-[10px] text-zinc-500 mt-0.5">Total</p>
            </div>
            <div className="bg-white/5 rounded-xl p-3 text-center hover:bg-white/10 transition-colors">
              <p className="text-xl font-bold text-emerald-400">{stats.sent}</p>
              <p className="text-[10px] text-zinc-500 mt-0.5">Sent</p>
            </div>
            <div className="bg-white/5 rounded-xl p-3 text-center hover:bg-white/10 transition-colors">
              <p className="text-xl font-bold text-blue-400">
                {stats.received}
              </p>
              <p className="text-[10px] text-zinc-500 mt-0.5">Received</p>
            </div>
          </div>
        </div>

        {/* Member Since */}
        {otherParticipant?.createdAt && (
          <div className="bg-white/[0.04] rounded-[28px] p-4 border border-white/[0.06]">
            <div className="flex items-center gap-3 text-sm text-zinc-400">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              <span>Member since {formatDate(otherParticipant.createdAt)}</span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
