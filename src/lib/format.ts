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

/** "Good morning" / "Good afternoon" / "Good evening" based on the device's local clock. */
export function getGreeting(reference: Date = new Date()): string {
  const hour = reference.getHours();
  if (hour < 5) return "Still up";
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
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
 * Auto-formats an amount string to 2 decimal places on blur.
 * "100" → "100.00", "0" → "0.00", "12.5" → "12.50"
 */
export function formatAmountOnBlur(value: string): string {
  const stripped = value.replace(/[^\d.]/g, "");
  if (!stripped || stripped === "0") return "0.00";
  if (stripped.includes(".")) {
    const [whole, dec] = stripped.split(".");
    return `${whole}.${(dec ?? "").padEnd(2, "0").slice(0, 2)}`;
  }
  return `${stripped}.00`;
}
