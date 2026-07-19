import { useCallback, useEffect, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
import { listAllTransactions } from "@/lib/db/repositories/transactions";
import type { TransactionsState } from "@/types";

/**
 * Loads the full transaction ledger. Refetches on tab focus so the list
 * stays current after adding transactions from the dashboard or FAB.
 * Mirrors the useDashboardData / useAccountsData pattern exactly.
 */
export function useTransactionsData(accountId?: string) {
  const [state, setState] = useState<TransactionsState>({ status: "loading" });

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
      const transactions = await listAllTransactions(500, accountId);
      if (mountedRef.current) {
        setState({ status: "ready", transactions, isRefreshing: false });
      }
    } catch (err) {
      if (mountedRef.current) {
        setState({
          status: "error",
          message:
            err instanceof Error ? err.message : "Failed to load transactions",
        });
      }
    }
  }, [accountId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return { state, refresh: load };
}
