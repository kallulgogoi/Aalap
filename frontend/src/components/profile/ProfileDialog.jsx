"use client";

import TelegramModal from "@/components/ui/TelegramModal";
import ProfileSettingsForm from "@/components/profile/ProfileSettingsForm";

export default function ProfileDialog({ open, onOpenChange }) {
  return (
    <TelegramModal
      open={open}
      onOpenChange={onOpenChange}
      title="Edit Profile"
    >
      <div className="py-2 pb-4 sm:pb-6">
        <ProfileSettingsForm onSuccess={() => onOpenChange(false)} />
      </div>
    </TelegramModal>
  );
}
