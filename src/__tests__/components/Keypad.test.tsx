/**
 * Tests for Keypad component.
 *
 * Keypad renders a 3×4 circle keypad with digits 0-9, backspace, and a ghost key.
 * Uses jest.spyOn for useWindowDimensions instead of mocking the entire react-native module.
 */

import { act, create } from "react-test-renderer";
import { Keypad } from "@/components/Keypad";

function render(component: React.ReactElement) {
  let renderer: ReturnType<typeof create>;
  act(() => {
    renderer = create(component);
  });
  return renderer!;
}

describe("Keypad", () => {
  beforeEach(() => {
    jest
      .spyOn(require("react-native"), "useWindowDimensions")
      .mockReturnValue({ width: 375, height: 812, scale: 1, fontScale: 1 });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("calls onDigit when a digit key is pressed", () => {
    const onDigit = jest.fn();
    const onBackspace = jest.fn();
    const { root } = render(
      <Keypad onDigit={onDigit} onBackspace={onBackspace} />,
    );

    const key5 = root.findByProps({ accessibilityLabel: "Digit 5" });
    act(() => {
      key5.props.onPress();
    });
    expect(onDigit).toHaveBeenCalledWith("5");
  });

  it("calls onDigit with '0' when zero key is pressed", () => {
    const onDigit = jest.fn();
    const onBackspace = jest.fn();
    const { root } = render(
      <Keypad onDigit={onDigit} onBackspace={onBackspace} />,
    );

    const key0 = root.findByProps({ accessibilityLabel: "Digit 0" });
    act(() => {
      key0.props.onPress();
    });
    expect(onDigit).toHaveBeenCalledWith("0");
  });

  it("calls onBackspace when backspace key is pressed", () => {
    const onDigit = jest.fn();
    const onBackspace = jest.fn();
    const { root } = render(
      <Keypad onDigit={onDigit} onBackspace={onBackspace} />,
    );

    const backspace = root.findByProps({ accessibilityLabel: "Backspace" });
    act(() => {
      backspace.props.onPress();
    });
    expect(onBackspace).toHaveBeenCalled();
  });

  it("renders all digit keys", () => {
    const { root } = render(
      <Keypad onDigit={() => {}} onBackspace={() => {}} />,
    );
    for (let i = 1; i <= 9; i++) {
      const key = root.findByProps({ accessibilityLabel: `Digit ${i}` });
      expect(key).toBeTruthy();
    }
    const key0 = root.findByProps({ accessibilityLabel: "Digit 0" });
    expect(key0).toBeTruthy();

    const bs = root.findByProps({ accessibilityLabel: "Backspace" });
    expect(bs).toBeTruthy();
  });
});
