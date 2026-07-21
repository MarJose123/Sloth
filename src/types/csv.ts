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
