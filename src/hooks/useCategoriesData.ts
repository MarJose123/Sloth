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
import {
  currentMonthRange,
  getTotalExpenseCents,
  listAllCategoriesWithSpend,
} from "@/lib/db/repositories/categories";
import type { CategoriesData, CategoriesState } from "@/types";

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
