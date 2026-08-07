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
 * Tests for src/lib/transactionFlow.ts — the account-type → category-kind
 * rules used by the Add Transaction picker and its guard.
 */

import {
  allowedCategoryEmptyHint,
  allowedCategoryKinds,
} from "@/lib/transactionFlow";

describe("allowedCategoryKinds", () => {
  it("limits time deposits to income only", () => {
    expect(allowedCategoryKinds("time-deposit")).toEqual(["income"]);
  });

  it("allows expense and loan-payment on loans, but not income", () => {
    expect(allowedCategoryKinds("loan")).toEqual(["expense", "loan-payment"]);
  });

  it("allows expense and income for every other account type", () => {
    expect(allowedCategoryKinds("wallet")).toEqual(["expense", "income"]);
    expect(allowedCategoryKinds("savings")).toEqual(["expense", "income"]);
    expect(allowedCategoryKinds("credit")).toEqual(["expense", "income"]);
    expect(allowedCategoryKinds("investment")).toEqual(["expense", "income"]);
    expect(allowedCategoryKinds(null)).toEqual(["expense", "income"]);
    expect(allowedCategoryKinds(undefined)).toEqual(["expense", "income"]);
  });
});

describe("allowedCategoryEmptyHint", () => {
  it("explains the time-deposit restriction", () => {
    expect(allowedCategoryEmptyHint("time-deposit")).toContain(
      "income categories",
    );
  });

  it("explains the loan requirement", () => {
    expect(allowedCategoryEmptyHint("loan")).toContain("loan-payment");
  });

  it("falls back to the generic message", () => {
    expect(allowedCategoryEmptyHint("wallet")).toContain("Create a category");
    expect(allowedCategoryEmptyHint(undefined)).toContain("Create a category");
  });
});
