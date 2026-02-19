import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility function to merge Tailwind CSS classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format number to Indonesian Rupiah currency
 */
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export const formatCurrency = formatRupiah;

/**
 * Format date to Indonesian locale
 */
export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(date));
}

/**
 * Generate invoice number
 */
export function generateInvoiceNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const random = String(Math.floor(Math.random() * 1000)).padStart(3, "0");
  return `INV/${year}/${month}/${day}/${random}`;
}

/**
 * Get full image URL from relative path
 */
export function getImageUrl(path: string | null | undefined): string {
  if (!path) return "";
  if (
    path.startsWith("http") ||
    path.startsWith("blob:") ||
    path.startsWith("data:")
  )
    return path;

  // Get API URL and strip /api/v1 to get root
  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
  const baseUrl = apiUrl.replace(/\/api\/v1\/?$/, "");

  // Remove leading slash if present to avoid double slashes when joining
  let cleanPath = path.startsWith("/") ? path.slice(1) : path;

  // If path doesn't start with media/, and it looks like a relative path (e.g. products/...), add media/
  // We assume all user uploads are in media directory.
  if (!cleanPath.startsWith("media/") && !cleanPath.startsWith("static/")) {
    cleanPath = `media/${cleanPath}`;
  }

  return `${baseUrl}/${cleanPath}`;
}
