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

import { open, type DB } from "@op-engineering/op-sqlite";
import { getOrCreateDbEncryptionKey } from "./key";
import { runMigrations } from "./migrations";

let dbInstance: DB | null = null;
let initPromise: Promise<DB> | null = null;

/**
 * Lazily opens the single app-wide DB connection. Per op-sqlite guidance,
 * exactly one connection should exist for the app's lifetime — callers
 * should import `getDb()`, never call `open()` directly elsewhere.
 */
export async function getDb(): Promise<DB> {
  if (dbInstance) return dbInstance;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const encryptionKey = await getOrCreateDbEncryptionKey();

    const db = open({
      name: "sloth.sqlite",
      encryptionKey,
    });

    await runMigrations(db);

    dbInstance = db;
    return db;
  })();

  return initPromise;
}

/** For an explicit "erase all data" settings action only. */
export async function closeAndDeleteDb(): Promise<void> {
  if (!dbInstance) return;
  dbInstance.close();
  dbInstance.delete();
  dbInstance = null;
  initPromise = null;
}
