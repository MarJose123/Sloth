import { getDb } from "../client";

export interface CategorySpend {
  id: string;
  name: string;
  icon: string;
  colorHex: string;
  /** Sum of |amount_cents| for this category in the given range. */
  spendCents: number;
  transactionCount: number;
}

export interface MonthRange {
  /** Inclusive start of the range, epoch ms. */
  start: number;
  /** Exclusive end of the range, epoch ms. */
  end: number;
}

interface CategorySpendRow {
  id: string;
  name: string;
  icon: string;
  color_hex: string;
  spend_cents: number | string;
  transaction_count: number | string;
}

/** The current calendar month, in the device's local timezone. */
export function currentMonthRange(reference: Date = new Date()): MonthRange {
  const start = new Date(
    reference.getFullYear(),
    reference.getMonth(),
    1,
  ).getTime();
  const end = new Date(
    reference.getFullYear(),
    reference.getMonth() + 1,
    1,
  ).getTime();
  return { start, end };
}

/**
 * Top expense categories by spend within `range`, optionally scoped to a
 * single account. Income categories are excluded — this powers the
 * dashboard's spend rings, not a full ledger view.
 */
export async function listTopExpenseCategories(
  range: MonthRange,
  limit = 3,
  accountId?: string,
): Promise<CategorySpend[]> {
  const db = await getDb();
  const params: (string | number)[] = [range.start, range.end];
  const accountClause = accountId ? "AND t.account_id = ?" : "";
  if (accountId) params.push(accountId);
  params.push(limit);

  const { rows } = await db.execute(
    `SELECT c.id, c.name, c.icon, c.color_hex,
                SUM(ABS(t.amount_cents)) AS spend_cents,
                COUNT(*) AS transaction_count
         FROM transactions t
         JOIN categories c ON c.id = t.category_id
         WHERE c.kind = 'expense'
           AND t.occurred_at >= ? AND t.occurred_at < ?
           ${accountClause}
         GROUP BY c.id
         ORDER BY spend_cents DESC
         LIMIT ?;`,
    params,
  );

  return (rows as unknown as CategorySpendRow[]).map((row) => ({
    id: row.id,
    name: row.name,
    icon: row.icon,
    colorHex: row.color_hex,
    spendCents: Number(row.spend_cents),
    transactionCount: Number(row.transaction_count),
  }));
}

/** Total expense spend within `range`, used as the denominator for share-of-spend rings. */
export async function getTotalExpenseCents(
  range: MonthRange,
  accountId?: string,
): Promise<number> {
  const db = await getDb();
  const params: (string | number)[] = [range.start, range.end];
  const accountClause = accountId ? "AND t.account_id = ?" : "";
  if (accountId) params.push(accountId);

  const { rows } = await db.execute(
    `SELECT IFNULL(SUM(ABS(t.amount_cents)), 0) AS total
         FROM transactions t
         JOIN categories c ON c.id = t.category_id
         WHERE c.kind = 'expense'
           AND t.occurred_at >= ? AND t.occurred_at < ?
           ${accountClause};`,
    params,
  );

  const total =
    (rows as unknown as { total: number | string }[])[0]?.total ?? 0;
  return Number(total);
}
