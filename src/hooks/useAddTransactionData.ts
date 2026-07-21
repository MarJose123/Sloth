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

import { useEffect, useState } from "react";
import { listAccountsWithBalances } from "@/lib/db/repositories/accounts";
import { listAllCategories } from "@/lib/db/repositories/categories";
import type { AddTransactionDataState } from "@/types";

/**
 * Loads the reference data (accounts + categories) needed to populate the
 * Add Transaction form pickers. Fetched once on mount — no focus-effect
 * refetch is needed because the user cannot add accounts or categories
 * while this tab is active.
 */
export function useAddTransactionData(): AddTransactionDataState {
  const [state, setState] = useState<AddTransactionDataState>({
    status: "loading",
  });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [accounts, categories] = await Promise.all([
          listAccountsWithBalances(),
          listAllCategories(),
        ]);
        if (!cancelled) {
          setState({ status: "ready", data: { accounts, categories } });
        }
      } catch (err) {
        if (!cancelled) {
          setState({
            status: "error",
            message:
              err instanceof Error ? err.message : "Failed to load form data",
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
