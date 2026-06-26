"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "../store/authStore";
import { useRouter, usePathname } from "next/navigation";

export const AuthProvider = ({ children }) => {
  const [isHydrated, setIsHydrated] = useState(false);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const router = useRouter();
  const pathname = usePathname();

  // 1. Wait for Zustand to load the token from localStorage
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // 2. Global Route Guard
  useEffect(() => {
    if (!isHydrated) return;

    // Define public routes that don't need a token
    const isPublicRoute =
      pathname.startsWith("/login") ||
      pathname.startsWith("/register") ||
      pathname.startsWith("/forgot-password") ||
      pathname.startsWith("/reset-password");

    // If logged out and trying to see the chat -> kick to login
    if (!isAuthenticated && !isPublicRoute) {
      router.push("/login");
    }
    // If logged in and trying to see the login page -> kick to chat
    else if (isAuthenticated && isPublicRoute) {
      router.push("/");
    }
  }, [isAuthenticated, pathname, isHydrated, router]);

  // Prevent rendering the app until the auth state is fully known
  if (!isHydrated) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-zinc-950">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
      </div>
    );
  }

  return <>{children}</>;
};
