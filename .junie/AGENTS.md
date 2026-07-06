# AGENTS.md — Sloth

Guidelines for Junie (and any other AGENTS.md-compatible agent) working on **Sloth**,
a privacy-first, fully offline personal finance tracker for Android (iOS is a future target).

Repo: https://github.com/MarJose123/sloth · License: GPLv3 (copyleft — do not introduce
MIT/permissive-only dependencies without flagging it first)

---

## 0. Non-negotiable project principle

Sloth is **zero network connectivity by design**: no cloud sync, no telemetry, no
third-party data aggregation, no analytics SDKs. Before adding *any* dependency, ask:
"does this phone home?" If yes, or if you're not sure, stop and ask the user instead of
adding it. This constraint outranks convenience, popular defaults, and "everyone uses this."

---

## 1. Tech stack

- **React Native + Expo SDK 57**, TypeScript
- **Expo Router v57** — file-based routing under `src/app/`
- **NativeWind v4** + Tailwind CSS v3
- **`@op-engineering/op-sqlite`** with SQLCipher — encryption at rest. Requires a
  **dev build**; this app cannot run in Expo Go. See `.junie/skills/op-sqlite-sqlcipher/`.
- **`expo-secure-store`** — biometric-gated key storage
- **`lottie-react-native`** — onboarding/animation screens
- **`react-native-svg`** — SVG assets, icons, mascot
- **Bun** — the only package manager. Never suggest or run `npm`/`npx`/`yarn` commands.
- Development on **macOS**; testing on a **physical Android device** (not emulator-first).

---

## 2. Design system (do not invent new tokens)

Colors are defined once and must be mirrored in **both** `tailwind.config.js` and a
`colors.ts` file (for SVG / non-Tailwind contexts). See
`.junie/skills/nativewind-brand-tokens/` before touching any screen's styling.

| Token | Value | Role |
|---|---|---|
| `--ink` | `#1B1F1A` | Background |
| `--ink-2` | `#242920` | Card surface |
| `--ink-3` | `#2E3428` | Tertiary surface |
| `--parchment` | `#F3EEE1` | Primary text |
| `--parchment-dim` | `#A79F8C` | Secondary text |
| `--brass` | `#C87B54` | Primary accent (clay/terracotta) |
| `--sage` | `#7FA06B` | Secondary accent (moss) |
| `--rust` | `#9C4A3D` | Alerts / negative |
| dusty blue | `#6E8FB0` | Category extra |
| ochre | `#C9A227` | Category extra |

- Category ring/legend colors must use **at least 5 distinct hues** — do not let two
  categories share a color, and don't cycle only `brass`/`sage`. This was a real bug
  (only 3 hues cycling across 5 categories) — treat it as a regression class, not a
  one-off fix.
- Typography: **Fraunces** (serif) for balances/headlines, **Manrope** for UI body,
  **IBM Plex Mono** for labels, categories, and data/mono contexts.
- Visual motif: a plain soft ring (no lock-dial ticks) is reused for both the biometric
  frame and budget/category progress rings — one shape, reused with purpose. Don't add a
  second ring style.
- Mascot: simple line-art sloth-face SVG on splash/onboarding — keep it linework, not filled.
- Bottom nav order is fixed: **Home / Accounts / + (Add) / Transactions / Settings**,
  with a raised brass "+" center button.
- Android-first chrome: punch-hole camera cutout (not an iOS notch), Material-style
  back arrows, not iOS chevrons.
- A full HTML mockup of all 19 screens lives at `vault-app-mockup.html` in the project
  root (or wherever it's been moved) — treat it as the source of truth for spacing,
  copy tone, and component shape before inventing a new layout.

---

## 3. Data & security architecture

- Amounts are stored as **integer cents**, never floats.
- SQLite tables use **STRICT mode**.
- Migrations use **`PRAGMA user_version`**, not a migrations library.
- The SQLCipher key is a **256-bit hex key** generated via `expo-crypto`, stored in
  SecureStore with `WHEN_UNLOCKED_THIS_DEVICE_ONLY`, and is **decoupled** from the
  PIN/biometric auth layer — don't conflate "app unlock" with "database encryption key."
- The DB singleton is initialized in `app/index.tsx` **before** routing starts. Don't
  move DB init into a lazily-mounted screen component.
- `op-sqlite`'s Expo plugin config goes in **`package.json`**, not the `app.json`
  `plugins` array — putting it in `plugins` causes a "Cannot find package
  better-sqlite3" error because Expo falls back to the Node.js facade. See
  `.junie/skills/op-sqlite-sqlcipher/`.

---

## 4. Code conventions

- **`SafeAreaView`** must be imported from `react-native-safe-area-context`, never from
  `react-native` core (deprecated, throws TS6385). For screens with a custom bottom tab
  bar, exclude the bottom edge in `edges` — the tab bar reads
  `useSafeAreaInsets()` directly instead.
- Prettier: **double quotes, 2-space indentation** (`eslint-config-expo` flat config).
  `.eslintignore` has been migrated into the flat config's `ignores` array — don't
  recreate a separate `.eslintignore`.
- Known resolved hook violations, don't reintroduce the pattern that caused them:
    - `react-hooks/set-state-in-effect` — fixed by moving `isRefreshing` into the
      `DashboardState` union's `ready` variant, updated directly by `load()`, instead of
      a `useEffect` that calls `setState`.
    - `react-hooks/refs` — fixed by moving the ref write into a `useEffect`.
- **Verification sequence before considering a task done:**
  ```
  bun eslint .
  bun tsc --noEmit
  bun prettier --check src
  ```
  All three must pass clean. Don't skip `tsc --noEmit` because ESLint passed.
- **Always verify against the actual committed config, not an approximation.** Fetch
  latest from `origin`, rebase, run `bun install` against real deps, then lint/typecheck.
  Do not hand-roll a guess at what the ESLint/TS config contains.

---

## 5. Android build & CI

See `.junie/skills/android-ci-eas/` for the full checklist. Summary:

- Builds run via `eas-cli` with `eas build --platform android --profile staging --local
  --non-interactive`, executed **on the GitHub Actions runner itself** (`--local`), not
  dispatched to EAS's cloud build queue. Authenticated via the `EXPO_TOKEN` secret.
- This produces a **debug/staging APK** (`app-dev.apk`) for internal testing — it is not
  a production release build.
- Native toolchain versions (JDK/NDK/CMake/Gradle) are **not hand-pinned** in the
  workflow — they resolve from `eas.json`'s `staging` profile and the runner's own
  Android SDK. Check `eas.json` before adding manual toolchain setup steps.
- **Signing credentials are managed by EAS**, not the repo — there is no checked-in
  keystore file and no `keytool`/manual signing step in this pipeline. Don't introduce one.
- The pipeline respects a `[skip ci]` convention in commit messages via a `check-skip` job.
- Job timeout is **50 minutes**; `bun`'s cache is already wired via `actions/cache`
  keyed on `bun.lock` — confirm cache hits before adding more caching.

---

## 6. Licensing & docs

- License is **GPLv3** — copyleft. Flag any dependency that is GPL-incompatible
  (e.g. strong proprietary-only licenses) instead of silently adding it.
- Confirm the `LICENSE` file is present and is the actual GPLv3 text, not a placeholder,
  before treating a release as ready.
- README replaces the default `create-expo-app` boilerplate — don't regenerate the
  Expo default README over it.

---

## 7. Explicit prohibitions

- Do **not** add any networking, analytics, crash-reporting, or telemetry dependency
  (Sentry, Firebase Analytics, etc.) without explicit user sign-off — this conflicts
  with the core offline/privacy principle.
- Do **not** run `npm` or `npx` install/add commands — use `bun` equivalents.
- Do **not** put `op-sqlite` in the `app.json` `plugins` array.
- Do **not** hand-edit generated `android/` files and expect them to survive — use a
  config plugin.
- Do **not** add a checked-in keystore file or a manual `keytool` signing step to the
  Android workflow — signing credentials are managed by EAS (`eas.json` /
  `eas credentials`), and a manual keystore would conflict with that.
- Do **not** introduce a second progress-ring/lock-dial visual motif — reuse the
  existing plain ring component.
- Do **not** bump Expo SDK, React Native, or `op-sqlite` major versions without a
  dedicated PR and explicit discussion — these are load-bearing and version
  compatibility across RN/Expo/AGP has caused real breakage before.
- Do **not** change the SQLite schema without a corresponding `PRAGMA user_version`
  migration step.

---

## 8. How to work

- The user is a senior developer (30+ years, detail-oriented, comfortable across
  languages). Skip beginner explanations of syntax or basic RN/Expo concepts; get to
  the specific decision or trade-off.
- When you provide code, provide the **full, working file or block** — not a partial
  diff-shaped summary — unless the user asks for a diff.
- When a fix touches config (ESLint, Babel, Metro, Gradle), state *why* the previous
  config caused the failure, not just the new value — these configs get revisited later
  and the reasoning matters more than the line itself.
