/**
 * Tests for src/lib/db/repositories/accounts.ts
 *
 * Uses the mocked @op-engineering/op-sqlite from setup.ts.
 * The mock returns a db instance where execute() is a jest.fn().
 */

import { mockDbInstance } from "@/__tests__/setup";
import {
  insertAccount,
  listAccountsWithBalances,
  getAccountById,
  updateAccount,
} from "@/lib/db/repositories/accounts";

// Helper to reset the mock before each test
beforeEach(() => {
  jest.clearAllMocks();
});

describe("insertAccount", () => {
  it("executes INSERT with correct parameters", async () => {
    mockDbInstance.execute.mockResolvedValue({ rows: [] });

    const id = await insertAccount({
      name: "BPI Savings",
      type: "savings",
      colorHex: "#C87B54",
      logoKey: "bank/bpi.png",
      startingBalanceCents: 100000,
    });

    expect(id).toBeTruthy();
    expect(typeof id).toBe("string");
    expect(mockDbInstance.execute).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO accounts"),
      expect.arrayContaining([
        id,
        "BPI Savings",
        "savings",
        100000,
        "bank/bpi.png",
        "#C87B54",
      ]),
    );
  });

  it("handles null logoKey", async () => {
    mockDbInstance.execute.mockResolvedValue({ rows: [] });

    await insertAccount({
      name: "Cash",
      type: "cash",
      colorHex: "#7FA06B",
      logoKey: null,
      startingBalanceCents: 0,
    });

    const params = mockDbInstance.execute.mock.calls[0][1];
    expect(params).toContain(null);
  });
});

describe("listAccountsWithBalances", () => {
  it("returns mapped account rows with computed balances", async () => {
    mockDbInstance.execute.mockResolvedValue({
      rows: [
        {
          id: "acc-1",
          name: "BPI Savings",
          type: "savings",
          color_hex: "#C87B54",
          logo_key: null,
          balance_cents: 150000,
        },
        {
          id: "acc-2",
          name: "Credit Card",
          type: "credit",
          color_hex: "#D48FB8",
          logo_key: "bank/bpi.png",
          balance_cents: -5000,
        },
      ],
    });

    const accounts = await listAccountsWithBalances();
    expect(accounts).toHaveLength(2);
    expect(accounts[0]).toEqual({
      id: "acc-1",
      name: "BPI Savings",
      type: "savings",
      colorHex: "#C87B54",
      logoKey: null,
      balanceCents: 150000,
    });
    expect(accounts[1]).toEqual({
      id: "acc-2",
      name: "Credit Card",
      type: "credit",
      colorHex: "#D48FB8",
      logoKey: "bank/bpi.png",
      balanceCents: -5000,
    });
  });
});

describe("getAccountById", () => {
  it("returns a single account when found", async () => {
    mockDbInstance.execute.mockResolvedValue({
      rows: [
        {
          id: "acc-1",
          name: "BPI Savings",
          type: "savings",
          starting_balance: 100000,
          color_hex: "#C87B54",
          logo_key: null,
        },
      ],
    });

    const account = await getAccountById("acc-1");
    expect(account).not.toBeNull();
    expect(account!.name).toBe("BPI Savings");
    expect(account!.type).toBe("savings");
  });

  it("returns null when account not found", async () => {
    mockDbInstance.execute.mockResolvedValue({ rows: [] });

    const account = await getAccountById("nonexistent");
    expect(account).toBeNull();
  });

  it("queries with correct WHERE clause", async () => {
    mockDbInstance.execute.mockResolvedValue({ rows: [] });

    await getAccountById("acc-42");
    expect(mockDbInstance.execute).toHaveBeenCalledWith(
      expect.stringContaining("WHERE id = ?"),
      ["acc-42"],
    );
  });
});

describe("updateAccount", () => {
  it("executes UPDATE with correct parameters", async () => {
    mockDbInstance.execute.mockResolvedValue({ rows: [] });

    await updateAccount({
      id: "acc-1",
      name: "BPI Savings Updated",
      type: "checking",
      colorHex: "#6B8D58",
      logoKey: "bank/metrobank.png",
    });

    expect(mockDbInstance.execute).toHaveBeenCalledWith(
      expect.stringContaining("UPDATE accounts"),
      expect.arrayContaining([
        "BPI Savings Updated",
        "checking",
        "#6B8D58",
        "bank/metrobank.png",
        "acc-1",
      ]),
    );
  });

  it("handles null logoKey on update", async () => {
    mockDbInstance.execute.mockResolvedValue({ rows: [] });

    await updateAccount({
      id: "acc-1",
      name: "Cash",
      type: "cash",
      colorHex: "#7FA06B",
      logoKey: null,
    });

    const params = mockDbInstance.execute.mock.calls[0][1];
    expect(params).toContain(null);
  });
});
