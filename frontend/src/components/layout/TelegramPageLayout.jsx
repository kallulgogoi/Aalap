"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import MobileTabBar from "@/components/layout/MobileTabBar";

export function TelegramPageHeader({
  title,
  backHref = "/",
  showBackOnDesktop = false,
  rightAction,
}) {
  return (
    <header className="tg-header h-14 flex items-center justify-between px-2 shrink-0 relative">
      <div className="w-20 flex items-center">
        <Link
          href={backHref}
          className={cn(
            "inline-flex items-center justify-center w-10 h-10 rounded-full text-telegram hover:bg-white/5 transition-colors",
            !showBackOnDesktop && "md:hidden",
          )}
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
      </div>
      <h1 className="absolute left-1/2 -translate-x-1/2 text-[17px] font-semibold text-white tracking-tight">
        {title}
      </h1>
      <div className="w-20 flex items-center justify-end">{rightAction}</div>
    </header>
  );
}

export default function TelegramPageLayout({
  title,
  backHref = "/",
  showBackOnDesktop = false,
  rightAction = null,
  children,
  showTabBar = true,
  className,
}) {
  return (
    <div className="flex flex-col h-screen w-full tg-page overflow-hidden">
      <TelegramPageHeader
        title={title}
        backHref={backHref}
        showBackOnDesktop={showBackOnDesktop}
        rightAction={rightAction}
      />
      <div
        className={cn(
          "flex-1 overflow-y-auto pb-24 md:pb-8",
          className,
        )}
      >
        {children}
      </div>
      {showTabBar && <MobileTabBar />}
    </div>
  );
}
