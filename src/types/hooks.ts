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

/** Hook state types. */

import type { AccountWithBalance } from "./account";
import type { Category, CategorySpend } from "./category";
import type { RecentTransaction, TransactionLedgerItem } from "./transaction";

export interface AddTransactionFormData {
  accounts: AccountWithBalance[];
  categories: Category[];
}

export type AccountsState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; accounts: AccountWithBalance[]; isRefreshing: boolean };

export type AddTransactionDataState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: AddTransactionFormData };

export interface CategoriesData {
  categories: CategorySpend[];
  totalExpenseCents: number;
}

export type CategoriesState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: CategoriesData; isRefreshing: boolean };

export interface DashboardData {
  accounts: AccountWithBalance[];
  categories: CategorySpend[];
  totalExpenseCents: number;
  recentTransactions: RecentTransaction[];
}

export type DashboardState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: DashboardData; isRefreshing: boolean };

export type TransactionsState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | {
      status: "ready";
      transactions: TransactionLedgerItem[];
      isRefreshing: boolean;
    };
