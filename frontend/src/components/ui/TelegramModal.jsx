"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export default function TelegramModal({
  open,
  onOpenChange,
  title,
  children,
  className,
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          "tg-modal p-0 gap-0 flex flex-col overflow-hidden",
          "bg-[#17212b] ring-1 ring-white/10 border-0 shadow-2xl text-white",
          "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
          "w-[min(420px,calc(100vw-2rem))]",
          "max-h-[min(680px,calc(100dvh-2rem))]",
          "rounded-2xl",
          "max-sm:w-[calc(100vw-1.5rem)] max-sm:max-h-[calc(100dvh-1.5rem)]",
          className,
        )}
      >
        <div className="tg-header h-14 flex items-center justify-center shrink-0 relative px-4 border-b border-black/20 rounded-t-2xl">
          <h2 className="text-[17px] font-semibold text-white tracking-tight">
            {title}
          </h2>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="absolute right-2 inline-flex w-10 h-10 items-center justify-center rounded-full text-tg-muted hover:bg-white/5 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto overflow-x-hidden tg-page min-h-0 px-2 sm:px-0 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}
