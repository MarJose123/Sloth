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
