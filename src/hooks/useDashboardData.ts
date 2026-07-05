import { useCallback, useEffect, useRef, useState } from "react";
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
  | { status: "ready"; data: DashboardData; isRefreshing: boolean };

async function fetchDashboardData(
  selectedAccountId: string | null,
): Promise<DashboardData> {
  const range = currentMonthRange();
  const accountId = selectedAccountId ?? undefined;

  const [accounts, categories, totalExpenseCents, recentTransactions] =
    await Promise.all([
      listAccountsWithBalances(),
      listTopExpenseCategories(range, TOP_CATEGORIES_LIMIT, accountId),
      getTotalExpenseCents(range, accountId),
      listRecentTransactions(RECENT_TRANSACTIONS_LIMIT, accountId),
    ]);

  return { accounts, categories, totalExpenseCents, recentTransactions };
}

/**
 * Loads dashboard data for the given account filter (null = all accounts).
 *
 * Refetches whenever the dashboard tab regains focus, so balances stay
 * correct after adding a transaction elsewhere. Once data has loaded once,
 * later refetches flip `isRefreshing` on an otherwise-`ready` state instead
 * of reverting to a bare `loading` state, so the screen never has to blank
 * out previously-loaded content just to show a spinner.
 */
export function useDashboardData(selectedAccountId: string | null) {
  const [state, setState] = useState<DashboardState>({ status: "loading" });

  // Mirrors `state` for reads inside `load` without making `load` (and thus
  // the focus-effect callback) depend on `state` itself, which would
  // otherwise refetch on every state change instead of only on focus /
  // account-filter changes. Writing to a ref is only safe outside of
  // render, hence the effect — writing it inline during the render body
  // trips react-hooks/refs.
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const mountedRef = useRef(true);
  useEffect(
    () => () => {
      mountedRef.current = false;
    },
    [],
  );

  const load = useCallback(async () => {
    const previous = stateRef.current;
    setState(
      previous.status === "ready"
        ? { ...previous, isRefreshing: true }
        : { status: "loading" },
    );

    try {
      const data = await fetchDashboardData(selectedAccountId);
      if (mountedRef.current) {
        setState({ status: "ready", data, isRefreshing: false });
      }
    } catch (err) {
      if (mountedRef.current) {
        setState({
          status: "error",
          message:
            err instanceof Error
              ? err.message
              : "Failed to load dashboard data",
        });
      }
    }
  }, [selectedAccountId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return { state, refresh: load };
}
