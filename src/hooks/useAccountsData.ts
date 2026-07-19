import { useCallback, useEffect, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
import { listAccountsWithBalances } from "@/lib/db/repositories/accounts";
import type { AccountsState } from "@/types";

/**
 * Loads all accounts with their computed balances. Mirrors the
 * `useDashboardData` pattern: refetches on tab focus so balances stay correct
 * after adding transactions, and uses `isRefreshing` to avoid blanking
 * previously-loaded content on subsequent fetches.
 */
export function useAccountsData() {
  const [state, setState] = useState<AccountsState>({ status: "loading" });

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
      const accounts = await listAccountsWithBalances();
      if (mountedRef.current) {
        setState({ status: "ready", accounts, isRefreshing: false });
      }
    } catch (err) {
      if (mountedRef.current) {
        setState({
          status: "error",
          message:
            err instanceof Error ? err.message : "Failed to load accounts",
        });
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return { state, refresh: load };
}
