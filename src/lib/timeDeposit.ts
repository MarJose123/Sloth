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
 * Shared time-deposit constants, helpers, and zod field schemas.
 * Used by add-account.tsx and edit-account.tsx so the two forms cannot drift.
 */

import { z } from "zod";
import type { InterestPayout } from "@/types";

/**
 * Shared react-hook-form values for the account forms (add-account and
 * edit-account). `balance` is unused by edit-account but shared so the
 * TimeDepositFields component can be typed with one concrete shape.
 */
export interface AccountFormData {
  name: string;
  balance: string;
  interestRate: string;
  placementTerm: string;
  interestPayout: string;
  note: string;
}

export const TIME_DEPOSIT_PAYOUT_OPTIONS: readonly {
  value: InterestPayout;
  label: string;
}[] = [
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "semi-annual", label: "Semi-annual" },
  { value: "annual", label: "Annual" },
  { value: "maturity", label: "At maturity" },
];

/** "3.50" → 350 (basis points). Returns null when unparsable. */
export function interestRateToBps(rate: string): number | null {
  const n = parseFloat(rate.trim());
  return isNaN(n) ? null : Math.round(n * 100);
}

/** 350 → "3.50" (empty string for null). */
export function interestRateFromBps(bps: number | null): string {
  return bps == null ? "" : (bps / 100).toFixed(2);
}

/** Parses a whole number of months; NaN/partial input → null. */
export function parsePlacementTermMonths(term: string): number | null {
  const trimmed = term.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  const n = parseInt(trimmed, 10);
  return n >= 1 && n <= 120 ? n : null;
}

/** Zod validation shared by add-account and edit-account. */
export const interestRateFieldSchema = z.string().refine((v) => {
  const n = parseFloat(v);
  return !isNaN(n) && n > 0 && n <= 100;
}, "Enter a rate between 0 and 100");

export const placementTermFieldSchema = z
  .string()
  .refine(
    (v) => parsePlacementTermMonths(v) !== null,
    "Enter a term between 1 and 120 months",
  );

export const interestPayoutFieldSchema = z
  .string()
  .refine(
    (v): v is InterestPayout =>
      TIME_DEPOSIT_PAYOUT_OPTIONS.some((o) => o.value === v),
    "Select an interest payout",
  );
