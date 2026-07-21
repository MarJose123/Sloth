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

/**
 * RFC 4180 CSV parser and OFX/QFX transaction parser.
 *
 * Both parsers are entirely local — no network calls, no third-party APIs.
 * CSV parsing follows RFC 4180 (quoted fields, escaped quotes, line breaks
 * inside quoted fields). OFX parsing uses regex to extract <STMTTRN> blocks
 * from SGML-structured bank export files.
 */

// ─── CSV Parser (RFC 4180) ────────────────────────────────────────────────────

/**
 * Parses a CSV string into an array of header-name → value records.
 * Handles quoted fields containing commas, double-quotes (escaped as ""),
 * and line breaks inside quoted fields.
 */
// ─── OFX / QFX Parser ─────────────────────────────────────────────────────────

/**
 * A single parsed transaction from an OFX/QFX <STMTTRN> block.
 */
import type { OfxTransaction } from "@/types";

export function parseCsv(text: string): {
  headers: string[];
  rows: Record<string, string>[];
} {
  const lines = tokeniseCsvLines(text);
  if (lines.length < 2) {
    return { headers: [], rows: [] };
  }

  const headers = parseCsvLine(lines[0]);
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const raw = lines[i];
    if (raw.trim().length === 0) continue; // skip empty lines

    const fields = parseCsvLine(raw);
    const record: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) {
      record[headers[j]] = fields[j]?.trim() ?? "";
    }
    rows.push(record);
  }

  return { headers, rows };
}

/**
 * Splits CSV text into logical lines, handling quoted fields that may
 * contain embedded newlines (RFC 4180 Section 2).
 */
function tokeniseCsvLines(text: string): string[] {
  const lines: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      current += ch;
    } else if (ch === "\n" && !inQuotes) {
      lines.push(current);
      current = "";
    } else if (ch === "\r" && !inQuotes) {
      // Skip carriage returns — handle \r\n and bare \r
      if (text[i + 1] === "\n") i++; // consume the \n
      lines.push(current);
      current = "";
    } else {
      current += ch;
    }
  }

  // Last line may not have a trailing newline
  if (current.length > 0) lines.push(current);

  return lines;
}

/**
 * Parses a single CSV line into fields, respecting RFC 4180 quoting.
 * Double-quotes inside a quoted field are escaped as "".
 */
function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];

    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote ("") → single quote
        current += '"';
        i++; // skip the second quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      fields.push(current);
      current = "";
    } else {
      current += ch;
    }
  }

  fields.push(current);
  return fields;
}

/**
 * Parses OFX/QFX text content into a list of transactions.
 * Extracts <STMTTRN>...</STMTTRN> blocks via regex. Ignores ledger
 * balance blocks and account metadata — only transaction-level data
 * is returned.
 */
export function parseOfx(text: string): OfxTransaction[] {
  const transactions: OfxTransaction[] = [];

  // Match each <STMTTRN> block (non-greedy, dot-all mode for multiline)
  const stmtTranRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi;
  let match: RegExpExecArray | null;

  while ((match = stmtTranRegex.exec(text)) !== null) {
    const block = match[1];
    transactions.push(parseOfxBlock(block));
  }

  return transactions;
}

function parseOfxBlock(block: string): OfxTransaction {
  const extract = (tag: string): string => {
    const re = new RegExp(`<${tag}>([^<]*)`, "i");
    const m = re.exec(block);
    return m ? m[1].trim() : "";
  };

  return {
    type: extract("TRNTYPE"),
    name: extract("NAME"),
    datePosted: extract("DTPOSTED"),
    amount: extract("TRNAMT"),
    memo: extract("MEMO"),
    checkNum: extract("CHECKNUM"),
  };
}

/**
 * Converts an OFX date string (YYYYMMDD or YYYYMMDDHHMMSS) to epoch ms.
 * Returns null if the format is unrecognised.
 */
export function ofxDateToEpochMs(ofxDate: string): number | null {
  const cleaned = ofxDate.replace(/[^0-9]/g, "");
  if (cleaned.length < 8) return null;

  const year = parseInt(cleaned.slice(0, 4), 10);
  const month = parseInt(cleaned.slice(4, 6), 10) - 1; // 0-based
  const day = parseInt(cleaned.slice(6, 8), 10);

  const date = new Date(year, month, day);
  if (isNaN(date.getTime())) return null;
  return date.getTime();
}

/**
 * Parses an OFX amount string (e.g. "-18.40") to integer cents.
 * Returns 0 if the string is not a valid number.
 */
export function ofxAmountToCents(amount: string): number {
  const val = parseFloat(amount.replace(/[^0-9.-]/g, ""));
  if (isNaN(val)) return 0;
  return Math.round(val * 100);
}
