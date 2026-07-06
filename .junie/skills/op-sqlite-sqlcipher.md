---
name: op-sqlite-sqlcipher
description: Use when configuring, debugging, or extending @op-engineering/op-sqlite with SQLCipher encryption in Sloth — plugin config location, key management, dev-build requirement, STRICT tables, and PRAGMA user_version migrations.
---

# op-sqlite + SQLCipher (Sloth)

Use this skill for anything touching the database layer: `op-sqlite` setup, SQLCipher
encryption, key storage, schema, or migrations.

## Key Principles

- Sloth's database is **encrypted at rest** with SQLCipher via `@op-engineering/op-sqlite`.
  There is no "unencrypted mode" — every table lives in the encrypted DB.
- The app **cannot run in Expo Go**. It requires a dev build (`expo prebuild` +
  native build) because `op-sqlite` ships native code. If a task seems to assume Expo
  Go, stop and flag it.
- The encryption key and the app-unlock mechanism (PIN/biometric) are **two separate
  concerns**. Don't merge them into one code path.

## Configuration

- `op-sqlite`'s Expo plugin configuration belongs in **`package.json`**, under the
  package's own config block — **not** in the `app.json` (or `app.config.ts`) `plugins`
  array.
  - Putting it in `plugins` causes Expo to resolve the JS/Node facade instead of the
    native binding, which surfaces as:
    ```
    Cannot find package 'better-sqlite3'
    ```
  - If you see that error, the first thing to check is where the `op-sqlite` config
    lives, not whether `better-sqlite3` needs installing.

## Key management

- Generate a **256-bit key as hex** using `expo-crypto`.
- Store it in `expo-secure-store` with accessibility level
  `WHEN_UNLOCKED_THIS_DEVICE_ONLY`.
- The DB singleton must be initialized in `app/index.tsx` (or the app's earliest entry
  point) **before** Expo Router starts routing to any screen. Don't lazily initialize
  the DB inside a screen's `useEffect` — screens assume the DB is already open.

## Schema conventions

- All tables use SQLite **STRICT mode**.
- All monetary amounts are stored as **integer cents** (never `REAL`/float). Convert to
  display currency only at the formatting layer.
- Schema changes go through a migration keyed on **`PRAGMA user_version`** — bump the
  version, add a migration step, never silently `ALTER TABLE` without a version bump.

## Checklist before shipping a DB change

- [ ] New/changed tables declared `STRICT`
- [ ] Any money column is `INTEGER` (cents), not `REAL`
- [ ] Migration step added and gated on a `PRAGMA user_version` bump
- [ ] `op-sqlite` config still lives in `package.json`, not `app.json` plugins
- [ ] Verified on a dev build on a physical Android device (not Expo Go, not assumed-only-emulator)
- [ ] SecureStore key handling untouched unless the task is specifically about key rotation
