import { useCallback, useEffect, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
import { listAllTransactions } from "@/lib/db/repositories/transactions";
import type { MonthRange, TransactionsState } from "@/types";

/**
 * Loads the full transaction ledger. Refetches on tab focus so the list
 * stays current after adding transactions from the dashboard or FAB.
 * Mirrors the useDashboardData / useAccountsData pattern exactly.
 *
 * @param accountId Optional account filter — pass `undefined` for all accounts.
 * @param range     Optional date range filter — pass `undefined` for all-time.
 */
export function useTransactionsData(accountId?: string, range?: MonthRange) {
  const [state, setState] = useState<TransactionsState>({ status: "loading" });

  // Tracks the latest generation of load() so stale async results from
  // earlier account-switches are discarded.
  const generationRef = useRef(0);

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
    const generation = ++generationRef.current;
    const previous = stateRef.current;
    setState(
      previous.status === "ready"
        ? { ...previous, isRefreshing: true }
        : { status: "loading" },
    );

    try {
      const transactions = await listAllTransactions(500, accountId, range);
      if (mountedRef.current && generation === generationRef.current) {
        setState({ status: "ready", transactions, isRefreshing: false });
      }
    } catch (err) {
      if (mountedRef.current && generation === generationRef.current) {
        setState({
          status: "error",
          message:
            err instanceof Error ? err.message : "Failed to load transactions",
        });
      }
    }
  }, [accountId, range]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return { state, refresh: load };
}
