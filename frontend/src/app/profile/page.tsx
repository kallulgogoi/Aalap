"use client";

import TelegramPageLayout from "@/components/layout/TelegramPageLayout";
import ProfileSettingsForm from "@/components/profile/ProfileSettingsForm";

export default function ProfilePage() {
  return (
    <TelegramPageLayout title="Edit Profile" showBackOnDesktop>
      <ProfileSettingsForm />
    </TelegramPageLayout>
  );
}
