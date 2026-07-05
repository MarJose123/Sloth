import { getDb } from "../client";

export type AccountType = "checking" | "savings" | "credit" | "cash";

export interface AccountWithBalance {
  id: string;
  name: string;
  type: AccountType;
  colorHex: string;
  logoKey: string | null;
  /** starting_balance + sum of all of this account's transactions, in cents. */
  balanceCents: number;
}

interface AccountRow {
  id: string;
  name: string;
  type: AccountType;
  color_hex: string;
  logo_key: string | null;
  balance_cents: number | string;
}

/**
 * Lists all non-archived accounts with their running balance computed from
 * starting_balance + the sum of their transactions. There is no cached
 * "balance" column by design — it's always derived so it can never drift
 * from the transaction ledger.
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
