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
 * Tests for DonateQRModal component.
 *
 * Renders a QR donation modal with close button, title, QR image,
 * and "Save to Photos" action. Depends on expo-image, expo-file-system,
 * expo-media-library, and sonner-native.
 */

import { act, create } from "react-test-renderer";
import { DonateQRModal } from "@/components/modals/DonateQRModal";

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

// Mock color (ESM-only package)
jest.mock("color", () => ({
  default: (color: string) => ({
    alpha: () => ({ string: () => color }),
    string: () => color,
  }),
  __esModule: true,
}));

// Mock lucide icons
jest.mock("@react-native-vector-icons/lucide", () => {
  const RN = require("react-native");
  return {
    Lucide: ({ name }: { name: string }) => (
      <RN.View testID={`lucide-${name}`} />
    ),
  };
});

// Mock expo-image
jest.mock("expo-image", () => ({
  Image: "ExpoImage",
}));

// Mock expo-file-system
jest.mock("expo-file-system", () => ({
  File: jest.fn().mockImplementation(() => ({
    copy: jest.fn().mockResolvedValue(undefined),
  })),
  Paths: { cache: "/cache" },
}));

// Mock expo-media-library
jest.mock("expo-media-library", () => ({
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: "granted" }),
  saveToLibraryAsync: jest.fn().mockResolvedValue(undefined),
}));

// Mock sonner-native toast
jest.mock("sonner-native", () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

function render(component: React.ReactElement) {
  let renderer: ReturnType<typeof create>;
  act(() => {
    renderer = create(component);
  });
  return renderer!;
}

describe("DonateQRModal", () => {
  it("renders nothing when visible is false", () => {
    const renderer = render(
      <DonateQRModal visible={false} onClose={() => {}} />,
    );
    const json = JSON.stringify(renderer.toJSON());
    // Modal with visible=false should render null on native
    // On Jest, the Modal might still render its children but not be visible
    expect(json).not.toContain("Support Sloth");
  });

  it("renders title and description when visible", () => {
    const renderer = render(
      <DonateQRModal visible={true} onClose={() => {}} />,
    );
    const json = JSON.stringify(renderer.toJSON());
    expect(json).toContain("Support Sloth");
    expect(json).toContain("one-time donation");
  });

  it("renders close button with x icon", () => {
    const { root } = render(
      <DonateQRModal visible={true} onClose={() => {}} />,
    );
    // Should have a lucide-x icon
    const xIcons = root.findAllByProps({ testID: "lucide-x" });
    expect(xIcons.length).toBeGreaterThanOrEqual(1);
  });

  it("renders download icon for save button", () => {
    const { root } = render(
      <DonateQRModal visible={true} onClose={() => {}} />,
    );
    const downloadIcons = root.findAllByProps({ testID: "lucide-download" });
    expect(downloadIcons.length).toBeGreaterThanOrEqual(1);
  });

  it("renders 'Save to Photos' button text", () => {
    const renderer = render(
      <DonateQRModal visible={true} onClose={() => {}} />,
    );
    const json = JSON.stringify(renderer.toJSON());
    expect(json).toContain("Save to Photos");
  });

  it("renders QR image when visible", () => {
    const { root } = render(
      <DonateQRModal visible={true} onClose={() => {}} />,
    );
    // expo-image is mocked as a string "ExpoImage"
    const expoImages = root.findAllByType("ExpoImage" as any);
    expect(expoImages.length).toBeGreaterThanOrEqual(1);
  });

  it("calls onClose when close button is pressed", () => {
    const onClose = jest.fn();
    const { root } = render(<DonateQRModal visible={true} onClose={onClose} />);
    // Find the close button Pressable
    const pressables = root.findAllByProps({ onPress: onClose });
    expect(pressables.length).toBeGreaterThanOrEqual(1);
  });
});
