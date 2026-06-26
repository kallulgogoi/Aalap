import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * A utility function to elegantly merge Tailwind CSS classes.
 * It resolves conflicts (e.g., if you pass 'p-4' and 'p-2', it keeps 'p-2').
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
