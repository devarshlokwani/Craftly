import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge class names, with later Tailwind utilities winning over earlier ones.
 * Every Craftly component takes a `className` prop and funnels it through this,
 * so consumers can always override our styling without `!important`.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
