import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import {
  listAccountsWithBalances,
  type AccountWithBalance,
} from "@/lib/db/repositories/accounts";
import {
  currentMonthRange,
  getTotalExpenseCents,
  listTopExpenseCategories,
  type CategorySpend,
} from "@/lib/db/repositories/categories";
import {
  listRecentTransactions,
  type RecentTransaction,
} from "@/lib/db/repositories/transactions";

const RECENT_TRANSACTIONS_LIMIT = 5;
const TOP_CATEGORIES_LIMIT = 3;

export interface DashboardData {
  accounts: AccountWithBalance[];
  categories: CategorySpend[];
  totalExpenseCents: number;
  recentTransactions: RecentTransaction[];
}

export type DashboardState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: DashboardData };

/**
 * Loads dashboard data for the given account filter (null = all accounts).
 * Refetches every time the dashboard tab regains focus, so balances stay
 * correct after adding a transaction elsewhere — there's no cross-screen
 * cache to invalidate since everything reads straight from SQLite.
 */
export function useDashboardData(selectedAccountId: string | null) {
  const [state, setState] = useState<DashboardState>({ status: "loading" });
  const [refreshKey, setRefreshKey] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      async function load() {
        setState((prev) =>
          prev.status === "ready" ? prev : { status: "loading" },
        );
        try {
          const range = currentMonthRange();
          const accountId = selectedAccountId ?? undefined;

          const [accounts, categories, totalExpenseCents, recentTransactions] =
            await Promise.all([
              listAccountsWithBalances(),
              listTopExpenseCategories(range, TOP_CATEGORIES_LIMIT, accountId),
              getTotalExpenseCents(range, accountId),
              listRecentTransactions(RECENT_TRANSACTIONS_LIMIT, accountId),
            ]);

          if (cancelled) return;
          setState({
            status: "ready",
            data: {
              accounts,
              categories,
              totalExpenseCents,
              recentTransactions,
            },
          });
        } catch (err) {
          if (cancelled) return;
          setState({
            status: "error",
            message:
              err instanceof Error
                ? err.message
                : "Failed to load dashboard data",
          });
        }
      }

      load();
      return () => {
        cancelled = true;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedAccountId, refreshKey]),
  );

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  return { state, refresh };
}
