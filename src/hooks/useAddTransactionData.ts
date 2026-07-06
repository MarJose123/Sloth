import { useEffect, useState } from "react";
import {
  listAccountsWithBalances,
  type AccountWithBalance,
} from "@/lib/db/repositories/accounts";
import {
  listAllCategories,
  type Category,
} from "@/lib/db/repositories/categories";

export interface AddTransactionFormData {
  accounts: AccountWithBalance[];
  categories: Category[];
}

export type AddTransactionDataState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: AddTransactionFormData };

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
