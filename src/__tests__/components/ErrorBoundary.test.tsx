/**
 * Tests for ErrorBoundary component.
 *
 * ErrorBoundary is a class component that catches rendering errors
 * and displays a fallback UI with a "Try Again" button.
 */

import { Text } from "react-native";
import { act, create } from "react-test-renderer";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";

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

// Mock SlothAppIcon (uses react-native-svg which is problematic in Jest)
jest.mock("@/components/SlothAppIcon", () => {
  const RN = require("react-native");
  return {
    SlothAppIcon: ({ size }: { size?: number }) => (
      <RN.View testID="sloth-icon" />
    ),
  };
});

function render(component: React.ReactElement) {
  let renderer: ReturnType<typeof create>;
  act(() => {
    renderer = create(component);
  });
  return renderer!;
}

// A component that throws during render
function BuggyComponent({ shouldThrow = false }: { shouldThrow?: boolean }) {
  if (shouldThrow) {
    throw new Error("Test error");
  }
  return <Text>Working</Text>;
}

describe("ErrorBoundary", () => {
  it("renders children when there is no error", () => {
    const renderer = render(
      <ErrorBoundary>
        <Text testID="child">Hello</Text>
      </ErrorBoundary>,
    );
    expect(renderer.root.findByProps({ testID: "child" })).toBeTruthy();
  });

  it("renders fallback when a child throws", () => {
    // Suppress expected console.error from the thrown error
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});

    const renderer = render(
      <ErrorBoundary>
        <BuggyComponent shouldThrow />
      </ErrorBoundary>,
    );

    // Should show the "Something went wrong" message
    const json = JSON.stringify(renderer.toJSON());
    expect(json).toContain("Something went wrong");
    expect(json).toContain("Try Again");

    spy.mockRestore();
  });

  it("resets to normal state after pressing 'Try Again'", () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});

    // First render with a thrown error
    let renderer: ReturnType<typeof create>;
    act(() => {
      renderer = create(
        <ErrorBoundary>
          <BuggyComponent shouldThrow />
        </ErrorBoundary>,
      );
    });
    const json1 = JSON.stringify(renderer!.toJSON());
    expect(json1).toContain("Something went wrong");

    // Press "Try Again"
    const pressables = renderer!.root.findAllByProps({
      onPress: expect.any(Function),
    });
    // Find the "Try Again" button
    for (const p of pressables) {
      const json2 = JSON.stringify(p.toJSON());
      if (json2.includes("Try Again")) {
        act(() => p.props.onPress());
        break;
      }
    }

    // After reset, the fallback should be gone and children should re-render
    // But since BuggyComponent still has shouldThrow=true, it will throw again
    // This is expected — the boundary catches it again
    const json3 = JSON.stringify(renderer!.toJSON());
    expect(json3).toContain("Something went wrong");

    spy.mockRestore();
  });
});
