import * as ExpoCrypto from "expo-crypto";
import { getDb } from "../client";

export type CategoryKind = "expense" | "income";

export interface RecentTransaction {
  id: string;
  merchant: string;
  amountCents: number;
  occurredAt: number;
  accountId: string;
  categoryName: string | null;
  categoryIcon: string | null;
  categoryKind: CategoryKind | null;
}

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

export interface InsertTransactionInput {
  accountId: string;
  categoryId: string | null;
  merchant: string;
  /**
   * Signed cents — negative = expense, positive = income.
   * The caller is responsible for applying the correct sign before passing
   * this value; the repository stores it as-is.
   */
  amountCents: number;
  occurredAt: number;
  note?: string;
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

  await db.execute(
    `INSERT INTO transactions
       (id, account_id, category_id, merchant, amount_cents, occurred_at, note, source, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'manual', ?);`,
    [
      id,
      input.accountId,
      input.categoryId ?? null,
      input.merchant.trim(),
      input.amountCents,
      input.occurredAt,
      input.note?.trim() ?? null,
      now,
    ],
  );

  return id;
}
