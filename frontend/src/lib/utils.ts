import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Parses dates in "DD-MM-YYYY HH:mm:ss" format returned by the supports API.
 * Returns null if the string is falsy or unparseable.
 */
export function parseDDMMYYYY(dateStr: string | null | undefined): Date | null {
  if (!dateStr) return null;
  // Expected format: "DD-MM-YYYY HH:mm:ss" or "DD-MM-YYYY"
  const match = dateStr.match(/^(\d{2})-(\d{2})-(\d{4})(?:\s(\d{2}):(\d{2}):(\d{2}))?/);
  if (!match) return null;
  const [, dd, mm, yyyy, hh = '0', min = '0', ss = '0'] = match;
  const date = new Date(
    Number(yyyy),
    Number(mm) - 1,
    Number(dd),
    Number(hh),
    Number(min),
    Number(ss)
  );
  return isNaN(date.getTime()) ? null : date;
}
