import { Paths, File } from "expo-file-system";
import type { TransactionLedgerItem } from "@/lib/db/repositories/transactions";

/**
 * Exports a list of transactions as a CSV file and triggers the OS share
 * sheet so the user can save or send the file.
 *
 * The export is entirely local — no data ever leaves the device except
 * through the user's explicit share action.
 *
 * @param transactions — Array of transaction ledger items to export.
 * @param accountLabel — Optional label included in the filename (e.g. "Checking").
 * @param dateRangeLabel — Optional date range label for the filename (e.g. "2024-01").
 * @returns The file URI of the exported CSV.
 */

// ─── RFC 4180 field escaping ──────────────────────────────────────────────────

/**
 * Escapes a single CSV field per RFC 4180:
 * - Fields containing commas, quotes, or newlines are quoted.
 * - Embedded quotes are doubled ("").
 */
function escapeCsvField(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (
    str.includes(",") ||
    str.includes('"') ||
    str.includes("\n") ||
    str.includes("\r")
  ) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Builds a complete CSV string from transaction data.
 * Columns: Date, Merchant, Category, Account, Amount, Note, Source.
 */
function buildCsvContent(transactions: TransactionLedgerItem[]): string {
  const header = [
    "Date",
    "Merchant",
    "Category",
    "Account",
    "Amount",
    "Note",
    "Source",
  ];

  const rows = transactions.map((tx) => {
    const date = new Date(tx.occurredAt).toISOString().slice(0, 10);
    const amount = (tx.amountCents / 100).toFixed(2);

    return [
      escapeCsvField(date),
      escapeCsvField(tx.merchant),
      escapeCsvField(tx.categoryName ?? ""),
      escapeCsvField(tx.accountName),
      escapeCsvField(amount),
      escapeCsvField(tx.note ?? ""),
      escapeCsvField(tx.source),
    ].join(",");
  });

  return [header.join(","), ...rows].join("\n");
}

/**
 * Generates a filename for the export.
 * Format: Sloth_export_{accountLabel}_{dateLabel}.csv
 */
function buildFilename(accountLabel?: string, dateRangeLabel?: string): string {
  const parts = ["Sloth_export"];
  if (accountLabel) parts.push(accountLabel.replace(/\s+/g, "_"));
  if (dateRangeLabel) parts.push(dateRangeLabel.replace(/\s+/g, "_"));
  return `${parts.join("_")}.csv`;
}

// ─── public API ───────────────────────────────────────────────────────────────

export async function exportTransactionsToCsv(
  transactions: TransactionLedgerItem[],
  accountLabel?: string,
  dateRangeLabel?: string,
): Promise<string> {
  const csvContent = buildCsvContent(transactions);
  const filename = buildFilename(accountLabel, dateRangeLabel);
  const cacheDir = Paths.cache;
  const file = new File(cacheDir, filename);

  await file.write(csvContent);

  // Trigger share via React Native's Share API
  const { Share } = await import("react-native");
  await Share.share(
    {
      url: file.uri,
      message: csvContent.slice(0, 500),
      title: filename,
    },
    { dialogTitle: "Export transactions" },
  );

  return file.uri;
}

/**
 * Formats cents as a dollar string for CSV output (no $ sign, no grouping).
 * e.g. -1840 → "-18.40", 150000 → "1500.00"
 */
export function formatCentsForCsv(cents: number): string {
  return (cents / 100).toFixed(2);
}
