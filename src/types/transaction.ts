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

/** Transaction-related types. */

import type { CategoryKind } from "./category";

/** Aggregated expense/income totals for a single calendar day (local tz). */
export interface DailyTotals {
  /** Epoch ms of local midnight for that day. */
  dayStartEpochMs: number;
  expenseCents: number;
  incomeCents: number;
}

export interface RecentTransaction {
  id: string;
  merchant: string;
  amountCents: number;
  occurredAt: number;
  accountId: string;
  /** Account name — used for the badge initials fallback. */
  accountName: string;
  /** Account logo key ("bank/…" or "custom/…"), resolved via resolveLogoSrc(). */
  accountLogoKey: string | null;
  /** Account badge color — fallback background when there is no logo. */
  accountColorHex: string;
  categoryName: string | null;
  categoryIcon: string | null;
  categoryKind: CategoryKind | null;
}

/**
 * Per-account income or expense total for a date range — one row of the
 * dashboard's weekly activity pie chart detail. `amountCents` is positive
 * (absolute amount).
 */
export interface AccountAmountSlice {
  accountId: string;
  accountName: string;
  accountLogoKey: string | null;
  accountColorHex: string;
  amountCents: number;
}

/**
 * Full transaction row for the ledger view — includes account name and note
 * in addition to the fields exposed by RecentTransaction.
 */
export interface TransactionLedgerItem {
  id: string;
  merchant: string;
  amountCents: number;
  occurredAt: number;
  createdAt: number;
  accountId: string;
  accountName: string;
  categoryName: string | null;
  categoryIcon: string | null;
  categoryKind: CategoryKind | null;
  note: string | null;
  source: "manual" | "scan" | "import";
}

export interface InsertTransactionInput {
  accountId: string;
  categoryId: string;
  merchant: string;
  /**
   * Signed cents — negative = expense, positive = income.
   * Caller applies the correct sign; repository stores as-is.
   */
  amountCents: number;
  occurredAt: number;
  note?: string | null;
  source?: "manual" | "scan" | "import";
}
