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
 * Tests for src/lib/db/repositories/transactions.ts
 */

import type { MonthRange } from "@/types";
import { mockDbInstance } from "@/__tests__/setup";
import {
  deleteTransaction,
  getDailyTotals,
  getExpenseByAccount,
  getIncomeByAccount,
  insertTransaction,
  listRecentTransactions,
  listAllTransactions,
} from "@/lib/db/repositories/transactions";

beforeEach(() => {
  jest.clearAllMocks();
  // Guard tests stub execute with mockImplementation; reset it so stubs
  // cannot leak into later tests (clearAllMocks keeps implementations).
  mockDbInstance.execute.mockReset();
});

/** The execute() call that actually runs the INSERT (guards run before it). */
function insertCall(): { sql: string; params: unknown[] } {
  const call = mockDbInstance.execute.mock.calls.find(([sql]) =>
    String(sql).includes("INSERT INTO transactions"),
  );
  expect(call).toBeDefined();
  return { sql: String(call![0]), params: call![1] as unknown[] };
}

/** Makes the guard's account/category lookups return the given kinds. */
function mockGuardLookups(accountType: string, categoryKind: string) {
  mockDbInstance.execute.mockImplementation(async (sql: string) => {
    if (sql.includes("SELECT type FROM accounts")) {
      return { rows: [{ type: accountType }] };
    }
    if (sql.includes("SELECT kind FROM categories")) {
      return { rows: [{ kind: categoryKind }] };
    }
    return { rows: [] };
  });
}

describe("insertTransaction", () => {
  it("executes INSERT with correct parameters", async () => {
    mockDbInstance.execute.mockResolvedValue({ rows: [] });

    const id = await insertTransaction({
      accountId: "acc-1",
      categoryId: "cat-1",
      merchant: "Starbucks",
      amountCents: -15000,
      occurredAt: 1700000000000,
      note: "Morning coffee",
      source: "manual",
    });

    expect(id).toBeTruthy();
    expect(typeof id).toBe("string");
    const { sql, params } = insertCall();
    expect(sql).toContain("INSERT INTO transactions");
    expect(params).toEqual(
      expect.arrayContaining([
        id,
        "acc-1",
        "cat-1",
        "Starbucks",
        -15000,
        1700000000000,
        "Morning coffee",
        "manual",
      ]),
    );
  });

  it("defaults source to 'manual' when not provided", async () => {
    mockDbInstance.execute.mockResolvedValue({ rows: [] });

    await insertTransaction({
      accountId: "acc-1",
      categoryId: "cat-1",
      merchant: "Test",
      amountCents: 100,
      occurredAt: Date.now(),
    });

    expect(insertCall().params).toContain("manual");
  });

  it("accepts null note", async () => {
    mockDbInstance.execute.mockResolvedValue({ rows: [] });

    await insertTransaction({
      accountId: "acc-1",
      categoryId: "cat-1",
      merchant: "Test",
      amountCents: 100,
      occurredAt: Date.now(),
      note: null,
    });

    expect(insertCall().params).toContain(null);
  });

  it("rejects expense transactions on time-deposit accounts", async () => {
    mockGuardLookups("time-deposit", "expense");

    await expect(
      insertTransaction({
        accountId: "acc-1",
        categoryId: "cat-1",
        merchant: "Test",
        amountCents: -1000,
        occurredAt: Date.now(),
      }),
    ).rejects.toThrow("Time deposit accounts cannot have expense");
    expect(
      mockDbInstance.execute.mock.calls.some(([sql]) =>
        String(sql).includes("INSERT INTO transactions"),
      ),
    ).toBe(false);
  });

  it("rejects loan-payment categories on non-loan accounts", async () => {
    mockGuardLookups("savings", "loan-payment");

    await expect(
      insertTransaction({
        accountId: "acc-1",
        categoryId: "cat-1",
        merchant: "Test",
        amountCents: 5000,
        occurredAt: Date.now(),
      }),
    ).rejects.toThrow("Loan payment transactions require a loan account");
  });

  it("rejects income categories on loan accounts", async () => {
    mockGuardLookups("loan", "income");

    await expect(
      insertTransaction({
        accountId: "acc-1",
        categoryId: "cat-1",
        merchant: "Test",
        amountCents: 5000,
        occurredAt: Date.now(),
      }),
    ).rejects.toThrow("Use a loan-payment category to reduce a loan balance");
  });

  it("allows loan-payment transactions on loan accounts", async () => {
    mockGuardLookups("loan", "loan-payment");

    const id = await insertTransaction({
      accountId: "acc-1",
      categoryId: "cat-1",
      merchant: "Payment",
      amountCents: 5000,
      occurredAt: Date.now(),
    });

    expect(id).toBeTruthy();
    expect(insertCall().params).toContain(5000);
  });
});

describe("deleteTransaction", () => {
  it("executes DELETE with correct id", async () => {
    mockDbInstance.execute.mockResolvedValue({ rows: [] });

    await deleteTransaction("tx-to-delete");

    expect(mockDbInstance.execute).toHaveBeenCalledWith(
      "DELETE FROM transactions WHERE id = ?;",
      ["tx-to-delete"],
    );
  });
});

describe("listRecentTransactions", () => {
  it("returns recent transactions", async () => {
    mockDbInstance.execute.mockResolvedValue({
      rows: [
        {
          id: "tx-1",
          merchant: "Starbucks",
          amount_cents: -15000,
          occurred_at: 1700000000000,
          account_id: "acc-1",
          account_name: "BPI Savings",
          account_logo_key: "bank/bpi.png",
          account_color_hex: "#C87B54",
          category_name: "Dining",
          category_icon: "🍽",
          category_kind: "expense",
        },
      ],
    });

    const txs = await listRecentTransactions(5);
    expect(txs).toHaveLength(1);
    expect(txs[0].merchant).toBe("Starbucks");
    expect(txs[0].amountCents).toBe(-15000);
    expect(txs[0].categoryName).toBe("Dining");
    expect(txs[0].accountName).toBe("BPI Savings");
    expect(txs[0].accountLogoKey).toBe("bank/bpi.png");
    expect(txs[0].accountColorHex).toBe("#C87B54");
  });

  it("filters by accountId when provided", async () => {
    mockDbInstance.execute.mockResolvedValue({ rows: [] });

    await listRecentTransactions(5, "acc-1");
    expect(mockDbInstance.execute).toHaveBeenCalledWith(
      expect.stringContaining("WHERE"),
      expect.arrayContaining(["acc-1"]),
    );
  });

  it("does not add WHERE clause without accountId", async () => {
    mockDbInstance.execute.mockResolvedValue({ rows: [] });

    await listRecentTransactions(5);
    const sql = mockDbInstance.execute.mock.calls[0][0] as string;
    expect(sql).not.toContain("WHERE");
  });

  it("adds occurred_at conditions when range is provided", async () => {
    mockDbInstance.execute.mockResolvedValue({ rows: [] });

    const range: MonthRange = { start: 1000, end: 2000 };
    await listRecentTransactions(5, undefined, range);
    const sql = mockDbInstance.execute.mock.calls[0][0] as string;
    const params = mockDbInstance.execute.mock.calls[0][1] as (
      string | number
    )[];

    expect(sql).toContain("WHERE");
    expect(sql).toContain("t.occurred_at >= ?");
    expect(sql).toContain("t.occurred_at < ?");
    expect(params).toContain(1000);
    expect(params).toContain(2000);
  });

  it("combines accountId and range in WHERE clause", async () => {
    mockDbInstance.execute.mockResolvedValue({ rows: [] });

    const range: MonthRange = { start: 1000, end: 2000 };
    await listRecentTransactions(5, "acc-1", range);
    const sql = mockDbInstance.execute.mock.calls[0][0] as string;
    const params = mockDbInstance.execute.mock.calls[0][1] as (
      string | number
    )[];

    expect(sql).toContain("WHERE");
    expect(sql).toContain("t.account_id = ?");
    expect(sql).toContain("t.occurred_at >= ?");
    expect(sql).toContain("t.occurred_at < ?");
    expect(sql).toContain("AND");
    expect(params).toContain("acc-1");
    expect(params).toContain(1000);
    expect(params).toContain(2000);
  });
});

describe("listAllTransactions", () => {
  it("returns full transaction ledger", async () => {
    mockDbInstance.execute.mockResolvedValue({
      rows: [
        {
          id: "tx-1",
          merchant: "Starbucks",
          amount_cents: -15000,
          occurred_at: 1700000000000,
          created_at: 1700000000000,
          account_id: "acc-1",
          account_name: "BPI Savings",
          category_name: "Dining",
          category_icon: "🍽",
          category_kind: "expense",
          note: null,
          source: "manual",
        },
      ],
    });

    const txs = await listAllTransactions();
    expect(txs).toHaveLength(1);
    expect(txs[0].accountName).toBe("BPI Savings");
    expect(txs[0].source).toBe("manual");
  });

  it("includes note in result", async () => {
    mockDbInstance.execute.mockResolvedValue({
      rows: [
        {
          id: "tx-1",
          merchant: "Test",
          amount_cents: 100,
          occurred_at: 1700000000000,
          created_at: 1700000000000,
          account_id: "acc-1",
          account_name: "Test",
          category_name: null,
          category_icon: null,
          category_kind: null,
          note: "My note",
          source: "manual",
        },
      ],
    });

    const txs = await listAllTransactions();
    expect(txs[0].note).toBe("My note");
  });
});

describe("getExpenseByAccount", () => {
  it("groups expense by account and maps badge data", async () => {
    mockDbInstance.execute.mockResolvedValue({
      rows: [
        {
          account_id: "acc-1",
          account_name: "BPI",
          account_logo_key: "bank/bpi.png",
          account_color_hex: "#C87B54",
          total_cents: 25000,
        },
        {
          account_id: "acc-2",
          account_name: "Wallet",
          account_logo_key: null,
          account_color_hex: "#7FA06B",
          total_cents: 5000,
        },
      ],
    });

    const range: MonthRange = { start: 1000, end: 2000 };
    const slices = await getExpenseByAccount(range);

    expect(slices).toHaveLength(2);
    expect(slices[0]).toEqual({
      accountId: "acc-1",
      accountName: "BPI",
      accountLogoKey: "bank/bpi.png",
      accountColorHex: "#C87B54",
      amountCents: 25000,
    });
    expect(slices[1].accountLogoKey).toBeNull();

    const sql = mockDbInstance.execute.mock.calls[0][0] as string;
    expect(sql).toContain("SUM(-t.amount_cents)");
    expect(sql).toContain("GROUP BY a.id");
    expect(sql).toContain("t.amount_cents < 0");
    expect(sql).toContain("c.kind = 'expense'");
  });

  it("scopes to a single account when accountId is provided", async () => {
    mockDbInstance.execute.mockResolvedValue({ rows: [] });

    const range: MonthRange = { start: 1000, end: 2000 };
    await getExpenseByAccount(range, "acc-1");

    const params = mockDbInstance.execute.mock.calls[0][1] as (
      string | number
    )[];
    expect(params).toContain(1000);
    expect(params).toContain(2000);
    expect(params).toContain("acc-1");
  });
});

describe("getIncomeByAccount", () => {
  it("returns income totals grouped by account", async () => {
    mockDbInstance.execute.mockResolvedValue({
      rows: [
        {
          account_id: "acc-1",
          account_name: "BPI",
          account_logo_key: null,
          account_color_hex: "#C87B54",
          total_cents: 42000,
        },
      ],
    });

    const range: MonthRange = { start: 1000, end: 2000 };
    const slices = await getIncomeByAccount(range);

    expect(slices).toHaveLength(1);
    expect(slices[0]).toEqual({
      accountId: "acc-1",
      accountName: "BPI",
      accountLogoKey: null,
      accountColorHex: "#C87B54",
      amountCents: 42000,
    });

    const sql = mockDbInstance.execute.mock.calls[0][0] as string;
    expect(sql).toContain("SUM(t.amount_cents)");
    expect(sql).toContain("t.amount_cents > 0");
    expect(sql).toContain("c.kind = 'income'");
  });

  it("scopes to a single account when accountId is provided", async () => {
    mockDbInstance.execute.mockResolvedValue({ rows: [] });

    const range: MonthRange = { start: 1000, end: 2000 };
    await getIncomeByAccount(range, "acc-1");

    const params = mockDbInstance.execute.mock.calls[0][1] as (
      string | number
    )[];
    expect(params).toContain("acc-1");
  });
});

describe("getDailyTotals", () => {
  it("excludes loan-payment rows from both expense and income totals", async () => {
    mockDbInstance.execute.mockResolvedValue({
      rows: [
        {
          day: "2026-08-01",
          kind: "expense",
          total: 1500,
        },
        {
          day: "2026-08-01",
          kind: "income",
          total: 9000,
        },
        {
          day: "2026-08-01",
          kind: "loan-payment",
          total: 12000,
        },
      ],
    });

    const range: MonthRange = {
      start: new Date(2026, 7, 1).getTime(),
      end: new Date(2026, 8, 1).getTime(),
    };
    const totals = await getDailyTotals(range);

    const day = totals.find((t) => t.dayStartEpochMs === range.start);
    expect(day).toBeDefined();
    expect(day!.expenseCents).toBe(1500);
    expect(day!.incomeCents).toBe(9000);
  });
});
