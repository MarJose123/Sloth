import { Paths, File } from "expo-file-system";
import * as DocumentPicker from "expo-document-picker";
import { getDb, closeAndDeleteDb } from "@/lib/db/client";

/**
 * Encrypted backup and restore for the SQLCipher database.
 *
 * The backup is a raw copy of the encrypted .sqlite file — it remains
 * encrypted with the same 256-bit AES key stored in SecureStore.
 * Restoring requires both the backup file AND the original SecureStore
 * key (which persists across app reinstalls on the same device only).
 *
 * There is no plaintext export. To create human-readable data, use the
 * CSV export (src/lib/export.ts) instead.
 */

/**
 * Creates a timestamped, encrypted backup of the current database.
 * The backup file is written to the app's cache directory, then shared
 * via the OS share sheet.
 *
 * @returns The file URI of the created backup, or null if sharing
 *          is unavailable on the device.
 */
export async function createEncryptedBackup(): Promise<string | null> {
  const cacheDir = Paths.cache;
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, "");
  const backupFilename = `sloth_backup_${timestamp}.db`;
  const backupFile = new File(cacheDir, backupFilename);

  const db = getDb();
  // op-sqlite exposes the file path via db.getDatabasePath()
  const dbPath = (
    db as unknown as { getDatabasePath?: () => string }
  ).getDatabasePath?.();

  let sourcePath: string | null = null;

  if (dbPath) {
    sourcePath = dbPath;
  } else {
    // Fallback: check the known path in the documents directory
    const docDir = Paths.document;
    const knownFile = new File(docDir, "sloth.sqlite");
    if (knownFile.exists) {
      sourcePath = knownFile.uri;
    }
  }

  if (!sourcePath) {
    throw new Error("Could not locate database file for backup");
  }

  // Copy the encrypted DB file
  const sourceFile = new File(sourcePath);
  await sourceFile.copy(backupFile);

  // Share via React Native's built-in Share API
  const { Share } = await import("react-native");
  await Share.share(
    {
      url: backupFile.uri,
      title: backupFilename,
    },
    { dialogTitle: "Save encrypted backup" },
  );

  return backupFile.uri;
}

/**
 * Restores the database from a user-selected backup file.
 *
 * WARNING: This replaces the current database entirely. All current data
 * will be lost. The restore process:
 *   1. Closes and deletes the current database.
 *   2. Copies the selected backup file to the database location.
 *   3. Re-opens the database (migrations re-run, which is safe due to
 *      IF NOT EXISTS / PRAGMA user_version guards).
 *
 * @returns true if the restore succeeded, false if the user cancelled
 *          the file picker.
 */
export async function restoreFromBackup(): Promise<boolean> {
  const result = await DocumentPicker.getDocumentAsync({
    type: "application/octet-stream",
    copyToCacheDirectory: true,
  });

  if (result.canceled || !result.assets?.[0]) return false;

  const backupUri = result.assets[0].uri;
  const docDir = Paths.document;
  const dbFile = new File(docDir, "sloth.sqlite");

  // Close and delete the current database
  await closeAndDeleteDb();

  // Copy the backup to the database location
  const backupFile = new File(backupUri);
  await backupFile.copy(dbFile);

  // Re-open the database — getDb() will re-initialise
  await getDb();

  return true;
}

/**
 * Returns the file size (in bytes) of the most recent backup, or 0 if
 * no backup exists in the cache directory.
 */
export async function getLatestBackupSize(): Promise<number> {
  try {
    const cacheDir = Paths.cache;
    const files = await cacheDir.list();
    const backupFiles = files
      .filter((f) => f.name.startsWith("sloth_backup_"))
      .sort((a, b) => b.name.localeCompare(a.name));

    if (backupFiles.length === 0) return 0;

    return backupFiles[0].size ?? 0;
  } catch {
    return 0;
  }
}
