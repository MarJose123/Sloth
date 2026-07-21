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
 * Tests for navigation and icon components: TabBarButton, AddTabButton,
 * FingerprintIcon, SlothAppIcon.
 */

import { act, create } from "react-test-renderer";
import { TabBarButton } from "@/components/navigation/TabBarButton";
import { AddTabButton } from "@/components/navigation/AddTabButton";
import { FingerprintIcon } from "@/components/ui/FingerprintIcon";
import { SlothAppIcon } from "@/components/SlothAppIcon";
import { HomeIcon } from "@/components/navigation/icons";

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

// Mock react-native-svg (for SlothAppIcon)
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

// Mock lucide icons
jest.mock("@react-native-vector-icons/lucide", () => {
  const React = require("react");
  return {
    Lucide: ({ name }: { name: string }) =>
      React.createElement("lucide", { "data-name": name }),
  };
});

function render(component: React.ReactElement) {
  let renderer: ReturnType<typeof create>;
  act(() => {
    renderer = create(component);
  });
  return renderer!;
}

// ─── TabBarButton ──────────────────────────────────────────────────────────

describe("TabBarButton", () => {
  it("renders an icon", () => {
    const renderer = render(
      <TabBarButton Icon={HomeIcon} isFocused={false} onPress={() => {}} />,
    );
    const json = JSON.stringify(renderer.toJSON());
    expect(json).toContain("house");
  });
});

// ─── AddTabButton ──────────────────────────────────────────────────────────

describe("AddTabButton", () => {
  it("renders a pressable plus button", () => {
    const renderer = render(<AddTabButton onPress={() => {}} />);
    const json = JSON.stringify(renderer.toJSON());
    expect(json).toContain("plus");
  });

  it("calls onPress when pressed", () => {
    const onPress = jest.fn();
    const { root } = render(<AddTabButton onPress={onPress} />);
    const pressables = root.findAllByProps({ onPress });
    for (const p of pressables) {
      act(() => p.props.onPress());
    }
    expect(onPress).toHaveBeenCalled();
  });
});

// ─── FingerprintIcon ───────────────────────────────────────────────────────

describe("FingerprintIcon", () => {
  it("renders a fingerprint icon", () => {
    const renderer = render(<FingerprintIcon />);
    const json = JSON.stringify(renderer.toJSON());
    expect(json).toContain("fingerprint");
  });
});

// ─── SlothAppIcon ──────────────────────────────────────────────────────────

describe("SlothAppIcon", () => {
  it("renders without crashing", () => {
    const renderer = render(<SlothAppIcon size={112} />);
    expect(renderer.toJSON()).toBeTruthy();
  });

  it("renders with default size", () => {
    const renderer = render(<SlothAppIcon />);
    expect(renderer.toJSON()).toBeTruthy();
  });
});

// ─── HomeIcon (icon factory) ───────────────────────────────────────────────

describe("HomeIcon", () => {
  it("renders as a lucide house icon", () => {
    const renderer = render(<HomeIcon size={24} color="#000" />);
    const json = JSON.stringify(renderer.toJSON());
    expect(json).toContain("house");
  });
});
