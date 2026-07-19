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
