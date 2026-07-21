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
 * Tests for src/lib/db/repositories/categories.ts
 */

import { mockDbInstance } from "@/__tests__/setup";
import {
  listAllCategories,
  getCategoryById,
  insertCategory,
  updateCategory,
  listAllCategoriesWithSpend,
  listTopExpenseCategories,
  currentMonthRange,
} from "@/lib/db/repositories/categories";

beforeEach(() => {
  jest.clearAllMocks();
});

describe("currentMonthRange", () => {
  it("returns start/end timestamps for the current month", () => {
    const range = currentMonthRange(new Date(2025, 3, 15)); // April 2025
    expect(range.start).toBe(new Date(2025, 3, 1).getTime());
    expect(range.end).toBe(new Date(2025, 4, 1).getTime());
  });
});

describe("listAllCategories", () => {
  it("returns mapped category rows", async () => {
    mockDbInstance.execute.mockResolvedValue({
      rows: [
        {
          id: "cat-1",
          name: "Groceries",
          icon: "🛒",
          color_hex: "#C87B54",
          kind: "expense",
        },
        {
          id: "cat-2",
          name: "Salary",
          icon: "💰",
          color_hex: "#7FA06B",
          kind: "income",
        },
      ],
    });

    const cats = await listAllCategories();
    expect(cats).toHaveLength(2);
    expect(cats[0]).toEqual({
      id: "cat-1",
      name: "Groceries",
      icon: "🛒",
      colorHex: "#C87B54",
      kind: "expense",
    });
    expect(cats[1].kind).toBe("income");
  });
});

describe("getCategoryById", () => {
  it("returns a single category", async () => {
    mockDbInstance.execute.mockResolvedValue({
      rows: [
        {
          id: "cat-1",
          name: "Groceries",
          icon: "🛒",
          color_hex: "#C87B54",
          kind: "expense",
        },
      ],
    });

    const cat = await getCategoryById("cat-1");
    expect(cat).not.toBeNull();
    expect(cat!.name).toBe("Groceries");
  });

  it("returns null when not found", async () => {
    mockDbInstance.execute.mockResolvedValue({ rows: [] });
    expect(await getCategoryById("nope")).toBeNull();
  });
});

describe("insertCategory", () => {
  it("executes INSERT with correct params", async () => {
    mockDbInstance.execute.mockResolvedValue({ rows: [] });

    const id = await insertCategory({
      name: "Transport",
      icon: "🚈",
      colorHex: "#6FC9B8",
      kind: "expense",
    });

    expect(id).toBeTruthy();
    expect(mockDbInstance.execute).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO categories"),
      expect.arrayContaining([id, "Transport", "🚈", "#6FC9B8", "expense"]),
    );
  });
});

describe("updateCategory", () => {
  it("executes UPDATE with correct params", async () => {
    mockDbInstance.execute.mockResolvedValue({ rows: [] });

    await updateCategory("cat-1", {
      name: "Groceries Updated",
      icon: "🛒",
      colorHex: "#A96B42",
      kind: "expense",
    });

    expect(mockDbInstance.execute).toHaveBeenCalledWith(
      expect.stringContaining("UPDATE categories"),
      expect.arrayContaining([
        "Groceries Updated",
        "🛒",
        "#A96B42",
        "expense",
        "cat-1",
      ]),
    );
  });
});

describe("listAllCategoriesWithSpend", () => {
  it("returns categories with computed spend", async () => {
    mockDbInstance.execute.mockResolvedValue({
      rows: [
        {
          id: "cat-1",
          name: "Groceries",
          icon: "🛒",
          color_hex: "#C87B54",
          kind: "expense",
          spend_cents: 50000,
          transaction_count: 3,
        },
      ],
    });

    const range = { start: 0, end: Date.now() };
    const cats = await listAllCategoriesWithSpend(range);
    expect(cats).toHaveLength(1);
    expect(cats[0].spendCents).toBe(50000);
    expect(cats[0].transactionCount).toBe(3);
  });
});

describe("listTopExpenseCategories", () => {
  it("returns top expense categories", async () => {
    mockDbInstance.execute.mockResolvedValue({
      rows: [
        {
          id: "cat-1",
          name: "Groceries",
          icon: "🛒",
          color_hex: "#C87B54",
          kind: "expense",
          spend_cents: 50000,
          transaction_count: 3,
        },
      ],
    });

    const range = { start: 0, end: Date.now() };
    const cats = await listTopExpenseCategories(range, 3);
    expect(cats).toHaveLength(1);
    expect(cats[0].spendCents).toBe(50000);
  });
});
