import * as ExpoCrypto from "expo-crypto";
import { getDb } from "../client";
import type {
  RecentTransaction,
  TransactionLedgerItem,
  InsertTransactionInput,
} from "@/types";

// ─── types ────────────────────────────────────────────────────────────────────

// ─── row shapes (internal) ────────────────────────────────────────────────────

interface RecentTransactionRow {
  id: string;
  merchant: string;
  amount_cents: number | string;
  occurred_at: number | string;
  account_id: string;
  category_name: string | null;
  category_icon: string | null;
  category_kind: CategoryKind | null;
}

interface TransactionLedgerRow {
  id: string;
  merchant: string;
  amount_cents: number | string;
  occurred_at: number | string;
  account_id: string;
  account_name: string;
  category_name: string | null;
  category_icon: string | null;
  category_kind: CategoryKind | null;
  note: string | null;
  source: "manual" | "scan" | "import";
}

// ─── queries ──────────────────────────────────────────────────────────────────

export async function listRecentTransactions(
  limit = 5,
  accountId?: string,
): Promise<RecentTransaction[]> {
  const db = await getDb();
  const params: (string | number)[] = [];
  const whereClause = accountId ? "WHERE t.account_id = ?" : "";
  if (accountId) params.push(accountId);
  params.push(limit);

  const { rows } = await db.execute(
    `SELECT t.id, t.merchant, t.amount_cents, t.occurred_at, t.account_id,
            c.name AS category_name, c.icon AS category_icon, c.kind AS category_kind
     FROM transactions t
     LEFT JOIN categories c ON c.id = t.category_id
     ${whereClause}
     ORDER BY t.occurred_at DESC
     LIMIT ?;`,
    params,
  );

  return (rows as unknown as RecentTransactionRow[]).map((row) => ({
    id: row.id,
    merchant: row.merchant,
    amountCents: Number(row.amount_cents),
    occurredAt: Number(row.occurred_at),
    accountId: row.account_id,
    categoryName: row.category_name ?? null,
    categoryIcon: row.category_icon ?? null,
    categoryKind: row.category_kind ?? null,
  }));
}

/**
 * Full transaction ledger with account name and note, ordered newest-first.
 * Scoped to a single account when `accountId` is provided.
 * `limit` defaults to 500 — sufficient for a personal finance app without
 * pagination complexity. Raise if needed.
 */
export async function listAllTransactions(
  limit = 500,
  accountId?: string,
): Promise<TransactionLedgerItem[]> {
  const db = await getDb();
  const params: (string | number)[] = [];
  const whereClause = accountId ? "WHERE t.account_id = ?" : "";
  if (accountId) params.push(accountId);
  params.push(limit);

  const { rows } = await db.execute(
    `SELECT t.id, t.merchant, t.amount_cents, t.occurred_at, t.account_id,
            a.name  AS account_name,
            c.name  AS category_name,
            c.icon  AS category_icon,
            c.kind  AS category_kind,
            t.note,
            t.source
     FROM transactions t
     JOIN  accounts a    ON a.id = t.account_id
     LEFT JOIN categories c ON c.id = t.category_id
     ${whereClause}
     ORDER BY t.occurred_at DESC
     LIMIT ?;`,
    params,
  );

  return (rows as unknown as TransactionLedgerRow[]).map((row) => ({
    id: row.id,
    merchant: row.merchant,
    amountCents: Number(row.amount_cents),
    occurredAt: Number(row.occurred_at),
    accountId: row.account_id,
    accountName: row.account_name,
    categoryName: row.category_name ?? null,
    categoryIcon: row.category_icon ?? null,
    categoryKind: row.category_kind ?? null,
    note: row.note ?? null,
    source: row.source,
  }));
}

/**
 * Inserts a manually-entered transaction and returns the new row's id.
 * The source column is always set to 'manual' by this function.
 */
export async function insertTransaction(
  input: InsertTransactionInput,
): Promise<string> {
  const db = await getDb();
  const id = ExpoCrypto.randomUUID();
  const now = Date.now();
  const source = input.source ?? "manual";

  await db.execute(
    `INSERT INTO transactions
       (id, account_id, category_id, merchant, amount_cents, occurred_at, note, source, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      id,
      input.accountId,
      input.categoryId,
      input.merchant.trim(),
      input.amountCents,
      input.occurredAt,
      input.note?.trim() ?? null,
      source,
      now,
    ],
  );

  return id;
}
