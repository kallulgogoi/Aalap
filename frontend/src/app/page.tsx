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
    <div className="flex h-[100dvh] w-full bg-[#0E1621] overflow-hidden">
      {/* Account Drawer Overlay */}
      {isAccountDrawerOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-[60] backdrop-blur-sm"
          onClick={() => setIsAccountDrawerOpen(false)}
        />
      )}

      {/* Account Drawer */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-[70] w-[min(320px,85vw)] flex flex-col bg-[#17212B] shadow-2xl transform transition-transform duration-300 ease-out",
          isAccountDrawerOpen
            ? "translate-x-0"
            : "-translate-x-full pointer-events-none",
        )}
      >
        {/* Drawer Header */}
        <div className="h-[56px] flex items-center justify-between px-4">
          <span className="text-[17px] font-medium text-white">Account</span>
          <button
            onClick={() => setIsAccountDrawerOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-[#8D9BAF] hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex flex-col flex-1 px-4">
          {/* Profile Card */}
          <div className="flex flex-col items-center py-6 rounded-xl bg-[#242F3D]">
            <div className="w-[84px] h-[84px] rounded-full overflow-hidden ring-2 ring-[#2B5278]">
              <img
                src={getAvatarUrl(user)}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>
            <p className="mt-3 font-semibold text-[17px] text-white">
              {user?.username}
            </p>
            <p className="text-[15px] text-[#8D9BAF] mt-0.5">{user?.email}</p>
          </div>

          {/* Menu Items */}
          <div className="mt-3 flex flex-col gap-0.5">
            <button
              onClick={openProfile}
              className="flex items-center gap-3 px-3 py-[13px] rounded-xl hover:bg-white/5 transition-colors group"
            >
              <div className="w-8 h-8 rounded-full bg-[#2B5278] flex items-center justify-center">
                <UserCircle className="w-[18px] h-[18px] text-white" />
              </div>
              <span className="flex-1 text-left text-[17px] text-white">
                My Profile
              </span>
              <ChevronRight className="w-4 h-4 text-[#8D9BAF] group-hover:text-white transition-colors" />
            </button>

            <button
              onClick={openSettings}
              className="flex items-center gap-3 px-3 py-[13px] rounded-xl hover:bg-white/5 transition-colors group"
            >
              <div className="w-8 h-8 rounded-full bg-[#2B5278] flex items-center justify-center">
                <Settings className="w-[18px] h-[18px] text-white" />
              </div>
              <span className="flex-1 text-left text-[17px] text-white">
                Settings
              </span>
              <ChevronRight className="w-4 h-4 text-[#8D9BAF] group-hover:text-white transition-colors" />
            </button>
          </div>

          {/* Logout */}
          <div className="mt-auto pb-4">
            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 w-full px-4 py-[14px] rounded-xl bg-[#242F3D] hover:bg-[#FF3B30]/20 text-[#FF3B30] hover:text-[#FF453A] transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-[17px] font-medium">Log Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div
        ref={sidebarRef}
        style={{ width: sidebarWidth }}
        className={cn(
          "flex flex-col shrink-0 transition-all duration-200 bg-[#17212B] relative",
          !activeChat && "flex max-md:!w-full max-md:pb-[70px]",
          activeChat && !isMobileSidebarOpen && "hidden md:flex",
          activeChat &&
            isMobileSidebarOpen &&
            "fixed inset-y-0 left-0 z-40 flex w-full max-w-[85%] max-md:!w-full shadow-xl",
          isResizing && "transition-none",
        )}
      >
        {/* Resize Handle */}
        <div
          className="absolute right-0 top-0 bottom-0 w-[2px] cursor-col-resize hover:bg-[#2B5278] transition-colors z-20 hidden md:block"
          onMouseDown={startResize}
        />

        {/* Sidebar Header */}
        <div className="h-[56px] flex items-center px-4 bg-[#17212B]">
          <div className="flex items-center gap-2 min-w-0">
            {activeChat && isMobileSidebarOpen && (
              <button
                onClick={() => setIsMobileSidebarOpen(false)}
                className="md:hidden w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-[#8D9BAF] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            )}

            <button
              onClick={() => setIsAccountDrawerOpen(true)}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-[#8D9BAF] hover:text-white transition-colors"
              title="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <span className="text-xl md:text-2xl font-semibold text-white truncate ml-1">
              Aalap
            </span>
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-hidden">
          <ChatSidebar onChatSelect={() => setIsMobileSidebarOpen(false)} />
        </div>
      </div>

      {/* Main Chat Area */}
      <div
        className={cn(
          "flex-1 bg-gradient-to-b from-[#0E1621] to-[#17212B] flex flex-col relative",
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
          /* Empty State */
          <div className="flex-1 flex flex-col items-center justify-center text-[#8D9BAF] p-6">
            <div className="w-[120px] h-[120px] rounded-full flex items-center justify-center mb-6">
              <Image
                src="/images/empty1.png"
                alt="Welcome"
                loading="eager"
                width={120}
                height={120}
                className="w-full h-full object-contain opacity-90"
              />
            </div>
            <h2 className="text-[22px] font-semibold text-white mb-2">
              Welcome to Aalap
            </h2>
            <p className="max-w-[300px] text-center text-[15px] text-[#8D9BAF] leading-relaxed">
              Select a conversation to start chatting, or find someone new to
              connect with.
            </p>
          </div>
        )}
      </div>

      {/* Chat Details Panel */}
      {activeChat && detailsOpen && (
        <ChatDetailsPanel
          isOpen={detailsOpen}
          onClose={() => setDetailsOpen(false)}
        />
      )}

      {/* Mobile Tab Bar */}
      {!activeChat && (
        <MobileTabBar
          activeTab={mobileTab}
          onTabChange={handleMobileTabChange}
        />
      )}

      {/* Dialogs */}
      <ProfileDialog
        open={profileOpen}
        onOpenChange={(open: boolean) => {
          setProfileOpen(open);
          if (!open && !settingsOpen) setMobileTab("chats");
        }}
      />

      <SettingsDialog
        open={settingsOpen}
        onOpenChange={(open: boolean) => {
          setSettingsOpen(open);
          if (!open && !profileOpen) setMobileTab("chats");
        }}
        onOpenProfile={openProfile}
      />
    </div>
  );
}
