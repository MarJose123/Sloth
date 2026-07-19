/** CSV/OFX import types. */

export interface OfxTransaction {
  /** e.g. "DEBIT", "CREDIT", "CHECK" */
  type: string;
  /** Human-readable merchant or description */
  name: string;
  /** Date string in OFX format (YYYYMMDD) */
  datePosted: string;
  /** Amount as a string (e.g. "-18.40" or "1500.00") */
  amount: string;
  /** Optional memo / extra description */
  memo: string;
  /** Optional check number or reference */
  checkNum: string;
}
