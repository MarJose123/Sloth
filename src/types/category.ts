/** Category-related types. */

export type CategoryKind = "expense" | "income";

/** A bare category row — used by the Add Transaction picker. */
export interface Category {
  id: string;
  name: string;
  icon: string;
  colorHex: string;
  kind: CategoryKind;
}

export interface CategorySpend {
  id: string;
  name: string;
  icon: string;
  colorHex: string;
  kind: CategoryKind;
  /** Sum of |amount_cents| for this category in the given range. */
  spendCents: number;
  transactionCount: number;
}

export interface MonthRange {
  /** Inclusive start of the range, epoch ms. */
  start: number;
  /** Exclusive end of the range, epoch ms. */
  end: number;
}

export interface InsertCategoryInput {
  name: string;
  icon: string;
  colorHex: string;
  kind: CategoryKind;
}

export interface UpdateCategoryInput {
  name: string;
  icon: string;
  colorHex: string;
  kind: CategoryKind;
}
