"use client";

import { useEffect, useState, useRef } from "react";
import { useAuthStore } from "@/store/authStore";
import { useChatStore } from "@/store/chatStore";
import {
  LogOut,
  X,
  UserCircle,
  Menu,
  ChevronRight,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import ChatSidebar from "@/components/chat/ChatSidebar";
import ChatArea from "@/components/chat/ChatArea";
import ChatDetailsPanel from "@/components/chat/ChatDetailsPanel";
import MobileTabBar from "@/components/layout/MobileTabBar";
import ProfileDialog from "@/components/profile/ProfileDialog";
import SettingsDialog from "@/components/settings/SettingsDialog";
import { getAvatarUrl } from "@/lib/avatar";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import Image from "next/image";

export default function MainChatDashboard() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const activeChat = useChatStore((state) => state.activeChat);
  const setActiveChat = useChatStore((state) => state.setActiveChat);
  const fetchChats = useChatStore((state) => state.fetchChats);

  const [sidebarWidth, setSidebarWidth] = useState(380);
  const [isResizing, setIsResizing] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isAccountDrawerOpen, setIsAccountDrawerOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState("chats");
  const sidebarRef = useRef(null);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const panel = params.get("open");
    if (panel === "profile") setProfileOpen(true);
    if (panel === "settings") setSettingsOpen(true);
    if (panel) {
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const startResize = (e: React.MouseEvent) => {
    setIsResizing(true);
    startXRef.current = e.clientX;
    startWidthRef.current = sidebarWidth;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  const handleResize = (e: MouseEvent) => {
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

  const handleLogout = () => {
    setIsAccountDrawerOpen(false);
    setSettingsOpen(false);
    setProfileOpen(false);
    logout();
    toast.success("Logged out successfully");
  };

  const openProfile = () => {
    setIsAccountDrawerOpen(false);
    setMobileTab("profile");
    setProfileOpen(true);
  };

  const openSettings = () => {
    setIsAccountDrawerOpen(false);
    setMobileTab("settings");
    setSettingsOpen(true);
  };

  const handleMobileTabChange = (tab: string) => {
    setMobileTab(tab);
    if (tab === "chats") {
      setActiveChat(null);
      setProfileOpen(false);
      setSettingsOpen(false);
      return;
    }
    if (tab === "profile") {
      setProfileOpen(true);
      setSettingsOpen(false);
      return;
    }
    if (tab === "settings") {
      setSettingsOpen(true);
      setProfileOpen(false);
    }
  };

  return (
    <div className="flex h-screen w-full app-bg overflow-hidden">
      {isAccountDrawerOpen && (
        <div
          className="fixed inset-0 bg-black/55 z-[60] backdrop-blur-[2px]"
          onClick={() => setIsAccountDrawerOpen(false)}
        />
      )}

      <div
        className={cn(
          "fixed inset-y-0 left-0 z-[70] w-[min(300px,88vw)] flex flex-col bg-[#17212b] border-r border-black/25 shadow-2xl transform transition-transform duration-300 ease-out",
          isAccountDrawerOpen
            ? "translate-x-0"
            : "-translate-x-full pointer-events-none",
        )}
      >
        <div className="h-14 border-b border-black/20 flex items-center justify-between px-4 shrink-0">
          <span className="text-[15px] font-medium text-white">Account</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsAccountDrawerOpen(false)}
            className="text-tg-muted hover:text-white hover:bg-white/5 rounded-full"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex flex-col flex-1 p-4">
          <div className="flex flex-col items-center py-6 px-4 rounded-2xl bg-telegram-soft">
            <img
              src={getAvatarUrl(user)}
              alt="Profile"
              className="w-24 h-24 rounded-full object-cover profile-avatar-ring"
            />
            <p className="mt-4 font-semibold text-white">{user?.username}</p>
            <p className="text-sm text-tg-muted mt-1">{user?.email}</p>
          </div>

          <button
            type="button"
            onClick={openProfile}
            className="profile-menu-item mt-4 group"
          >
            <div className="w-11 h-11 rounded-full bg-telegram-soft flex items-center justify-center">
              <UserCircle className="w-5 h-5 text-telegram" />
            </div>
            <span className="flex-1 text-sm font-medium text-white text-left">
              My Profile
            </span>
            <ChevronRight className="w-4 h-4 text-tg-muted group-hover:text-telegram transition-colors" />
          </button>

          <button
            type="button"
            onClick={openSettings}
            className="profile-menu-item mt-1 group"
          >
            <div className="w-11 h-11 rounded-full bg-telegram-soft flex items-center justify-center">
              <Settings className="w-5 h-5 text-telegram" />
            </div>
            <span className="flex-1 text-sm font-medium text-white text-left">
              Settings
            </span>
            <ChevronRight className="w-4 h-4 text-tg-muted group-hover:text-telegram transition-colors" />
          </button>

          <div className="mt-auto pt-4 border-t border-white/5">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-full hover:bg-red-500/10 transition-colors text-red-400 hover:text-red-300"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-sm font-medium">Logout</span>
            </button>
          </div>
        </div>
      </div>

      <div
        ref={sidebarRef}
        style={{ width: sidebarWidth }}
        className={cn(
          "flex flex-col shrink-0 transition-all duration-300 border-r border-white/5 bg-[rgba(8,12,24,0.55)] backdrop-blur-2xl relative",
          !activeChat && "flex max-md:!w-full max-md:pb-[70px]",
          activeChat && !isMobileSidebarOpen && "hidden md:flex",
          activeChat &&
            isMobileSidebarOpen &&
            "fixed inset-y-0 left-0 z-40 flex w-full max-w-[85%] max-md:!w-full",
          isResizing && "transition-none",
        )}
      >
        <div
          className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-[#24A1DE]/50 transition-colors z-20 hidden md:block"
          onMouseDown={startResize}
        />

        <div className="h-16 border-b border-zinc-800/50 flex items-center px-4 shrink-0 bg-zinc-950/60 backdrop-blur-xl">
          <div className="flex items-center gap-2 min-w-0">
            {activeChat && isMobileSidebarOpen && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileSidebarOpen(false)}
                className="md:hidden text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 shrink-0"
              >
                <X className="w-5 h-5" />
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsAccountDrawerOpen(true)}
              className="text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 rounded-xl shrink-0"
              title="Open menu"
            >
              <Menu className="w-5 h-5" />
            </Button>

            <span className="text-lg font-display font-bold text-telegram truncate">
              Aalap
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <ChatSidebar onChatSelect={() => setIsMobileSidebarOpen(false)} />
        </div>
      </div>

      <div
        className={cn(
          "flex-1 bg-gradient-to-b from-zinc-950 to-zinc-900 flex flex-col relative md:pb-0",
          activeChat ? "flex" : "hidden md:flex",
        )}
      >
        {activeChat ? (
          <div className="flex-1 flex flex-col h-full w-full min-w-0">
            <ChatArea
              onOpenDetails={() => setDetailsOpen(true)}
              detailsOpen={detailsOpen}
            />
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 p-6">
            <div className="relative">
              <div className="absolute inset-0 rounded-full blur-2xl bg-telegram-soft animate-pulse" />
              <div className="w-42 h-42 rounded-full flex items-center justify-center relative">
                <Image
                  src="/images/empty1.png"
                  alt="Welcome"
                  loading="eager"
                  width={90}
                  height={90}
                  className="w-full h-full object-fit rounded-full"
                />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-zinc-200 mt-6 mb-2">
              Welcome to Aalap
            </h2>
            <p className="max-w-sm text-center text-zinc-500 leading-relaxed">
              Select a conversation from the sidebar to start messaging, or
              search for a new contact through email to connect with.
            </p>
          </div>
        )}
      </div>

      {activeChat && detailsOpen && (
        <ChatDetailsPanel onClose={() => setDetailsOpen(false)} />
      )}

      {!activeChat && (
        <MobileTabBar
          activeTab={mobileTab}
          onTabChange={handleMobileTabChange}
        />
      )}

      <ProfileDialog
        open={profileOpen}
        onOpenChange={(open) => {
          setProfileOpen(open);
          if (!open && !settingsOpen) setMobileTab("chats");
        }}
      />

      <SettingsDialog
        open={settingsOpen}
        onOpenChange={(open) => {
          setSettingsOpen(open);
          if (!open && !profileOpen) setMobileTab("chats");
        }}
        onOpenProfile={openProfile}
      />
    </div>
  );
}
