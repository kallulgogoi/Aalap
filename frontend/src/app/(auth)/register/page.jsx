"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1 = Register, 2 = Verify OTP
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    otp: "",
  });

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axiosInstance.post("/auth/register", {
        username: formData.username,
        email: formData.email,
        password: formData.password,
      });
      toast.success("OTP sent to your email!");
      setStep(2); // Switch to OTP View
    } catch (error) {
      toast.error(error.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axiosInstance.post("/auth/verify-otp", {
        email: formData.email,
        otp: formData.otp,
      });
      toast.success("Account verified! You can now log in.");
      router.push("/login");
    } catch (error) {
      toast.error(error.response?.data?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4">
      <Card className="w-full max-w-md bg-zinc-900 border-zinc-800 text-zinc-100 shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold tracking-tight">
            {step === 1 ? "Create an account" : "Verify your email"}
          </CardTitle>
          <CardDescription className="text-zinc-400">
            {step === 1
              ? "Enter your details below to get started."
              : `Enter the 6-digit code sent to ${formData.email}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 1 ? (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-zinc-300">
                  Username
                </Label>
                <Input
                  id="username"
                  className="bg-zinc-950 border-zinc-800 focus-visible:ring-indigo-500"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-zinc-300">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  className="bg-zinc-950 border-zinc-800 focus-visible:ring-indigo-500"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-zinc-300">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  className="bg-zinc-950 border-zinc-800 focus-visible:ring-indigo-500"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                disabled={loading}
              >
                {loading ? "Creating account..." : "Sign Up"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp" className="text-zinc-300">
                  One-Time Password (OTP)
                </Label>
                <Input
                  id="otp"
                  type="text"
                  maxLength={6}
                  className="bg-zinc-950 border-zinc-800 text-center tracking-widest text-lg focus-visible:ring-indigo-500"
                  value={formData.otp}
                  onChange={(e) =>
                    setFormData({ ...formData, otp: e.target.value })
                  }
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                disabled={loading}
              >
                {loading ? "Verifying..." : "Verify & Continue"}
              </Button>
            </form>
          )}

          {step === 1 && (
            <div className="mt-6 text-center text-sm text-zinc-400">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-medium text-indigo-400 hover:text-indigo-300"
              >
                Sign in
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
