import * as ExpoCrypto from "expo-crypto";
import { getDb } from "../client";

export type CategoryKind = "expense" | "income";

/** A bare category row — used by the Add Transaction picker. */
export interface Category {
  id: string;
  name: string;
  icon: string;
  colorHex: string;
  kind: CategoryKind;
}

export interface CategorySpend {
  id: string;
  name: string;
  icon: string;
  colorHex: string;
  kind: CategoryKind;
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

export interface InsertCategoryInput {
  name: string;
  icon: string;
  colorHex: string;
  kind: CategoryKind;
}

export interface UpdateCategoryInput {
  name: string;
  icon: string;
  colorHex: string;
  kind: CategoryKind;
}

interface CategoryRow {
  id: string;
  name: string;
  icon: string;
  color_hex: string;
  kind: CategoryKind;
}

interface CategorySpendRow {
  id: string;
  name: string;
  icon: string;
  color_hex: string;
  kind: CategoryKind;
  spend_cents: number | string;
  transaction_count: number | string;
}

/** The current calendar month in the device's local timezone. */
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
 * All non-archived categories ordered by kind then name.
 * Used to populate the category picker in the Add Transaction form.
 */
export async function listAllCategories(): Promise<Category[]> {
  const db = await getDb();

  const { rows } = await db.execute(
    `SELECT id, name, icon, color_hex, kind
       FROM categories
      WHERE archived_at IS NULL
      ORDER BY kind, name;`,
  );

  return (rows as unknown as CategoryRow[]).map((row) => ({
    id: row.id,
    name: row.name,
    icon: row.icon,
    colorHex: row.color_hex,
    kind: row.kind,
  }));
}

/**
 * Fetches a single category by id. Returns null if not found or archived.
 * Used by the category editor to pre-populate fields when editing.
 */
export async function getCategoryById(id: string): Promise<Category | null> {
  const db = await getDb();

  const { rows } = await db.execute(
    `SELECT id, name, icon, color_hex, kind
       FROM categories
      WHERE id = ? AND archived_at IS NULL;`,
    [id],
  );

  const row = (rows as unknown as CategoryRow[])[0];
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    icon: row.icon,
    colorHex: row.color_hex,
    kind: row.kind,
  };
}

/**
 * All categories (both expense and income) with their spend and transaction
 * count for `range`, optionally scoped to one account. Categories with no
 * transactions in range return 0 spend — they are NOT excluded.
 * Used by the Categories management screen (Screen 08).
 *
 * Note: The date range is in the JOIN's ON clause, not WHERE, so that
 * categories with no matching transactions still appear (LEFT JOIN behavior).
 */
export async function listAllCategoriesWithSpend(
  range: MonthRange,
  accountId?: string,
): Promise<CategorySpend[]> {
  const db = await getDb();
  const params: (string | number)[] = [range.start, range.end];
  const accountClause = accountId ? "AND t.account_id = ?" : "";
  if (accountId) params.push(accountId);

  const { rows } = await db.execute(
    `SELECT c.id, c.name, c.icon, c.color_hex, c.kind,
                IFNULL(SUM(ABS(t.amount_cents)), 0) AS spend_cents,
                COUNT(t.id)                          AS transaction_count
         FROM categories c
         LEFT JOIN transactions t
                ON t.category_id = c.id
               AND t.occurred_at >= ?
               AND t.occurred_at < ?
               ${accountClause}
         WHERE c.archived_at IS NULL
         GROUP BY c.id
         ORDER BY c.kind ASC, spend_cents DESC, c.name ASC;`,
    params,
  );

  return (rows as unknown as CategorySpendRow[]).map((row) => ({
    id: row.id,
    name: row.name,
    icon: row.icon,
    colorHex: row.color_hex,
    kind: row.kind,
    spendCents: Number(row.spend_cents),
    transactionCount: Number(row.transaction_count),
  }));
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
    `SELECT c.id, c.name, c.icon, c.color_hex, c.kind,
                SUM(ABS(t.amount_cents)) AS spend_cents,
                COUNT(*)                 AS transaction_count
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
    kind: row.kind,
    spendCents: Number(row.spend_cents),
    transactionCount: Number(row.transaction_count),
  }));
}

/** Total expense spend within `range`, used as the ring denominator on the dashboard. */
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

/**
 * Inserts a new category and returns its generated id.
 */
export async function insertCategory(
  input: InsertCategoryInput,
): Promise<string> {
  const db = await getDb();
  const id = ExpoCrypto.randomUUID();
  const now = Date.now();

  await db.execute(
    `INSERT INTO categories (id, name, icon, color_hex, kind, created_at)
     VALUES (?, ?, ?, ?, ?, ?);`,
    [id, input.name.trim(), input.icon, input.colorHex, input.kind, now],
  );

  return id;
}

/**
 * Updates a category's mutable fields.
 * The WHERE guard ensures archived categories cannot be mutated.
 */
export async function updateCategory(
  id: string,
  input: UpdateCategoryInput,
): Promise<void> {
  const db = await getDb();

  await db.execute(
    `UPDATE categories
        SET name      = ?,
            icon      = ?,
            color_hex = ?,
            kind      = ?
      WHERE id = ? AND archived_at IS NULL;`,
    [input.name.trim(), input.icon, input.colorHex, input.kind, id],
  );
}
