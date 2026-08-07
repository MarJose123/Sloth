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
      name: "Wallet",
      type: "wallet",
      colorHex: "#7FA06B",
      logoKey: null,
      startingBalanceCents: 0,
    });

    const params = mockDbInstance.execute.mock.calls[0][1];
    expect(params).toContain(null);
  });

  it("stores loan starting balance as negative (liability convention)", async () => {
    mockDbInstance.execute.mockResolvedValue({ rows: [] });

    await insertAccount({
      name: "Car Loan",
      type: "loan",
      colorHex: "#C87B54",
      logoKey: null,
      startingBalanceCents: 500000,
    });

    const params = mockDbInstance.execute.mock.calls[0][1];
    expect(params).toContain("loan");
    expect(params).toContain(-500000);
  });

  it("does not negate non-loan starting balances", async () => {
    mockDbInstance.execute.mockResolvedValue({ rows: [] });

    await insertAccount({
      name: "Credit Card",
      type: "credit",
      colorHex: "#D48FB8",
      logoKey: null,
      startingBalanceCents: -25000,
    });

    const params = mockDbInstance.execute.mock.calls[0][1];
    expect(params).toContain(-25000);
  });

  it("keeps time-deposit starting balance positive (asset type)", async () => {
    mockDbInstance.execute.mockResolvedValue({ rows: [] });

    await insertAccount({
      name: "TD 6 Months",
      type: "time-deposit",
      colorHex: "#6B8D58",
      logoKey: null,
      startingBalanceCents: 250000,
    });

    const params = mockDbInstance.execute.mock.calls[0][1];
    expect(params).toContain("time-deposit");
    expect(params).toContain(250000);
    expect(params).not.toContain(-250000);
  });

  it("stores time-deposit details for time-deposit accounts", async () => {
    mockDbInstance.execute.mockResolvedValue({ rows: [] });

    await insertAccount({
      name: "TD 1 Year",
      type: "time-deposit",
      colorHex: "#6B8D58",
      logoKey: null,
      startingBalanceCents: 100000,
      timeDeposit: {
        interestRateBps: 350,
        placementTermMonths: 12,
        interestPayout: "quarterly",
        note: "Rollover",
      },
    });

    const params = mockDbInstance.execute.mock.calls[0][1];
    expect(params).toEqual(
      expect.arrayContaining([350, 12, "quarterly", "Rollover"]),
    );
  });

  it("stores NULL time-deposit details for other account types", async () => {
    mockDbInstance.execute.mockResolvedValue({ rows: [] });

    await insertAccount({
      name: "Savings",
      type: "savings",
      colorHex: "#7FA06B",
      logoKey: null,
      startingBalanceCents: 0,
    });

    const params = mockDbInstance.execute.mock.calls[0][1];
    expect(params).toEqual(expect.arrayContaining([null, null, null, null]));
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
        {
          id: "acc-3",
          name: "TD 6 Months",
          type: "time-deposit",
          color_hex: "#6B8D58",
          logo_key: null,
          balance_cents: 250000,
          interest_rate_bps: 350,
          placement_term_months: 6,
          interest_payout: "maturity",
          note: "Branch 42",
        },
      ],
    });

    const accounts = await listAccountsWithBalances();
    expect(accounts).toHaveLength(3);
    expect(accounts[0]).toEqual({
      id: "acc-1",
      name: "BPI Savings",
      type: "savings",
      colorHex: "#C87B54",
      logoKey: null,
      balanceCents: 150000,
      interestRateBps: null,
      placementTermMonths: null,
      interestPayout: null,
      note: null,
    });
    expect(accounts[1]).toEqual({
      id: "acc-2",
      name: "Credit Card",
      type: "credit",
      colorHex: "#D48FB8",
      logoKey: "bank/bpi.png",
      balanceCents: -5000,
      interestRateBps: null,
      placementTermMonths: null,
      interestPayout: null,
      note: null,
    });
    expect(accounts[2]).toEqual({
      id: "acc-3",
      name: "TD 6 Months",
      type: "time-deposit",
      colorHex: "#6B8D58",
      logoKey: null,
      balanceCents: 250000,
      interestRateBps: 350,
      placementTermMonths: 6,
      interestPayout: "maturity",
      note: "Branch 42",
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

  it("returns time-deposit detail fields", async () => {
    mockDbInstance.execute.mockResolvedValue({
      rows: [
        {
          id: "acc-1",
          name: "TD 1 Year",
          type: "time-deposit",
          starting_balance: 100000,
          color_hex: "#6B8D58",
          logo_key: null,
          interest_rate_bps: 350,
          placement_term_months: 12,
          interest_payout: "quarterly",
          note: "Rollover",
        },
      ],
    });

    const account = await getAccountById("acc-1");
    expect(account).not.toBeNull();
    expect(account!.interestRateBps).toBe(350);
    expect(account!.placementTermMonths).toBe(12);
    expect(account!.interestPayout).toBe("quarterly");
    expect(account!.note).toBe("Rollover");
  });
});

describe("updateAccount", () => {
  it("executes UPDATE with correct parameters", async () => {
    mockDbInstance.execute.mockResolvedValue({ rows: [] });

    await updateAccount({
      id: "acc-1",
      name: "BPI Savings Updated",
      type: "wallet",
      colorHex: "#6B8D58",
      logoKey: "bank/metrobank.png",
    });

    expect(mockDbInstance.execute).toHaveBeenCalledWith(
      expect.stringContaining("UPDATE accounts"),
      expect.arrayContaining([
        "BPI Savings Updated",
        "wallet",
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
      name: "Wallet",
      type: "wallet",
      colorHex: "#7FA06B",
      logoKey: null,
    });

    const params = mockDbInstance.execute.mock.calls[0][1];
    expect(params).toContain(null);
  });

  it("negates the stored balance when the type changes to loan", async () => {
    mockDbInstance.execute.mockResolvedValue({ rows: [] });

    await updateAccount({
      id: "acc-1",
      name: "Home Loan",
      type: "loan",
      colorHex: "#C87B54",
      logoKey: null,
    });

    const [sql, params] = mockDbInstance.execute.mock.calls[0];
    expect(sql).toContain("starting_balance = CASE");
    expect(sql).toContain("WHEN ? = 'loan' THEN -ABS(starting_balance)");
    // The type is bound three times: the type column + the two CASE branches.
    expect(params.filter((p: unknown) => p === "loan")).toHaveLength(3);
  });

  it("restores a positive balance when converting away from loan", async () => {
    mockDbInstance.execute.mockResolvedValue({ rows: [] });

    await updateAccount({
      id: "acc-1",
      name: "Now Savings",
      type: "savings",
      colorHex: "#7FA06B",
      logoKey: null,
    });

    const [sql, params] = mockDbInstance.execute.mock.calls[0];
    expect(sql).toContain(
      "WHEN ? <> 'loan' AND type = 'loan' THEN ABS(starting_balance)",
    );
    expect(params.filter((p: unknown) => p === "savings")).toHaveLength(3);
  });

  it("writes time-deposit details when updating a time deposit", async () => {
    mockDbInstance.execute.mockResolvedValue({ rows: [] });

    await updateAccount({
      id: "acc-1",
      name: "TD 2 Years",
      type: "time-deposit",
      colorHex: "#6B8D58",
      logoKey: null,
      timeDeposit: {
        interestRateBps: 300,
        placementTermMonths: 24,
        interestPayout: "annual",
        note: "Branch 7",
      },
    });

    const params = mockDbInstance.execute.mock.calls[0][1];
    expect(params).toEqual(
      expect.arrayContaining([300, 24, "annual", "Branch 7"]),
    );
  });

  it("clears time-deposit details when the type is no longer a time deposit", async () => {
    mockDbInstance.execute.mockResolvedValue({ rows: [] });

    await updateAccount({
      id: "acc-1",
      name: "Now Savings",
      type: "savings",
      colorHex: "#7FA06B",
      logoKey: null,
    });

    const params = mockDbInstance.execute.mock.calls[0][1];
    expect(params).toEqual(expect.arrayContaining([null, null, null, null]));
  });
});
