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

/** Account-related types. */

export type AccountType = "checking" | "savings" | "credit" | "cash";

export interface AccountWithBalance {
  id: string;
  name: string;
  type: AccountType;
  colorHex: string;
  logoKey: string | null;
  /** starting_balance + sum of all account transactions, in cents. */
  balanceCents: number;
}

export interface InsertAccountInput {
  name: string;
  type: AccountType;
  colorHex: string;
  logoKey?: string | null;
  /** Signed cents. Positive for asset accounts; credit cards typically start at 0. */
  startingBalanceCents: number;
}

export interface UpdateAccountInput {
  id: string;
  name: string;
  type: AccountType;
  colorHex: string;
  logoKey: string | null;
}
