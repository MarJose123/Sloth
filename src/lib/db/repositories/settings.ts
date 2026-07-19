import { getDb } from "../client";
import type { SettingRow } from "@/types";

/**
 * DB-backed settings table.
 *
 * Complements the SecureStore-based `storage` module (src/lib/storage.ts).
 * SecureStore is used for auth/sensitive flags (onboarding, biometric, PIN).
 * This repository is for general app settings that don't need keystore
 * protection (e.g., last-selected account, UI preferences).
 *
 * Both systems coexist — this is NOT a replacement for SecureStore.
 */

/**
 * Retrieves a setting value by key. Returns null when the key has never
 * been set, which is the expected state before first use.
 */
export async function getSetting(key: string): Promise<string | null> {
  const db = await getDb();
  const { rows } = await db.execute(
    "SELECT value FROM settings WHERE key = ?;",
    [key],
  );
  const row = (rows as unknown as SettingRow[])[0];
  return row?.value ?? null;
}

/**
 * Sets a setting (INSERT OR REPLACE). Values are always stored as strings;
 * callers are responsible for serialisation (JSON.stringify for objects).
 */
export async function setSetting(key: string, value: string): Promise<void> {
  const db = await getDb();
  await db.execute(
    "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?);",
    [key, value],
  );
}

/**
 * Deletes a setting by key. No-op if the key doesn't exist.
 */
export async function deleteSetting(key: string): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM settings WHERE key = ?;", [key]);
}

/**
 * Returns all settings as a flat key-value record. Useful for backup/export.
 */
export async function getAllSettings(): Promise<Record<string, string>> {
  const db = await getDb();
  const { rows } = await db.execute("SELECT key, value FROM settings;");
  const record: Record<string, string> = {};
  for (const row of rows as unknown as SettingRow[]) {
    record[row.key] = row.value;
  }
  return record;
}
