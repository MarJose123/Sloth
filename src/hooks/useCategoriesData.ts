import { useCallback, useEffect, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
import {
  currentMonthRange,
  getTotalExpenseCents,
  listAllCategoriesWithSpend,
  type CategorySpend,
} from "@/lib/db/repositories/categories";

export interface CategoriesData {
  categories: CategorySpend[];
  totalExpenseCents: number;
}

export type CategoriesState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: CategoriesData; isRefreshing: boolean };

async function fetchCategoriesData(): Promise<CategoriesData> {
  const range = currentMonthRange();
  const [categories, totalExpenseCents] = await Promise.all([
    listAllCategoriesWithSpend(range),
    getTotalExpenseCents(range),
  ]);
  return { categories, totalExpenseCents };
}

/**
 * Loads all categories with monthly spend. Refetches on focus so the list
 * stays correct after adding or editing a category. Mirrors the
 * useDashboardData / useAccountsData pattern exactly.
 */
export function useCategoriesData() {
  const [state, setState] = useState<CategoriesState>({ status: "loading" });

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
      const data = await fetchCategoriesData();
      if (mountedRef.current) {
        setState({ status: "ready", data, isRefreshing: false });
      }
    } catch (err) {
      if (mountedRef.current) {
        setState({
          status: "error",
          message:
            err instanceof Error ? err.message : "Failed to load categories",
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
