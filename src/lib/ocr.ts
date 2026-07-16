/**
 * On-device OCR integration stub.
 *
 * This module provides a placeholder interface for receipt scanning.
 * The actual ML Kit text-recognition integration will be wired here
 * when the native module is configured in a future phase.
 *
 * For now, `extractReceiptData` simulates a successful scan with mock
 * data, allowing the UI layer (Screen 13) to be developed and tested
 * end-to-end without the native dependency.
 */

export interface OcrResult {
  /** Raw text detected by the OCR engine */
  rawText: string;
  /** Best-guess merchant name extracted from the receipt */
  merchant: string | null;
  /** Best-guess total amount in cents (positive), or null */
  amountCents: number | null;
  /** ISO date string (YYYY-MM-DD), or null */
  date: string | null;
}

/**
 * Configuration for the OCR engine. Currently a stub — will expand
 * when ML Kit is wired.
 */
export interface OcrConfig {
  /** Language hint(s) for text recognition, e.g. "en" */
  language?: string;
}

/**
 * Extracts structured receipt data from a captured image path.
 *
 * @param imageUri — Local file URI of the captured receipt image.
 * @param config — Optional OCR configuration.
 * @returns Parsed OcrResult with raw text and extracted fields.
 *
 * Current implementation returns simulated data for UI development.
 * When ML Kit is wired, this will call the native text recogniser
 * and apply post-processing heuristics.
 */
export async function extractReceiptData(
  imageUri: string,
  config?: OcrConfig,
): Promise<OcrResult> {
  // ── Placeholder: simulate a 1-second processing delay ──────────────
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // ── Mock result for UI development ─────────────────────────────────
  // Replace this block with ML kit text recognition + post-processing.
  const mockData: OcrResult = {
    rawText: `CORNER MARKET
123 Main St
Anytown, USA
============================
Organic Bananas       $2.40
Whole Milk            $4.99
Sourdough Bread       $5.50
============================
SUBTOTAL             $12.89
TAX                  $1.03
TOTAL                $13.92
============================
Thank you for shopping!
VISA **** 4242
AUTH CODE: 83A7F2`,
    merchant: "Corner Market",
    amountCents: 1392, // $13.92
    date: new Date().toISOString().slice(0, 10),
  };

  return mockData;
}

/**
 * Returns whether the device supports on-device OCR.
 * Currently always returns true (placeholder). When ML Kit is wired,
 * this will check for the native module's availability.
 */
export function isOcrAvailable(): boolean {
  // Placeholder — will check ML Kit availability when wired
  return true;
}
