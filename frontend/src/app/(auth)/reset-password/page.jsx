"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import axiosInstance from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PasswordInput from "@/components/ui/PasswordInput";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Clock } from "lucide-react";
import LeftSidebar from "@/components/ui/LeftSidebar";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);

  const [isResending, setIsResending] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  const [formData, setFormData] = useState({
    email: "",
    otp: "",
    newPassword: "",
  });

  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (emailParam) setFormData((prev) => ({ ...prev, email: emailParam }));
  }, [searchParams]);

  // Handle the countdown timer for the Resend button
  useEffect(() => {
    let timerId;
    if (resendTimer > 0) {
      timerId = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timerId);
  }, [resendTimer]);

  const handleSubmit = async (e) => {
    e.preventDefault();
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

  const handleResendOTP = async () => {
    if (!formData.email) return;

    setIsResending(true);
    try {
      await axiosInstance.post("/auth/forgot-password", {
        email: formData.email,
      });
      toast.success("A new 10-minute verification code has been sent.");
      setResendTimer(60); // 60-second timer for resnding
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to resend code");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-zinc-950">
      <LeftSidebar />

      {/* Reset Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 lg:p-8">
        <Card className="w-full max-w-md bg-zinc-900/50 border-zinc-800 text-zinc-100 shadow-2xl backdrop-blur-sm">
          <CardHeader className="space-y-2 text-center pb-6">
            <CardTitle className="text-2xl font-bold tracking-tight">
              Create New Password
            </CardTitle>
            <CardDescription className="text-zinc-400 flex flex-col items-center gap-2">
              <span>Enter the 6-digit code sent to your email.</span>

              {/* 10 Minute Validity Indicator */}
              <span className="flex items-center gap-1.5 text-xs bg-indigo-500/10 text-indigo-300 px-3 py-1.5 rounded-full border border-indigo-500/20">
                <Clock className="w-3.5 h-3.5" />
                Code expires in 10 minutes
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-zinc-300">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  className="bg-zinc-950 border-zinc-700 focus-visible:ring-indigo-500 h-11 text-zinc-400 placeholder:text-zinc-500 cursor-not-allowed"
                  value={formData.email}
                  readOnly
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="otp" className="text-zinc-300">
                  Verification Code
                </Label>
                <Input
                  id="otp"
                  type="text"
                  maxLength={6}
                  className="bg-zinc-950 border-zinc-700 focus-visible:ring-indigo-500 h-11 text-center tracking-[0.25em] text-lg text-zinc-100 placeholder:text-zinc-500"
                  placeholder="Enter 6-digit code"
                  value={formData.otp}
                  onChange={(e) =>
                    setFormData({ ...formData, otp: e.target.value })
                  }
                  required
                />
                <div className="text-xs text-zinc-500 mt-1 flex justify-between items-center">
                  <span>Didn&apos;t receive the code?</span>

                  <button
                    type="button"
                    className="text-indigo-400 hover:text-indigo-300 transition-colors disabled:text-zinc-600 disabled:cursor-not-allowed disabled:hover:text-zinc-600 font-medium"
                    onClick={handleResendOTP}
                    disabled={isResending || resendTimer > 0 || !formData.email}
                  >
                    {isResending
                      ? "Sending..."
                      : resendTimer > 0
                        ? `Resend in ${resendTimer}s`
                        : "Resend Code"}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-zinc-300">
                  New Password
                </Label>
                <PasswordInput
                  id="newPassword"
                  className="bg-zinc-950 border-zinc-700 focus-visible:ring-indigo-500 h-11 text-zinc-100 placeholder:text-zinc-500"
                  placeholder="Enter new password"
                  value={formData.newPassword}
                  onChange={(e) =>
                    setFormData({ ...formData, newPassword: e.target.value })
                  }
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all duration-300 mt-2"
                disabled={loading}
              >
                {loading ? "Updating Password..." : "Reset Password"}
              </Button>
            </form>

            <div className="mt-6 flex justify-center">
              <Link
                href="/login"
                className="flex items-center text-sm font-medium text-zinc-400 hover:text-indigo-300 transition-colors"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
