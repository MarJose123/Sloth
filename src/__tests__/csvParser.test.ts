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
 * Tests for src/lib/csvParser.ts
 *
 * Pure parsing logic for CSV (RFC 4180) and OFX/QFX formats.
 * No native module mocking required.
 */

import {
  parseCsv,
  parseOfx,
  ofxDateToEpochMs,
  ofxAmountToCents,
} from "@/lib/csvParser";

// ─── parseCsv ──────────────────────────────────────────────────────────────

describe("parseCsv", () => {
  it("parses a simple CSV with header and rows", () => {
    const csv = "name,amount\nCoffee,150\nLunch,320";
    const result = parseCsv(csv);
    expect(result.headers).toEqual(["name", "amount"]);
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0]).toEqual({ name: "Coffee", amount: "150" });
    expect(result.rows[1]).toEqual({ name: "Lunch", amount: "320" });
  });

  it("handles quoted fields with commas", () => {
    const csv = 'item,desc\n1,"Coffee, large"\n2,"Lunch, with tip"';
    const result = parseCsv(csv);
    expect(result.rows[0].desc).toBe("Coffee, large");
    expect(result.rows[1].desc).toBe("Lunch, with tip");
  });

  it("handles escaped quotes inside quoted fields", () => {
    const csv = 'note,text\n1,"He said ""hello"""';
    const result = parseCsv(csv);
    expect(result.rows[0].text).toBe('He said "hello"');
  });

  it("handles multiline quoted fields", () => {
    const csv = 'id,desc\n1,"Line1\nLine2"';
    const result = parseCsv(csv);
    expect(result.rows[0].desc).toBe("Line1\nLine2");
  });

  it("handles \\r\\n line endings", () => {
    const csv = "name,amount\r\nCoffee,150\r\nLunch,320";
    const result = parseCsv(csv);
    expect(result.rows).toHaveLength(2);
  });

  it("returns empty headers/rows for single-line CSV", () => {
    const result = parseCsv("only headers");
    expect(result.headers).toEqual([]);
    expect(result.rows).toEqual([]);
  });

  it("skips empty lines", () => {
    const csv = "a,b\n1,2\n\n3,4\n";
    const result = parseCsv(csv);
    expect(result.rows).toHaveLength(2);
  });
});

// ─── parseOfx ──────────────────────────────────────────────────────────────

describe("parseOfx", () => {
  it("extracts transactions from OFX text", () => {
    const ofx = `
<OFX>
  <BANKTRANLIST>
    <STMTTRN>
      <TRNTYPE>DEBIT</TRNTYPE>
      <DTPOSTED>20250115</DTPOSTED>
      <TRNAMT>-18.40</TRNAMT>
      <NAME>Starbucks</NAME>
      <MEMO>Morning coffee</MEMO>
    </STMTTRN>
    <STMTTRN>
      <TRNTYPE>CREDIT</TRNTYPE>
      <DTPOSTED>20250120</DTPOSTED>
      <TRNAMT>1500.00</TRNAMT>
      <NAME>Salary</NAME>
      <MEMO>Monthly pay</MEMO>
    </STMTTRN>
  </BANKTRANLIST>
</OFX>`;
    const result = parseOfx(ofx);
    expect(result).toHaveLength(2);
    expect(result[0].type).toBe("DEBIT");
    expect(result[0].name).toBe("Starbucks");
    expect(result[0].amount).toBe("-18.40");
    expect(result[1].type).toBe("CREDIT");
    expect(result[1].name).toBe("Salary");
    expect(result[1].amount).toBe("1500.00");
  });

  it("returns empty array when no STMTTRN blocks found", () => {
    expect(parseOfx("no transactions here")).toEqual([]);
  });

  it("handles CHECKNUM tag", () => {
    const ofx = `<STMTTRN><CHECKNUM>1001</CHECKNUM></STMTTRN>`;
    const result = parseOfx(ofx);
    expect(result[0].checkNum).toBe("1001");
  });
});

// ─── ofxDateToEpochMs ──────────────────────────────────────────────────────

describe("ofxDateToEpochMs", () => {
  it("converts YYYYMMDD to epoch ms", () => {
    const result = ofxDateToEpochMs("20250115");
    // Jan 15, 2025: months are 0-based, days are 1-based
    const expected = new Date(2025, 0, 15).getTime();
    expect(result).toBe(expected);
  });

  it("strips non-numeric characters", () => {
    const result = ofxDateToEpochMs("2025-01-15");
    const expected = new Date(2025, 0, 15).getTime();
    expect(result).toBe(expected);
  });

  it("returns null for invalid format", () => {
    expect(ofxDateToEpochMs("")).toBeNull();
    expect(ofxDateToEpochMs("abc")).toBeNull();
  });
});

// ─── ofxAmountToCents ──────────────────────────────────────────────────────

describe("ofxAmountToCents", () => {
  it("converts positive amount string to cents", () => {
    expect(ofxAmountToCents("1500.00")).toBe(150000);
  });

  it("converts negative amount string to cents", () => {
    expect(ofxAmountToCents("-18.40")).toBe(-1840);
  });

  it("strips non-numeric characters except decimal and minus", () => {
    expect(ofxAmountToCents("$1,234.56")).toBe(123456);
  });

  it("returns 0 for invalid input", () => {
    expect(ofxAmountToCents("")).toBe(0);
    expect(ofxAmountToCents("abc")).toBe(0);
  });
});
