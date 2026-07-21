/**
 * Tests for src/lib/db/repositories/transactions.ts
 */

import type { MonthRange } from "@/types";
import { mockDbInstance } from "@/__tests__/setup";
import {
  deleteTransaction,
  insertTransaction,
  listRecentTransactions,
  listAllTransactions,
} from "@/lib/db/repositories/transactions";

beforeEach(() => {
  jest.clearAllMocks();
});

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
    expect(mockDbInstance.execute).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO transactions"),
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

    const params = mockDbInstance.execute.mock.calls[0][1];
    expect(params).toContain("manual");
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

    const params = mockDbInstance.execute.mock.calls[0][1];
    expect(params).toContain(null);
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
    const params = mockDbInstance.execute.mock.calls[0][1] as (string | number)[];

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
    const params = mockDbInstance.execute.mock.calls[0][1] as (string | number)[];

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
