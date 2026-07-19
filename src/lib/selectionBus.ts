/**
 * selectionBus.ts
 *
 * Minimal event emitter for communicating picker-sheet selections
 * back to the parent screen (Add Transaction, etc.).
 *
 * Usage:
 *   Subscriber (parent) – subscribe on mount, unsubscribe on unmount.
 *   Emitter (sheet)     – emit the value, then `router.back()`.
 */

type Listener<T> = (value: T) => void;

function createBus<Payload>() {
  let listener: Listener<Payload> | null = null;

  return {
    /** Register a listener. Returns an unsubscribe function. */
    subscribe(fn: Listener<Payload>): () => void {
      listener = fn;
      return () => {
        listener = null;
      };
    },
    /** Emit a value to the registered listener (if any). */
    emit(value: Payload): void {
      listener?.(value);
    },
  };
}

export const onAccountSelected = createBus<string>();
export const onCategorySelected = createBus<string>();
