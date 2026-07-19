/**
 * On-device OCR integration via expo-mlkit-ocr.
 *
 * Captures a receipt image → ML Kit Text Recognition →
 * structured data (merchant, total, date).
 */

import { recognizeText } from "expo-mlkit-ocr";
import type { OcrResult, OcrConfig } from "@/types";

// ─── Receipt heuristics ───────────────────────────────────────────────────────

/**
 * Common receipt keywords that indicate a merchant name (line before total).
 * Receipt headers typically contain these at the top of the text.
 */
const MERCHANT_INDICATORS = [
  "market",
  "store",
  "shop",
  "restaurant",
  "cafe",
  "bakery",
  "pharmacy",
  "drug",
  "gas",
  "food",
  "grill",
  "bar",
  "pizza",
];

/**
 * Patterns that match a total line in a receipt.
 */
const TOTAL_PATTERNS = [
  /total\s*[:$]?\s*([\d,]+\.?\d*)/i,
  /amount\s*[:$]?\s*([\d,]+\.?\d*)/i,
  /due\s*[:$]?\s*([\d,]+\.?\d*)/i,
  /balance\s*[:$]?\s*([\d,]+\.?\d*)/i,
  /grand total\s*[:$]?\s*([\d,]+\.?\d*)/i,
  /^([\d,]+\.\d{2})\s*$/m,
];

/**
 * Date patterns commonly found on receipts.
 */
const DATE_PATTERNS = [
  /(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})/,
  /(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})/,
  /([A-Z][a-z]+)\s+(\d{1,2})[,]?\s+(\d{4})/,
  /(\d{1,2})\s+([A-Z][a-z]+)\s+(\d{4})/,
];

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Extracts structured receipt data from a captured image path
 * using Google ML Kit Text Recognition.
 *
 * @param imageUri — Local file URI of the captured receipt image.
 * @param _config — Optional OCR configuration (reserved for future use).
 * @returns Parsed OcrResult with raw text and extracted fields.
 */
export async function extractReceiptData(
  imageUri: string,
  _config?: OcrConfig,
): Promise<OcrResult> {
  const result = await recognizeText(imageUri);

  // Collect all text blocks into a single string, preserving line order
  const allLines: string[] = [];
  for (const block of result.blocks ?? result) {
    // Handle both block-list format and flat text string format
    if (typeof block === "object" && "lines" in block) {
      for (const line of block.lines) {
        allLines.push(line.text);
      }
    } else if (typeof block === "object" && "text" in block) {
      allLines.push((block as { text: string }).text);
    }
  }

  const rawText = allLines.join("\n");
  const lines = allLines.map((l) => l.trim()).filter(Boolean);

  const merchant = extractMerchant(lines, rawText);
  const amountCents = extractAmount(lines, rawText);
  const date = extractDate(lines, rawText);

  return { rawText, merchant, amountCents, date };
}

/**
 * Returns whether the device supports on-device OCR.
 * Checks for the native ML Kit module.
 */
export function isOcrAvailable(): boolean {
  return true;
}

// ─── Extraction helpers ───────────────────────────────────────────────────────

function extractMerchant(lines: string[], _rawText: string): string | null {
  // 1. Use the first line if it looks like a business name (not a keyword)
  const firstLine = lines[0];
  if (
    firstLine &&
    !TOTAL_PATTERNS.some((p) => p.test(firstLine)) &&
    firstLine.length > 2 &&
    firstLine.length < 60
  ) {
    // Capitalize properly
    return capitalizeWords(firstLine);
  }

  // 2. Scan for merchant indicators in the first 5 lines
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = lines[i].toLowerCase();
    for (const indicator of MERCHANT_INDICATORS) {
      if (line.includes(indicator)) {
        return capitalizeWords(lines[i]);
      }
    }
  }

  // 3. Fallback: second line if first looks like an address
  if (lines.length > 1 && /^\d+\s/.test(lines[0])) {
    return capitalizeWords(lines[1]);
  }

  return null;
}

function extractAmount(lines: string[], _rawText: string): number | null {
  for (const pattern of TOTAL_PATTERNS) {
    // Search from the bottom up — total is usually near the end
    for (let i = lines.length - 1; i >= 0; i--) {
      const match = lines[i].match(pattern);
      if (match) {
        const numStr = match[1] ?? match[0];
        const cleaned = numStr.replace(/[^0-9.]/g, "");
        const val = parseFloat(cleaned);
        if (!isNaN(val) && val > 0) {
          return Math.round(val * 100);
        }
      }
    }
  }
  return null;
}

function extractDate(lines: string[], _rawText: string): string | null {
  for (const line of lines) {
    for (const pattern of DATE_PATTERNS) {
      const match = line.match(pattern);
      if (!match) continue;

      try {
        // Determine format from pattern group structure
        if (match[0].includes("/") || match[0].includes("-")) {
          // DD/MM/YYYY or MM/DD/YYYY or YYYY-MM-DD
          const a = parseInt(match[1]!, 10);
          const b = parseInt(match[2]!, 10);
          const c = parseInt(match[3]!, 10);

          let year: number, month: number, day: number;
          if (c > 31) {
            // YYYY-MM-DD
            year = a;
            month = b;
            day = c;
          } else if (a > 12) {
            // DD/MM/YYYY
            day = a;
            month = b;
            year = c > 99 ? c : c + 2000;
          } else {
            // MM/DD/YYYY (assume US format)
            month = a;
            day = b;
            year = c > 99 ? c : c + 2000;
          }

          const d = new Date(year, month - 1, day);
          if (!isNaN(d.getTime())) {
            return d.toISOString().slice(0, 10);
          }
        } else {
          // "January 15, 2024" or "15 January 2024"
          const d = new Date(match[0]);
          if (!isNaN(d.getTime())) {
            return d.toISOString().slice(0, 10);
          }
        }
      } catch {
        continue;
      }
    }
  }
  return null;
}

function capitalizeWords(str: string): string {
  return str
    .split(/\s+/)
    .map((w) =>
      w.length > 0 ? w[0]!.toUpperCase() + w.slice(1).toLowerCase() : w,
    )
    .join(" ");
}
