"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "../store/authStore";
import { useRouter, usePathname } from "next/navigation";

export const AuthProvider = ({ children }) => {
  const [isHydrated, setIsHydrated] = useState(false);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

    const isPublicRoute =
      pathname.startsWith("/login") ||
      pathname.startsWith("/register") ||
      pathname.startsWith("/forgot-password") ||
      pathname.startsWith("/reset-password");

    // If logged out and trying to see the chat
    if (!isAuthenticated && !isPublicRoute) {
      router.push("/login");
    }
    // If logged in and trying to see the login page
    else if (isAuthenticated && isPublicRoute) {
      router.push("/");
    }
  }, [isAuthenticated, pathname, isHydrated, router]);

  if (!isHydrated) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-zinc-950">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
      </div>
    );
  }

  return <>{children}</>;
};
