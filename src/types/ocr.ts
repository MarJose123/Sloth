/** OCR types. */

export interface OcrResult {
  /** Raw concatenated text from the receipt */
  rawText: string;
  /** Best-guess merchant name */
  merchant: string | null;
  /** Best-guess total amount in cents (positive), or null */
  amountCents: number | null;
  /** ISO date string (YYYY-MM-DD), or null */
  date: string | null;
}

export interface OcrConfig {
  language?: string;
}
