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

/**
 * Account-type → category-kind rules for the Add Transaction flow, shared by
 * the form (guard) and the select-category sheet (filter):
 *
 *  - time-deposit: locked placement — only income transactions are allowed
 *    (e.g. interest credited). Expenses are blocked.
 *  - loan: expense transactions increase the debt; "loan-payment" categories
 *    reduce it. Income categories are hidden to keep the flow unambiguous.
 *  - everything else: expense + income as before.
 */

import type { AccountType, CategoryKind } from "@/types";

/** Category kinds selectable for a transaction on the given account type. */
export function allowedCategoryKinds(
  accountType?: AccountType | null,
): CategoryKind[] {
  switch (accountType) {
    case "time-deposit":
      return ["income"];
    case "loan":
      return ["expense", "loan-payment"];
    default:
      return ["expense", "income"];
  }
}

/** Friendly hint when no categories match the selected account type. */
export function allowedCategoryEmptyHint(
  accountType?: AccountType | null,
): string {
  switch (accountType) {
    case "time-deposit":
      return "Time deposits only allow income categories — create an income category first.";
    case "loan":
      return "No matching categories. Create an expense or loan-payment category for this loan.";
    default:
      return "Create a category first.";
  }
}
