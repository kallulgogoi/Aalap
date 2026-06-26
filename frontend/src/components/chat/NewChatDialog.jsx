"use client";

import { useState } from "react";
import axiosInstance from "@/lib/axios";
import { useChatStore } from "@/store/chatStore";
import { useAuthStore } from "@/store/authStore";
import { Search, Plus, Loader2, Send, Mail, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { getAvatarUrl } from "@/lib/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function NewChatDialog({ children }) {
  const [emailQuery, setEmailQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [inviteText, setInviteText] = useState("");

  const { setActiveChat, addPendingInviteChat } = useChatStore();
  const { user } = useAuthStore();

  const currentUserId = user?.id || user?._id;
  const currentUserEmail = user?.email?.toLowerCase().trim();

  const isSelfTarget = (emailOrId) => {
    if (!emailOrId) return false;
    const value = String(emailOrId).toLowerCase().trim();
    return value === String(currentUserId) || value === currentUserEmail;
  };

  const resetDialog = () => {
    setEmailQuery("");
    setResults([]);
    setHasSearched(false);
    setIsInviting(false);
    setInviteText("");
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    const trimmedEmail = emailQuery.trim();
    if (!trimmedEmail) return;

    if (isSelfTarget(trimmedEmail)) {
      toast.error("You cannot start a chat with yourself.");
      setResults([]);
      setHasSearched(true);
      setIsInviting(false);
      return;
    }

    setLoading(true);
    setIsInviting(false);
    setInviteText("");

    try {
      const response = await axiosInstance.get(
        `/users/search?email=${encodeURIComponent(emailQuery.trim())}`,
      );
      const data = response.data;

      if (data?.exists === false) {
        setResults([]);
      } else if (data?.user) {
        if (isSelfTarget(data.user._id) || isSelfTarget(data.user.email)) {
          toast.error("You cannot start a chat with yourself.");
          setResults([]);
        } else {
          setResults([data.user]);
        }
      } else if (Array.isArray(data)) {
        setResults(
          data.filter((u) => !isSelfTarget(u._id) && !isSelfTarget(u.email)),
        );
      } else if (data?._id) {
        if (isSelfTarget(data._id) || isSelfTarget(data.email)) {
          toast.error("You cannot start a chat with yourself.");
          setResults([]);
        } else {
          setResults([data]);
        }
      } else {
        setResults([]);
      }
    } catch (error) {
      console.error("Search failed", error);
      setResults([]);
      toast.error(
        error.response?.data?.message || "Search failed. Please try again.",
      );
    } finally {
      setHasSearched(true);
      setLoading(false);
    }
  };

  const startGhostChat = (targetUser) => {
    if (isSelfTarget(targetUser._id) || isSelfTarget(targetUser.email)) {
      toast.error("You cannot start a chat with yourself.");
      return;
    }

    const ghostChat = {
      _id: "new_ghost_" + Date.now(),
      chatName: targetUser.username,
      avatar: getAvatarUrl(targetUser),
      receiverId: targetUser._id,
      isGhost: true,
    };

    setActiveChat(ghostChat);
    setOpen(false);
    resetDialog();
  };

  const handleSendInvite = async () => {
    const trimmedMessage = inviteText.trim();
    const trimmedEmail = emailQuery.trim().toLowerCase();

    if (isSelfTarget(trimmedEmail)) {
      toast.error("You cannot send an invite to yourself.");
      return;
    }

    if (!trimmedMessage) {
      toast.error("Please type a message before sending the invite.");
      return;
    }

    setLoading(true);

    try {
      const response = await axiosInstance.post("/messages/shadow", {
        targetEmail: trimmedEmail,
        text: trimmedMessage,
      });

      const shadowMessage = response.data?.message;
      if (!shadowMessage) {
        throw new Error("Invalid invite response");
      }

      const pendingChat = addPendingInviteChat(
        shadowMessage,
        emailQuery.trim().toLowerCase(),
      );

      setActiveChat(pendingChat);
      toast.success(`Invite sent to ${emailQuery.trim()}!`);
      setOpen(false);
      resetDialog();
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to send invite. Try again.";
      toast.error(message);
      console.error("Invite error", error);
    } finally {
      setLoading(false);
    }
  };

  const showInviteOption =
    hasSearched &&
    !loading &&
    results.length === 0 &&
    emailQuery.trim() &&
    !isSelfTarget(emailQuery.trim());

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) resetDialog();
      }}
    >
      <DialogTrigger asChild>
        {children || (
          <Button
            variant="ghost"
            size="icon"
            className="text-zinc-400 hover:text-zinc-100 bg-zinc-900 border border-zinc-800 shrink-0"
          >
            <Plus className="w-5 h-5" />
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-md bg-zinc-950 border-zinc-800 text-zinc-100">
        <DialogHeader>
          <DialogTitle>Start New Conversation</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSearch} className="flex items-center gap-2 mt-4">
          <Input
            placeholder="Search user by email..."
            className="bg-zinc-900 border-zinc-800 focus-visible:ring-indigo-500"
            value={emailQuery}
            onChange={(e) => {
              setEmailQuery(e.target.value);
              setHasSearched(false);
              setIsInviting(false);
              setInviteText("");
              setResults([]);
            }}
          />
          <Button
            type="submit"
            disabled={loading || !emailQuery.trim()}
            className="bg-indigo-600 hover:bg-indigo-700"
            title="Search user"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </Button>
        </form>

        <div className="mt-4 space-y-2 max-h-[300px] overflow-y-auto">
          {showInviteOption && !isInviting && (
            <div className="text-center py-4 space-y-3">
              <p className="text-sm text-zinc-400">
                No user found with <strong>{emailQuery.trim()}</strong>.
              </p>
              <Button
                onClick={() => setIsInviting(true)}
                variant="outline"
                className="border-indigo-600 text-indigo-400 hover:bg-indigo-600/10 w-full"
              >
                <Mail className="w-4 h-4 mr-2" />
                Send Invite
              </Button>
            </div>
          )}

          {isInviting && (
            <div className="p-4 bg-zinc-900 rounded-lg border border-zinc-800 space-y-3">
              <p className="text-sm text-zinc-300">
                Invite <strong>{emailQuery.trim()}</strong> with a message
              </p>
              <Input
                value={inviteText}
                onChange={(e) => setInviteText(e.target.value)}
                placeholder="Type your invite message..."
                className="bg-zinc-950 border-zinc-700 text-zinc-100"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSendInvite();
                  }
                }}
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsInviting(false);
                    setInviteText("");
                  }}
                  className="flex-1 border-zinc-700 text-zinc-300"
                >
                  Back
                </Button>
                <Button
                  onClick={handleSendInvite}
                  disabled={loading}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send Invite
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {results.map((user) => (
            <button
              key={user._id}
              onClick={() => startGhostChat(user)}
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-zinc-900 transition-colors text-left border border-transparent hover:border-zinc-800"
            >
              <img
                src={getAvatarUrl(user)}
                alt="avatar"
                className="w-10 h-10 rounded-full object-cover"
              />
              <div>
                <p className="font-medium text-sm text-zinc-200">
                  {user.username}
                </p>
                <p className="text-xs text-zinc-500">{user.email}</p>
              </div>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
