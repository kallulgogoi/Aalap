"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "../store/authStore";
import { useRouter, usePathname } from "next/navigation";

const PUBLIC_ROUTES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
];

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

    const isPublicRoute = PUBLIC_ROUTES.some((route) =>
      pathname.startsWith(route),
    );

    // If logged out and trying to see a private page
    if (!isAuthenticated && !isPublicRoute) {
      router.push("/login");
    }
    // If logged in and trying to see an auth page
    else if (
      isAuthenticated &&
      (pathname.startsWith("/login") || pathname.startsWith("/register"))
    ) {
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
