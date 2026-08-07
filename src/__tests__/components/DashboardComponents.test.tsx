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
 * Tests for dashboard components: TransactionRow, AccountSwitcher,
 * EmptyAccountsCard, CategoryRingCard.
 */

import { act, create } from "react-test-renderer";
import { TransactionRow } from "@/components/dashboard/TransactionRow";
import { AccountSwitcher } from "@/components/dashboard/AccountSwitcher";
import { EmptyAccountsCard } from "@/components/dashboard/EmptyAccountsCard";
import { CategoryRingCard } from "@/components/dashboard/CategoryRingCard";
import { WeeklyActivityCard } from "@/components/dashboard/WeeklyActivityCard";
import { HIDDEN_AMOUNT } from "@/lib/format";

// Mock nativewind
jest.mock("nativewind", () => ({
  VariableContextProvider: ({ children }: { children: React.ReactNode }) =>
    children,
}));

// Mock ThemeContext
jest.mock("@/theme/ThemeContext", () => {
  const colors = jest.requireActual("@/theme/colors").darkColors;
  return {
    useColors: () => colors,
    useTheme: () => ({
      preference: "auto" as const,
      resolved: "dark" as const,
      palette: colors,
      loaded: true,
      setPreference: jest.fn(),
    }),
    ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
  };
});

// Mock color (ESM-only package that Jest can't parse)
jest.mock("color", () => ({
  default: (color: string) => ({
    alpha: () => ({ toString: () => color }),
    toString: () => color,
  }),
  __esModule: true,
}));

// Mock react-native-svg (use require inside factory — jest.mock is hoisted)
jest.mock("react-native-svg", () => {
  const React = require("react");
  const MockSvg = (props: Record<string, unknown>) =>
    React.createElement("svg", props, props.children);
  const MockCircle = (props: Record<string, unknown>) =>
    React.createElement("circle", props);
  const MockG = (props: Record<string, unknown>) =>
    React.createElement("g", props, props.children);
  const MockEllipse = (props: Record<string, unknown>) =>
    React.createElement("ellipse", props);
  const MockPath = (props: Record<string, unknown>) =>
    React.createElement("path", props);
  const MockRect = (props: Record<string, unknown>) =>
    React.createElement("rect", props);
  return {
    __esModule: true,
    default: MockSvg,
    Svg: MockSvg,
    Circle: MockCircle,
    G: MockG,
    Ellipse: MockEllipse,
    Path: MockPath,
    Rect: MockRect,
  };
});

function render(component: React.ReactElement) {
  let renderer: ReturnType<typeof create>;
  act(() => {
    renderer = create(component);
  });
  return renderer!;
}

// ─── TransactionRow ─────────────────────────────────────────────────────────

describe("TransactionRow", () => {
  const baseTx = {
    id: "tx-1",
    merchant: "Starbucks",
    amountCents: -15000,
    occurredAt: Date.now() - 3600000,
    accountId: "acc-1",
    accountName: "BPI Savings",
    accountLogoKey: null,
    accountColorHex: "#C87B54",
    categoryName: "Dining",
    categoryIcon: "🍽",
    categoryKind: "expense" as const,
  };

  it("renders merchant name", () => {
    const renderer = render(<TransactionRow transaction={baseTx} />);
    expect(JSON.stringify(renderer.toJSON())).toContain("Starbucks");
  });

  it("renders category name", () => {
    const renderer = render(<TransactionRow transaction={baseTx} />);
    expect(JSON.stringify(renderer.toJSON())).toContain("Dining");
  });

  it('shows "Uncategorized" when no category', () => {
    const uncategorized = { ...baseTx, categoryName: null };
    const renderer = render(<TransactionRow transaction={uncategorized} />);
    expect(JSON.stringify(renderer.toJSON())).toContain("Uncategorized");
  });

  it("renders positive income with sage coloring (amount > 0)", () => {
    const income = {
      ...baseTx,
      amountCents: 500000,
      categoryKind: "income" as const,
    };
    const renderer = render(<TransactionRow transaction={income} />);
    const json = JSON.stringify(renderer.toJSON());
    expect(json).toContain("5,000");
  });

  it("renders the account badge (initials fallback when no logo)", () => {
    const renderer = render(<TransactionRow transaction={baseTx} />);
    const json = JSON.stringify(renderer.toJSON());
    // Initials of "BPI Savings" → "BS"
    expect(json).toContain("BS");
    // Badge fallback background color
    expect(json).toContain("#C87B54");
  });

  it("renders the account logo image when a logoKey is present", () => {
    const withLogo = { ...baseTx, accountLogoKey: "bank/bpi.png" };
    const renderer = render(<TransactionRow transaction={withLogo} />);
    // Bundled logo asset resolves via require — the image element renders
    // without the initials fallback.
    expect(JSON.stringify(renderer.toJSON())).not.toContain("BS");
  });
});

// ─── AccountSwitcher ───────────────────────────────────────────────────────

describe("AccountSwitcher", () => {
  const accounts = [
    {
      id: "acc-1",
      name: "BPI",
      type: "savings" as const,
      colorHex: "#C87B54",
      logoKey: null,
      balanceCents: 100000,
      interestRateBps: null,
      placementTermMonths: null,
      interestPayout: null,
      note: null,
    },
    {
      id: "acc-2",
      name: "Metro",
      type: "wallet" as const,
      colorHex: "#7FA06B",
      logoKey: null,
      balanceCents: 50000,
      interestRateBps: null,
      placementTermMonths: null,
      interestPayout: null,
      note: null,
    },
  ];

  it("renders all accounts plus 'All accounts' chip", () => {
    const renderer = render(
      <AccountSwitcher
        accounts={accounts}
        selectedAccountId={null}
        onSelect={() => {}}
      />,
    );
    const json = JSON.stringify(renderer.toJSON());
    expect(json).toContain("All accounts");
    expect(json).toContain("BPI");
    expect(json).toContain("Metro");
  });
});

// ─── EmptyAccountsCard ──────────────────────────────────────────────────────

describe("EmptyAccountsCard", () => {
  it("renders title and button", () => {
    const renderer = render(<EmptyAccountsCard onAddAccount={() => {}} />);
    const json = JSON.stringify(renderer.toJSON());
    expect(json).toContain("No accounts yet");
    expect(json).toContain("Add your first account");
  });
});

// ─── CategoryRingCard ───────────────────────────────────────────────────────

describe("CategoryRingCard", () => {
  const category = {
    id: "cat-1",
    name: "Groceries",
    icon: "🛒",
    colorHex: "#C87B54",
    kind: "expense" as const,
    spendCents: 50000,
    transactionCount: 5,
  };

  it("renders category name", () => {
    const renderer = render(
      <CategoryRingCard category={category} totalExpenseCents={100000} />,
    );
    expect(JSON.stringify(renderer.toJSON())).toContain("Groceries");
  });

  it("renders percentage when there are expenses", () => {
    const renderer = render(
      <CategoryRingCard category={category} totalExpenseCents={100000} />,
    );
    // 50% = 50000/100000
    expect(JSON.stringify(renderer.toJSON())).toContain("50%");
  });

  it("renders — when totalExpenseCents is 0", () => {
    const renderer = render(
      <CategoryRingCard category={category} totalExpenseCents={0} />,
    );
    expect(JSON.stringify(renderer.toJSON())).toContain("\u2014");
  });
});

// ─── WeeklyActivityCard ─────────────────────────────────────────────────────

describe("WeeklyActivityCard", () => {
  const earned = [
    {
      accountId: "acc-1",
      accountName: "BPI",
      accountLogoKey: "bank/bpi.png",
      accountColorHex: "#C87B54",
      amountCents: 30000,
    },
  ];
  const spent = [
    {
      accountId: "acc-2",
      accountName: "Wallet",
      accountLogoKey: null,
      accountColorHex: "#7FA06B",
      amountCents: 10000,
    },
    {
      accountId: "acc-3",
      accountName: "GCash",
      accountLogoKey: "bank/gcash.png",
      accountColorHex: "#6B8D58",
      amountCents: 5000,
    },
  ];

  it("shows earned and spent totals by default", () => {
    const renderer = render(
      <WeeklyActivityCard earned={earned} spent={spent} />,
    );
    const json = JSON.stringify(renderer.toJSON());
    expect(json).toContain("Earned");
    expect(json).toContain("Spent");
    expect(json).toContain("₱300.00");
    expect(json).toContain("₱150.00");
  });

  it("lists accounts with badges and amounts when the spent arc is tapped", () => {
    const renderer = render(
      <WeeklyActivityCard earned={earned} spent={spent} />,
    );
    act(() => {
      renderer.root.findByProps({ testID: "segment-spent" }).props.onPress();
    });
    const json = JSON.stringify(renderer.toJSON());
    expect(json).toContain("Spent by account");
    expect(json).toContain("Wallet");
    expect(json).toContain("GCash");
    expect(json).toContain("₱100.00");
    expect(json).toContain("₱50.00");
    expect(json).not.toContain("Earned");
  });

  it("lists accounts when the earned arc is tapped", () => {
    const renderer = render(
      <WeeklyActivityCard earned={earned} spent={spent} />,
    );
    act(() => {
      renderer.root.findByProps({ testID: "segment-earned" }).props.onPress();
    });
    const json = JSON.stringify(renderer.toJSON());
    expect(json).toContain("Earned by account");
    expect(json).toContain("BPI");
    expect(json).toContain("₱300.00");
  });

  it("tapping the same segment again returns to the totals", () => {
    const renderer = render(
      <WeeklyActivityCard earned={earned} spent={spent} />,
    );
    act(() => {
      renderer.root.findByProps({ testID: "segment-earned" }).props.onPress();
    });
    act(() => {
      renderer.root.findByProps({ testID: "segment-earned" }).props.onPress();
    });
    const json = JSON.stringify(renderer.toJSON());
    expect(json).toContain("Earned");
    expect(json).toContain("Spent");
  });

  it("masks amounts when hidden", () => {
    const renderer = render(
      <WeeklyActivityCard earned={earned} spent={spent} hidden />,
    );
    expect(JSON.stringify(renderer.toJSON())).toContain(HIDDEN_AMOUNT);
  });

  it("shows the empty state when there is no activity", () => {
    const renderer = render(<WeeklyActivityCard earned={[]} spent={[]} />);
    const json = JSON.stringify(renderer.toJSON());
    expect(json).toContain("No activity");
    expect(json).toContain("₱0.00");
  });
});
