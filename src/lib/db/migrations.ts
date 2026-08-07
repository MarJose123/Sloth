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

import type { DB, Transaction } from "@op-engineering/op-sqlite";
import { SCHEMA_STATEMENTS } from "./schema";

interface Migration {
  version: number;
  statements?: readonly string[];
  /** Alternative to statements for migrations needing runtime logic. */
  apply?: (tx: Transaction) => Promise<void>;
}

// Append new migrations here; never mutate a previously-shipped entry.
const MIGRATIONS: readonly Migration[] = [
  { version: 1, statements: SCHEMA_STATEMENTS },
  {
    version: 2,
    statements: [
      // Make category_id NOT NULL.  SQLite cannot ALTER a column constraint,
      // so we recreate the table and copy existing rows, setting any null
      // category_id to the first available expense category or leaving as
      // NULL and letting the app handle it on next edit.
      `CREATE TABLE transactions_new (
        id TEXT PRIMARY KEY NOT NULL,
        account_id TEXT NOT NULL REFERENCES accounts(id),
        category_id TEXT NOT NULL REFERENCES categories(id),
        merchant TEXT NOT NULL,
        amount_cents INTEGER NOT NULL,
        occurred_at INTEGER NOT NULL,
        note TEXT,
        source TEXT NOT NULL CHECK (source IN ('manual','scan','import')),
        created_at INTEGER NOT NULL
      ) STRICT;`,
      `INSERT INTO transactions_new (id, account_id, category_id, merchant, amount_cents, occurred_at, note, source, created_at)
       SELECT t.id, t.account_id, COALESCE(t.category_id, (SELECT c.id FROM categories c WHERE c.kind = 'expense' LIMIT 1), ''), t.merchant, t.amount_cents, t.occurred_at, t.note, t.source, t.created_at
       FROM transactions t;`,
      `DROP TABLE transactions;`,
      `ALTER TABLE transactions_new RENAME TO transactions;`,
      `CREATE INDEX IF NOT EXISTS idx_transactions_account ON transactions(account_id);`,
      `CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);`,
      `CREATE INDEX IF NOT EXISTS idx_transactions_occurred_at ON transactions(occurred_at);`,
    ],
  },
  {
    version: 3,
    statements: [
      // Account types changed from checking/savings/credit/cash to
      // wallet/savings/credit/investment.  SQLite cannot ALTER a CHECK
      // constraint, so we recreate the table, mapping the old generic
      // types (checking, cash) onto the new "wallet" type.
      `CREATE TABLE accounts_new (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('wallet','savings','credit','investment')),
        starting_balance INTEGER NOT NULL DEFAULT 0,
        logo_key TEXT,
        color_hex TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        archived_at INTEGER
      ) STRICT;`,
      `INSERT INTO accounts_new (id, name, type, starting_balance, logo_key, color_hex, created_at, archived_at)
       SELECT id, name,
              CASE type WHEN 'checking' THEN 'wallet' WHEN 'cash' THEN 'wallet' ELSE type END,
              starting_balance, logo_key, color_hex, created_at, archived_at
       FROM accounts;`,
      `DROP TABLE accounts;`,
      `ALTER TABLE accounts_new RENAME TO accounts;`,
    ],
  },
  {
    version: 4,
    statements: [
      // Add the "loan" and "time-deposit" account types plus time-deposit
      // detail columns.  SQLite cannot ALTER a CHECK constraint, so we
      // recreate the accounts table with the widened CHECK and the new
      // nullable columns.  Existing rows are copied verbatim; the detail
      // columns default to NULL for pre-existing accounts.
      `CREATE TABLE accounts_new (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('wallet','savings','credit','investment','loan','time-deposit')),
        starting_balance INTEGER NOT NULL DEFAULT 0,
        logo_key TEXT,
        color_hex TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        archived_at INTEGER,
        interest_rate_bps INTEGER,
        placement_term_months INTEGER,
        interest_payout TEXT CHECK (interest_payout IN ('monthly','quarterly','semi-annual','annual','maturity')),
        note TEXT
      ) STRICT;`,
      `INSERT INTO accounts_new (id, name, type, starting_balance, logo_key, color_hex, created_at, archived_at)
       SELECT id, name, type, starting_balance, logo_key, color_hex, created_at, archived_at
       FROM accounts;`,
      `DROP TABLE accounts;`,
      `ALTER TABLE accounts_new RENAME TO accounts;`,
    ],
  },
  {
    version: 6,
    // Dev builds shipped versions 4 and 5 with accounts tables that lack the
    // time-deposit detail columns, and the merged v4 above cannot re-run for
    // installs already past it (user_version >= 4). SQLite has no
    // "ADD COLUMN IF NOT EXISTS", so add any missing columns idempotently.
    apply: async (tx) => {
      const { rows } = await tx.execute("PRAGMA table_info(accounts);");
      const existing = new Set(
        (rows as unknown as { name: string }[]).map((r) => r.name),
      );
      const columns: { name: string; ddl: string }[] = [
        { name: "interest_rate_bps", ddl: "interest_rate_bps INTEGER" },
        {
          name: "placement_term_months",
          ddl: "placement_term_months INTEGER",
        },
        {
          name: "interest_payout",
          ddl: "interest_payout TEXT CHECK (interest_payout IN ('monthly','quarterly','semi-annual','annual','maturity'))",
        },
        { name: "note", ddl: "note TEXT" },
      ];
      for (const column of columns) {
        if (!existing.has(column.name)) {
          await tx.execute(`ALTER TABLE accounts ADD COLUMN ${column.ddl};`);
        }
      }
    },
  },
  {
    version: 7,
    statements: [
      // v6 added the detail columns but ALTER TABLE ADD COLUMN cannot change
      // the accounts CHECK constraint, so installs that ran the old v4/v5
      // still reject type 'time-deposit' on INSERT.  Rebuild the table with
      // the final CHECK and all detail columns; v6 guarantees the source
      // columns exist by this point.
      `CREATE TABLE accounts_new (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('wallet','savings','credit','investment','loan','time-deposit')),
        starting_balance INTEGER NOT NULL DEFAULT 0,
        logo_key TEXT,
        color_hex TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        archived_at INTEGER,
        interest_rate_bps INTEGER,
        placement_term_months INTEGER,
        interest_payout TEXT CHECK (interest_payout IN ('monthly','quarterly','semi-annual','annual','maturity')),
        note TEXT
      ) STRICT;`,
      `INSERT INTO accounts_new (id, name, type, starting_balance, logo_key, color_hex, created_at, archived_at,
                                 interest_rate_bps, placement_term_months, interest_payout, note)
       SELECT id, name, type, starting_balance, logo_key, color_hex, created_at, archived_at,
              interest_rate_bps, placement_term_months, interest_payout, note
       FROM accounts;`,
      `DROP TABLE accounts;`,
      `ALTER TABLE accounts_new RENAME TO accounts;`,
    ],
  },
  {
    version: 8,
    statements: [
      // Add the "loan-payment" category kind (used to reduce a loan balance).
      // SQLite cannot ALTER a CHECK constraint, so rebuild the categories
      // table with the widened CHECK.  Existing rows are copied verbatim.
      `CREATE TABLE categories_new (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        icon TEXT NOT NULL,
        color_hex TEXT NOT NULL,
        kind TEXT NOT NULL CHECK (kind IN ('expense','income','loan-payment')),
        created_at INTEGER NOT NULL,
        archived_at INTEGER
      ) STRICT;`,
      `INSERT INTO categories_new (id, name, icon, color_hex, kind, created_at, archived_at)
       SELECT id, name, icon, color_hex, kind, created_at, archived_at
       FROM categories;`,
      `DROP TABLE categories;`,
      `ALTER TABLE categories_new RENAME TO categories;`,
    ],
  },
];

export async function runMigrations(db: DB): Promise<void> {
  const { rows } = await db.execute("PRAGMA user_version;");
  const currentVersion = Number(rows[0]?.user_version ?? 0);

  const pending = MIGRATIONS.filter((m) => m.version > currentVersion).sort(
    (a, b) => a.version - b.version,
  );

  for (const migration of pending) {
    await db.transaction(async (tx) => {
      if (migration.statements) {
        for (const statement of migration.statements) {
          await tx.execute(statement);
        }
      }
      if (migration.apply) {
        await migration.apply(tx);
      }
    });
    // PRAGMA writes can't run inside the transaction on all platforms reliably;
    // set it immediately after each migration commits.
    await db.execute(`PRAGMA user_version = ${migration.version};`);
  }
}
