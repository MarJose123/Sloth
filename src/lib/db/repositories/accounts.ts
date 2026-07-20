import * as ExpoCrypto from "expo-crypto";
import { getDb } from "../client";
import type {
  AccountType,
  AccountWithBalance,
  InsertAccountInput,
  UpdateAccountInput,
} from "@/types";

export type { AccountType };

interface AccountRow {
  id: string;
  name: string;
  type: AccountType;
  color_hex: string;
  logo_key: string | null;
  balance_cents: number | string;
}

interface AccountBaseRow {
  id: string;
  name: string;
  type: AccountType;
  starting_balance: number;
  color_hex: string;
  logo_key: string | null;
}

/**
 * Lists all non-archived accounts with their running balance computed from
 * starting_balance + the sum of their transactions. There is no cached
 * "balance" column by design — it's always derived so it can never drift.
 */
export async function listAccountsWithBalances(): Promise<
  AccountWithBalance[]
> {
  const db = await getDb();

  const { rows } = await db.execute(
    `SELECT a.id, a.name, a.type, a.color_hex, a.logo_key,
            a.starting_balance + IFNULL(SUM(t.amount_cents), 0) AS balance_cents
     FROM accounts a
              LEFT JOIN transactions t ON t.account_id = a.id
     WHERE a.archived_at IS NULL
     GROUP BY a.id
     ORDER BY a.created_at ASC;`,
  );

  return (rows as unknown as AccountRow[]).map((row) => ({
    id: row.id,
    name: row.name,
    type: row.type,
    colorHex: row.color_hex,
    logoKey: row.logo_key ?? null,
    balanceCents: Number(row.balance_cents),
  }));
}

/**
 * Inserts a new account and returns its generated id.
 * The balance is stored as `starting_balance`; the running balance is always
 * derived at query time (starting_balance + transaction sum).
 */
export async function insertAccount(
  input: InsertAccountInput,
): Promise<string> {
  const db = await getDb();
  const id = ExpoCrypto.randomUUID();
  const now = Date.now();

  await db.execute(
    `INSERT INTO accounts (id, name, type, starting_balance, logo_key, color_hex, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?);`,
    [
      id,
      input.name.trim(),
      input.type,
      input.startingBalanceCents,
      input.logoKey ?? null,
      input.colorHex,
      now,
    ],
  );

  return id;
}

/**
 * Fetches a single account by id (non-archived only).
 * Returns the raw account fields including starting_balance —
 * does NOT compute the running balance (use listAccountsWithBalances for that).
 */
export async function getAccountById(id: string): Promise<{
  id: string;
  name: string;
  type: AccountType;
  colorHex: string;
  logoKey: string | null;
} | null> {
  const db = await getDb();

  const { rows } = await db.execute(
    `SELECT id, name, type, starting_balance, color_hex, logo_key
     FROM accounts
     WHERE id = ? AND archived_at IS NULL
     LIMIT 1;`,
    [id],
  );

  const row = (rows as unknown as AccountBaseRow[])[0];
  if (!row) return null;

  return {
    id: row.id,
    name: row.name,
    type: row.type,
    colorHex: row.color_hex,
    logoKey: row.logo_key ?? null,
  };
}

export async function updateAccount(input: UpdateAccountInput): Promise<void> {
  const db = await getDb();
  await db.execute(
    `UPDATE accounts SET name = ?, type = ?, color_hex = ?, logo_key = ? WHERE id = ?;`,
    [
      input.name.trim(),
      input.type,
      input.colorHex,
      input.logoKey ?? null,
      input.id,
    ],
  );
}
