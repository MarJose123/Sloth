# AGENTS.md — Sloth Android Finance App

> **Reasoning-model compatible.** Every section is written as explicit, machine-parseable
> constraints. No implicit assumptions. Ambiguity is a bug — file an issue instead.

---

## 0 · Meta / Purpose

Sloth is a **privacy-first, fully offline, multi-account personal finance tracker** for
Android (iOS deferred). All financial data lives **on-device only**, encrypted via
SQLCipher. There is no cloud sync, no analytics endpoint, no third-party login.

- **Repo:** `github.com/MarJose123/sloth`
- **License:** GPLv3 — all derivative works must publish source changes.
- **Mockup reference:** `Sloth app mockup.html` (committed to repo root).
  When design and code conflict, the **mockup wins** unless explicitly overridden here.

---

## 1 · Stack & Toolchain (non-negotiable)

| Concern | Package / Version | Notes |
|---|---|---|
| Runtime | React Native + Expo SDK 57 | |
| Router | `expo-router` (file-based) | `src/app/` layout |
| Styling | Uniwind v1.10.0 + Tailwind CSS v4.3.2 | CSS-first `@theme` in `global.css`; **no `tailwind.config.js`** |
| Database | `op-sqlite` + SQLCipher | `sqlcipher:true`, `performanceMode:true` in `package.json` only — **never in `app.json` plugins** |
| Encryption key | `expo-crypto` → 256-bit hex → `expo-secure-store` (`WHEN_UNLOCKED_THIS_DEVICE_ONLY`) | Fully decoupled from PIN / biometric layer |
| Animation | `react-native-reanimated` v4, `react-native-gesture-handler`, `lottie-react-native` | |
| Graphics | `react-native-svg` | |
| Auth | `expo-local-authentication`, `expo-secure-store` | |
| Camera / OCR | `expo-camera@~57.0.0` | **Not** `expo-vision-camera` (does not exist) |
| Package manager | Bun 1.3.14 (pinned) | Use `bun install`, `bun add`, `bun remove` — **never `npm install`**. Lock file: `bun.lock`. `bun lint` runs `prettier --write . && expo lint` |
| Build | EAS CLI ≥ 20.5.1, `eas build --local` | GH Actions ubuntu-latest |
| Java | JDK 17 (hard requirement for AGP + RN 0.86) | |
| Android SDK | 36, NDK 27.1.12297006, CMake 3.22.1 | ABI: `arm64-v8a` only for CI |

### Registered font names (must match exactly in code)

```
Fraunces_450
IBMPlexMono_400
Manrope_400
Manrope_700Bold
```

---

## 2 · Design System (source of truth: mockup CSS `:root`)

### 2.1 Color Tokens

| Token | Hex | Usage |
|---|---|---|
| `--ink` | `#1B1F1A` | Primary background |
| `--ink-2` | `#242920` | Card surface |
| `--ink-3` | `#2E3428` | Input bg, icon bg |
| `--parchment` | `#F3EEE1` | Primary text |
| `--parchment-dim` | `#A79F8C` | Secondary text, labels |
| `--brass` | `#C87B54` | Primary accent, CTA buttons |
| `--brass-soft` | `#8F5636` | Pressed state |
| `--sage` | `#7FA06B` | Income, success, secondary accent |
| `--rust` | `#9C4A3D` | Alerts, negative balance, errors |
| `--hairline` | `rgba(243,238,225,0.09)` | Borders, dividers |
| Dusty blue (category) | `#6E8FB0` | Transit category ring |
| Ochre (category) | `#C9A227` | Dining category ring |

### 2.2 Typography

| Role | Family | Weight | Size (reference) |
|---|---|---|---|
| Balance / headline | Fraunces | 450 | 44 px (dashboard), 30 px (onboarding) |
| UI body | Manrope | 400 / 700 | 13–15 px |
| Labels / mono data | IBM Plex Mono | 400 | 10–12 px |

### 2.3 Spacing & Radius Conventions (from mockup)

- Screen padding: `56px top, 22px horizontal, 28px bottom`
- Card radius: `16px`
- Button radius: `14px` (primary), `20px` (pill)
- FAB radius: `50%`
- Key circle: explicit `KEY_SIZE = (screenWidth - padding - gaps) / 3`,
  `borderRadius: KEY_SIZE / 2`

### 2.4 Visual Motifs

- **Progress / biometric ring:** plain soft ring only — **no dashed ticks, no segments**.
  Border only: `border: 1px solid rgba(200,123,84,0.3)`.
- **FAB:** `background: var(--brass)`, `box-shadow: 0 10px 24px -6px rgba(200,123,84,0.5)`,
  positioned `bottom:94px right:22px` on Dashboard; `margin-top:-20px` in tab bar variant.
- **Lottie badge:** screens 01, 02, 03, 13 use `lottie-react-native` animations, not
  static graphics.
- **Sloth icon:** moss-green rounded-rect bg (`#7FA06B`, rx=220/1024), caramel fur, cream
  face patch, dark eye patches. Defined as a **single shared SVG symbol** reused across
  Splash (00), Onboarding Welcome (01), About (18). Must not drift between screens.

---

## 3 · Navigation Architecture

```
Bottom Tab Bar (5 items):
  [Home] [Accounts] [+/FAB] [Transactions] [Settings]

Tab mapping (expo-router/ui headless):
  Home         → src/app/(tabs)/index.tsx           (Screen 04)
  Accounts     → src/app/(tabs)/accounts.tsx         (Screen 06)
  + (FAB)      → triggers FAB Action Sheet modal     (Screen 12)
  Transactions → src/app/(tabs)/transactions.tsx
  Settings     → src/app/(tabs)/settings.tsx         (Screen 07)

Modals / stack screens (outside tabs):
  Onboarding carousel  → src/app/onboarding.tsx      (Screens 01–03)
  Splash               → src/app/index.tsx            (Screen 00)
  Lock / PIN           → src/app/lock.tsx             (Screens 11, 15)
  Add Transaction      → src/app/transaction/new.tsx  (Screen 05)
  Add Account          → src/app/account/new.tsx      (Screen 09)
  Category Editor      → src/app/category/edit.tsx    (Screen 10)
  Receipt Scan         → src/app/scan.tsx             (Screen 13)
  CSV/OFX Import       → src/app/import.tsx           (Screen 14)
  Donate QR Modal      → src/app/donate.tsx           (Screen 16)
  About                → src/app/about.tsx            (Screen 18)
```

**Safe area rule:** Use `<View className="pt-safe">` (Uniwind utility).
**Never** `<SafeAreaView>` — double-inset occurs when combined with Expo Router's
existing `SafeAreaProvider`.

---

## 4 · Screen Inventory & Specifications

### Screen 00 — Splash (cold start)
- **File:** `src/app/index.tsx`
- **Layout:** centered column, `bg: #1B1F1A`
- **Elements:** SlothAppIcon SVG 112×112 (`drop-shadow`), wordmark "Sloth" (Fraunces 450
  26px), tagline "Private by default" (IBM Plex Mono 10.5px uppercase 0.1em
  `--parchment-dim`), three loading dots `bottom:64px` (dot 2 active `--brass`, others
  `rgba(200,123,84,0.35)`)
- **Behaviour:** On mount → check SecureStore for DB key + onboarding flag → navigate to
  `/onboarding` (first run) or `/lock` (returning)

### Screen 01 — Onboarding Welcome
- **File:** `src/app/onboarding.tsx` (carousel slide 0)
- **Elements:** Lottie animation zone, "Sloth" mono eyebrow (`--brass`), SlothAppIcon
  fallback 120×120, H2 "Your money.\nYour device.\nNobody else's." (Fraunces 450 30px
  lh:1.18), subtext (Manrope 14px `--parchment-dim` lh:1.55), pagination dots (3 dots,
  dot 1 active: `--brass` w:18px r:3px), "Continue" brass button
- **Carousel:** Shared horizontal swipe carousel for slides 01–02–03.
  `GestureDetector` + `Gesture.Pan()`, `makeMutable` at **module scope**.

### Screen 02 — Privacy Explainer
- **File:** `src/app/onboarding.tsx` (carousel slide 1)
- **Elements:** Lottie badge, "How it works" mono eyebrow, H2 "Three ways Sloth keeps
  this yours." (Fraunces 450 25px), 3 feature rows (hairline top border, brass circle icon,
  bold title + dim description), dots (dot 2 active), "Continue" brass button
- **Feature rows:**
    1. Icon "1" — "No bank credentials, ever"
    2. Icon "2" — "Processed on your phone"
    3. Icon "3" — "Fully offline, always"

### Screen 03 — Biometric Setup
- **File:** `src/app/onboarding.tsx` (carousel slide 2)
- **Elements:** Lottie badge, "Step 3 of 3" eyebrow, H2 "Lock Sloth to your face or
  fingerprint.", sub paragraph (13.5px `--parchment-dim`), biometric ring (150px plain
  soft ring `border:1px solid rgba(200,123,84,0.55)`), fingerprint SVG inner circle
  78×78, caption "Touch the sensor to continue" (brass mono 12px 0.06em), "Enable Face /
  Touch ID" brass button, "Use a 6-digit PIN instead" underlined dim fallback

### Screen 04 — Dashboard
- **File:** `src/app/(tabs)/index.tsx`
- **Elements:**
    - Greeting "Good evening, [name]" (12.5px `--parchment-dim`)
    - Account switcher chips (horizontal scroll; active: `rgba(200,123,84,0.1)` bg, brass
      border, 7px colour dot)
    - "Total balance" label (12px dim), balance (Fraunces 450 44px -0.01em tracking)
    - Ring row: 3 ring cards (`--ink-2`, 16px radius), rings are `border:3px solid <color>`
      circles with percentage text (IBM Plex Mono 10px) — no fill
    - Recent section header with inline "+ Add" brass pill button (700, 11px, 14px radius)
    - Transaction rows: name (Manrope 600 13.5px) + meta (11px dim); amount (IBM Plex Mono
      13.5px; negative=`--parchment`, positive=`--sage`)
    - Bottom tab bar

### Screen 05 — Add Transaction
- **File:** `src/app/transaction/new.tsx`
- **Elements:** Cancel / "New expense" / Save header, amount display (Fraunces 450 46px,
  cursor `--brass`), method pills (Manual/Scan receipt/Import; active:
  `rgba(200,123,84,0.14)` bg brass border), four field blocks (`--ink-2`, 14px radius),
  scan hint row (sage, "◎" prefix), **no** tab bar
- **Hook:** plain `useEffect` (not `useFocusEffect`) — avoid state flash on back

### Screen 06 — Accounts List
- **File:** `src/app/(tabs)/accounts.tsx`
- **Elements:** "Accounts" (Fraunces 450 20px) + "+ Add" brass link, account cards
  (`--ink-2`, 16px radius, 38×38 logo tile 11px radius), balance (IBM Plex Mono 14px),
  "Add another account" dashed card, footnote (11px dim centered), tab bar
- **Logo tile:** solid colour bg + 2-char initials (IBM Plex Mono 12px 700 `--ink` text)

### Screen 07 — Settings
- **File:** `src/app/(tabs)/settings.tsx`
- **Groups:** Appearance, Security, Data, Support, About
- **Toggle:** on=`rgba(200,123,84,0.9)` thumb right; off=`--ink-3` + hairline border thumb
  left `--parchment-dim`
- **Segment control (Theme):** `--ink-3` bg, active segment `--brass` bg `--ink` text,
  10.5px 700

### Screen 08 — Categories / Expense Types
- **File:** `src/app/(tabs)/categories.tsx`
- **Elements:** "Categories" title + "+ Add" link, "This month · ring shows share of total
  spend" sub label (11px dim), category rows with conic-gradient ring, inner `--ink-2`
  circle with emoji, name (13.5px 700) + type badge (IBM Plex Mono 11px dim), spend +
  tx count (IBM Plex Mono 12.5px), dashed "Create a new expense type" card
- **Ring formula:** `background: conic-gradient(var(--ring-color) var(--pct), rgba(243,238,225,0.09) 0)`

### Screen 09 — Add Account
- **File:** `src/app/account/new.tsx`
- **Elements:** Cancel / "New account" / Save header, name field, type grid (2×2:
  Checking/Savings/Credit card/Cash), logo preview (64×64 `--ink-2` dashed), logo grid
  (4×2 tiles), upload tile (dashed brass text), starting balance field, "Add account" brass
  button
- **Active type tile:** `rgba(200,123,84,0.1)` bg, brass border, `--parchment` text

### Screen 10 — Category Editor + Icon Picker
- **File:** `src/app/category/edit.tsx`
- **Elements:** Cancel / "New category" / Save header, category preview row (58×58 brass
  circle + inline name field), icon grid (6 cols, 12 icons + "···" overflow), colour dot
  row (5 dots; active: double ring `--ink` inner then `--brass` outer), type tiles
  (Expense / Income 2-col)

### Screen 11 — PIN Entry / Lock Screen
- **File:** `src/app/lock.tsx`
- **Elements:** "Sloth locked" mono eyebrow (centered), "Enter your PIN" (Fraunces 450
  20px centered), 6 PIN dots (14×14, `border:1.5px solid rgba(200,123,84,0.5)`,
  filled=`--brass`), 3×4 keypad, "Use Face ID instead" brass link bottom
- **Keypad circles:** `KEY_SIZE = (screenWidth - 44 - 14*2) / 3`, `borderRadius: KEY_SIZE / 2`
- **Layout:** `flex:1` spacer between PIN dots and keypad → keypad anchors to bottom
- **Ghost keys:** bottom-left=empty, bottom-right=backspace; transparent bg, no border

### Screen 12 — FAB Action Sheet
- **File:** `src/app/fab-sheet.tsx` (modal)
- **Elements:** scrim `rgba(8,9,13,0.6)`, bottom sheet (`--ink-2`, 22px top radius,
  hairline border), drag handle (36×4px `rgba(237,233,224,0.2)`), "Add to Sloth" title
  (Fraunces 450 18px), 4 action rows (icon tile `--ink-3` brass border + bold label + dim
  description)
- **Actions:** Manual transaction / Scan receipt / New account / Import CSV/OFX

### Screen 13 — Receipt Scan / OCR
- **File:** `src/app/scan.tsx`
- **Camera:** `expo-camera@~57.0.0` still-image capture — **not** `react-native-vision-camera`
- **Elements:** camera viewport overlay gradient, ✕ close + "Flash: Auto" top bar,
  "◈ Lottie — align receipt in frame" caption, dashed receipt frame with brass scan-line
  animation (Lottie), detected results card (`--ink-2`, sage "Detected on-device" tag),
  shutter ring (64px, 3px parchment border, brass fill circle)

### Screen 14 — CSV / OFX Import
- **File:** `src/app/import.tsx`
- **Elements:** Cancel / "Import" / Import header, file drop zone (dashed border, filename
    + row count), "Import into" account selector, column mapping table (CSV col → arrow →
      field), preview rows (first 3 transactions)

### Screen 15 — Returning User Launch / Lock
- **File:** `src/app/index.tsx` → routes to `src/app/lock.tsx`
- **Elements:** "Sloth" brass mono brand-mark top, biometric ring (110×110 plain soft
  ring `border:1px solid rgba(200,123,84,0.55)`) with fingerprint SVG, "Welcome back"
  (Fraunces 450 22px), "Unlock to see your accounts" (13px dim), "Unlock with Face ID"
  brass button, "Use PIN instead" dim underlined fallback

### Screen 16 — Donate QR Modal
- **File:** `src/app/donate.tsx`
- **Elements:** scrim, modal card (82% width, `--ink-2`, 22px radius), ✕ close,
  "Support Sloth" (Fraunces 450 19px), descriptor paragraph (12px dim lh:1.5), QR box
  (168×168 `--parchment` bg 14px radius 12px padding), address (IBM Plex Mono 10.5px
  `--ink-3` bg), "⬇ Save to Photos" brass button, sage toast "✓ Saved to gallery"

### Screen 18 — About
- **File:** `src/app/about.tsx`
- **Elements:** ← back + "About" header, SlothAppIcon 64×64 (16px radius), "Sloth"
  (Fraunces 450 20px), "Version 1.0.0" (IBM Plex Mono 11px dim), description paragraph
  (12.5px dim centered lh:1.6), about rows (label + value or chevron), footer "Made
  slowly, on purpose." (11px dim centered)
- **Rows:** Check for updates / License (GPLv3) / Source code / Acknowledgments

---

## 5 · Data Layer

### 5.1 Database Schema (op-sqlite + SQLCipher, STRICT mode)

```sql
PRAGMA journal_mode = WAL;

CREATE TABLE accounts (
  id            INTEGER PRIMARY KEY,
  name          TEXT    NOT NULL,
  type          TEXT    NOT NULL CHECK(type IN ('checking','savings','credit','cash')),
  logo_key      TEXT,
  color_hex     TEXT,
  balance_cents INTEGER NOT NULL DEFAULT 0,
  created_at    INTEGER NOT NULL,
  updated_at    INTEGER NOT NULL
) STRICT;

CREATE TABLE categories (
  id         INTEGER PRIMARY KEY,
  name       TEXT    NOT NULL,
  icon       TEXT    NOT NULL,
  color_hex  TEXT    NOT NULL,
  type       TEXT    NOT NULL CHECK(type IN ('expense','income')),
  sort_order INTEGER NOT NULL DEFAULT 0
) STRICT;

CREATE TABLE transactions (
  id           INTEGER PRIMARY KEY,
  account_id   INTEGER NOT NULL REFERENCES accounts(id),
  category_id  INTEGER REFERENCES categories(id),
  amount_cents INTEGER NOT NULL,   -- positive=income, negative=expense
  merchant     TEXT,
  note         TEXT,
  date_unix    INTEGER NOT NULL,
  source       TEXT CHECK(source IN ('manual','scan','import')),
  created_at   INTEGER NOT NULL
) STRICT;

CREATE TABLE settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
) STRICT;

PRAGMA user_version = 1;  -- increment on each migration
```

**Rules:**
- Amounts: **integer cents only** — never floats.
- Migrations: `PRAGMA user_version` gate pattern.
- Key storage: `expo-crypto` random 256-bit hex → `SecureStore`, key name `sloth_db_key`,
  accessibility `WHEN_UNLOCKED_THIS_DEVICE_ONLY`.

### 5.2 Repository Pattern

```
src/db/
  client.ts               ← opens/initialises DB, runs migrations
  migrations.ts
  repositories/
    accounts.ts
    categories.ts
    transactions.ts
    settings.ts
```

### 5.3 Hook Rules

- `useFocusEffect` for list/dashboard hooks that must refresh on screen return.
- Plain `useEffect` for in-progress form screens (Add Transaction, Add Account) to avoid
  state flash.

---

## 6 · Animation Conventions

| Pattern | Implementation |
|---|---|
| Swipe gesture (onboarding carousel) | `GestureDetector` + `Gesture.Pan()` + `makeMutable` at **module scope** |
| Lottie screens (01, 02, 03, 13) | `lottie-react-native` — not static graphics |
| Progress / biometric rings | SVG `<Circle>` strokeDasharray or `Animated`; biometric ring = plain border |
| Bottom sheet dismiss | `react-native-reanimated` v4 translateY + `Gesture.Pan()` |

**Reanimated ESLint rule:** Use `makeMutable(value)` at module scope for shared values —
never `useSharedValue` inside component body if it triggers the immutability lint error.

---

## 7 · Security Architecture

```
Layer 1: DB Encryption
  op-sqlite + SQLCipher AES-256
  Key: 256-bit random hex (expo-crypto) → SecureStore (WHEN_UNLOCKED_THIS_DEVICE_ONLY)
  Key is COMPLETELY INDEPENDENT of PIN / biometrics

Layer 2: App Lock (expo-local-authentication)
  Biometric (Face ID / Touch ID) — primary
  6-digit PIN fallback — hashed and stored in SecureStore
  Lock state managed in app root; navigates to /lock on foreground resume

Layer 3: Screenshot Prevention
  Settings toggle → FLAG_SECURE (Android) via Expo config plugin
  Default: OFF (screenshots blocked by default)
```

---

## 8 · Build & CI

### 8.1 EAS Profile (`eas.json`)

```json
{
  "build": {
    "staging": {
      "distribution": "internal",
      "android": {
        "buildType": "apk",
        "gradleCommand": ":app:assembleRelease",
        "withoutCredentials": false
      }
    }
  }
}
```

Use `assembleRelease` — debug builds omit the JS bundle and require Metro running.

### 8.2 GitHub Actions constraints

```yaml
timeout-minutes: 45      # baseline; reduce after ccache is wired
env:
  NDK_VERSION: 27.1.12297006
  CMAKE_VERSION: 3.22.1
  JAVA_VERSION: '17'     # hard pin — AGP + RN 0.86 requirement
  ABI: arm64-v8a         # CI only; release builds include all ABIs
```

**ccache plan:** Apply to CMake/SQLCipher native compile via `withAppBuildGradle` Expo
config plugin (the `android/` directory is regenerated by `expo prebuild --clean` so
manual edits do not survive).

### 8.3 Pre-commit Lint Gate (must all pass)

```bash
bun eslint .
npx tsc --noEmit
npx prettier --check src
```

Run against committed config — local clone may lag `origin/main`.

---

## 9 · Hard Rules (agent must NEVER violate)

| # | Rule |
|---|---|
| 1 | Never add `op-sqlite` to `app.json` plugins array → "Cannot find package better-sqlite3" error |
| 2 | Never use `<SafeAreaView>` → double-inset with Expo Router's SafeAreaProvider. Use `<View className="pt-safe">` |
| 3 | Never use `expo-vision-camera` (does not exist). Use `expo-camera@~57.0.0` |
| 4 | Never suppress lint with `// eslint-disable` comments. Fix root cause |
| 5 | Never store amounts as floats. Integer cents only |
| 6 | Never create `tailwind.config.js`. Use CSS-first `@theme` in `global.css` only |
| 7 | Never edit `android/` files directly — changes are wiped by `expo prebuild --clean`. Use config plugins |
| 8 | Never use `useSharedValue` inside component body if it triggers Reanimated immutability ESLint error. Use module-scope `makeMutable` |
| 9 | Always wrap Unicode escape sequences in JSX text nodes inside `{"..."}` JS string expressions |
| 10 | EAS manages all Android credentials — no manual keystore handling in workflow files |

---

## 10 · Implementation Plan (Phase-gated)

Each phase requires explicit approval before implementation begins.
Deliver all code as **complete inline codeblocks** — no partial diffs, no `...` ellipsis,
no `// TODO` stubs in deliverables.

### Phase 0 — Foundation ✅ Complete
- [x] Expo SDK 57 project scaffold, Bun, Expo Router `src/app/`
- [x] Uniwind + Tailwind CSS v4 `global.css` `@theme` tokens
- [x] Font registration (Fraunces_450, IBMPlexMono_400, Manrope_400, Manrope_700Bold)
- [x] op-sqlite + SQLCipher (`package.json` config only)
- [x] DB client, migrations (PRAGMA user_version), STRICT schema
- [x] SecureStore key generation (expo-crypto)
- [x] AGENTS.md + skill files

### Phase 1 — Onboarding & Auth ✅ Complete
- [x] Screen 00: Splash + cold-start routing
- [x] Screens 01–02–03: Unified swipe carousel (GestureDetector + makeMutable)
- [x] SlothAppIcon SVG component (shared, no drift)
- [x] Screen 03: Biometric setup (expo-local-authentication)
- [x] Screen 11: PIN entry (6-dot, circle keypad, KEY_SIZE formula)
- [x] Screen 15: Returning user lock screen

### Phase 2 — Core Finance Screens ✅ Complete
- [x] Screen 04: Dashboard (tab bar, account switcher chips, ring row, tx list, FAB)
- [x] Screen 05: Add Transaction (amount pad, method pills, fields)
- [x] Screen 06: Accounts list (account cards, logo tiles)
- [x] Screen 07: Settings (all groups, toggles, segment control)
- [x] Repositories: accounts, transactions, categories, settings
- [x] Hooks: useAccounts, useTransactions, useCategories

### Phase 3 — Category & Account Management ✅ Complete
- [x] Screen 08: Categories list (conic ring, EXPENSE/INCOME badge)
- [x] Screen 09: Add Account (type grid, logo grid, colour swatches)
- [x] Screen 10: Category editor + icon picker

### Phase 4 — Utility Screens ✅ Complete
- [x] Screen 12: FAB Action Sheet
- [x] Screen 13: Receipt Scan scaffold (expo-camera, frame overlay)
- [x] Screen 14: CSV/OFX Import scaffold
- [x] Screen 16: Donate QR Modal
- [x] Screen 18: About

### Phase 5 — OCR & Import Logic 🔲 Next
- [ ] Screen 13: expo-camera capture → on-device OCR → pre-fill Add Transaction form
- [ ] Screen 14: CSV column parser → map to schema → bulk insert
- [ ] OFX/QFX parser (no network)

### Phase 6 — Data Export & Backup 🔲 Pending
- [ ] CSV export (all transactions, filtered by account/date)
- [ ] Encrypted backup (SQLCipher DB copy → share sheet)
- [ ] Restore from backup

### Phase 7 — Polish & Hardening 🔲 Pending
- [ ] Lottie animations (screens 01, 02, 03, 13)
- [ ] Screenshot prevention toggle (FLAG_SECURE config plugin)
- [ ] App foreground/background lock resume
- [ ] PIN change flow
- [ ] Accessibility (a11y labels, 44px min touch targets)
- [ ] FlashList virtualisation for transaction lists

### Phase 8 — CI & Distribution 🔲 Pending
- [ ] ccache for CMake/SQLCipher (withAppBuildGradle config plugin)
- [ ] GH Actions timeout tuning post-ccache
- [ ] GitHub Release APK upload action
- [ ] Play Store Internal Testing (EAS submit)

### Phase 9 — iOS Port 🔲 Deferred
- [ ] After Android is stable
- [ ] Face ID entitlements, Keychain / SecureStore iOS variant
- [ ] expo prebuild for iOS target
- [ ] EAS iOS build profile

---

## 11 · File Structure Reference

```
sloth/
├── AGENTS.md
├── Sloth app mockup.html           ← design source of truth (committed)
├── eas.json
├── app.json
├── package.json                    ← op-sqlite config lives here only
├── global.css                      ← @theme tokens (no tailwind.config.js)
├── src/
│   ├── app/
│   │   ├── _layout.tsx             ← root layout, SafeAreaProvider, GestureHandler
│   │   ├── index.tsx               ← Screen 00 Splash + routing
│   │   ├── onboarding.tsx          ← Screens 01-02-03 carousel
│   │   ├── lock.tsx                ← Screens 11 + 15
│   │   ├── scan.tsx                ← Screen 13
│   │   ├── import.tsx              ← Screen 14
│   │   ├── donate.tsx              ← Screen 16
│   │   ├── about.tsx               ← Screen 18
│   │   ├── (tabs)/
│   │   │   ├── _layout.tsx         ← headless tab bar (expo-router/ui)
│   │   │   ├── index.tsx           ← Screen 04 Dashboard
│   │   │   ├── accounts.tsx        ← Screen 06
│   │   │   ├── transactions.tsx    ← Transactions list
│   │   │   ├── settings.tsx        ← Screen 07
│   │   │   └── categories.tsx      ← Screen 08
│   │   ├── transaction/
│   │   │   └── new.tsx             ← Screen 05
│   │   ├── account/
│   │   │   └── new.tsx             ← Screen 09
│   │   └── category/
│   │       └── edit.tsx            ← Screen 10
│   ├── components/
│   │   ├── SlothAppIcon.tsx        ← shared SVG (Splash, Onboarding, About)
│   │   ├── TabBar.tsx
│   │   ├── BiometricRing.tsx       ← plain soft ring, no ticks
│   │   ├── FABSheet.tsx            ← Screen 12
│   │   ├── AccountCard.tsx
│   │   ├── TransactionRow.tsx
│   │   ├── CategoryRow.tsx
│   │   ├── KeyPad.tsx              ← PIN keypad (KEY_SIZE circle formula)
│   │   └── PinDots.tsx
│   ├── db/
│   │   ├── client.ts
│   │   ├── migrations.ts
│   │   └── repositories/
│   │       ├── accounts.ts
│   │       ├── categories.ts
│   │       ├── transactions.ts
│   │       └── settings.ts
│   ├── hooks/
│   │   ├── useAccounts.ts
│   │   ├── useTransactions.ts
│   │   ├── useCategories.ts
│   │   ├── useSettings.ts
│   │   └── useBiometric.ts
│   ├── lib/
│   │   ├── crypto.ts               ← key generation + SecureStore
│   │   ├── csvParser.ts            ← CSV/OFX parsing (no network)
│   │   └── ocr.ts                  ← receipt OCR shim
│   └── types/
│       └── index.ts
└── .github/
    └── workflows/
        └── build.yml
```

---

## 12 · Agent Behaviour Rules

1. **Read this file first** before generating any code or making any decision.
2. **Mockup-first:** every pixel value, colour token, and font size must trace to
   `Sloth app mockup.html`. Do not invent values.
3. **Approval gate:** present analysis/plan; wait for explicit approval before implementing
   any phase or screen.
4. **Full inline codeblocks:** all implementation code delivered as complete markdown
   codeblocks — no partial diffs, no `...` ellipsis, no `// TODO` stubs in deliverables.
5. **Lint before finalising:** mentally apply all three lint commands to every output.
   Fix root causes, never suppress.
6. **No scope creep:** implement exactly what the mockup shows. Do not add features or
   screens not in the approved 19-screen set without explicit instruction.
7. **Conflict resolution order:** AGENTS.md hard rules > mockup design values >
   Expo/RN defaults.
8. **State assumptions explicitly:** if a decision requires an assumption not covered here,
   state it before proceeding and await confirmation.
