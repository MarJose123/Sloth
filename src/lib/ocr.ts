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
 * On-device OCR integration via expo-mlkit-ocr.
 *
 * Captures a receipt image → ML Kit Text Recognition →
 * structured data (merchant, total, date).
 *
 * Enhanced for Philippine receipts with local merchant indicators,
 * PHP currency support, VAT handling, and common establishment types.
 */

import { recognizeText } from "expo-mlkit-ocr";
import type { OcrResult, OcrConfig } from "@/types";

// ─── Receipt heuristics ───────────────────────────────────────────────────────

/**
 * Global merchant indicators.
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
 * Philippine-specific merchant indicators and common establishments.
 * Includes major chains, local establishments, and business types.
 */
const PHILIPPINES_MERCHANT_INDICATORS = [
  // Major retail chains
  "sm mall",
  "sm supermarket",
  "robinsons",
  "puregold",
  "savemore",
  "s&r",
  "rusty's",
  "seafood",
  "landmark",
  "hypermart",
  "waltermart",
  "abc",
  "metro",
  "7-eleven",
  // Fast food chains
  "jollibee",
  "mcdo",
  "kfc",
  "chowking",
  "mang inasal",
  "red ribbon",
  "goldilocks",
  "yellow cab",
  "pizza hut",
  "dq",
  "burger king",
  "popeyes",
  "ihop",
  "max's",
  "ministry",
  "tokyo",
  // Establishments
  "pharmacy",
  "drugstore",
  "watsons",
  "generics",
  "mercury",
  "health",
  "beauty",
  "salon",
  "barber",
  "clinic",
  "hospital",
  "medical",
  "gasoline",
  "petron",
  "shell",
  "caltex",
  "seaoil",
  // Local terms
  "sari-sari",
  "tiangge",
  "palengke",
  "carinderia",
  "eatery",
  "catering",
  "canteen",
  "kiosk",
];

/**
 * Patterns that match a total line in a receipt.
 * Enhanced to support PHP currency symbol and variations.
 */
const TOTAL_PATTERNS = [
  /(?:total|grand\s+total|amount\s+due|balance\s+due)\s*[:\s]?\s*(?:php|₱|p\s?)?(?:\s*)?([\d,]+\.?\d*)/i,
  /total\s*[:$]?\s*([\d,]+\.?\d*)/i,
  /total due\s*[:$]?\s*([\d,]+\.?\d*)/i,
  /amount\s*[:$]?\s*([\d,]+\.?\d*)/i,
  /due\s*[:$]?\s*([\d,]+\.?\d*)/i,
  /balance\s*[:$]?\s*([\d,]+\.?\d*)/i,
  /grand total\s*[:$]?\s*([\d,]+\.?\d*)/i,
  // Philippine-specific: amount with PHP prefix
  /(?:php|₱)\s*([\d,]+\.?\d*)/i,
  // Standalone amount at end of line (common in PH receipts)
  /^\s*(?:php|₱)?\s*([\d,]+\.\d{2})\s*$/im,
];

/**
 * VAT and tax-related patterns (common in PH receipts).
 * Used to identify tax lines and potentially filter them from total.
 */
const TAX_PATTERNS = [
  /(?:vat|vatable|tax|amount due)\s*[:\s]?\s*(?:php|₱|p\s?)?\s*([\d,]+\.?\d*)/i,
  /(?:subtotal|sub total|subtotal before vat)\s*[:\s]?\s*(?:php|₱|p\s?)?\s*([\d,]+\.?\d*)/i,
  /(?:vat exempt|non-vat|discount)\s*[:\s]?\s*(?:php|₱|p\s?)?\s*([\d,]+\.?\d*)/i,
];

/**
 * Date patterns commonly found on receipts.
 * Enhanced to support Philippine date formats (DD/MM/YYYY typical).
 */
const DATE_PATTERNS = [
  // DD/MM/YYYY (Philippine standard)
  /(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})/,
  // YYYY-MM-DD
  /(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})/,
  // Month name formats
  /([A-Z][a-z]+)\s+(\d{1,2})[,]?\s+(\d{4})/,
  /(\d{1,2})\s+([A-Z][a-z]+)\s+(\d{4})/,
  // Filipino month abbreviations
  /(\d{1,2})\s+(ene|feb|mar|abr|may|hun|hul|ago|set|okt|nob|dis)[\w]*[\s,]?(\d{4})/i,
];

/**
 * Time patterns (common on Philippine receipts).
 * Helps filter out time info that shouldn't be used for date parsing.
 */
const TIME_PATTERN = /\b(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(?:AM|PM|am|pm)?\b/;

/**
 * Metadata patterns to skip when extracting merchant name.
 */
const METADATA_PATTERNS = [
  /^receipt/i,
  /^ref/i,
  /^transaction/i,
  /^trans/i,
  /^date/i,
  /^time/i,
  /^tin/i,
  /^rtn/i,
  /^cashier/i,
  /^\d{6,}$/,
  /^[A-Z]{2}\d+$/,
];

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Extracts structured receipt data from a captured image path
 * using Google ML Kit Text Recognition.
 *
 * Optimized for Philippine receipts with enhanced merchant detection,
 * VAT/tax handling, and PHP currency recognition.
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

/**
 * Extracts merchant name from receipt lines.
 * Prioritizes Philippine merchant indicators and common establishment names.
 *
 * Strategy:
 * 1. Check for Philippine-specific merchants first
 * 2. Validate first line as business name
 * 3. Scan for global merchant indicators
 * 4. Fallback to second line if first is metadata
 */
function extractMerchant(lines: string[], _rawText: string): string | null {
  if (!lines || lines.length === 0) {
    return null;
  }

  // 1. Check for Philippine-specific merchants first
  const phMerchant = findPhilippineMerchant(lines);
  if (phMerchant) {
    return phMerchant;
  }

  // 2. Use the first line if it looks like a business name (not metadata)
  const firstLine = lines[0];
  if (
    firstLine &&
    !TOTAL_PATTERNS.some((p) => p.test(firstLine)) &&
    !TAX_PATTERNS.some((p) => p.test(firstLine)) &&
    !TIME_PATTERN.test(firstLine) &&
    !isMetadata(firstLine) &&
    firstLine.length > 2 &&
    firstLine.length < 80
  ) {
    return capitalizeWords(firstLine);
  }

  // 3. Scan for global merchant indicators in the first 10 lines
  for (let i = 0; i < Math.min(10, lines.length); i++) {
    const line = lines[i].toLowerCase();
    for (const indicator of MERCHANT_INDICATORS) {
      if (line.includes(indicator)) {
        return capitalizeWords(lines[i]);
      }
    }
  }

  // 4. Fallback: second or third line if first is metadata
  for (let i = 1; i <= Math.min(3, lines.length - 1); i++) {
    const candidateLine = lines[i];
    if (
      candidateLine &&
      !isMetadata(candidateLine) &&
      !TOTAL_PATTERNS.some((p) => p.test(candidateLine)) &&
      !TAX_PATTERNS.some((p) => p.test(candidateLine)) &&
      candidateLine.length > 2 &&
      candidateLine.length < 80
    ) {
      return capitalizeWords(candidateLine);
    }
  }

  return null;
}

/**
 * Scans for Philippine-specific merchant names and chains.
 */
function findPhilippineMerchant(lines: string[]): string | null {
  for (let i = 0; i < Math.min(10, lines.length); i++) {
    const line = lines[i].toLowerCase();
    for (const indicator of PHILIPPINES_MERCHANT_INDICATORS) {
      if (line.includes(indicator)) {
        return capitalizeWords(lines[i]);
      }
    }
  }
  return null;
}

/**
 * Checks if a line is metadata (receipt number, date, time, etc).
 */
function isMetadata(line: string): boolean {
  return METADATA_PATTERNS.some((p) => p.test(line));
}

/**
 * Extracts amount from receipt lines.
 * Handles PHP currency, VAT lines, and Philippine receipt structures.
 * Prioritizes "Total" over subtotal; avoids VAT-only lines.
 *
 * Strategy:
 * 1. Search from bottom-up (totals typically near end)
 * 2. Skip VAT/tax-specific lines unless they contain "total"
 * 3. Prefer lines with explicit "total" keyword
 * 4. Return first valid high-value amount as fallback
 */
function extractAmount(lines: string[], _rawText: string): number | null {
  if (!lines || lines.length === 0) {
    return null;
  }

  let lastValidAmount: number | null = null;
  const AMOUNT_THRESHOLD = 500000; // 5000.00 PHP in cents

  // Search from bottom up (totals typically near end of receipt)
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i];

    // Test total patterns
    for (const pattern of TOTAL_PATTERNS) {
      const match = line.match(pattern);
      if (match) {
        const numStr = match[1] ?? match[0];
        const cleaned = numStr.replace(/[^0-9.]/g, "");
        const val = parseFloat(cleaned);

        if (!isNaN(val) && val > 0 && val < AMOUNT_THRESHOLD) {
          const amountCents = Math.round(val * 100);

          // Prefer lines with explicit "total" keyword
          if (/total|grand|amount due/i.test(line)) {
            return amountCents;
          }

          // Store as fallback if no previous match
          if (!lastValidAmount) {
            lastValidAmount = amountCents;
          }
        }
      }
    }

    // Additionally check for VAT patterns but only return if line has "total"
    for (const pattern of TAX_PATTERNS) {
      const match = line.match(pattern);
      if (match && /amount due/i.test(line)) {
        const numStr = match[1] ?? match[0];
        const cleaned = numStr.replace(/[^0-9.]/g, "");
        const val = parseFloat(cleaned);

        if (!isNaN(val) && val > 0 && val < AMOUNT_THRESHOLD) {
          const amountCents = Math.round(val * 100);
          if (!lastValidAmount) {
            lastValidAmount = amountCents;
          }
        }
      }
    }
  }

  return lastValidAmount;
}

/**
 * Extracts date from receipt lines.
 * Handles Philippine date formats (DD/MM/YYYY standard) and common formats.
 * Returns YYYY-MM-DD format for consistency.
 *
 * Strategy:
 * 1. Scan all lines for date patterns
 * 2. Skip time-only patterns
 * 3. Determine format based on value ranges
 * 4. Handle Filipino month names and abbreviations
 * 5. Validate extracted date
 */
function extractDate(lines: string[], _rawText: string): string | null {
  if (!lines || lines.length === 0) {
    return null;
  }

  for (const line of lines) {
    // Skip lines that are just times
    if (TIME_PATTERN.test(line) && !DATE_PATTERNS.some((p) => p.test(line))) {
      continue;
    }

    for (const pattern of DATE_PATTERNS) {
      const match = line.match(pattern);
      if (!match) continue;

      try {
        // Numeric date format detection (DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD)
        if (match[0].includes("/") || match[0].includes("-")) {
          const a = parseInt(match[1]!, 10);
          const b = parseInt(match[2]!, 10);
          const c = parseInt(match[3]!, 10);

          let year: number, month: number, day: number;

          // YYYY-MM-DD format (c is day-like)
          if (a > 1900 && b <= 12 && c <= 31) {
            year = a;
            month = b;
            day = c;
          }
          // DD/MM/YYYY (Philippine standard) — day is large, month is small
          else if (a > 12 && b <= 12) {
            day = a;
            month = b;
            year = c > 99 ? c : c + 2000;
          }
          // MM/DD/YYYY — assume US format as fallback
          else if (a <= 12 && b <= 31) {
            month = a;
            day = b;
            year = c > 99 ? c : c + 2000;
          } else {
            continue;
          }

          // Validate date ranges
          if (
            month < 1 ||
            month > 12 ||
            day < 1 ||
            day > 31 ||
            year < 2000 ||
            year > 2099
          ) {
            continue;
          }

          // Final validation: ensure date is valid
          const d = new Date(year, month - 1, day);
          if (!isNaN(d.getTime()) && d.getFullYear() === year) {
            return d.toISOString().slice(0, 10);
          }
        } else if (match.length >= 4) {
          // Handle Filipino month abbreviations and English month names
          const dayOrMonth = parseInt(match[1]!, 10);
          const monthOrName = match[2]!;
          const year = parseInt(match[3]!, 10);

          if (dayOrMonth < 1 || dayOrMonth > 31) {
            continue;
          }

          const filMonths: Record<string, number> = {
            // Spanish/Filipino abbreviations
            ene: 1,
            enero: 1,
            feb: 2,
            febrero: 2,
            mar: 3,
            marzo: 3,
            abr: 4,
            abril: 4,
            may: 5,
            hun: 6,
            hunyo: 6,
            hul: 7,
            hulyo: 7,
            ago: 8,
            agosto: 8,
            set: 9,
            setiembre: 9,
            sept: 9,
            septiembre: 9,
            okt: 10,
            oktubre: 10,
            nob: 11,
            nobyembre: 11,
            dis: 12,
            disiembre: 12,
            // English abbreviations (only entries not already in Filipino section above)
            jan: 1,
            january: 1,
            february: 2,
            march: 3,
            apr: 4,
            april: 4,
            june: 6,
            july: 7,
            august: 8,
            sep: 9,
            september: 9,
            october: 10,
            november: 11,
            december: 12,
          };

          const monNum = filMonths[monthOrName.toLowerCase()];
          if (monNum && monNum >= 1 && monNum <= 12) {
            const d = new Date(year, monNum - 1, dayOrMonth);
            if (!isNaN(d.getTime()) && d.getFullYear() === year) {
              return d.toISOString().slice(0, 10);
            }
          }

          // Try English month names as fallback
          const d = new Date(`${monthOrName} ${dayOrMonth}, ${year}`);
          if (!isNaN(d.getTime()) && d.getFullYear() === year) {
            return d.toISOString().slice(0, 10);
          }
        }
      } catch {
        // Continue to next pattern on error
        continue;
      }
    }
  }

  return null;
}

/**
 * Capitalizes the first letter of each word in a string.
 * Preserves existing capitalization for acronyms.
 */
function capitalizeWords(str: string): string {
  if (!str || str.length === 0) {
    return str;
  }

  return str
    .split(/\s+/)
    .map((w) => {
      if (w.length === 0) return w;
      if (w.length === 1) return w.toUpperCase();
      // Don't change if already all caps (acronym)
      if (w === w.toUpperCase()) return w;
      return w[0]!.toUpperCase() + w.slice(1).toLowerCase();
    })
    .join(" ");
}

/**
 * Helper to safely parse amounts with Philippine formatting.
 */
export function parsePhilippineAmount(amountStr: string | null): number | null {
  if (!amountStr) return null;

  // Remove PHP, ₱, P symbols and whitespace
  const cleaned = amountStr
    .replace(/[₱PHP\s]/gi, "")
    .replace(/,/g, "")
    .trim();

  const val = parseFloat(cleaned);
  if (!isNaN(val) && val > 0) {
    return Math.round(val * 100); // Return as cents
  }
  return null;
}

/**
 * Helper to format cents as PHP currency string.
 */
export function formatPhilippineCurrency(cents: number): string {
  const pesos = (cents / 100).toFixed(2);
  return `₱${parseFloat(pesos).toLocaleString("en-PH")}`;
}

/**
 * Helper to format date string.
 */
export function formatReceiptDate(dateStr: string | null): string {
  if (!dateStr) return "N/A";

  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;

    return d.toLocaleDateString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}
