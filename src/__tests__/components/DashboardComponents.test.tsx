/**
 * Tests for dashboard components: TransactionRow, AccountSwitcher,
 * EmptyAccountsCard, CategoryRingCard.
 */

import { act, create } from "react-test-renderer";
import { TransactionRow } from "@/components/dashboard/TransactionRow";
import { AccountSwitcher } from "@/components/dashboard/AccountSwitcher";
import { EmptyAccountsCard } from "@/components/dashboard/EmptyAccountsCard";
import { CategoryRingCard } from "@/components/dashboard/CategoryRingCard";

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
    },
    {
      id: "acc-2",
      name: "Metro",
      type: "checking" as const,
      colorHex: "#7FA06B",
      logoKey: null,
      balanceCents: 50000,
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
