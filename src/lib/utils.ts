import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a date to a deterministic string to avoid SSR/CSR hydration mismatches.
 * Uses "en-GB" locale for consistent DD/MM/YYYY output regardless of user's locale.
 * 
 * @param date - Date object, ISO string, or timestamp
 * @param options - Optional Intl.DateTimeFormatOptions to customize format
 * @returns Formatted date string (e.g., "03/12/2025")
 */
export function formatDate(
  date: Date | string | number,
  options?: Intl.DateTimeFormatOptions
): string {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  return d.toLocaleDateString('en-GB', options ?? {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Format a date with time in a deterministic way.
 * @param date - Date object, ISO string, or timestamp
 * @returns Formatted date + time string (e.g., "03/12/2025, 14:30")
 */
export function formatDateTime(
  date: Date | string | number
): string {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

