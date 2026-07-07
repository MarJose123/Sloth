# AGENTS.md — Sloth

Guidelines for Junie working on **Sloth**, a privacy-first, fully offline personal finance tracker for Android.

Repo: https://github.com/MarJose123/sloth · License: GPLv3 (copyleft)

---

## 0. Non-negotiable principle

**Zero network connectivity by design**: no cloud sync, no telemetry, no third-party data aggregation. Before adding any dependency, ask: "does this phone home?" If yes, stop and ask the user first.

---

## 1. Tech stack

- **React Native 0.86.0 + Expo SDK 57**, TypeScript
- **Expo Router v57** — file-based routing in `src/app/`
- **Uniwind v1.10.0** + **Tailwind CSS v4.3.2** (merged styling, no separate `tailwind.config.js`)
- **`@op-engineering/op-sqlite`** v17.1.1 with SQLCipher
- **Bun 1.3.14** (pinned) — only package manager
- Development on **macOS**; testing on **physical Android device**

---

## 2. Design system

Colors and fonts live in `src/global.css` using Tailwind v4's `@theme` syntax, mirrored in `src/theme/colors.ts`. No separate config file.

**Color tokens** (all defined as `--color-*` in global.css):
- `ink`, `ink-2`, `ink-3` — backgrounds
- `parchment`, `parchment-dim` — text
- `brass`, `brass-soft`, `sage` — accents
- `rust` — negatives
- `dusty-blue`, `ochre` — category extras

**Typography**: Fraunces (headlines), Manrope (body), IBM Plex Mono (labels/data).

**Key rules**:
- Category ring colors must use **at least 5 distinct hues** (real regression class: this was a bug before)
- One shared soft-ring motif reused across screens
- Bottom nav order is fixed: Home / Accounts / + / Transactions / Settings
- Android-first chrome: punch-hole camera, Material back arrows

See `.junie/skills/uniwind-brand-tokens/` before styling.

---

## 3. Data & security

- Amounts: **integer cents** (never floats)
- SQLite: **STRICT mode** tables
- Migrations: **`PRAGMA user_version`** (not a migrations library)
- SQLCipher key: 256-bit hex via `expo-crypto`, stored in SecureStore, **decoupled** from PIN/biometric auth
- DB singleton initialized in `app/index.tsx` before routing
- **`op-sqlite` config goes in `package.json`** (`"op-sqlite": { "sqlcipher": true, ... }`), **NOT** `app.json` plugins

---

## 4. Code conventions

- `SafeAreaView` from `react-native-safe-area-context` (not core)
- Lint script: `bun lint` (runs `prettier --write . && expo lint`)
- Verification:
  ```bash
  bun lint
  bun tsc --noEmit
  ```
- Always verify against actual committed config, not guesses

---

## 5. Android build & CI

- `eas build --platform android --profile staging --local --non-interactive` (on GH runner, not cloud)
- **SDK 36** (set in `app.json`), **Bun 1.3.14** (set in `eas.json`), **EAS CLI >= 20.5.1**
- Debug APK (`app-dev.apk`) for internal testing
- **EAS manages credentials** — no keystore file in repo
- `[skip ci]` convention respected via check-skip job
- 50-minute timeout; bun cache already wired

See `.junie/skills/android-ci-eas/` for details.

---

## 6. Tailwind v4 + Uniwind

**No `tailwind.config.js` file exists.** All config in `src/global.css`:
- Colors/fonts under `@theme { ... }`
- Custom utilities under `@utility { ... }`
- Uniwind wired in `metro.config.js` via `withUniwindConfig()`
- Types auto-generated to `src/uniwind-types.d.ts`

---

## 7. Explicit prohibitions

- No networking/analytics/telemetry deps without explicit user sign-off
- No `npm`/`npx` — use `bun` only
- Don't put `op-sqlite` in `app.json` plugins
- Don't create a `tailwind.config.js` — config lives in `src/global.css`
- Don't add checked-in keystore or keytool step
- Don't introduce a second ring visual motif
- Don't bump major versions (Expo/RN/Uniwind/op-sqlite) without dedicated PR discussion
- Don't change SQLite schema without `PRAGMA user_version` bump

---

## 8. How to work

- Senior dev audience (30+ years) — no beginner explanations
- Provide full, working code blocks inline, not partial diffs
- When fixing config, explain *why* the old config broke, not just the new value
