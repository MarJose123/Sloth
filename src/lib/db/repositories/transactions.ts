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

import * as ExpoCrypto from "expo-crypto";
import { getDb } from "../client";
import type {
  AccountAmountSlice,
  AccountType,
  DailyTotals,
  RecentTransaction,
  TransactionLedgerItem,
  InsertTransactionInput,
  CategoryKind,
  MonthRange,
} from "@/types";

// ─── types ────────────────────────────────────────────────────────────────────

// ─── row shapes (internal) ────────────────────────────────────────────────────

interface RecentTransactionRow {
  id: string;
  merchant: string;
  amount_cents: number | string;
  occurred_at: number | string;
  account_id: string;
  account_name: string;
  account_logo_key: string | null;
  account_color_hex: string;
  category_name: string | null;
  category_icon: string | null;
  category_kind: CategoryKind | null;
}

interface TransactionLedgerRow {
  id: string;
  merchant: string;
  amount_cents: number | string;
  occurred_at: number | string;
  created_at: number | string;
  account_id: string;
  account_name: string;
  category_name: string | null;
  category_icon: string | null;
  category_kind: CategoryKind | null;
  note: string | null;
  source: "manual" | "scan" | "import";
}

interface AccountAmountRow {
  account_id: string;
  account_name: string;
  account_logo_key: string | null;
  account_color_hex: string;
  total_cents: number | string;
}

// ─── queries ──────────────────────────────────────────────────────────────────

export async function listRecentTransactions(
  limit = 5,
  accountId?: string,
  range?: MonthRange,
): Promise<RecentTransaction[]> {
  const db = await getDb();
  const params: (string | number)[] = [];

  const conditions: string[] = [];
  if (accountId) {
    conditions.push("t.account_id = ?");
    params.push(accountId);
  }
  if (range) {
    conditions.push("t.occurred_at >= ?");
    conditions.push("t.occurred_at < ?");
    params.push(range.start, range.end);
  }

  const whereClause =
    conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";
  params.push(limit);

  const { rows } = await db.execute(
    `SELECT t.id, t.merchant, t.amount_cents, t.occurred_at, t.account_id,
            a.name AS account_name, a.logo_key AS account_logo_key,
            a.color_hex AS account_color_hex,
            c.name AS category_name, c.icon AS category_icon, c.kind AS category_kind
     FROM transactions t
     LEFT JOIN accounts a ON a.id = t.account_id
     LEFT JOIN categories c ON c.id = t.category_id
     ${whereClause}
     ORDER BY t.created_at DESC
     LIMIT ?;`,
    params,
  );

  return (rows as unknown as RecentTransactionRow[]).map((row) => ({
    id: row.id,
    merchant: row.merchant,
    amountCents: Number(row.amount_cents),
    occurredAt: Number(row.occurred_at),
    accountId: row.account_id,
    accountName: row.account_name,
    accountLogoKey: row.account_logo_key ?? null,
    accountColorHex: row.account_color_hex,
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
  range?: MonthRange,
): Promise<TransactionLedgerItem[]> {
  const db = await getDb();
  const params: (string | number)[] = [];

  const conditions: string[] = [];
  if (accountId) {
    conditions.push("t.account_id = ?");
    params.push(accountId);
  }
  if (range) {
    conditions.push("t.occurred_at >= ?");
    conditions.push("t.occurred_at < ?");
    params.push(range.start, range.end);
  }

  const whereClause =
    conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";
  params.push(limit);

  const { rows } = await db.execute(
    `SELECT t.id, t.merchant, t.amount_cents, t.occurred_at, t.created_at, t.account_id,
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
    createdAt: Number(row.created_at),
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

  // Account/category compatibility guard — protects every caller, including
  // the CSV/OFX import:
  //  - time-deposit accounts hold a locked placement: no expense transactions.
  //  - "loan-payment" categories only apply to loan accounts (they reduce the
  //    loan balance; the positive sign is applied by the caller).
  const [{ rows: accountRows }, { rows: categoryRows }] = await Promise.all([
    db.execute("SELECT type FROM accounts WHERE id = ?;", [input.accountId]),
    db.execute("SELECT kind FROM categories WHERE id = ?;", [input.categoryId]),
  ]);
  const accountType = (accountRows as unknown as { type: AccountType }[])[0]
    ?.type;
  const categoryKind = (categoryRows as unknown as { kind: CategoryKind }[])[0]
    ?.kind;
  if (accountType === "time-deposit" && categoryKind === "expense") {
    throw new Error("Time deposit accounts cannot have expense transactions");
  }
  if (categoryKind === "loan-payment" && accountType !== "loan") {
    throw new Error("Loan payment transactions require a loan account");
  }
  // Mirrors the picker: loan accounts record expenses (debt increases) or
  // loan-payments (debt decreases), never plain income.
  if (categoryKind === "income" && accountType === "loan") {
    throw new Error("Use a loan-payment category to reduce a loan balance");
  }

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

/**
 * Deletes a single transaction by id. No-op if the id does not exist.
 */
export async function deleteTransaction(id: string): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM transactions WHERE id = ?;", [id]);
}

/**
 * Daily expense/income totals for every day in `range` (local timezone),
 * zero-filled so days without transactions still appear.
 */
export async function getDailyTotals(
  range: MonthRange,
  accountId?: string,
): Promise<DailyTotals[]> {
  const db = await getDb();
  const params: (string | number)[] = [range.start, range.end];
  const accountClause = accountId ? "AND t.account_id = ?" : "";
  if (accountId) params.push(accountId);

  const { rows } = await db.execute(
    `SELECT strftime('%Y-%m-%d', t.occurred_at / 1000, 'unixepoch', 'localtime') AS day,
            c.kind,
            SUM(ABS(t.amount_cents)) AS total
       FROM transactions t
       JOIN categories c ON c.id = t.category_id
      WHERE t.occurred_at >= ?
        AND t.occurred_at < ?
        ${accountClause}
      GROUP BY day, c.kind;`,
    params,
  );

  const byDay = new Map<
    string,
    { expenseCents: number; incomeCents: number }
  >();
  for (const row of rows as unknown as {
    day: string;
    kind: CategoryKind;
    total: number | string;
  }[]) {
    const entry = byDay.get(row.day) ?? { expenseCents: 0, incomeCents: 0 };
    if (row.kind === "income") entry.incomeCents += Number(row.total);
    else if (row.kind === "expense") entry.expenseCents += Number(row.total);
    // "loan-payment" rows are neither expense nor income — they reduce a
    // loan balance and must not appear in either daily total.
    byDay.set(row.day, entry);
  }

  // Zero-fill each calendar day in the range so empty days still render.
  const totals: DailyTotals[] = [];
  const cursor = new Date(range.start);
  while (cursor.getTime() < range.end) {
    const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(cursor.getDate()).padStart(2, "0")}`;
    const entry = byDay.get(key) ?? { expenseCents: 0, incomeCents: 0 };
    totals.push({
      dayStartEpochMs: cursor.getTime(),
      expenseCents: entry.expenseCents,
      incomeCents: entry.incomeCents,
    });
    cursor.setDate(cursor.getDate() + 1);
  }
  return totals;
}

/**
 * Expense totals grouped by account for `range` (positive cents), ordered
 * largest first. Feeds the "spent" side of the dashboard's interactive
 * weekly activity pie chart. Scoped to a single account when `accountId`
 * is provided.
 */
export async function getExpenseByAccount(
  range: MonthRange,
  accountId?: string,
): Promise<AccountAmountSlice[]> {
  const db = await getDb();
  const params: (string | number)[] = [range.start, range.end];
  const accountClause = accountId ? "AND t.account_id = ?" : "";
  if (accountId) params.push(accountId);

  const { rows } = await db.execute(
    `SELECT a.id   AS account_id,
            a.name AS account_name,
            a.logo_key  AS account_logo_key,
            a.color_hex AS account_color_hex,
            SUM(-t.amount_cents) AS total_cents
       FROM transactions t
       JOIN accounts a ON a.id = t.account_id
       JOIN categories c ON c.id = t.category_id
      WHERE t.amount_cents < 0
        AND c.kind = 'expense'
        AND t.occurred_at >= ?
        AND t.occurred_at < ?
        ${accountClause}
      GROUP BY a.id
      ORDER BY total_cents DESC;`,
    params,
  );

  return (rows as unknown as AccountAmountRow[]).map((row) => ({
    accountId: row.account_id,
    accountName: row.account_name,
    accountLogoKey: row.account_logo_key ?? null,
    accountColorHex: row.account_color_hex,
    amountCents: Number(row.total_cents),
  }));
}

/**
 * Income totals grouped by account for `range` (positive cents), ordered
 * largest first. Feeds the "earned" side of the dashboard's interactive
 * weekly activity pie chart. Scoped to a single account when `accountId`
 * is provided.
 */
export async function getIncomeByAccount(
  range: MonthRange,
  accountId?: string,
): Promise<AccountAmountSlice[]> {
  const db = await getDb();
  const params: (string | number)[] = [range.start, range.end];
  const accountClause = accountId ? "AND t.account_id = ?" : "";
  if (accountId) params.push(accountId);

  const { rows } = await db.execute(
    `SELECT a.id   AS account_id,
            a.name AS account_name,
            a.logo_key  AS account_logo_key,
            a.color_hex AS account_color_hex,
            SUM(t.amount_cents) AS total_cents
       FROM transactions t
       JOIN accounts a ON a.id = t.account_id
       JOIN categories c ON c.id = t.category_id
      WHERE t.amount_cents > 0
        AND c.kind = 'income'
        AND t.occurred_at >= ?
        AND t.occurred_at < ?
        ${accountClause}
      GROUP BY a.id
      ORDER BY total_cents DESC;`,
    params,
  );

  return (rows as unknown as AccountAmountRow[]).map((row) => ({
    accountId: row.account_id,
    accountName: row.account_name,
    accountLogoKey: row.account_logo_key ?? null,
    accountColorHex: row.account_color_hex,
    amountCents: Number(row.total_cents),
  }));
}
