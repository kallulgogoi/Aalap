"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { useChatStore } from "@/store/chatStore";
import { LogOut, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

// Importing the actual UI components we built
import ChatSidebar from "@/components/chat/ChatSidebar";
import ChatArea from "@/components/chat/ChatArea";

export default function MainChatDashboard() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const activeChat = useChatStore((state) => state.activeChat);
  const fetchChats = useChatStore((state) => state.fetchChats);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  return (
    <div className="flex h-screen w-full bg-zinc-950 overflow-hidden">
      {/* LEFT PANEL: Sidebar (Contacts & Chats) */}
      <div className="w-full max-w-[380px] border-r border-zinc-800 bg-zinc-950/50 flex flex-col shrink-0 transition-all duration-300">
        {/* Header / Profile Area */}
        <div className="h-16 border-b border-zinc-800 flex items-center justify-between px-4 shrink-0 bg-zinc-950">
          <div className="flex items-center gap-3">
            <img
              src={
                user?.profilePic?.url ||
                "https://ui-avatars.com/api/?name=User&background=random"
              }
              alt="Profile"
              className="w-10 h-10 rounded-full object-cover border border-zinc-700"
            />
            <span className="font-semibold tracking-tight text-zinc-100">
              {user?.username}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={logout}
            className="text-zinc-400 hover:text-red-400 hover:bg-zinc-900 transition-colors"
            title="Log out"
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </div>

        {/* The Sidebar Component with Search and Chat List */}
        <div className="flex-1 overflow-hidden">
          <ChatSidebar />
        </div>
      </div>

      {/* RIGHT PANEL: Active Chat Area */}
      <div className="flex-1 bg-[#09090b] flex flex-col relative">
        {activeChat ? (
          <div className="flex-1 flex flex-col h-full">
            <ChatArea />
          </div>
        ) : (
          // Empty State (When no chat is selected from the sidebar)
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 bg-zinc-950 inset-0 absolute">
            <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mb-6 shadow-lg border border-zinc-800">
              <MessageSquare className="w-10 h-10 text-indigo-500" />
            </div>
            <h2 className="text-xl font-medium text-zinc-200 mb-2">
              Welcome to Enterprise Chat
            </h2>
            <p className="max-w-sm text-center text-zinc-500">
              Select a conversation from the sidebar to start messaging, or
              search for a new contact.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
