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

export const SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
  ) STRICT;`,

  `CREATE TABLE IF NOT EXISTS accounts (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('checking','savings','credit','cash')),
    starting_balance INTEGER NOT NULL DEFAULT 0,
    logo_key TEXT,
    color_hex TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    archived_at INTEGER
  ) STRICT;`,

  `CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    icon TEXT NOT NULL,
    color_hex TEXT NOT NULL,
    kind TEXT NOT NULL CHECK (kind IN ('expense','income')),
    created_at INTEGER NOT NULL,
    archived_at INTEGER
  ) STRICT;`,

  `CREATE TABLE IF NOT EXISTS transactions (
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

  `CREATE INDEX IF NOT EXISTS idx_transactions_account
    ON transactions(account_id);`,

  `CREATE INDEX IF NOT EXISTS idx_transactions_category
    ON transactions(category_id);`,

  `CREATE INDEX IF NOT EXISTS idx_transactions_occurred_at
    ON transactions(occurred_at);`,
] as const;
