/**
 * Resolves an account's logoKey to an image source for display.
 *
 * - "bank/<filename>" → bundled asset via require()
 * - "custom/<filename>" → filesystem URI, path relative to documentDirectory
 * - null → no logo (fall back to initials + colorHex)
 */
import type { LogoSource } from "@/types";

export function resolveLogoSrc(logoKey: string | null): LogoSource | null {
  if (!logoKey) return null;

  if (logoKey.startsWith("bank/")) {
    const source = BANK_LOGO_MAP[logoKey];
    return source ? { type: "bundled", source } : null;
  }

  if (logoKey.startsWith("custom/")) {
    const filename = logoKey.slice("custom/".length);
    // Stored under <documentDirectory>/account-logos/<filename>
    return { type: "uri", uri: `account-logos/${filename}` };
  }

  return null;
}

/** Static require map for bundled bank logos. */
const BANK_LOGO_MAP: Record<string, ReturnType<typeof require>> = {
  "bank/bdo.png": require("../../assets/bank/bdo.png"),
  "bank/bpi.png": require("../../assets/bank/bpi.png"),
  "bank/chinabank.png": require("../../assets/bank/chinabank.png"),
  "bank/gcash.png": require("../../assets/bank/gcash.png"),
  "bank/gotyme.png": require("../../assets/bank/gotyme.png"),
  "bank/maribank.png": require("../../assets/bank/maribank.png"),
  "bank/maya.png": require("../../assets/bank/maya.png"),
  "bank/metrobank.png": require("../../assets/bank/metrobank.png"),
  "bank/pagibig.png": require("../../assets/bank/pagibig.png"),
  "bank/pnb.png": require("../../assets/bank/pnb.png"),
  "bank/unionbank.png": require("../../assets/bank/unionbank.png"),
  "bank/vybebpi.png": require("../../assets/bank/vybebpi.png"),
  "bank/landbank.png": require("../../assets/bank/landbank.png"),
  "bank/securitybank.png": require("../../assets/bank/securitybank.png"),
  "bank/rcbc.png": require("../../assets/bank/rcbc.png"),
  "bank/aub.png": require("../../assets/bank/aub.png"),
};

/** All bundled bank logo entries for use in the add-account picker grid. */
export const BANK_LOGOS: {
  key: string;
  source: ReturnType<typeof require>;
  name: string;
}[] = [
  { key: "bank/bdo.png", source: BANK_LOGO_MAP["bank/bdo.png"]!, name: "BDO" },
  { key: "bank/bpi.png", source: BANK_LOGO_MAP["bank/bpi.png"]!, name: "BPI" },
  {
    key: "bank/chinabank.png",
    source: BANK_LOGO_MAP["bank/chinabank.png"]!,
    name: "Chinabank",
  },
  {
    key: "bank/gcash.png",
    source: BANK_LOGO_MAP["bank/gcash.png"]!,
    name: "GCash",
  },
  {
    key: "bank/gotyme.png",
    source: BANK_LOGO_MAP["bank/gotyme.png"]!,
    name: "GoTyme",
  },
  {
    key: "bank/maribank.png",
    source: BANK_LOGO_MAP["bank/maribank.png"]!,
    name: "MariBank",
  },
  {
    key: "bank/maya.png",
    source: BANK_LOGO_MAP["bank/maya.png"]!,
    name: "Maya",
  },
  {
    key: "bank/metrobank.png",
    source: BANK_LOGO_MAP["bank/metrobank.png"]!,
    name: "Metrobank",
  },
  {
    key: "bank/pagibig.png",
    source: BANK_LOGO_MAP["bank/pagibig.png"]!,
    name: "PAG-IBIG",
  },
  { key: "bank/pnb.png", source: BANK_LOGO_MAP["bank/pnb.png"]!, name: "PNB" },
  {
    key: "bank/unionbank.png",
    source: BANK_LOGO_MAP["bank/unionbank.png"]!,
    name: "UnionBank",
  },
  {
    key: "bank/vybebpi.png",
    source: BANK_LOGO_MAP["bank/vybebpi.png"]!,
    name: "Vybe by BPI",
  },
  {
    key: "bank/landbank.png",
    source: BANK_LOGO_MAP["bank/landbank.png"]!,
    name: "Landbank",
  },
  {
    key: "bank/securitybank.png",
    source: BANK_LOGO_MAP["bank/securitybank.png"]!,
    name: "Security Bank",
  },
  {
    key: "bank/rcbc.png",
    source: BANK_LOGO_MAP["bank/rcbc.png"]!,
    name: "RCBC",
  },
  {
    key: "bank/aub.png",
    source: BANK_LOGO_MAP["bank/aub.png"]!,
    name: "AUB",
  },
];
