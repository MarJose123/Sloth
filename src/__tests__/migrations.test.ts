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
 * Tests for src/lib/db/migrations.ts:
 *  - v6 recovery migration: adds the time-deposit detail columns to installs
 *    whose accounts table predates them (user_version 4/5 from dev builds).
 *  - v7 recovery migration: rebuilds the accounts table with the final CHECK
 *    (ALTER TABLE ADD COLUMN cannot change a CHECK constraint).
 */

import { mockDbInstance } from "@/__tests__/setup";
import { runMigrations } from "@/lib/db/migrations";
import type { DB } from "@op-engineering/op-sqlite";

/** Column names present in a pre-detail-columns accounts table. */
const STALE_COLUMNS = [
  "id",
  "name",
  "type",
  "starting_balance",
  "logo_key",
  "color_hex",
  "created_at",
  "archived_at",
];

const DETAIL_COLUMNS = [
  "interest_rate_bps",
  "placement_term_months",
  "interest_payout",
  "note",
];

beforeEach(() => {
  jest.clearAllMocks();
});

/** Drives runMigrations, returning every SQL statement executed (in order). */
async function runWithColumns(
  userVersion: number,
  existingColumns: string[],
): Promise<string[]> {
  const executed: string[] = [];

  mockDbInstance.execute.mockImplementation(async (sql: string) => {
    if (sql === "PRAGMA user_version;") {
      return { rows: [{ user_version: userVersion }] };
    }
    return { rows: [] };
  });

  mockDbInstance.transaction.mockImplementation(
    async (cb: (tx: { execute: jest.Mock }) => Promise<void>) => {
      const tx = {
        execute: jest.fn(async (sql: string) => {
          executed.push(sql);
          if (sql === "PRAGMA table_info(accounts);") {
            return { rows: existingColumns.map((name) => ({ name })) };
          }
          return { rows: [] };
        }),
      };
      await cb(tx);
    },
  );

  await runMigrations(mockDbInstance as unknown as DB);
  return executed;
}

const addColumnStatements = (executed: string[]) =>
  executed.filter((sql) => sql.startsWith("ALTER TABLE accounts ADD COLUMN"));

describe("migration v6 (time-deposit detail columns)", () => {
  it("adds the missing detail columns to a stale install at user_version 5", async () => {
    const executed = await runWithColumns(5, STALE_COLUMNS);

    const adds = addColumnStatements(executed);
    expect(adds).toHaveLength(DETAIL_COLUMNS.length);
    for (const name of DETAIL_COLUMNS) {
      expect(adds.some((sql) => sql.includes(name))).toBe(true);
    }
    // The CHECK constraint on interest_payout must survive the ALTER.
    expect(adds.find((sql) => sql.includes("interest_payout"))).toContain(
      "CHECK",
    );
  });

  it("adds the missing detail columns to a stale install at user_version 4", async () => {
    const executed = await runWithColumns(4, STALE_COLUMNS);
    expect(addColumnStatements(executed)).toHaveLength(DETAIL_COLUMNS.length);
  });

  it("is a no-op for v6 when the detail columns already exist", async () => {
    const executed = await runWithColumns(5, [
      ...STALE_COLUMNS,
      ...DETAIL_COLUMNS,
    ]);
    expect(addColumnStatements(executed)).toHaveLength(0);
  });
});

describe("migration v7 (accounts CHECK rebuild)", () => {
  it("rebuilds the accounts table with the final CHECK and detail columns", async () => {
    const executed = await runWithColumns(6, [
      ...STALE_COLUMNS,
      ...DETAIL_COLUMNS,
    ]);

    const create = executed.find((sql) =>
      sql.startsWith("CREATE TABLE accounts_new"),
    );
    expect(create).toBeDefined();
    expect(create).toContain("'time-deposit'");
    expect(create).toContain("interest_rate_bps");
    expect(create).toContain("note");

    const insert = executed.find((sql) =>
      sql.startsWith("INSERT INTO accounts_new"),
    );
    expect(insert).toBeDefined();
    expect(insert).toContain("interest_payout");

    expect(executed).toContain("DROP TABLE accounts;");
    expect(executed).toContain("ALTER TABLE accounts_new RENAME TO accounts;");
  });

  it("runs after v6 on a stale install (v6 adds columns, then v7 rebuilds)", async () => {
    const executed = await runWithColumns(5, STALE_COLUMNS);

    const firstAddIdx = executed.findIndex((sql) =>
      sql.startsWith("ALTER TABLE accounts ADD COLUMN"),
    );
    const createIdx = executed.findIndex((sql) =>
      sql.startsWith("CREATE TABLE accounts_new"),
    );
    expect(firstAddIdx).toBeGreaterThanOrEqual(0);
    expect(createIdx).toBeGreaterThan(firstAddIdx);
  });

  it("runs nothing when already at the latest user_version", async () => {
    const executed = await runWithColumns(8, STALE_COLUMNS);
    expect(executed).toHaveLength(0);
  });
});

describe("migration v8 (loan-payment category kind)", () => {
  it("rebuilds the categories table with the widened kind CHECK", async () => {
    const executed = await runWithColumns(7, STALE_COLUMNS);

    const create = executed.find((sql) =>
      sql.startsWith("CREATE TABLE categories_new"),
    );
    expect(create).toBeDefined();
    expect(create).toContain("'loan-payment'");
    expect(executed).toContain("DROP TABLE categories;");
    expect(executed).toContain(
      "ALTER TABLE categories_new RENAME TO categories;",
    );
  });
});
