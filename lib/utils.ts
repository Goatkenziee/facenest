import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Merge Tailwind classes without conflicts — use cn() everywhere you compose
// conditional classes (the shadcn convention).
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(n: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(n);
}
export function formatNumber(n: number) {
  return new Intl.NumberFormat("en-US").format(n);
}
