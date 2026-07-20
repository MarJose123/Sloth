/**
 * @/types/ocr.ts
 * Type definitions for OCR functionality.
 */

/**
 * Structured receipt data extracted by OCR.
 */
export interface OcrResult {
  /** Raw text output from ML Kit OCR */
  rawText: string;

  /** Extracted merchant/establishment name */
  merchant: string | null;

  /** Amount in cents (PHP) */
  amountCents: number | null;

  /** Receipt date in YYYY-MM-DD format */
  date: string | null;
}

/**
 * Configuration options for OCR extraction.
 * Reserved for future enhancements like language detection,
 * confidence thresholds, or extraction strategy preferences.
 */
export interface OcrConfig {
  /** Minimum confidence threshold for text recognition (0-1) */
  confidenceThreshold?: number;

  /** Language hint for OCR (e.g., "fil", "en", "es") */
  language?: string;

  /** Whether to skip certain extraction steps */
  skipMerchantDetection?: boolean;
  skipDateExtraction?: boolean;
  skipAmountExtraction?: boolean;

  /** Custom regex patterns for merchant detection */
  customMerchantPatterns?: RegExp[];

  /** Custom regex patterns for total/amount detection */
  customAmountPatterns?: RegExp[];
}

/**
 * Confidence metadata for OCR results (optional enhancement).
 */
export interface OcrResultWithConfidence extends OcrResult {
  /** Confidence scores for each extracted field (0-1) */
  confidence?: {
    merchant?: number;
    amount?: number;
    date?: number;
  };

  /** Indices of lines used for extraction */
  sourceLines?: {
    merchant?: number[];
    amount?: number[];
    date?: number[];
  };
}
