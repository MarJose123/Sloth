/**
 * Tests for src/lib/selectionBus.ts
 *
 * Simple pub/sub event emitter used for picker-sheet communication.
 * Pure logic — no native module mocking required.
 */

import { onAccountSelected, onCategorySelected } from "@/lib/selectionBus";

describe("selectionBus", () => {
  it("onAccountSelected delivers value to subscriber", () => {
    const listener = jest.fn();
    const unsubscribe = onAccountSelected.subscribe(listener);

    onAccountSelected.emit("account-1");
    expect(listener).toHaveBeenCalledWith("account-1");

    unsubscribe();
  });

  it("onCategorySelected delivers value to subscriber", () => {
    const listener = jest.fn();
    const unsubscribe = onCategorySelected.subscribe(listener);

    onCategorySelected.emit("category-5");
    expect(listener).toHaveBeenCalledWith("category-5");

    unsubscribe();
  });

  it("does not deliver after unsubscribe", () => {
    const listener = jest.fn();
    const unsubscribe = onAccountSelected.subscribe(listener);
    unsubscribe();
    onAccountSelected.emit("ghost");
    expect(listener).not.toHaveBeenCalled();
  });

  it("silently emits when no listener is registered", () => {
    // Should not throw
    expect(() => {
      onCategorySelected.emit("any-value");
    }).not.toThrow();
  });

  it("allows re-subscribing after unsubscribe", () => {
    const listener1 = jest.fn();
    const listener2 = jest.fn();

    const unsub1 = onAccountSelected.subscribe(listener1);
    unsub1();

    const unsub2 = onAccountSelected.subscribe(listener2);
    onAccountSelected.emit("re-subscribed");

    expect(listener1).not.toHaveBeenCalled();
    expect(listener2).toHaveBeenCalledWith("re-subscribed");
    unsub2();
  });
});
