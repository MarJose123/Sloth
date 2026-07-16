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
- **Mockup reference:** Not committed. Design follows the `Sloth app mockup.html`
  concept — when design and code conflict, the **mockup wins** unless explicitly
  overridden in `AGENTS.md`.

---

## 1 · Stack & Toolchain (non-negotiable)

| Concern | Package / Version | Notes |
|---|---|---|
| Runtime | React Native + Expo SDK 57 (0.86.0) | |
| Router | `expo-router` (file-based) | `src/app/` layout; route group is `(app)` not `(tabs)` |
| Styling | NativeWind v5.0.0-preview.4 + Tailwind CSS v4.3.2 | CSS-first `@theme` in `global.css`; **no `tailwind.config.js`**; PostCSS plugin `@tailwindcss/postcss` |
| Metro config | `nativewind/metro` wrapper in `metro.config.js` | Uses `withNativewind(config)` |
| Database | `@op-engineering/op-sqlite` v17.1.1 + SQLCipher | `sqlcipher:true`, `performanceMode:true` in `package.json` only — **never in `app.json` plugins** |
| Encryption key | `expo-crypto` random 256-bit hex → `expo-secure-store` (`WHEN_UNLOCKED_THIS_DEVICE_ONLY`) | Fully decoupled from PIN / biometric layer. Code in `src/lib/db/key.ts` |
| Animation | `react-native-reanimated` v4.5.0, `react-native-gesture-handler` ~2.32.0, `lottie-react-native` ~7.3.8 | |
| Graphics | `react-native-svg` 15.15.4 | |
| Auth | `expo-local-authentication` ~57.0.0, `expo-secure-store` ~57.0.0 | |
| Camera / OCR | `expo-camera@~57.0.1` | **Not** `expo-vision-camera` (does not exist) |
| Package manager | Bun 1.3.14 (pinned in `eas.json`) | Use `bun install`, `bun add`, `bun remove` — **never `npm install`**. Lock file: `bun.lock`. `bun lint` runs `prettier --write . && expo lint` |
| Build | EAS CLI ≥ 20.5.1, `eas build --local` | GH Actions ubuntu-latest |
| Java | JDK 17 (hard requirement for AGP + RN 0.86) | |
| Android SDK | Compile/target 36, minSdk 31, buildTools 36.0.0 (via `expo-build-properties` in `app.json`) | |
| Additional Expo plugins | `expo-router`, `expo-secure-store`, `expo-font`, `expo-local-authentication`, `expo-splash-screen`, `expo-camera`, `expo-build-properties` | All configured in `app.json` plugins array |

### Registered font names (must match exactly in code)

The font map lives in `src/hooks/useAppFonts.ts`. The key is the alias name (left side),
mapped to the Google Fonts object (right side):

```
Fraunces_400Regular       → Fraunces_400Regular
Fraunces_450              → Fraunces_500Medium   (closest available weight)
Fraunces_600SemiBold      → Fraunces_600SemiBold
Manrope_400               → Manrope_400Regular
Manrope_500Medium         → Manrope_500Medium
Manrope_600SemiBold       → Manrope_600SemiBold
Manrope_700Bold           → Manrope_700Bold
Manrope_800ExtraBold      → Manrope_800ExtraBold
IBMPlexMono_400           → IBMPlexMono_400Regular
IBMPlexMono_500Medium     → IBMPlexMono_500Medium
```

**CSS `--font-*` keys in `global.css` must match the alias keys above** (left column).
React Native requires exact font-file key names, no fallbacks.

---

## 2 · Design System (source of truth: `global.css` `@theme` + mockup)

### 2.1 Color Tokens

| Token | CSS variable | Hex | Usage |
|---|---|---|---|
| Ink | `--color-ink` | `#1B1F1A` | Primary background |
| Ink-2 | `--color-ink-2` | `#242920` | Card surface |
| Ink-3 | `--color-ink-3` | `#2E3428` | Input bg, icon bg |
| Parchment | `--color-parchment` | `#F3EEE1` | Primary text |
| Parchment dim | `--color-parchment-dim` | `#A79F8C` | Secondary text, labels |
| Brass | `--color-brass` | `#C87B54` | Primary accent, CTA buttons |
| Brass soft | `--color-brass-soft` | `#8F5636` | Pressed state |
| Sage | `--color-sage` | `#7FA06B` | Income, success, secondary accent |
| Rust | `--color-rust` | `#9C4A3D` | Alerts, negative balance, errors |
| Hairline | — | `rgba(243,238,225,0.09)` | Borders, dividers (utility: `hairline`) |
| Dusty blue | `--color-dusty-blue` | `#6E8FB0` | Transit category ring |
| Ochre | `--color-ochre` | `#C9A227` | Dining category ring |

JS counterpart: `src/theme/colors.ts` exports the same values for inline `style={}` use.

### 2.2 Typography

| Role | CSS font key (class) | Weight | Size (reference) |
|---|---|---|---|
| Balance / headline | `font-fraunces` or `font-fraunces-medium` | 400 / 450 (500) | 44 px (dashboard), 30 px (onboarding) |
| UI body / bold | `font-manrope` / `font-manrope-bold` | 400 / 700 | 13–15 px |
| Labels / mono data | `font-mono` / `font-mono-medium` | 400 / 500 | 10–12 px |

### 2.3 Spacing & Radius Conventions (from mockup)

- Screen padding: `56px top, 22px horizontal, 28px bottom`
- Card radius: `16px` (class `rounded-2xl`)
- Button radius: `14px` (pill/action), `20px` (pill toggle)
- FAB tab bar: rounded `32px` (`rounded-[32px]`)
- Key circle: explicit `KEY_SIZE = (screenWidth - padding - gaps) / 3`,
  `borderRadius: KEY_SIZE / 2`

### 2.4 Visual Motifs

- **Progress / biometric ring:** plain soft ring only — **no dashed ticks, no segments**.
  Border only: `border: 1px solid rgba(200,123,84,0.3)`.
- **FAB:** Tab bar variant, centered pill button within the `TabList`, `margin-top:-20px`
  effect applied by `AddTabButton` component. Floating variant `bottom:94px right:22px`
  on Dashboard with `brass-glow` shadow utility.
- **Lottie badge:** screens 01, 02, 03, 13 use `lottie-react-native` animations, not
  static graphics.
- **Sloth icon:** moss-green rounded-rect bg (`#7FA06B`, rx=220/1024), caramel fur, cream
  face patch, dark eye patches. Defined as `SlothAppIcon.tsx` — a **single shared SVG
  component** reused across Splash (00), Onboarding Welcome (01), About (18). Must not
  drift between screens. Secondary `SlothMark.tsx` exists for simplified inline use.

---

## 3 · Navigation Architecture

```
Root Layout (src/app/_layout.tsx):
  Stack:
    ├── (app)           → Tab group (src/app/(app)/_layout.tsx)
    ├── onboarding      → Stack group (src/app/onboarding/_layout.tsx)
    ├── add-account     → Screen 09 (flat route)
    ├── category-editor → Screen 10 (flat route)
    ├── transaction/new → Screen 05
    ├── about           → Screen 18
    ├── receipt-scan    → Screen 13
    ├── import          → Screen 14
    ├── lock            → Screens 11 + 15
    ├── donate          → Screen 16
    └── fab-sheet       → Screen 12 (modal)

Onboarding Layout (src/app/onboarding/_layout.tsx):
  Stack (gesture disabled, animation managed by carousel):
    ├── welcome         → Screens 01–02–03 carousel (unified)
    ├── pin-setup       → PIN creation screen (slide_from_right)
    ├── privacy         → redirects to welcome (legacy compat)
    └── biometric       → redirects to welcome (legacy compat)

Tab Group (src/app/(app)/_layout.tsx):
  Tabs (expo-router/ui headless):
    [dashboard] [accounts] [+/FAB] [transactions] [settings]

  Tab mapping (expo-router/ui TabList):
    dashboard    → src/app/(app)/dashboard.tsx   (Screen 04)
    accounts     → src/app/(app)/accounts.tsx    (Screen 06)
    add (FAB)    → src/app/(app)/add.tsx         (Add Transaction / Screen 05 variant)
    transactions → src/app/(app)/transactions.tsx
    settings     → src/app/(app)/settings.tsx    (Screen 07)

Root-level push screens (no tab bar):
  Splash               → src/app/index.tsx         (Screen 00)
  Lock / PIN           → src/app/lock.tsx          (Screens 11, 15)
  Add Account          → src/app/add-account.tsx   (Screen 09)
  Category Editor      → src/app/category-editor.tsx (Screen 10)
  Add Transaction      → src/app/transaction/new.tsx (Screen 05)
  Receipt Scan         → src/app/receipt-scan.tsx  (Screen 13)
  CSV/OFX Import       → src/app/import.tsx        (Screen 14)
  FAB Action Sheet     → src/app/fab-sheet.tsx     (Screen 12)
  Donate QR Modal      → src/app/donate.tsx        (Screen 16)
  About                → src/app/about.tsx         (Screen 18)
```

**Route structure note:** Most screens are **flattened** at `src/app/` root rather than
in subdirectories. Only two route groups exist: `(app)` (tab bar) and `onboarding`
(carousel stack). This differs from earlier documented plans — always check actual files.

**Safe area rule:** Use `<View className="pt-safe">` (custom `@utility` in `global.css`
backed by `react-native-css` SafeAreaProvider's CSS variables).
**Never** `<SafeAreaView>` — double-inset occurs when combined with Expo Router's
existing `SafeAreaProvider`.

---

## 4 · Screen Inventory & Specifications

### Screen 00 — Splash (cold start)
- **File:** `src/app/index.tsx` (also routes to onboarding or lock)
- **Component:** `src/screens/SplashScreen.tsx`
- **Layout:** centered column, `bg: #1B1F1A`
- **Elements:** SlothAppIcon SVG 112×112 (`drop-shadow`), wordmark "Sloth" (Fraunces 450
  26px), tagline "Private by default" (IBM Plex Mono 10.5px uppercase 0.1em
  `--parchment-dim`), three loading dots `bottom:64px` (dot 2 active `--brass`, others
  `rgba(200,123,84,0.35)`)
- **Behaviour:** On mount → opens encrypted DB (runs migrations) → checks
  `storage.getOnboardingComplete()` → redirects to `/onboarding/welcome` (first run)
  or `/(app)/dashboard` (returning)

### Screen 01 — Onboarding Welcome
- **File:** `src/app/onboarding/welcome.tsx` (carousel slide 0)
- **Elements:** Lottie animation zone, "Sloth" mono eyebrow (`--brass`), SlothAppIcon
  fallback 120×120, H2 "Your money.\nYour device.\nNobody else's." (Fraunces 450 30px
  lh:1.18), subtext (Manrope 14px `--parchment-dim` lh:1.55), pagination dots (3 dots,
  dot 1 active: `--brass` w:18px r:3px), "Continue" brass button
- **Carousel:** Shared horizontal swipe carousel for slides 01–02–03 (all in
  `welcome.tsx`). `GestureDetector` + `Gesture.Pan()`, `makeMutable` at **module scope**.

### Screen 02 — Privacy Explainer
- **File:** `src/app/onboarding/welcome.tsx` (carousel slide 1)
- **Elements:** Lottie badge, "How it works" mono eyebrow, H2 "Three ways Sloth keeps
  this yours." (Fraunces 450 25px), 3 feature rows (hairline top border, brass circle icon,
  bold title + dim description), dots (dot 2 active), "Continue" brass button
- **Feature rows:** rendered by `FeatureRow.tsx` component
  1. Icon "1" — "No bank credentials, ever"
  2. Icon "2" — "Processed on your phone"
  3. Icon "3" — "Fully offline, always"

### Screen 03 — Biometric Setup
- **File:** `src/app/onboarding/welcome.tsx` (carousel slide 2)
- **Elements:** Lottie badge, "Step 3 of 3" eyebrow, H2 "Lock Sloth to your face or
  fingerprint.", sub paragraph (13.5px `--parchment-dim`), biometric ring (150px plain
  soft ring `border:1px solid rgba(200,123,84,0.55)`), fingerprint SVG inner circle
  78×78 (component: `FingerprintIcon.tsx`), caption "Touch the sensor to continue" (brass
  mono 12px 0.06em), "Enable Face / Touch ID" brass button, "Use a 6-digit PIN instead"
  underlined dim fallback → navigates to `/onboarding/pin-setup`

### Screen 04 — Dashboard
- **File:** `src/app/(app)/dashboard.tsx`
- **Elements:**
    - Greeting "Good morning/afternoon/evening" (12.5px `--parchment-dim`)
    - Account switcher chips (horizontal scroll; component: `AccountSwitcher.tsx`)
    - "Total balance" label (12px dim), balance (Fraunces 450 44px -0.01em tracking)
    - Ring row: 3 ring cards (`--ink-2`, 16px radius), rings are `border:3px solid <color>`
      circles with percentage text (IBM Plex Mono 10px) — no fill (component: `CategoryRingCard.tsx`)
    - Recent section header with inline "+ Add" brass pill button (700, 11px, 14px radius)
    - Transaction rows: name (Manrope 600 13.5px) + meta (11px dim); amount (IBM Plex Mono
      13.5px; negative=`--parchment`, positive=`--sage`) (component: `TransactionRow.tsx`)
    - Empty state card when no accounts exist (component: `EmptyAccountsCard.tsx`)
    - **No** tab bar (tabs are rendered by `TabList` in `(app)/_layout.tsx`)

### Screen 05 — Add Transaction (tab + push route)
- **File:** `src/app/(app)/add.tsx` (tab FAB variant) and `src/app/transaction/new.tsx` (push)
- **Elements:** Cancel / "New expense" / Save header, amount display (Fraunces 450 46px,
  cursor `--brass`), method pills (Manual/Scan receipt/Import; active:
  `rgba(200,123,84,0.14)` bg brass border), four field blocks (`--ink-2`, 14px radius),
  scan hint row (sage, "◎" prefix), **no** tab bar
- **Hook:** `useAddTransactionData` (custom hook, plain `useEffect` — no state flash on back)

### Screen 06 — Accounts List
- **File:** `src/app/(app)/accounts.tsx`
- **Elements:** "Accounts" (Fraunces 450 20px) + "+ Add" brass link, account cards
  (`--ink-2`, 16px radius, 38×38 logo tile 11px radius), balance (IBM Plex Mono 14px),
  "Add another account" dashed card, footnote (11px dim centered), tab bar
- **Logo tile:** solid colour bg + 2-char initials (IBM Plex Mono 12px 700 `--ink` text)

### Screen 07 — Settings
- **File:** `src/app/(app)/settings.tsx`
- **Groups:** Appearance, Security, Data, Support, About
- **Toggle:** on=`rgba(200,123,84,0.9)` thumb right; off=`--ink-3` + hairline border thumb
  left `--parchment-dim` (component: `Toggle.tsx`)
- **Segment control (Theme):** `--ink-3` bg, active segment `--brass` bg `--ink` text,
  10.5px 700

### Screen 08 — Categories / Expense Types
- **File:** `src/app/(app)/categories.tsx`
- **Elements:** "Categories" title + "+ Add" link, "This month · ring shows share of total
  spend" sub label (11px dim), category rows with conic-gradient ring, inner `--ink-2`
  circle with emoji, name (13.5px 700) + type badge (IBM Plex Mono 11px dim), spend +
  tx count (IBM Plex Mono 12.5px), dashed "Create a new expense type" card
- **Ring formula:** `background: conic-gradient(var(--ring-color) var(--pct), rgba(243,238,225,0.09) 0)`

### Screen 09 — Add Account
- **File:** `src/app/add-account.tsx` (flat route)
- **Elements:** Cancel / "New account" / Save header, name field, type grid (2×2:
  Checking/Savings/Credit card/Cash), logo preview (64×64 `--ink-2` dashed), logo grid
  (4×2 tiles), upload tile (dashed brass text), starting balance field, "Add account" brass
  button
- **Active type tile:** `rgba(200,123,84,0.1)` bg, brass border, `--parchment` text

### Screen 10 — Category Editor + Icon Picker
- **File:** `src/app/category-editor.tsx` (flat route)
- **Elements:** Cancel / "New category" / Save header, category preview row (58×58 brass
  circle + inline name field), icon grid (6 cols, 12 icons + "···" overflow), colour dot
  row (5 dots; active: double ring `--ink` inner then `--brass` outer), type tiles
  (Expense / Income 2-col)

### Screen 11 — PIN Entry / Lock Screen
- **File:** `src/app/lock.tsx`
- **Elements:** "Sloth locked" mono eyebrow (centered), "Enter your PIN" (Fraunces 450
  20px centered), 6 PIN dots (14×14, `border:1.5px solid rgba(200,123,84,0.5)`,
  filled=`--brass`) (component: `PinDots.tsx`), 3×4 keypad (component: `Keypad.tsx`)
- **Keypad circles:** `KEY_SIZE = (screenWidth - 44 - 14*2) / 3`, `borderRadius: KEY_SIZE / 2`
  (component: `DialFrame.tsx`)
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
- **File:** `src/app/receipt-scan.tsx`
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
- **File:** `src/app/lock.tsx` (same as Screen 11, handles both unlock flows)
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
- **Hook/helper:** `src/lib/export.ts` (download/save QR)

### Screen 18 — About
- **File:** `src/app/about.tsx`
- **Elements:** ← back + "About" header, SlothAppIcon 64×64 (16px radius), "Sloth"
  (Fraunces 450 20px), "Version 1.0.0" (IBM Plex Mono 11px dim), description paragraph
  (12.5px dim centered lh:1.6), about rows (label + value or chevron), footer "Made
  slowly, on purpose." (11px dim centered)
- **Rows:** Check for updates / License (GPLv3) / Source code / Request a feature /
  Report an error / Privacy & security / Acknowledgments

---

## 5 · Data Layer

### 5.1 Database Path

All database code lives under `src/lib/db/`, not a top-level `src/db/`.

```
src/lib/db/
  client.ts               ← opens/initialises DB (getDb singleton), runs migrations
  key.ts                  ← expo-crypto SecureStore key generation
  schema.ts               ← SQL CREATE TABLE statements as strings
  migrations.ts           ← PRAGMA user_version gate pattern
  repositories/
    accounts.ts           ← account CRUD
    categories.ts         ← category CRUD
    transactions.ts       ← transaction CRUD + aggregation queries
    settings.ts           ← key-value settings store
```

### 5.2 Database Schema (op-sqlite + SQLCipher, STRICT mode)

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
- Migrations: `PRAGMA user_version` gate pattern in `migrations.ts`.
- Key storage: `expo-crypto` random 256-bit hex → `SecureStore`, key name `sloth_db_key`,
  accessibility `WHEN_UNLOCKED_THIS_DEVICE_ONLY` (see `key.ts`).

### 5.3 Hook Rules

| Current hook | File | Purpose |
|---|---|---|
| `useAccountsData` | `src/hooks/useAccountsData.ts` | Account list + balances |
| `useTransactionsData` | `src/hooks/useTransactionsData.ts` | Transaction list (filtered) |
| `useCategoriesData` | `src/hooks/useCategoriesData.ts` | Category list |
| `useDashboardData` | `src/hooks/useDashboardData.ts` | Aggregated dashboard data (balance + rings + recent txs) |
| `useAddTransactionData` | `src/hooks/useAddTransactionData.ts` | Accounts + categories for Add Transaction pickers |
| `useAppFonts` | `src/hooks/useAppFonts.ts` | Font loading (runs in root layout) |

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
  @op-engineering/op-sqlite + SQLCipher AES-256
  Key: 256-bit random hex (expo-crypto) → SecureStore (WHEN_UNLOCKED_THIS_DEVICE_ONLY)
  Key is COMPLETELY INDEPENDENT of PIN / biometrics
  Implementation: src/lib/db/key.ts

Layer 2: App Lock (expo-local-authentication)
  Biometric (Face ID / Touch ID) — primary
  6-digit PIN fallback — hashed and stored in SecureStore
  Implementation: src/lib/biometrics.ts, src/lib/pin.ts
  Lock state managed in app root; Lock screen at /lock

Layer 3: Screenshot Prevention
  Settings toggle → FLAG_SECURE (Android) via Expo config plugin
  Default: ON (screenshots blocked by default)
```

---

## 8 · Build & CI

### 8.1 EAS Profile (`eas.json`)

```json
{
  "cli": {
    "version": ">= 20.5.1",
    "appVersionSource": "remote"
  },
  "build": {
    "base": {
      "bun": "1.3.14",
      "resourceClass": "medium"
    },
    "development": {
      "extends": "base",
      "env": { "ENVIRONMENT": "development" },
      "distribution": "internal",
      "developmentClient": true
    },
    "staging": {
      "extends": "base",
      "env": { "ENVIRONMENT": "staging" },
      "distribution": "internal",
      "android": { "buildType": "apk" }
    },
    "production": {
      "extends": "base",
      "autoIncrement": true,
      "env": { "ENVIRONMENT": "production" },
      "android": { "buildType": "apk" }
    }
  },
  "submit": {
    "production": {}
  }
}
```

Key notes:
- `assembleRelease` is **not** explicitly set — EAS picks the default for APK `buildType`.
- Three profiles: `development` (dev client), `staging` (internal APK), `production` (release APK).
- All extend a `base` profile with Bun 1.3.14 pinned.
- Staging is equivalent to the older `gradleCommand: ":app:assembleRelease"` approach.

### 8.2 GitHub Actions (CI)

**Workflow file:** `.github/workflows/dev-build-android.yml`

```yaml
timeout-minutes: 50
triggers:
  - pull_request on main
  - workflow_dispatch

env:
  EXPO_TOKEN: [redacted]   # from secrets
  NODE_OPTIONS: --openssl-legacy-provider

Steps:
  1. Checkout repo (actions/checkout@v7)
  2. Setup Bun (oven-sh/setup-bun@v2, bun-version: latest)
  3. Bun cache (actions/cache@v6 on bun pm cache)
  4. Install deps & global eas-cli (bun install; bun add --global eas-cli)
  5. Build: eas build --platform android --profile staging --local
     --non-interactive --clear-cache --output=./app-dev.apk
  6. Upload APK artifact (actions/upload-artifact@v7, retention: 1 day)
```

**Constraints:**
- Run on `ubuntu-latest`.
- No explicit NDK/CMAKE/JAVA/ABI env vars — those come from the Ubuntu runner image.
- EAS manages all Android credentials — no manual keystore handling in workflow files.

### 8.3 Pre-commit Lint Gate (must all pass)

```bash
bun lint
```

This runs `prettier --write . && expo lint` (see `package.json` scripts).

---

## 9 · Hard Rules (agent must NEVER violate)

| # | Rule |
|---|---|
| 1 | Never add `@op-engineering/op-sqlite` to `app.json` plugins array → "Cannot find package better-sqlite3" error |
| 2 | Never use `<SafeAreaView>` → double-inset with Expo Router's SafeAreaProvider. Use `<View className="pt-safe">` |
| 3 | Never use `expo-vision-camera` (does not exist). Use `expo-camera@~57.0.0` |
| 4 | Never suppress lint with `// eslint-disable` comments. Fix root cause |
| 5 | Never store amounts as floats. Integer cents only |
| 6 | Never create `tailwind.config.js`. Use CSS-first `@theme` in `global.css` only |
| 7 | Never edit `android/` files directly — changes are wiped by `expo prebuild --clean`. Use config plugins |
| 8 | Never use `useSharedValue` inside component body if it triggers Reanimated immutability ESLint error. Use module-scope `makeMutable` |
| 9 | Always wrap Unicode escape sequences in JSX text nodes inside `{"..."}` JS string expressions |
| 10 | EAS manages all Android credentials — no manual keystore handling in workflow files |
| 11 | Never import from `src/db/` — database code lives under `src/lib/db/` |
| 12 | Never create routes under `(tabs)` — the route group is `(app)` |
| 13 | Font alias names in `global.css` (`--font-*`) MUST match the alias keys in `useAppFonts.ts` exactly |

---

## 10 · Implementation Plan (Phase-gated)

Each phase requires explicit approval before implementation begins.

### Phase 0 — Foundation ✅ Complete
- [x] Expo SDK 57 project scaffold, Bun, Expo Router `src/app/`
- [x] NativeWind v5 + Tailwind CSS v4 `global.css` `@theme` tokens, PostCSS, Metro wrapper
- [x] Font registration (10 variants in `useAppFonts.ts`)
- [x] @op-engineering/op-sqlite + SQLCipher (`package.json` config only)
- [x] DB client (`getDb` singleton), key generation, migrations, STRICT schema
- [x] SecureStore key generation (`expo-crypto` via `src/lib/db/key.ts`)
- [x] AGENTS.md + skill files

### Phase 1 — Onboarding & Auth ✅ Complete
- [x] Screen 00: Splash + cold-start routing
- [x] Screens 01–02–03: Unified swipe carousel in `onboarding/welcome.tsx`
- [x] SlothAppIcon SVG component (shared, no drift)
- [x] Screen 03: Biometric setup (`expo-local-authentication`, `src/lib/biometrics.ts`)
- [x] Screen 11 + 15: PIN entry + returning user lock (`lock.tsx`, `Keypad.tsx`, `PinDots.tsx`, `DialFrame.tsx`)
- [x] PIN setup flow: `onboarding/pin-setup.tsx`
- [x] Auth utilities: `src/lib/pin.ts`, `src/lib/biometrics.ts`, `src/lib/storage.ts`

### Phase 2 — Core Finance Screens ✅ Complete
- [x] Screen 04: Dashboard (`dashboard.tsx`, `AccountSwitcher`, `CategoryRingCard`, `TransactionRow`, `EmptyAccountsCard`)
- [x] Screen 05: Add Transaction (`add.tsx` tab variant + `transaction/new.tsx` push)
- [x] Screen 06: Accounts list (`accounts.tsx`)
- [x] Screen 07: Settings (`settings.tsx`, `Toggle.tsx`)
- [x] Repositories: accounts, transactions, categories, settings (under `src/lib/db/repositories/`)
- [x] Hooks: `useAccountsData`, `useTransactionsData`, `useCategoriesData`, `useDashboardData`, `useAddTransactionData`

### Phase 3 — Category & Account Management ✅ Complete
- [x] Screen 08: Categories list (`categories.tsx`, conic ring, EXPENSE/INCOME badge)
- [x] Screen 09: Add Account (`add-account.tsx`, type grid, logo grid)
- [x] Screen 10: Category editor + icon picker (`category-editor.tsx`)

### Phase 4 — Utility Screens ✅ Complete
- [x] Screen 12: FAB Action Sheet (`fab-sheet.tsx`)
- [x] Screen 13: Receipt Scan scaffold (`receipt-scan.tsx`, expo-camera, frame overlay)
- [x] Screen 14: CSV/OFX Import scaffold (`import.tsx`, `src/lib/csvParser.ts`)
- [x] Screen 16: Donate QR Modal (`donate.tsx`, `src/lib/export.ts`)
- [x] Screen 18: About (`about.tsx`)
- [x] Screen 00 Splash component: `SplashScreen.tsx`

### Phase 5 — OCR & Import Logic 🔲 Next
- [ ] Screen 13: expo-camera capture → on-device OCR (`src/lib/ocr.ts`) → pre-fill Add Transaction form
- [ ] Screen 14: CSV column parser → map to schema → bulk insert
- [ ] OFX/QFX parser (no network)

### Phase 6 — Data Export & Backup 🔲 Pending
- [ ] CSV export (all transactions, filtered by account/date) — `src/lib/export.ts` scaffold exists
- [ ] Encrypted backup (SQLCipher DB copy → share sheet) — `src/lib/backup.ts` scaffold exists
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
├── LICENSE                         (GPLv3)
├── README.md
├── CONTRIBUTING.md
├── app.json                        ← Expo config + plugins (expo-camera, build-properties, local-auth, etc.)
├── package.json                    ← dependencies + @op-engineering/op-sqlite sqlcipher config
├── eas.json                        ← 3 profiles (development/staging/production)
├── tsconfig.json                   ← strict, @/* → ./src/*
├── babel.config.js                 ← babel-preset-expo only
├── postcss.config.mjs              ← @tailwindcss/postcss plugin
├── metro.config.js                 ← NativeWind metro wrapper
├── eslint.config.js                ← flat config + Prettier plugin
├── nativewind-env.d.ts             ← generated NativeWind types
├── bun.lock                        ← Bun lockfile
│
├── assets/
│   └── icons/                      ← icon.png, adaptive-icon-*.png, favicon.png
│
├── .github/
│   ├── FUNDING.yml
│   └── workflows/
│       └── dev-build-android.yml   ← CI: bun install + eas build --local APK
│
└── src/
    ├── global.css                  ← Tailwind CSS v4 @theme tokens + safe-area utilities
    ├── global.d.ts                 ← declare module "*.css"
    │
    ├── app/
    │   ├── _layout.tsx             ← root layout (fonts → SplashScreen → Stack)
    │   ├── index.tsx               ← Screen 00: Splash + boot routing
    │   │
    │   ├── (app)/                  ← Tab group (expo-router/ui Tabs)
    │   │   ├── _layout.tsx         ← TabList: dashboard/accounts/add/transactions/settings
    │   │   ├── dashboard.tsx       ← Screen 04
    │   │   ├── accounts.tsx        ← Screen 06
    │   │   ├── add.tsx             ← Screen 05 (Add Transaction, tab variant)
    │   │   ├── transactions.tsx    ← Transaction list
    │   │   ├── settings.tsx        ← Screen 07
    │   │   └── categories.tsx      ← Screen 08
    │   │
    │   ├── onboarding/             ← Onboarding carousel
    │   │   ├── _layout.tsx         ← Stack (welcome + pin-setup)
    │   │   ├── welcome.tsx         ← Screens 01–02–03 unified carousel
    │   │   ├── pin-setup.tsx       ← PIN creation screen
    │   │   ├── privacy.tsx         ← Legacy redirect compat
    │   │   └── biometric.tsx       ← Legacy redirect compat
    │   │
    │   ├── lock.tsx                ← Screens 11 + 15: PIN entry / biometric unlock
    │   ├── add-account.tsx         ← Screen 09 (flat route)
    │   ├── category-editor.tsx     ← Screen 10 (flat route)
    │   ├── transaction/
    │   │   └── new.tsx             ← Screen 05 (push variant)
    │   ├── fab-sheet.tsx           ← Screen 12
    │   ├── receipt-scan.tsx        ← Screen 13
    │   ├── import.tsx              ← Screen 14
    │   ├── donate.tsx              ← Screen 16
    │   └── about.tsx               ← Screen 18
    │
    ├── components/
    │   ├── SlothAppIcon.tsx        ← Shared SVG (Splash, Onboarding, About)
    │   ├── SlothMark.tsx           ← Simplified inline sloth mark
    │   ├── DialFrame.tsx           ← Keypad dial circle wrapper
    │   ├── Keypad.tsx              ← PIN keypad (3×4 circle keypad)
    │   ├── FeatureRow.tsx          ← Onboarding feature row
    │   ├── StepDots.tsx            ← Onboarding pagination dots
    │   ├── dashboard/
    │   │   ├── AccountSwitcher.tsx
    │   │   ├── CategoryRingCard.tsx
    │   │   ├── EmptyAccountsCard.tsx
    │   │   └── TransactionRow.tsx
    │   ├── modals/
    │   │   └── DonateQRModal.tsx
    │   ├── navigation/
    │   │   ├── AddTabButton.tsx     ← FAB tab button (+ icon)
    │   │   ├── CustomTabBar.tsx     ← Legacy tab bar (may be unused)
    │   │   ├── TabBarButton.tsx    ← Headless tab trigger button
    │   │   └── icons.tsx           ← SVG tab icons (Home, Accounts, Transactions, Settings)
    │   └── ui/
    │       ├── BrassButton.tsx     ← Brass CTA button
    │       ├── ErrorBoundary.tsx   ← React error boundary
    │       ├── FingerprintIcon.tsx ← Fingerprint SVG
    │       ├── PinDots.tsx         ← 6-dot PIN display
    │       ├── TextLink.tsx        ← Styled link text
    │       └── Toggle.tsx          ← Settings toggle switch
    │
    ├── hooks/
    │   ├── useAccountsData.ts
    │   ├── useTransactionsData.ts
    │   ├── useCategoriesData.ts
    │   ├── useDashboardData.ts
    │   ├── useAddTransactionData.ts
    │   └── useAppFonts.ts
    │
    ├── lib/
    │   ├── db/
    │   │   ├── client.ts           ← getDb() singleton, open/init
    │   │   ├── key.ts              ← DB encryption key (expo-crypto → SecureStore)
    │   │   ├── schema.ts           ← CREATE TABLE statements
    │   │   ├── migrations.ts       ← PRAGMA user_version migrations
    │   │   └── repositories/
    │   │       ├── accounts.ts
    │   │       ├── categories.ts
    │   │       ├── transactions.ts
    │   │       └── settings.ts
    │   ├── backup.ts               ← Encrypted backup scaffold
    │   ├── biometrics.ts           ← expo-local-authentication wrapper
    │   ├── csvParser.ts            ← CSV/OFX parser
    │   ├── export.ts               ← Data export + QR save
    │   ├── format.ts               ← Currency/date formatting
    │   ├── ocr.ts                  ← OCR shim/scaffold
    │   ├── pin.ts                  ← PIN hashing/verification
    │   └── storage.ts              ← SecureStore/AsyncStorage wrapper
    │
    ├── screens/
    │   └── SplashScreen.tsx        ← Screen 00 visual component
    │
    ├── theme/
    │   └── colors.ts               ← JS color values matching global.css
    │
    └── db/.gitkeep                 ← legacy placeholder (DO NOT USE — all DB code under lib/db/)
```

## 12 · Agent Behaviour Rules

1. **Read this file first** before generating any code or making any decision.
2. **Mockup-first:** every pixel value, colour token, and font size must trace to
   `Sloth app mockup.html`. Do not invent values. (Mockup not committed — refer to
   the design tokens in `src/global.css` `@theme` and `src/theme/colors.ts` as the
   canonical source.)
3. **Approval gate:** present analysis/plan; wait for explicit approval before implementing
   any phase or screen.
4. **Full inline codeblocks:** all implementation code delivered as complete markdown
   codeblocks — no partial diffs, no `...` ellipsis, no `// TODO` stubs in deliverables.
5. **Lint before finalising:** mentally apply `bun lint` to every output.
   Fix root causes, never suppress.
6. **No scope creep:** implement exactly what the mockup shows. Do not add features or
   screens not in the approved screen set without explicit instruction.
7. **Conflict resolution order:** AGENTS.md hard rules > mockup design values >
   Expo/RN defaults.
8. **State assumptions explicitly:** if a decision requires an assumption not covered here,
   state it before proceeding and await confirmation.
