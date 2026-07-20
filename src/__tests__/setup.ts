/**
 * Global Jest setup — mocks for native modules used by Sloth.
 * These are required because jest-expo cannot auto-mock every package.
 */

// ─── @op-engineering/op-sqlite ─────────────────────────────────────────────
const mockDbInstance = {
  execute: jest.fn(),
  close: jest.fn(),
  delete: jest.fn(),
  transaction: jest.fn(
    async (cb: (tx: { execute: jest.Mock }) => Promise<void>) => {
      const tx = { execute: jest.fn() };
      await cb(tx);
    },
  ),
};

jest.mock("@op-engineering/op-sqlite", () => ({
  open: jest.fn(() => mockDbInstance),
}));

// ─── expo-crypto ───────────────────────────────────────────────────────────
jest.mock("expo-crypto", () => ({
  randomUUID: jest.fn(() => "00000000-0000-0000-0000-000000000001"),
  digestStringAsync: jest.fn((_algorithm: string, data: string) =>
    Promise.resolve(`hashed:${data}`),
  ),
  getRandomBytesAsync: jest.fn((byteLength: number) =>
    Promise.resolve(new Uint8Array(byteLength)),
  ),
  CryptoDigestAlgorithm: { SHA256: "SHA-256" },
}));

// ─── expo-secure-store ─────────────────────────────────────────────────────
const secureStore: Record<string, string> = {};
jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn((key: string) => {
    return Promise.resolve(secureStore[key] ?? null);
  }),
  setItemAsync: jest.fn((key: string, value: string) => {
    secureStore[key] = value;
    return Promise.resolve();
  }),
  deleteItemAsync: jest.fn((key: string) => {
    delete secureStore[key];
    return Promise.resolve();
  }),
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: "WhenUnlocked",
}));

// ─── expo-mlkit-ocr ────────────────────────────────────────────────────────
jest.mock("expo-mlkit-ocr", () => ({
  recognizeText: jest.fn((_imageUri: string) =>
    Promise.resolve({
      blocks: [
        {
          lines: [{ text: "Sample Store" }, { text: "Total: ₱150.00" }],
        },
      ],
    }),
  ),
}));

export { mockDbInstance };
