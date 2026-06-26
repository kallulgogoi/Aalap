import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function TelegramSection({ title, children, className }) {
  return (
    <section className={cn("px-4", className)}>
      {title && <p className="tg-section-title">{title}</p>}
      <div className="tg-section">{children}</div>
    </section>
  );
}

export function TelegramRow({
  icon: Icon,
  iconClassName,
  iconBgClassName = "bg-telegram-soft",
  label,
  value,
  hint,
  onClick,
  href,
  as: Component = onClick || href ? "button" : "div",
  className,
  destructive,
  showChevron = Boolean(onClick || href),
  children,
}) {
  const content = (
    <>
      {Icon && (
        <div
          className={cn(
            "w-9 h-9 rounded-full flex items-center justify-center shrink-0",
            iconBgClassName,
          )}
        >
          <Icon
            className={cn(
              "w-[18px] h-[18px]",
              destructive ? "text-red-400" : "text-telegram",
              iconClassName,
            )}
          />
        </div>
      )}
      <div className="flex-1 min-w-0 text-left">
        {label && (
          <p
            className={cn(
              "text-[15px] leading-tight",
              destructive ? "text-red-400" : "text-white",
            )}
          >
            {label}
          </p>
        )}
        {value && (
          <p className="text-[15px] text-telegram truncate mt-0.5">{value}</p>
        )}
        {hint && (
          <p className="text-[13px] text-tg-muted mt-0.5 leading-snug">{hint}</p>
        )}
        {children}
      </div>
      {showChevron && (
        <ChevronRight className="w-5 h-5 text-tg-muted shrink-0 opacity-70" />
      )}
    </>
  );

  const rowClass = cn(
    "tg-row w-full",
    (onClick || href) && "hover:bg-white/[0.03] active:bg-white/[0.05] transition-colors",
    className,
  );

  if (href) {
    return (
      <a href={href} className={rowClass}>
        {content}
      </a>
    );
  }

  return (
    <Component type={onClick ? "button" : undefined} onClick={onClick} className={rowClass}>
      {content}
    </Component>
  );
}

export function TelegramFieldRow({ label, children, className }) {
  return (
    <div className={cn("tg-field-row", className)}>
      <label className="block text-[13px] text-telegram font-medium mb-2 px-1">
        {label}
      </label>
      {children}
    </div>
  );
}
