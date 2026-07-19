import type { DB } from "@op-engineering/op-sqlite";
import { SCHEMA_STATEMENTS } from "./schema";

interface Migration {
  version: number;
  statements: readonly string[];
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
];

export async function runMigrations(db: DB): Promise<void> {
  const { rows } = await db.execute("PRAGMA user_version;");
  const currentVersion = Number(rows[0]?.user_version ?? 0);

  const pending = MIGRATIONS.filter((m) => m.version > currentVersion).sort(
    (a, b) => a.version - b.version,
  );

  for (const migration of pending) {
    await db.transaction(async (tx) => {
      for (const statement of migration.statements) {
        await tx.execute(statement);
      }
    });
    // PRAGMA writes can't run inside the transaction on all platforms reliably;
    // set it immediately after each migration commits.
    await db.execute(`PRAGMA user_version = ${migration.version};`);
  }
}
