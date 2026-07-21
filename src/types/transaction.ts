/** Transaction-related types. */

import type { CategoryKind } from "./category";

export interface RecentTransaction {
  id: string;
  merchant: string;
  amountCents: number;
  occurredAt: number;
  accountId: string;
  categoryName: string | null;
  categoryIcon: string | null;
  categoryKind: CategoryKind | null;
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
