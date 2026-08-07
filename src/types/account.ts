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

export type AccountType =
  "wallet" | "savings" | "credit" | "investment" | "loan" | "time-deposit";

/** When interest earned on a time deposit is credited. */
export type InterestPayout =
  "monthly" | "quarterly" | "semi-annual" | "annual" | "maturity";

export interface AccountWithBalance {
  id: string;
  name: string;
  type: AccountType;
  colorHex: string;
  logoKey: string | null;
  /** starting_balance + sum of all account transactions, in cents. */
  balanceCents: number;
  /** Time-deposit only: interest rate in basis points (350 = 3.50%). */
  interestRateBps: number | null;
  /** Time-deposit only: placement term in months. */
  placementTermMonths: number | null;
  /** Time-deposit only: how/when interest is paid out. */
  interestPayout: InterestPayout | null;
  /** Time-deposit only: free-text note. */
  note: string | null;
}

export interface TimeDepositFields {
  /** Interest rate in basis points (350 = 3.50%). */
  interestRateBps: number | null;
  placementTermMonths: number | null;
  interestPayout: InterestPayout | null;
  note: string | null;
}

export interface InsertAccountInput {
  name: string;
  type: AccountType;
  colorHex: string;
  logoKey?: string | null;
  /** Signed cents. Positive for asset accounts; credit cards typically start at 0.
   *  For loan accounts the amount owed is stored negative (liability convention). */
  startingBalanceCents: number;
  /** Time-deposit details; ignored for other account types. */
  timeDeposit?: Partial<TimeDepositFields>;
}

export interface UpdateAccountInput {
  id: string;
  name: string;
  type: AccountType;
  colorHex: string;
  logoKey: string | null;
  /** Time-deposit details; nulls when the account is not a time deposit. */
  timeDeposit?: Partial<TimeDepositFields>;
}
