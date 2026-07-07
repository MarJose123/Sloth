---
name: op-sqlite-sqlcipher
description: Use when configuring, debugging, or extending @op-engineering/op-sqlite with SQLCipher encryption — plugin config location (package.json, NOT app.json), key management, dev-build requirement, STRICT tables, and PRAGMA user_version migrations.
---

# op-sqlite + SQLCipher (Sloth)

**Config location**: `package.json` under `"op-sqlite": { ... }`, NOT `app.json` plugins.

Putting it in `app.json` plugins array causes: "Cannot find package better-sqlite3" because Expo falls back to the Node.js facade.

**Key setup** (current in package.json):
```json
"op-sqlite": {
  "sqlcipher": true,
  "performanceMode": true
}
```

## Database layer

- Initialized in `app/index.tsx` **before** routing starts
- 256-bit SQLCipher key: generated via `expo-crypto`, stored in SecureStore with `WHEN_UNLOCKED_THIS_DEVICE_ONLY`
- Key is **decoupled** from PIN/biometric unlock — don't conflate the two
- Tables use **STRICT mode**
- Amounts stored as **integer cents**
- Migrations keyed on **`PRAGMA user_version`**, not a migrations library

## Checklist for DB changes

- [ ] `op-sqlite` config still in `package.json`, not `app.json`
- [ ] New/changed tables declared `STRICT`
- [ ] Money columns are `INTEGER` (cents), not `REAL`
- [ ] Migration step added + `PRAGMA user_version` bumped
- [ ] Verified on dev build on physical Android device (not Expo Go)
