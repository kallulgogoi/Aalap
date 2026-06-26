"use client";

import { useEffect, useState, useRef } from "react";
import { useAuthStore } from "@/store/authStore";
import { useChatStore } from "@/store/chatStore";
import {
  LogOut,
  MessageSquare,
  Sparkles,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  User,
  Settings,
  Sun,
  Moon,
  Home,
  PlusCircle,
  Users,
  MoreHorizontal,
  UserCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import ProfileSettingsDialog from "@/components/profile/ProfileSettingsDialog";
import ChatSidebar from "@/components/chat/ChatSidebar";
import ChatArea from "@/components/chat/ChatArea";
import { getAvatarUrl } from "@/lib/avatar";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function MainChatDashboard() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const activeChat = useChatStore((state) => state.activeChat);
  const fetchChats = useChatStore((state) => state.fetchChats);
  const chats = useChatStore((state) => state.chats);
  const [sidebarWidth, setSidebarWidth] = useState(380);
  const [isResizing, setIsResizing] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("chats");
  const sidebarRef = useRef(null);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  // Handle sidebar resize
  const startResize = (e) => {
    setIsResizing(true);
    startXRef.current = e.clientX;
    startWidthRef.current = sidebarWidth;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  const handleResize = (e) => {
    if (!isResizing) return;
    const diff = e.clientX - startXRef.current;
    const newWidth = Math.min(Math.max(260, startWidthRef.current + diff), 500);
    setSidebarWidth(newWidth);
  };

  const stopResize = () => {
    setIsResizing(false);
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  };

  useEffect(() => {
    if (isResizing) {
      window.addEventListener("mousemove", handleResize);
      window.addEventListener("mouseup", stopResize);
      return () => {
        window.removeEventListener("mousemove", handleResize);
        window.removeEventListener("mouseup", stopResize);
      };
    }
  }, [isResizing]);

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
  };

  const unreadCount = chats.filter((chat) => chat.unreadCount > 0).length;

  // Mobile Bottom Tab Bar
  const TabBar = () => (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-800/50 flex items-center justify-around py-2 px-4 z-50">
      <button
        onClick={() => {
          setActiveTab("chats");
          setIsMobileSidebarOpen(false);
        }}
        className={cn(
          "flex flex-col items-center gap-0.5 p-2 rounded-xl transition-all relative",
          activeTab === "chats"
            ? "text-indigo-400"
            : "text-zinc-500 hover:text-zinc-300",
        )}
      >
        <Home className="w-6 h-6" />
        <span className="text-[10px] font-medium">Chats</span>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 right-0 bg-red-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1">
            {unreadCount}
          </span>
        )}
      </button>

      <button
        onClick={() => {
          setActiveTab("settings");
          setIsMobileSidebarOpen(false);
        }}
        className={cn(
          "flex flex-col items-center gap-0.5 p-2 rounded-xl transition-all",
          activeTab === "settings"
            ? "text-indigo-400"
            : "text-zinc-500 hover:text-zinc-300",
        )}
      >
        <Settings className="w-6 h-6" />
        <span className="text-[10px] font-medium">Settings</span>
      </button>

      <button
        onClick={() => {
          setActiveTab("profile");
          setIsMobileSidebarOpen(false);
        }}
        className={cn(
          "flex flex-col items-center gap-0.5 p-2 rounded-xl transition-all",
          activeTab === "profile"
            ? "text-indigo-400"
            : "text-zinc-500 hover:text-zinc-300",
        )}
      >
        <UserCircle className="w-6 h-6" />
        <span className="text-[10px] font-medium">Profile</span>
      </button>
    </div>
  );

  return (
    <div className="flex h-screen w-full bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 overflow-hidden">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-50 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Menu Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[280px] bg-zinc-950 border-r border-zinc-800/50 transform transition-transform duration-300 md:hidden",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="h-16 border-b border-zinc-800/50 flex items-center justify-between px-4 bg-zinc-950/80">
          <span className="text-xl font-bold text-indigo-400">Aalap</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen(false)}
            className="text-zinc-400 hover:text-zinc-100"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-4">
          <ProfileSettingsDialog>
            <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-800/50 transition-all">
              <img
                src={getAvatarUrl(user)}
                alt="Profile"
                className="w-12 h-12 rounded-full object-cover border-2 border-zinc-700"
              />
              <div className="flex-1 text-left">
                <p className="font-semibold text-zinc-100">{user?.username}</p>
                <p className="text-sm text-zinc-500">{user?.email}</p>
              </div>
            </button>
          </ProfileSettingsDialog>

          <div className="mt-4 pt-4 border-t border-zinc-800/50 space-y-1">
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                setActiveTab("chats");
              }}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-800/50 transition-all text-zinc-300 hover:text-zinc-100"
            >
              <Home className="w-5 h-5" />
              <span>Chats</span>
            </button>
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                setActiveTab("settings");
              }}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-800/50 transition-all text-zinc-300 hover:text-zinc-100"
            >
              <Settings className="w-5 h-5" />
              <span>Settings</span>
            </button>
            <ProfileSettingsDialog>
              <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-800/50 transition-all text-zinc-300 hover:text-zinc-100">
                <UserCircle className="w-5 h-5" />
                <span>Edit Profile</span>
              </button>
            </ProfileSettingsDialog>
          </div>

          <div className="absolute bottom-4 left-4 right-4">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-500/10 transition-all text-red-400 hover:text-red-300"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* LEFT PANEL: Sidebar */}
      <div
        ref={sidebarRef}
        style={{ width: isMobileSidebarOpen ? "100%" : sidebarWidth }}
        className={cn(
          "flex flex-col shrink-0 transition-all duration-300 border-r border-zinc-800/50 bg-zinc-950/30 backdrop-blur-sm relative",
          "md:flex",
          isMobileSidebarOpen
            ? "fixed inset-y-0 left-0 z-40 w-full max-w-[85%]"
            : "hidden md:flex",
          isResizing && "transition-none",
        )}
      >
        {/* Resize Handle */}
        <div
          className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-indigo-500/50 transition-colors z-20 hidden md:block"
          onMouseDown={startResize}
        />

        {/* Header - Desktop */}
        <div className="h-16 border-b border-zinc-800/50 flex items-center justify-between px-4 shrink-0 bg-zinc-950/60 backdrop-blur-xl">
          <div className="flex items-center gap-2">
            {/* Mobile close button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileSidebarOpen(false)}
              className="md:hidden text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50"
            >
              <X className="w-5 h-5" />
            </Button>

            <span className="text-lg font-bold text-indigo-400 hidden md:block">
              Aalap
            </span>

            {/* Hamburger Menu - Desktop */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50"
            >
              <Menu className="w-5 h-5" />
            </Button>

            <ProfileSettingsDialog>
              <button
                type="button"
                className="flex items-center gap-3 text-left rounded-xl px-2 py-1.5 hover:bg-zinc-800/30 transition-all duration-200 group hidden md:flex"
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
                <div className="hidden sm:block">
                  <span className="font-semibold tracking-tight text-zinc-100 group-hover:text-white transition-colors block">
                    {user?.username}
                  </span>
                  <span className="text-xs text-zinc-500">Online</span>
                </div>
              </button>
            </ProfileSettingsDialog>
          </div>

          <div className="flex items-center gap-1">
            {/* Three dots menu - Desktop */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(true)}
              className="text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 rounded-xl transition-all duration-200 hidden md:flex"
            >
              <MoreHorizontal className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Sidebar content */}
        <div className="flex-1 overflow-hidden">
          <ChatSidebar onChatSelect={() => setIsMobileSidebarOpen(false)} />
        </div>
      </div>

      {/* RIGHT PANEL: Active Chat Area */}
      <div
        className={cn(
          "flex-1 bg-gradient-to-b from-zinc-950 to-zinc-900 flex flex-col relative pb-[70px] md:pb-0",
          !activeChat ? "hidden md:flex" : "flex",
        )}
      >
        {/* Mobile Header with Menu Toggle */}
        {activeChat && (
          <div className="md:hidden h-14 border-b border-zinc-800/50 flex items-center px-3 shrink-0 bg-zinc-950/60 backdrop-blur-xl">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(true)}
              className="text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50"
            >
              <Menu className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2 ml-2">
              <img
                src={getAvatarUrl(activeChat)}
                alt="Avatar"
                className="w-8 h-8 rounded-full object-cover border-2 border-zinc-700/50"
              />
              <span className="font-semibold text-zinc-100 text-sm">
                {activeChat.chatName}
              </span>
            </div>
          </div>
        )}

        {activeChat ? (
          <div className="flex-1 flex flex-col h-full w-full">
            <ChatArea />
          </div>
        ) : (
          // Empty State
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 p-6">
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

      {/* Mobile Tab Bar */}
      <TabBar />
    </div>
  );
}
