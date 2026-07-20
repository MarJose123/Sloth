/**
 * Tests for src/lib/db/repositories/settings.ts
 */

import { mockDbInstance } from "@/__tests__/setup";
import {
  getSetting,
  setSetting,
  deleteSetting,
  getAllSettings,
} from "@/lib/db/repositories/settings";

beforeEach(() => {
  jest.clearAllMocks();
});

describe("getSetting", () => {
  it("returns the value when key exists", async () => {
    mockDbInstance.execute.mockResolvedValue({
      rows: [{ key: "theme", value: "dark" }],
    });

    const val = await getSetting("theme");
    expect(val).toBe("dark");
  });

  it("returns null when key does not exist", async () => {
    mockDbInstance.execute.mockResolvedValue({ rows: [] });
    expect(await getSetting("missing")).toBeNull();
  });
});

describe("setSetting", () => {
  it("executes INSERT OR REPLACE", async () => {
    mockDbInstance.execute.mockResolvedValue({ rows: [] });

    await setSetting("theme", "light");
    expect(mockDbInstance.execute).toHaveBeenCalledWith(
      expect.stringContaining("INSERT OR REPLACE"),
      ["theme", "light"],
    );
  });
});

describe("deleteSetting", () => {
  it("executes DELETE with correct key", async () => {
    mockDbInstance.execute.mockResolvedValue({ rows: [] });

    await deleteSetting("theme");
    expect(mockDbInstance.execute).toHaveBeenCalledWith(
      expect.stringContaining("DELETE FROM settings"),
      ["theme"],
    );
  });
});

describe("getAllSettings", () => {
  it("returns all settings as a key-value record", async () => {
    mockDbInstance.execute.mockResolvedValue({
      rows: [
        { key: "theme", value: "dark" },
        { key: "currency", value: "PHP" },
      ],
    });

    const all = await getAllSettings();
    expect(all).toEqual({ theme: "dark", currency: "PHP" });
  });

  it("returns empty object when no settings exist", async () => {
    mockDbInstance.execute.mockResolvedValue({ rows: [] });
    expect(await getAllSettings()).toEqual({});
  });
});
