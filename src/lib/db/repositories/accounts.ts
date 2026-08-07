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
  AccountType,
  AccountWithBalance,
  InsertAccountInput,
  InterestPayout,
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
  interest_rate_bps: number | null;
  placement_term_months: number | null;
  interest_payout: InterestPayout | null;
  note: string | null;
}

interface AccountBaseRow {
  id: string;
  name: string;
  type: AccountType;
  starting_balance: number;
  color_hex: string;
  logo_key: string | null;
  interest_rate_bps: number | null;
  placement_term_months: number | null;
  interest_payout: InterestPayout | null;
  note: string | null;
}

/** Time-deposit detail columns resolved to concrete values (NULL otherwise). */
function resolveTimeDeposit(input: {
  type: AccountType;
  timeDeposit?: Partial<{
    interestRateBps: number | null;
    placementTermMonths: number | null;
    interestPayout: InterestPayout | null;
    note: string | null;
  }>;
}): {
  interestRateBps: number | null;
  placementTermMonths: number | null;
  interestPayout: InterestPayout | null;
  note: string | null;
} {
  if (input.type !== "time-deposit") {
    return {
      interestRateBps: null,
      placementTermMonths: null,
      interestPayout: null,
      note: null,
    };
  }
  const td = input.timeDeposit ?? {};
  return {
    interestRateBps: td.interestRateBps ?? null,
    placementTermMonths: td.placementTermMonths ?? null,
    interestPayout: td.interestPayout ?? null,
    note: td.note?.trim() ? td.note.trim() : null,
  };
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
            a.interest_rate_bps, a.placement_term_months, a.interest_payout, a.note,
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
    interestRateBps: row.interest_rate_bps ?? null,
    placementTermMonths: row.placement_term_months ?? null,
    interestPayout: row.interest_payout ?? null,
    note: row.note ?? null,
  }));
}

/**
 * Inserts a new account and returns its generated id.
 * The balance is stored as `starting_balance`; the running balance is always
 * derived at query time (starting_balance + transaction sum).
 * Loan accounts follow the liability convention: the amount owed is stored
 * negative, so it reduces net worth instead of inflating it.
 */
export async function insertAccount(
  input: InsertAccountInput,
): Promise<string> {
  const db = await getDb();
  const id = ExpoCrypto.randomUUID();
  const now = Date.now();
  const startingBalanceCents =
    input.type === "loan"
      ? -Math.abs(input.startingBalanceCents)
      : input.startingBalanceCents;
  const td = resolveTimeDeposit(input);

  await db.execute(
    `INSERT INTO accounts (id, name, type, starting_balance, logo_key, color_hex, created_at,
                           interest_rate_bps, placement_term_months, interest_payout, note)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      id,
      input.name.trim(),
      input.type,
      startingBalanceCents,
      input.logoKey ?? null,
      input.colorHex,
      now,
      td.interestRateBps,
      td.placementTermMonths,
      td.interestPayout,
      td.note,
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
  interestRateBps: number | null;
  placementTermMonths: number | null;
  interestPayout: InterestPayout | null;
  note: string | null;
} | null> {
  const db = await getDb();

  const { rows } = await db.execute(
    `SELECT id, name, type, starting_balance, color_hex, logo_key,
            interest_rate_bps, placement_term_months, interest_payout, note
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
    interestRateBps: row.interest_rate_bps ?? null,
    placementTermMonths: row.placement_term_months ?? null,
    interestPayout: row.interest_payout ?? null,
    note: row.note ?? null,
  };
}

export async function updateAccount(input: UpdateAccountInput): Promise<void> {
  const db = await getDb();
  const td = resolveTimeDeposit(input);
  // Keep the liability convention consistent across type conversions:
  // becoming a loan flips the stored starting_balance negative, and leaving
  // the loan type flips it back positive (asset convention).
  await db.execute(
    `UPDATE accounts
     SET name = ?,
         type = ?,
         starting_balance = CASE
           WHEN ? = 'loan' THEN -ABS(starting_balance)
           WHEN ? <> 'loan' AND type = 'loan' THEN ABS(starting_balance)
           ELSE starting_balance
         END,
         color_hex = ?,
         logo_key = ?,
         interest_rate_bps = ?,
         placement_term_months = ?,
         interest_payout = ?,
         note = ?
     WHERE id = ?;`,
    [
      input.name.trim(),
      input.type,
      input.type,
      input.type,
      input.colorHex,
      input.logoKey ?? null,
      td.interestRateBps,
      td.placementTermMonths,
      td.interestPayout,
      td.note,
      input.id,
    ],
  );
}
