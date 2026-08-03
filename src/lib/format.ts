/*
 * Copyright (C) 2026
 *
 * Owner: MarJose123 (https://github.com/MarJose123/sloth)
 * Project: Sloth
 * License: GPLv3 <https://choosealicense.com/licenses/gpl-3.0/>
 *
 * Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

/**
 * Formats a signed cent amount as PHP, e.g. -1840 -> "−₱18.40", 214000 -> "₱2,140.00".
 * Uses a true minus sign (U+2212) to match the design system rather than a hyphen.
 */
export function formatCurrency(cents: number): string {
  const sign = cents < 0 ? "\u2212" : "";
  const value = (Math.abs(cents) / 100).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${sign}\u20B1${value}`;
}

/** Same as formatCurrency, but prefixes positive amounts with "+" — used for transaction rows. */
export function formatSignedCurrency(cents: number): string {
  if (cents >= 0) return `+${formatCurrency(cents)}`;
  return formatCurrency(cents);
}

/**
 * Masked placeholder shown in place of amounts when the user hides
 * balances/figures with the dashboard's eye toggle ("₱ ••••••").
 */
export const HIDDEN_AMOUNT = "\u20B1 \u2022\u2022\u2022\u2022\u2022\u2022";

/**
 * Returns a human-readable month label like "July 2025" for the given date.
 */
export function formatMonthLabel(date: Date = new Date()): string {
  return date.toLocaleDateString("en-PH", {
    month: "long",
    year: "numeric",
  });
}

/**
 * Formats a timestamp as MM/dd/YYYY.
 * `occurredAt` is epoch ms in the device's local timezone.
 */
export function formatRelativeDate(
  occurredAt: number,
  _reference?: Date,
): string {
  const d = new Date(occurredAt);
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const year = d.getFullYear();
  return `${month}/${day}/${year}`;
}

/**
 * "Good morning" / "Good afternoon" / "Good evening" based on the device's
 * local clock, each with a time-of-day emoji:
 *   morning (5–11) → 🌅, afternoon (12–16) → ☀️,
 *   evening / "almost 6pm" (17–18) → 🌇, night (19–4) → 🌙.
 */
export function getGreeting(reference: Date = new Date()): string {
  const hour = reference.getHours();
  if (hour < 5) return "Still up 🌙";
  if (hour < 12) return "Good morning 🌅";
  if (hour < 17) return "Good afternoon ☀️";
  if (hour < 19) return "Good evening 🌇";
  return "Good evening 🌙";
}

/**
 * Formats a timestamp as a human-readable relative string, e.g.
 * "Just now", "5 seconds ago", "2 minutes ago", "1 hour ago", "3 days ago".
 * Falls back to MM/dd/YYYY for timestamps older than 30 days.
 */
export function formatRelativeTime(
  occurredAt: number,
  _reference?: Date,
): string {
  const now = Date.now();
  const diffMs = now - occurredAt;
  if (diffMs < 0) return "Just now";

  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 5) return "Just now";
  if (seconds < 60) return `${seconds} seconds ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes === 1) return "1 minute ago";
  if (minutes < 60) return `${minutes} minutes ago`;

  const hours = Math.floor(minutes / 60);
  if (hours === 1) return "1 hour ago";
  if (hours < 24) return `${hours} hours ago`;

  const days = Math.floor(hours / 24);
  if (days === 1) return "1 day ago";
  if (days < 30) return `${days} days ago`;

  // Fall back to absolute date for older entries
  const d = new Date(occurredAt);
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const year = d.getFullYear();
  return `${month}/${day}/${year}`;
}

/**
 * Live-formats an amount string with thousands separators as the user types.
 * "1234" → "1,234", "1234.5" → "1,234.5", ".5" → "0.5", "0" → "0".
 * Strips existing currency symbols/commas, keeps a single decimal point and
 * caps the decimal part at 2 digits. Returns "" for an empty input.
 */
export function formatAmountInput(value: string): string {
  let cleaned = value.replace(/[^\d.]/g, "");
  const firstDot = cleaned.indexOf(".");
  if (firstDot !== -1) {
    cleaned =
      cleaned.slice(0, firstDot + 1) +
      cleaned.slice(firstDot + 1).replace(/\./g, "");
  }
  const [rawWhole, rawDec] = cleaned.split(".");
  const whole =
    rawWhole.replace(/^0+(?=\d)/, "") || (rawDec !== undefined ? "0" : "");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  if (rawDec === undefined) return grouped;
  return `${grouped}.${(rawDec ?? "").slice(0, 2)}`;
}

/**
 * Auto-formats an amount string to 2 decimal places with thousands
 * separators on blur.
 * "100" → "100.00", "1234.5" → "1,234.50", "0" → "0.00", "12.5" → "12.50"
 */
export function formatAmountOnBlur(value: string): string {
  const stripped = value.replace(/[^\d.]/g, "");
  if (!stripped || stripped === "0") return "0.00";
  const firstDot = stripped.indexOf(".");
  const hasDot = stripped.includes(".");
  const whole =
    (hasDot ? stripped.slice(0, firstDot) : stripped).replace(
      /^0+(?=\d)/,
      "",
    ) || "0";
  const dec = (hasDot ? stripped.slice(firstDot + 1) : "")
    .padEnd(2, "0")
    .slice(0, 2);
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${grouped}.${dec}`;
}
