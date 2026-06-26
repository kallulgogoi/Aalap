"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axiosInstance from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    otp: "",
    newPassword: "",
  });

  // Auto-fill the email if they just came from the forgot-password page
  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (emailParam) setFormData((prev) => ({ ...prev, email: emailParam }));
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Submitting reset password with data:", formData);
    setLoading(true);
    try {
      await axiosInstance.post("/auth/reset-password", formData);
      toast.success("Password reset successfully! You can now log in.");
      router.push("/login");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4">
      <Card className="w-full max-w-md bg-zinc-900 border-zinc-800 text-zinc-100 shadow-2xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold tracking-tight">
            Create New Password
          </CardTitle>
          <CardDescription className="text-zinc-400">
            Enter the 6-digit code sent to your email and choose a new password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-zinc-300">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                className="bg-zinc-950 border-zinc-800 text-zinc-500"
                value={formData.email}
                readOnly // Make it read-only if it was passed via URL to prevent mistakes
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="otp" className="text-zinc-300">
                Reset Code
              </Label>
              <Input
                id="otp"
                type="text"
                maxLength={6}
                className="bg-zinc-950 border-zinc-800 tracking-widest focus-visible:ring-indigo-500"
                value={formData.otp}
                onChange={(e) =>
                  setFormData({ ...formData, otp: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-zinc-300">
                New Password
              </Label>
              <Input
                id="newPassword"
                type="password"
                className="bg-zinc-950 border-zinc-800 focus-visible:ring-indigo-500"
                value={formData.newPassword}
                onChange={(e) =>
                  setFormData({ ...formData, newPassword: e.target.value })
                }
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
              disabled={loading}
            >
              {loading ? "Updating..." : "Reset Password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
