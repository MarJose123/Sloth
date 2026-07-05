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

/**
 * Most recent transactions, newest first, optionally scoped to a single
 * account. Category fields are nullable since a transaction's category can
 * be left unset or later archived.
 */
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
