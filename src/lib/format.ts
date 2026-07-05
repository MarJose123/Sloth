/**
 * Formats a signed cent amount as USD, e.g. -1840 -> "−$18.40", 214000 -> "$2,140.00".
 * Uses a true minus sign (U+2212) to match the design system rather than a hyphen.
 */
export function formatCurrency(cents: number): string {
  const sign = cents < 0 ? "\u2212" : "";
  const value = (Math.abs(cents) / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${sign}$${value}`;
}

/** Same as formatCurrency, but prefixes positive amounts with "+" — used for transaction rows. */
export function formatSignedCurrency(cents: number): string {
  if (cents >= 0) return `+${formatCurrency(cents)}`;
  return formatCurrency(cents);
}

/**
 * "Today" / "Yesterday" for the last two days, otherwise a short date like "Jul 4".
 * `occurredAt` and `reference` are both epoch ms in the device's local timezone.
 */
export function formatRelativeDate(
  occurredAt: number,
  reference: Date = new Date(),
): string {
  const d = new Date(occurredAt);
  const startOfDay = (dt: Date) =>
    new Date(dt.getFullYear(), dt.getMonth(), dt.getDate()).getTime();
  const diffDays = Math.round(
    (startOfDay(reference) - startOfDay(d)) / 86_400_000,
  );

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** "Good morning" / "Good afternoon" / "Good evening" based on the device's local clock. */
export function getGreeting(reference: Date = new Date()): string {
  const hour = reference.getHours();
  if (hour < 5) return "Still up";
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}
