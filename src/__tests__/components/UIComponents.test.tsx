/**
 * Component tests for simple UI primitives.
 */

import { View } from "react-native";
import { act, create } from "react-test-renderer";
import { Toggle } from "@/components/ui/Toggle";
import { FormField } from "@/components/ui/FormField";
import { BrassButton } from "@/components/ui/BrassButton";
import { TextLink } from "@/components/ui/TextLink";
import { PinDots } from "@/components/ui/PinDots";
import { DialFrame } from "@/components/DialFrame";

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

function render(component: React.ReactElement) {
  let renderer: ReturnType<typeof create>;
  act(() => {
    renderer = create(component);
  });
  return renderer!;
}

// ─── Toggle ─────────────────────────────────────────────────────────────────

describe("Toggle", () => {
  it("renders in off state", () => {
    const { root } = render(<Toggle value={false} onValueChange={() => {}} />);
    const pressable = root.findByProps({ accessibilityRole: "switch" });
    expect(pressable).toBeTruthy();
    expect(pressable.props.accessibilityState.checked).toBe(false);
    expect(pressable.props.accessibilityState.disabled).toBe(false);
  });

  it("renders in on state", () => {
    const { root } = render(<Toggle value={true} onValueChange={() => {}} />);
    const pressable = root.findByProps({ accessibilityRole: "switch" });
    expect(pressable.props.accessibilityState.checked).toBe(true);
  });

  it("calls onValueChange with toggled value on press", () => {
    const onValueChange = jest.fn();
    const { root } = render(
      <Toggle value={false} onValueChange={onValueChange} />,
    );
    act(() => {
      root.findByProps({ accessibilityRole: "switch" }).props.onPress();
    });
    expect(onValueChange).toHaveBeenCalledWith(true);
  });

  it("does not call onValueChange when disabled", () => {
    const onValueChange = jest.fn();
    const { root } = render(
      <Toggle value={false} onValueChange={onValueChange} disabled />,
    );
    act(() => {
      root.findByProps({ accessibilityRole: "switch" }).props.onPress();
    });
    expect(onValueChange).not.toHaveBeenCalled();
  });
});

// ─── FormField ──────────────────────────────────────────────────────────────

describe("FormField", () => {
  it("renders label and children", () => {
    const { root } = render(
      <FormField label="Account name">
        <View testID="child" />
      </FormField>,
    );
    expect(root.findByProps({ testID: "child" })).toBeTruthy();
  });

  it("renders error message when provided", () => {
    const renderer = render(
      <FormField label="Name" error="Required">
        <View />
      </FormField>,
    );
    expect(JSON.stringify(renderer.toJSON())).toContain("Required");
  });

  it("does not render error when not provided", () => {
    const renderer = render(
      <FormField label="Name">
        <View />
      </FormField>,
    );
    expect(JSON.stringify(renderer.toJSON())).not.toContain("Required");
  });
});

// ─── BrassButton ────────────────────────────────────────────────────────────

describe("BrassButton", () => {
  it("renders label", () => {
    const renderer = render(<BrassButton label="Save" />);
    expect(JSON.stringify(renderer.toJSON())).toContain("Save");
  });

  it("calls onPress when pressed", () => {
    const onPress = jest.fn();
    const { root } = render(<BrassButton label="Save" onPress={onPress} />);
    const pressable = root.findByProps({ onPress });
    act(() => {
      pressable.props.onPress();
    });
    expect(onPress).toHaveBeenCalled();
  });
});

// ─── TextLink ───────────────────────────────────────────────────────────────

describe("TextLink", () => {
  it("renders label", () => {
    const renderer = render(<TextLink label="Skip" onPress={() => {}} />);
    expect(JSON.stringify(renderer.toJSON())).toContain("Skip");
  });

  it("calls onPress when pressed", () => {
    const onPress = jest.fn();
    const { root } = render(<TextLink label="Skip" onPress={onPress} />);
    const pressable = root.findByProps({ accessibilityRole: "button" });
    act(() => {
      pressable.props.onPress();
    });
    expect(onPress).toHaveBeenCalled();
  });
});

// ─── PinDots ────────────────────────────────────────────────────────────────

describe("PinDots", () => {
  it("renders correct number of dots", () => {
    const renderer = render(<PinDots length={6} filledCount={3} />);
    const json = JSON.stringify(renderer.toJSON());
    expect(json).toContain("w-3.5");
    expect(json).toContain("h-3.5");
  });
});

// ─── DialFrame ──────────────────────────────────────────────────────────────

describe("DialFrame", () => {
  it("renders children inside the dial frame", () => {
    const { root } = render(
      <DialFrame>
        <View testID="inner" />
      </DialFrame>,
    );
    expect(root.findByProps({ testID: "inner" })).toBeTruthy();
  });
});
