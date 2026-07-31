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
 * Component tests for the receipt scan screen (Screen 13).
 *
 * Focus: the frosted scrim that dims everything outside the dashed scan
 * frame while the frame area itself stays clear.
 */

import { Dimensions, StyleSheet, View } from "react-native";
import { act, create } from "react-test-renderer";
import ReceiptScanScreen from "@/app/receipt-scan";

// Mock NativeWind's VariableContextProvider — handled by Metro/Babel, not Jest.
jest.mock("nativewind", () => ({
  VariableContextProvider: ({ children }: { children: React.ReactNode }) =>
    children,
}));

// Mock ThemeContext — useColors and useTheme return predictable values.
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

// Camera permission state — mutable so tests can flip it.
const mockPermissions: { granted: boolean; canAskAgain: boolean } = {
  granted: true,
  canAskAgain: true,
};

jest.mock("expo-camera", () => ({
  CameraView: () => null,
  useCameraPermissions: () => [mockPermissions, jest.fn()],
}));

jest.mock("expo-router", () => ({
  router: { back: jest.fn(), replace: jest.fn() },
}));

// expo-blur is a native module — render BlurView as a plain View in tests so
// style assertions still work, and track render count.
jest.mock("expo-blur", () => {
  const { View: RNView } =
    jest.requireActual<typeof import("react-native")>("react-native");
  return {
    BlurView: jest.fn(
      ({ style, ...props }: React.ComponentProps<typeof RNView>) => (
        <RNView {...props} style={style} />
      ),
    ),
  };
});

jest.mock("@react-native-vector-icons/lucide", () => ({
  Lucide: () => null,
}));

jest.mock("@/hooks/useToast", () => ({
  useToast: () => ({
    error: jest.fn(),
    success: jest.fn(),
    info: jest.fn(),
    warning: jest.fn(),
  }),
}));

jest.mock("@/lib/ocr", () => ({
  extractReceiptData: jest.fn(),
  isOcrAvailable: jest.fn().mockReturnValue(true),
  parsePhilippineAmount: jest.fn(),
  formatPhilippineCurrency: (cents: number) => `\u20B1${cents}`,
  formatReceiptDate: (dateStr: string | null) => dateStr ?? "",
}));

const SCRIM_COLOR = "rgba(8,9,13,0.35)";
const FRAME_TOP = 100;
const FRAME_LEFT = 25;
const FRAME_RIGHT = 25;
const FRAME_HEIGHT_RATIO = 0.76;

function render(component: React.ReactElement) {
  let renderer: ReturnType<typeof create>;
  act(() => {
    renderer = create(component);
  });
  return renderer!;
}

function findScrimStrips(root: ReturnType<typeof create>["root"]) {
  return root.findAll(
    (node) =>
      node.type === View &&
      StyleSheet.flatten(node.props.style)?.backgroundColor === SCRIM_COLOR,
  );
}

describe("ReceiptScanScreen", () => {
  beforeEach(() => {
    mockPermissions.granted = true;
  });

  it("renders four frosted BlurView strips around the scan frame when idle", () => {
    const { root } = render(<ReceiptScanScreen />);
    const strips = findScrimStrips(root);

    // Top, left, right, bottom — one blur strip per side of the frame
    expect(strips).toHaveLength(4);

    // Each strip is a BlurView (frosted), not a plain scrim
    const { BlurView } = jest.requireMock("expo-blur");
    expect(BlurView).toHaveBeenCalledTimes(4);

    const screenHeight = Dimensions.get("window").height;
    const frameBottom =
      FRAME_TOP + Math.round(screenHeight * FRAME_HEIGHT_RATIO);

    const flatten = (node: (typeof strips)[number]) =>
      StyleSheet.flatten(node.props.style);

    // Top strip spans the full width down to the frame's top edge
    expect(flatten(strips[0])).toMatchObject({
      top: 0,
      left: 0,
      right: 0,
      height: FRAME_TOP,
    });
    // Left strip runs from the frame's top edge down, only as wide as the
    // frame's left inset
    expect(flatten(strips[1])).toMatchObject({
      top: FRAME_TOP,
      left: 0,
      width: FRAME_LEFT,
      bottom: 0,
    });
    // Right strip mirrors the left one
    expect(flatten(strips[2])).toMatchObject({
      top: FRAME_TOP,
      right: 0,
      width: FRAME_RIGHT,
      bottom: 0,
    });
    // Bottom strip starts exactly at the frame's bottom edge, within the
    // frame's horizontal inset
    expect(flatten(strips[3])).toMatchObject({
      top: frameBottom,
      left: FRAME_LEFT,
      right: FRAME_RIGHT,
      bottom: 0,
    });
  });

  it("keeps the dashed scan frame rendered on top of the scrim", () => {
    const { root } = render(<ReceiptScanScreen />);
    const frames = root.findAll(
      (node) =>
        node.type === View &&
        StyleSheet.flatten(node.props.style)?.borderStyle === "dashed",
    );
    expect(frames).toHaveLength(1);

    const frameStyle = StyleSheet.flatten(frames[0].props.style);
    expect(frameStyle).toMatchObject({
      borderColor: "#C87B54", // colors.brass
      borderWidth: 1.5,
      borderRadius: 10,
    });
  });

  it("does not render the blur strips when camera permission is denied", () => {
    mockPermissions.granted = false;
    const { root } = render(<ReceiptScanScreen />);
    expect(findScrimStrips(root)).toHaveLength(0);
  });
});
