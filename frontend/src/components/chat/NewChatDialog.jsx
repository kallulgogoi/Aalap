"use client";

import { useState } from "react";
import axiosInstance from "@/lib/axios";
import { useChatStore } from "@/store/chatStore";
import { Search, Plus, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner"; // Added for success notifications
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function NewChatDialog() {
  const [emailQuery, setEmailQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  // New states for the pop-up invite flow
  const [isInviting, setIsInviting] = useState(false);
  const [inviteText, setInviteText] = useState("");

  const { setActiveChat } = useChatStore();

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!emailQuery.trim()) return;

    setLoading(true);
    setIsInviting(false); // Reset invite UI on new search
    setInviteText("");

    try {
      const response = await axiosInstance.get(
        `/users/search?email=${emailQuery}`,
      );
      const data = response.data;

      // Force response into an array safely
      if (Array.isArray(data)) {
        setResults(data);
      } else if (data && data.user) {
        setResults([data.user]);
      } else if (data && data._id) {
        setResults([data]);
      } else {
        setResults([]);
      }
    } catch (error) {
      console.error("Search failed", error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // 1. Existing User Flow: Open in ChatArea
  const startGhostChat = (targetUser) => {
    const ghostChat = {
      _id: "new_ghost_" + Date.now(),
      chatName: targetUser.username,
      avatar:
        targetUser?.profilePic?.url ||
        "https://ui-avatars.com/api/?name=User&background=random",
      receiverId: targetUser._id,
      isGhost: true,
    };

    setActiveChat(ghostChat);
    setOpen(false);
    setEmailQuery("");
    setResults([]);
  };

  // 2. Unregistered User Flow: Send Shadow Message from Pop-up
  const handleSendInvite = async () => {
    if (!inviteText.trim()) return;
    setLoading(true);

    try {
      await axiosInstance.post("/messages/shadow", {
        targetEmail: emailQuery,
        text: inviteText,
      });

      toast.success(`Invite sent to ${emailQuery}!`);
      setOpen(false); // Close modal on success
      setEmailQuery("");
      setResults([]);
      setIsInviting(false);
      setInviteText("");
    } catch (error) {
      toast.error("Failed to send invite");
      console.error("Invite error", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-zinc-400 hover:text-zinc-100 bg-zinc-900 border border-zinc-800 shrink-0"
        >
          <Plus className="w-5 h-5" />
        </Button>
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
            onChange={(e) => setEmailQuery(e.target.value)}
          />
          <Button
            type="submit"
            disabled={loading || !emailQuery}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </Button>
        </form>

        <div className="mt-4 space-y-2 max-h-[300px] overflow-y-auto">
          {/* Empty State: Trigger Invite Flow */}
          {results.length === 0 && emailQuery && !loading && !isInviting && (
            <div className="text-center py-4 space-y-3">
              <p className="text-sm text-zinc-400">
                No user found with this email.
              </p>
              <Button
                onClick={() => setIsInviting(true)}
                variant="outline"
                className="border-indigo-600 text-indigo-400 hover:bg-indigo-600/10 w-full"
              >
                Send Shadow Invite
              </Button>
            </div>
          )}

          {/* Invite Input Box (Appears when they click the button above) */}
          {isInviting && (
            <div className="p-4 bg-zinc-900 rounded-lg border border-zinc-800 space-y-3">
              <p className="text-sm text-zinc-300">
                Invite <strong>{emailQuery}</strong> to the platform
              </p>
              <Input
                value={inviteText}
                onChange={(e) => setInviteText(e.target.value)}
                placeholder="Type your welcome message..."
                className="bg-zinc-950 border-zinc-700 text-zinc-100"
              />
              <Button
                onClick={handleSendInvite}
                disabled={!inviteText || loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                Send Message
              </Button>
            </div>
          )}

          {/* Existing User Found: Open in ChatArea */}
          {results.map((user) => (
            <button
              key={user._id}
              onClick={() => startGhostChat(user)}
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-zinc-900 transition-colors text-left border border-transparent hover:border-zinc-800"
            >
              <img
                src={
                  user.profilePic?.url ||
                  "https://ui-avatars.com/api/?name=User&background=random"
                }
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
