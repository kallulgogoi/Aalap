"use client";

import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import { getAvatarUrl } from "@/lib/avatar";
import {
  Bell,
  Shield,
  LogOut,
  Moon,
  Smartphone,
  ChevronRight,
  UserCircle,
} from "lucide-react";
import TelegramPageLayout from "@/components/layout/TelegramPageLayout";
import { TelegramSection, TelegramRow } from "@/components/ui/TelegramSettings";
import { toast } from "sonner";

export default function SettingsPage() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
  };

  return (
    <TelegramPageLayout title="Settings" showBackOnDesktop>
      <div className="max-w-xl mx-auto pt-2 space-y-2">
        <TelegramSection>
          <Link
            href="/profile"
            className="tg-row hover:bg-white/[0.03] active:bg-white/[0.05] transition-colors"
          >
            <img
              src={getAvatarUrl(user)}
              alt={user?.username}
              className="w-14 h-14 rounded-full object-cover border-2 border-[rgba(36,161,222,0.3)] shrink-0"
            />
            <div className="flex-1 min-w-0 text-left">
              <p className="text-[17px] font-semibold text-white truncate">
                {user?.username}
              </p>
              <p className="text-[14px] text-tg-muted truncate mt-0.5">
                {user?.email}
              </p>
              <p className="text-[14px] text-telegram mt-1">Edit profile</p>
            </div>
            <ChevronRight className="w-5 h-5 text-tg-muted shrink-0 opacity-70" />
          </Link>
        </TelegramSection>

        <TelegramSection title="Settings">
          <TelegramRow
            icon={Bell}
            iconBgClassName="bg-[rgba(36,161,222,0.18)]"
            label="Notifications and Sounds"
            hint="Message previews, sounds"
          />
          <TelegramRow
            icon={Moon}
            iconBgClassName="bg-[rgba(0,136,204,0.18)]"
            iconClassName="text-[#0088CC]"
            label="Chat Settings"
            hint="Theme, wallpaper, font size"
          />
          <TelegramRow
            icon={Smartphone}
            iconBgClassName="bg-[rgba(36,161,222,0.12)]"
            label="Devices"
            hint="Active sessions"
          />
        </TelegramSection>

        <TelegramSection title="Privacy and Security">
          <TelegramRow
            icon={Shield}
            iconBgClassName="bg-[rgba(36,161,222,0.15)]"
            label="Privacy and Security"
            hint="Block list, two-step verification"
          />
          <TelegramRow
            icon={UserCircle}
            iconBgClassName="bg-[rgba(0,136,204,0.15)]"
            iconClassName="text-[#0088CC]"
            label="Active Sessions"
            hint="Manage logged-in devices"
          />
        </TelegramSection>

        <TelegramSection className="mt-4">
          <TelegramRow
            icon={LogOut}
            iconBgClassName="bg-red-500/15"
            iconClassName="text-red-400"
            label="Log Out"
            destructive
            showChevron={false}
            onClick={handleLogout}
          />
        </TelegramSection>

        <p className="text-center text-[13px] text-tg-muted pt-4 pb-2">
          Aalap for Web · v1.0
        </p>
      </div>
    </TelegramPageLayout>
  );
}
