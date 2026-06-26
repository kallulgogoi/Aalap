"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { useChatStore } from "@/store/chatStore";
import { LogOut, MessageSquare, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProfileSettingsDialog from "@/components/profile/ProfileSettingsDialog";
import ChatSidebar from "@/components/chat/ChatSidebar";
import ChatArea from "@/components/chat/ChatArea";
import { getAvatarUrl } from "@/lib/avatar";

export default function MainChatDashboard() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const activeChat = useChatStore((state) => state.activeChat);
  const fetchChats = useChatStore((state) => state.fetchChats);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  return (
    <div className="flex h-screen w-full bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 overflow-hidden">
      {/* LEFT PANEL: Sidebar */}
      <div className="w-full max-w-[380px] border-r border-zinc-800/50 bg-zinc-950/30 backdrop-blur-sm flex flex-col shrink-0 transition-all duration-300">
        {/* Header / Profile Area with Glass Effect */}
        <div className="h-16 border-b border-zinc-800/50 flex items-center justify-between px-4 shrink-0 bg-zinc-950/60 backdrop-blur-xl">
          <ProfileSettingsDialog>
            <button
              type="button"
              className="flex items-center gap-3 text-left rounded-xl px-2 py-1.5 hover:bg-zinc-800/30 transition-all duration-200 group"
              title="Edit profile"
            >
              <div className="relative">
                <div className="absolute inset-0 rounded-full blur-md bg-indigo-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <img
                  src={getAvatarUrl(user)}
                  alt="Profile"
                  className="w-10 h-10 rounded-full object-cover border-2 border-zinc-700/50 relative z-10 group-hover:border-indigo-500/50 transition-colors duration-300"
                />
              </div>
              <span className="font-semibold tracking-tight text-zinc-100 group-hover:text-white transition-colors">
                {user?.username}
              </span>
            </button>
          </ProfileSettingsDialog>
          <Button
            variant="ghost"
            size="icon"
            onClick={logout}
            className="text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all duration-200 hover:scale-105"
            title="Log out"
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </div>

        {/* The Sidebar Component */}
        <div className="flex-1 overflow-hidden">
          <ChatSidebar />
        </div>
      </div>

      {/* RIGHT PANEL: Active Chat Area */}
      <div className="flex-1 bg-gradient-to-b from-zinc-950 to-zinc-900 flex flex-col relative">
        {activeChat ? (
          <div className="flex-1 flex flex-col h-full">
            <ChatArea />
          </div>
        ) : (
          // Beautiful Empty State
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-500">
            <div className="relative">
              <div className="absolute inset-0 rounded-full blur-2xl bg-indigo-500/10 animate-pulse" />
              <div className="w-24 h-24 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full flex items-center justify-center relative border border-zinc-800/50">
                <MessageSquare className="w-12 h-12 text-indigo-500" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-zinc-200 mt-6 mb-2">
              Welcome to Aalap
            </h2>
            <p className="max-w-sm text-center text-zinc-500 leading-relaxed">
              Select a conversation from the sidebar to start messaging, or
              search for a new contact to connect with.
            </p>
            <div className="flex items-center gap-2 mt-4 text-xs text-zinc-600">
              <Sparkles className="w-3 h-3" />
              <span>Secure • Real-time • Encrypted</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
