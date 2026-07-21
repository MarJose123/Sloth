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
 * Tests for src/lib/format.ts
 *
 * Pure utility functions for currency, date, and amount formatting.
 * No native module mocking required.
 */

import {
  formatCurrency,
  formatSignedCurrency,
  formatRelativeDate,
  getGreeting,
  formatRelativeTime,
  formatAmountOnBlur,
} from "@/lib/format";

// ─── formatCurrency ─────────────────────────────────────────────────────────

describe("formatCurrency", () => {
  it("formats positive cents as PHP", () => {
    expect(formatCurrency(0)).toBe("\u20B10.00");
    expect(formatCurrency(100)).toBe("\u20B11.00");
    expect(formatCurrency(1500)).toBe("\u20B115.00");
    expect(formatCurrency(214000)).toBe("\u20B12,140.00");
  });

  it("formats negative cents with minus sign", () => {
    expect(formatCurrency(-1)).toBe("\u2212\u20B10.01");
    expect(formatCurrency(-1840)).toBe("\u2212\u20B118.40");
    expect(formatCurrency(-100000)).toBe("\u2212\u20B11,000.00");
  });
});

// ─── formatSignedCurrency ───────────────────────────────────────────────────

describe("formatSignedCurrency", () => {
  it("prefixes positive amounts with +", () => {
    expect(formatSignedCurrency(100)).toBe("+\u20B11.00");
    expect(formatSignedCurrency(0)).toBe("+\u20B10.00");
  });

  it("keeps negative amounts as-is (minus sign)", () => {
    expect(formatSignedCurrency(-100)).toBe("\u2212\u20B11.00");
  });
});

// ─── formatRelativeDate ─────────────────────────────────────────────────────

describe("formatRelativeDate", () => {
  it("formats a timestamp as MM/dd/YYYY", () => {
    // April 15, 2025 (month is 0-based in JS Date constructor)
    const date = new Date(2025, 3, 15).getTime();
    expect(formatRelativeDate(date)).toBe("04/15/2025");
  });

  it("handles single-digit month and day with padding", () => {
    const date = new Date(2025, 0, 5).getTime();
    expect(formatRelativeDate(date)).toBe("01/05/2025");
  });
});

// ─── getGreeting ────────────────────────────────────────────────────────────

describe("getGreeting", () => {
  it('returns "Good morning" before 12', () => {
    const morning = new Date(2025, 0, 1, 9, 0, 0);
    expect(getGreeting(morning)).toBe("Good morning");
  });

  it('returns "Good afternoon" between 12 and 18', () => {
    const afternoon = new Date(2025, 0, 1, 14, 0, 0);
    expect(getGreeting(afternoon)).toBe("Good afternoon");
  });

  it('returns "Good evening" after 18', () => {
    const evening = new Date(2025, 0, 1, 20, 0, 0);
    expect(getGreeting(evening)).toBe("Good evening");
  });

  it('returns "Still up" for late night (before 5am)', () => {
    const night = new Date(2025, 0, 1, 3, 0, 0);
    expect(getGreeting(night)).toBe("Still up");
  });
});

// ─── formatRelativeTime ─────────────────────────────────────────────────────

describe("formatRelativeTime", () => {
  it('returns "Just now" for < 5 seconds', () => {
    const now = Date.now();
    expect(formatRelativeTime(now)).toBe("Just now");
    expect(formatRelativeTime(now - 1000)).toBe("Just now");
  });

  it('returns "X seconds ago" for < 60 seconds', () => {
    expect(formatRelativeTime(Date.now() - 30_000)).toMatch(/\d+ seconds ago/);
  });

  it('returns "1 minute ago" for exactly 1 minute', () => {
    const oneMin = Date.now() - 60_000;
    expect(formatRelativeTime(oneMin)).toBe("1 minute ago");
  });

  it('returns "X minutes ago" for < 1 hour', () => {
    const fiveMin = Date.now() - 5 * 60_000;
    expect(formatRelativeTime(fiveMin)).toBe("5 minutes ago");
  });

  it('returns "1 hour ago" for exactly 1 hour', () => {
    const oneHr = Date.now() - 3_600_000;
    expect(formatRelativeTime(oneHr)).toBe("1 hour ago");
  });

  it('returns "X hours ago" for < 24 hours', () => {
    const twoHr = Date.now() - 7_200_000;
    expect(formatRelativeTime(twoHr)).toBe("2 hours ago");
  });

  it('returns "1 day ago" for exactly 1 day', () => {
    const oneDay = Date.now() - 86_400_000;
    expect(formatRelativeTime(oneDay)).toBe("1 day ago");
  });

  it('returns "X days ago" for < 30 days', () => {
    const threeDays = Date.now() - 3 * 86_400_000;
    expect(formatRelativeTime(threeDays)).toBe("3 days ago");
  });

  it("falls back to MM/dd/YYYY for > 30 days", () => {
    // Use a fixed date to avoid timezone edge cases
    const oldDate = new Date(2025, 0, 15).getTime();
    const _formatRelativeTime = formatRelativeTime(oldDate);
    expect(_formatRelativeTime).toMatch(/\d{2}\/\d{2}\/\d{4}/);
  });
});

// ─── formatAmountOnBlur ─────────────────────────────────────────────────────

describe("formatAmountOnBlur", () => {
  it('returns "0.00" for empty or zero', () => {
    expect(formatAmountOnBlur("")).toBe("0.00");
    expect(formatAmountOnBlur("0")).toBe("0.00");
  });

  it("pads to 2 decimal places", () => {
    expect(formatAmountOnBlur("100")).toBe("100.00");
    expect(formatAmountOnBlur("12.5")).toBe("12.50");
  });

  it("truncates to 2 decimal places", () => {
    expect(formatAmountOnBlur("12.345")).toBe("12.34");
    expect(formatAmountOnBlur("12.999")).toBe("12.99");
  });

  it("strips non-numeric characters", () => {
    expect(formatAmountOnBlur("$1,234.56")).toBe("1234.56");
  });
});
