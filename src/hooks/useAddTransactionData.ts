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

import { useCallback, useEffect, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
import { listAccountsWithBalances } from "@/lib/db/repositories/accounts";
import { listAllCategories } from "@/lib/db/repositories/categories";
import type { AddTransactionDataState } from "@/types";

/**
 * Loads the reference data (accounts + categories) needed to populate the
 * Add Transaction form pickers.
 *
 * Refetches on focus rather than only on mount: the Add Transaction screen
 * can stay mounted in the navigation stack (for example after saving pushes
 * the transactions list on top of it) while the user creates or edits
 * accounts/categories elsewhere. A mount-only fetch would leave the pickers
 * and their guards (e.g. "No categories — create a category first.") looking
 * at stale data. Once loaded, later refetches keep the `ready` state and
 * only flip `isRefreshing`, so the form never blanks out mid-edit.
 */
export function useAddTransactionData(): AddTransactionDataState {
  const [state, setState] = useState<AddTransactionDataState>({
    status: "loading",
  });

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
      const [accounts, categories] = await Promise.all([
        listAccountsWithBalances(),
        listAllCategories(),
      ]);
      if (mountedRef.current) {
        setState({
          status: "ready",
          data: { accounts, categories },
          isRefreshing: false,
        });
      }
    } catch (err) {
      if (mountedRef.current) {
        setState({
          status: "error",
          message:
            err instanceof Error ? err.message : "Failed to load form data",
        });
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return state;
}
