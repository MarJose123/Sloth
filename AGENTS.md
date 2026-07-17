# AGENTS.md — Sloth Android Finance App

> **Reasoning-model compatible.** Every section is written as explicit, machine-parseable
> constraints. No implicit assumptions. Ambiguity is a bug — file an issue instead.

---

## 0 · Meta / Purpose

Sloth is a **privacy-first, fully offline, multi-account personal finance tracker** for
Android (iOS deferred). All financial data lives **on-device only**, encrypted via
SQLCipher. There is no cloud sync, no analytics endpoint, no third-party login.

> **⚠️ Bun-only project:** This project uses **Bun** as its package manager and runtime.
> Never use `npm`, `yarn`, or `pnpm`. See §1 for details.

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
| Additional Expo plugins | `expo-router`, `expo-secure-store`, `expo-font`, `expo-local-authentication`, `expo-splash-screen`, `expo-camera`, `expo-build-properties`, `expo-image`, `expo-status-bar`, `expo-web-browser`, `@react-native-vector-icons/lucide` | All configured in `app.json` plugins array |
| Runtime helpers | `react-native-reanimated` 4.5.0, `react-native-gesture-handler` ~2.32.0, `react-native-worklets` 0.10.0, `react-native-safe-area-context` 5.7.0 | |
| Dev client | `expo-dev-client` ~57.0.7 | Used in development profile |

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

The theme uses a two-layer system: `--sloth-*` CSS variables defined in `:root` / `@media (prefers-color-scheme: dark)` in `global.css`, aliased to `--color-*` Tailwind utilities via `@theme`. Components should use the Tailwind utility names (`bg-surface-bg`, `text-text-primary`, `text-brass`, etc.).

| Token | CSS variable (`@theme` alias) | `--sloth-*` variable | Usage |
|---|---|---|---|
| Surface bg | `--color-surface-bg` | `--sloth-surface-bg` | Screen background |
| Surface card | `--color-surface-card` | `--sloth-surface-card` | Card surface |
| Surface elevated | `--color-surface-elevated` | `--sloth-surface-elevated` | Input bg, icon bg |
| Text primary | `--color-text-primary` | `--sloth-text-primary` | Primary text |
| Text secondary | `--color-text-secondary` | `--sloth-text-secondary` | Secondary text, labels |
| Brass | `--color-brass` | `--sloth-brass` | Primary accent, CTA buttons |
| Brass soft | `--color-brass-soft` | `--sloth-brass-soft` | Pressed state |
| Sage | `--color-sage` | `--sloth-sage` | Income, success, secondary accent |
| Rust | `--color-rust` | `--sloth-rust` | Alerts, negative balance, errors |
| Hairline | `--color-hairline` | `--sloth-hairline` | Borders, dividers (utility: `hairline`) |
| Dusty blue | `--color-dusty-blue` | `--sloth-dusty-blue` | Transit category ring |
| Ochre | `--color-ochre` | `--sloth-ochre` | Dining category ring |
| Ink (static) | `--color-ink` | `--sloth-ink` | CTA text on brass (#1B1F1A, same in both themes) |
| Parchment (static) | `--color-parchment` | `--sloth-parchment` | QR / badge bg (#F3EEE1, same in both themes) |

**Dark mode defaults:** surfaceBg=#1B1F1A, surfaceCard=#242920, surfaceElevated=#2E3428, textPrimary=#F3EEE1, textSecondary=#A79F8C, hairline=rgba(243,238,225,0.09), tabBar=rgba(18,20,28,0.95), sage=#7FA06B, brassSoft=#8F5636.

**Light mode defaults:** surfaceBg=#F5F0E4, surfaceCard=#EBE6D8, surfaceElevated=#E0DBCB, textPrimary=#1B1F1A, textSecondary=#6B6352, hairline=rgba(27,31,26,0.09), tabBar=rgba(235,230,216,0.95), sage=#6B8D58, brassSoft=#A96B42.

JS counterpart: `src/theme/colors.ts` exports the same values as typed `ColorPalette` for inline `style={}` use. The `useColors()` hook (imported from `ThemeContext`) returns the active palette at runtime — but note this hook is currently **imported but not yet implemented**; see §8.

### 2.2 Typography

| Role | CSS font key (class) | Weight | Size (reference) |
|---|---|---|---|
| Balance / headline | `font-fraunces` or `font-fraunces-medium` | 400 / 450 (500) | 44 px (dashboard), 32 px (onboarding) |
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
- **FAB:** Tab bar variant, centered pill button within the custom tab bar, `margin-top:-20px`
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
  Custom pill tab bar (Slot + manual navigation buttons):
    [dashboard] [accounts] [+/FAB] [transactions] [settings]

  Tab mapping:
    dashboard    → src/app/(app)/dashboard.tsx   (Screen 04)
    accounts     → src/app/(app)/accounts.tsx    (Screen 06)
    add (FAB)    → /fab-sheet.tsx                (Screen 12, pushed via router)
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
  `--text-secondary`), three loading dots `bottom:64px` (dot 2 active `--brass`, others
  `rgba(200,123,84,0.35)`)
- **Behaviour:** On mount → opens encrypted DB (runs migrations) → checks
  `storage.getOnboardingComplete()` → redirects to `/onboarding/welcome` (first run)
  or `/(app)/dashboard` (returning)

### Screen 01 — Onboarding Welcome
- **File:** `src/app/onboarding/welcome.tsx` (carousel slide 0)
- **Elements:** Lottie animation zone, "Sloth" mono eyebrow (`--brass`), SlothAppIcon
  fallback 120×120, H2 "Your money.\nYour device.\nNobody else's." (Fraunces 450 30px
  lh:1.18), subtext (Manrope 14px `--text-secondary` lh:1.55), pagination dots (3 dots,
  dot 1 active: `--brass` w:18px r:3px), "Continue" brass button
- **Carousel:** Shared horizontal swipe carousel for slides 01–02–03 (all in
  `welcome.tsx`). Uses `useColorScheme()` + inline `createStyles()` factory at module scope.

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
  fingerprint.", sub paragraph (13.5px `--text-secondary`), biometric ring (150px plain
  soft ring `border:1px solid rgba(200,123,84,0.55)`), fingerprint SVG inner circle
  78×78 (component: `FingerprintIcon.tsx`), caption "Touch the sensor to continue" (brass
  mono 12px 0.06em), "Enable Face / Touch ID" brass button, "Use a 6-digit PIN instead"
  underlined dim fallback → navigates to `/onboarding/pin-setup`

### Screen 04 — Dashboard
- **File:** `src/app/(app)/dashboard.tsx`
- **Elements:**
    - Greeting "Good morning/afternoon/evening" (12.5px `--text-secondary`)
    - Account switcher chips (horizontal scroll; component: `AccountSwitcher.tsx`)
    - "Total balance" label (12px dim), balance (Fraunces 450 44px -0.01em tracking)
    - Ring row: 3 ring cards (`--surface-card`, 16px radius), rings are `border:3px solid <color>`
      circles with percentage text (IBM Plex Mono 10px) — no fill (component: `CategoryRingCard.tsx`)
    - Recent section header with inline "+ Add" brass pill button (700, 11px, 14px radius)
    - Transaction rows: name (Manrope 600 13.5px) + meta (11px dim); amount (IBM Plex Mono
      13.5px; negative=`--parchment`, positive=`--sage`) (component: `TransactionRow.tsx`)\`;
    - Empty state card when no accounts exist (component: `EmptyAccountsCard.tsx`)
    - **No** tab bar (tabs are rendered by the custom pill bar in `(app)/_layout.tsx`)

### Screen 05 — Add Transaction (push route)
- **File:** `src/app/transaction/new.tsx` (push form); action sheet at `src/app/fab-sheet.tsx`
- **Elements:** Cancel / "New expense" / Save header, amount display (Fraunces 450 46px,
  cursor `--brass`), method pills (Manual/Scan receipt/Import; active:
  `rgba(200,123,84,0.14)` bg brass border), four field blocks (`--surface-card`, 14px radius),
  scan hint row (sage, "◎" prefix), **no** tab bar
- **Hook:** `useAddTransactionData` (custom hook, plain `useEffect` — no state flash on back)

### Screen 06 — Accounts List
- **File:** `src/app/(app)/accounts.tsx`
- **Elements:** "Accounts" (Fraunces 450 20px) + "+ Add" brass link, account cards
  (`--surface-card`, 16px radius, 38×38 logo tile 11px radius), balance (IBM Plex Mono 14px),
  "Add another account" dashed card, footnote (11px dim centered), tab bar
- **Logo tile:** solid colour bg + 2-char initials (IBM Plex Mono 12px 700 `--ink` text)

### Screen 07 — Settings
- **File:** `src/app/(app)/settings.tsx`
- **Groups:** Appearance, Security, Data, Support, About
- **Toggle:** on=`rgba(200,123,84,0.9)` thumb right; off=`--surface-elevated` + hairline border thumb
  left `--text-secondary` (component: `Toggle.tsx`)
- **Segment control (Theme):** `--surface-elevated` bg, active segment `--brass` bg `--ink` text,
  10.5px 700

### Screen 08 — Categories / Expense Types
- **File:** `src/app/(app)/categories.tsx`
- **Elements:** "Categories" title + "+ Add" link, "This month · ring shows share of total
  spend" sub label (11px dim), category rows with conic-gradient ring, inner `--surface-card`
  circle with emoji, name (13.5px 700) + type badge (IBM Plex Mono 11px dim), spend +
  tx count (IBM Plex Mono 12.5px), dashed "Create a new expense type" card
- **Ring formula:** `background: conic-gradient(var(--ring-color) var(--pct), rgba(243,238,225,0.09) 0)`

### Screen 09 — Add Account
- **File:** `src/app/add-account.tsx` (flat route)
- **Elements:** Cancel / "New account" / Save header, name field, type grid (2×2:
  Checking/Savings/Credit card/Cash), logo preview (64×64 `--surface-card` dashed), logo grid
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
- **File:** `src/app/(app)/fab-sheet.tsx` (modal action sheet)
- **Elements:** scrim `rgba(8,9,13,0.6)`, bottom sheet (`--surface-card`, 22px top radius,
  hairline border), drag handle (36×4px `rgba(237,233,224,0.2)`), "Add to Sloth" title
  (Fraunces 450 18px), 4 action rows (icon tile `--surface-elevated` brass border + bold label + dim
  description)
- **Actions:** Manual transaction / Scan receipt / New account / Import CSV/OFX

### Screen 13 — Receipt Scan / OCR
- **File:** `src/app/receipt-scan.tsx`
- **Camera:** `expo-camera@~57.0.0` still-image capture — **not** `react-native-vision-camera`
- **Elements:** camera viewport overlay gradient, ✕ close + "Flash: Auto" top bar,
  "◈ Lottie — align receipt in frame" caption, dashed receipt frame with brass scan-line
  animation (Lottie), detected results card (`--surface-card`, sage "Detected on-device" tag),
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
- **Elements:** scrim, modal card (82% width, `--surface-card`, 22px radius), ✕ close,
  "Support Sloth" (Fraunces 450 19px), descriptor paragraph (12px dim lh:1.5), QR box
  (168×168 `--parchment` bg 14px radius 12px padding), address (IBM Plex Mono 10.5px
  `--surface-elevated` bg), "⬇ Save to Photos" brass button, sage toast "✓ Saved to gallery"
- **Hook/helper:** `src/lib/export.ts` (download/save QR)

### Screen 18 — About
- **File:** `src/app/about.tsx`
- **Elements:** ← back + "About" header, SlothAppIcon 64×64 (16px radius), "Sloth"
  (Fraunces 450 20px), "Version 1.0.0" (IBM Plex Mono 11px dim), description paragraph
  (12.5px dim centered lh:1.6), about rows (label + value or chevron), footer "Made
  slowly, on purpose." (11px dim centered)
- **Rows:** Check for updates / License (GPLv3) / Source code / Acknowledgments

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

All ids are TEXT UUIDs generated via `expo-crypto`'s `randomUUID()`. Amounts are integer cents only. The running balance is computed at query time (`starting_balance + SUM(transactions.amount_cents)`), not stored in a cached column.

```sql
PRAGMA journal_mode = WAL;

CREATE TABLE settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
) STRICT;

CREATE TABLE accounts (
  id               TEXT PRIMARY KEY NOT NULL,
  name             TEXT NOT NULL,
  type             TEXT NOT NULL CHECK (type IN ('checking','savings','credit','cash')),
  starting_balance INTEGER NOT NULL DEFAULT 0,
  logo_key         TEXT,
  color_hex        TEXT NOT NULL,
  created_at       INTEGER NOT NULL,
  archived_at      INTEGER
) STRICT;

CREATE TABLE categories (
  id         TEXT PRIMARY KEY NOT NULL,
  name       TEXT NOT NULL,
  icon       TEXT NOT NULL,
  color_hex  TEXT NOT NULL,
  kind       TEXT NOT NULL CHECK (kind IN ('expense','income')),
  created_at INTEGER NOT NULL,
  archived_at INTEGER
) STRICT;

CREATE TABLE transactions (
  id           TEXT PRIMARY KEY NOT NULL,
  account_id   TEXT NOT NULL REFERENCES accounts(id),
  category_id  TEXT REFERENCES categories(id),
  merchant     TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  occurred_at  INTEGER NOT NULL,
  note         TEXT,
  source       TEXT NOT NULL CHECK (source IN ('manual','scan','import')),
  created_at   INTEGER NOT NULL
) STRICT;

CREATE INDEX IF NOT EXISTS idx_transactions_account
  ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category
  ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_occurred_at
  ON transactions(occurred_at);

PRAGMA user_version = 1;  -- increment on each migration
```

**Rules:**
- Amounts: **integer cents only** — never floats.
- Migrations: `PRAGMA user_version` gate pattern in `migrations.ts`.
- Key storage: `expo-crypto` random 256-bit hex → `SecureStore`, key name `sloth.db_encryption_key`,
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
| Swipe gesture (onboarding carousel) | `useColorScheme()` + `createStyles()` factory at module scope |
| Lottie screens (01, 02, 03, 13) | `lottie-react-native` — not static graphics |
| Progress / biometric rings | SVG `<Circle>` strokeDasharray or `Animated`; biometric ring = plain border |
| Bottom sheet dismiss | `react-native-reanimated` v4 translateY + `Gesture.Pan()` |

**Reanimated ESLint rule:** If you encounter the Reanimated immutability lint error, use `makeMutable(value)` at module scope instead of `useSharedValue` inside the component body.

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

## 8 · Theme System

### 8.1 Architecture

Theming uses a **`VariableContextProvider`** from NativeWind, wrapping the app at the root layout:

```
src/theme/
  ThemeContext.tsx      ← Simple ThemeProvider wrapping VariableContextProvider
  darkColors.ts         ← Dark palette (default)
  lightColors.ts        ← Light palette
  colors.ts             ← Re-exports darkColors as default + exports both palettes
```

### 8.2 ThemeProvider

**File:** `src/theme/ThemeContext.tsx`

The ThemeProvider is a straightforward component that:

- Receives a theme `name` prop (currently only `"default"`)
- Reads the device color scheme via `useColorScheme()` from React Native
- Selects the matching palette (`darkColors` or `lightColors` from the theme map)
- Maps the palette's JS values to `--sloth-*` CSS variable names
- Passes them into NativeWind's `<VariableContextProvider>`, which overrides the `var(--sloth-*)` references in `global.css` at runtime

```tsx
import { useColorScheme } from "react-native";
import { VariableContextProvider } from "nativewind";
```

The CSS variables it provides are:
```
--sloth-surface-bg, --sloth-surface-card, --sloth-surface-elevated
--sloth-text-primary, --sloth-text-secondary
--sloth-brass, --sloth-brass-soft, --sloth-sage, --sloth-rust
--sloth-dusty-blue, --sloth-ochre
--sloth-ink, --sloth-parchment
--sloth-hairline, --sloth-tab-bar
```

### 8.3 Color Palettes

**Dark (default):** `darkColors.ts` — deep ink backgrounds (#1B1F1A), warm parchment text (#F3EEE1), brass accents (#C87B54).

**Light:** `lightColors.ts` — warm-light surfaces (#F5F0E4), dark ink text (#1B1F1A), adjusted accents (sage #6B8D58) for contrast.

### 8.4 How Runtime Theme Switching Works

The theme switching uses a CSS-variable-override approach via React context:

1. **`global.css` defaults** — `:root` defines **light-mode** defaults for all `--sloth-*` CSS variables. The `@media (prefers-color-scheme: dark)` block provides dark-mode overrides.

2. **`VariableContextProvider` overrides** — `ThemeContext.tsx` wraps the app and injects the JS palette values into CSS variables via React context. When the device color scheme changes, `useColorScheme()` updates, and the new palette takes effect immediately.

3. **`@theme` aliases** — The `@theme` block in `global.css` maps `--sloth-*` variables to `--color-*` Tailwind utility names (e.g., `--color-surface-bg: var(--sloth-surface-bg)`). Components use semantic Tailwind classes like `bg-surface-bg`, `text-text-primary`, `text-brass`.

### 8.5 Known Gap: `useColors()` hook

`useColors()` is **imported from `@/theme/ThemeContext` by ~20 components** but is **not currently exported or defined** there. ThemeContext.tsx only exports `ThemeProvider`. The hook needs to be implemented (likely a React context consumer returning the active `ColorPalette`). Until then, components that import it will **fail at runtime** if the import is not tree-shaken.

The intended interface (per imports already in code) is:
```ts
const colors = useColors(); // → ColorPalette (darkColors or lightColors)
```

### 8.6 Styling Components — Prefer Tailwind Classes

**The CSS variable mechanism (§8.4) means Tailwind utility classes like `bg-surface-bg`,
`text-text-primary`, `border-hairline`, etc. automatically switch with the theme.**
Components should use these classes rather than inline `style={{}}` for static colour properties.

**✅ DO this (preferred):**
```tsx
<View className="flex-1 bg-surface-bg">
  <Text className="text-text-primary">Hello</Text>
</View>
```

**❌ NOT this (unnecessary indirection):**
```tsx
const colors = useColors();
<View className="flex-1" style={{ backgroundColor: colors.surfaceBg }}>
  <Text style={{ color: colors.textPrimary }}>Hello</Text>
</View>
```

**When `useColors()` is still appropriate — use it ONLY for these cases:**

| Use case | Example |
|---|---|
| Native component props (not `style`) | `tintColor={colors.brass}` on RefreshControl, `placeholderTextColor={colors.textSecondary}` on TextInput |
| Icon / SVG component props | `color={colors.brass}` on Lucide/XIcon, `stroke={colors.hairline}` on Circle |
| Dynamic icon/SVG colour with alpha | `colors.brass + "80"` (alpha concatenation — no Tailwind equivalent) |
| RN-specific style props | `shadowColor: colors.brass` (RN shadow props map to Tailwind poorly) |
| expo-router config objects | `contentStyle: { backgroundColor: colors.surfaceBg }` |
| Module-level/initialiser constants | `export const BADGE_COLORS = [colors.brass, ...]`, `useState<string>(colors.brass)` |
| `createStyles(c: ColorPalette)` factories | Stylesheet-like factory patterns (e.g. onboarding/welcome.tsx) |
| `colors.tabBar` | No Tailwind utility exists for this token |

**For dynamic/conditional colours,** use dynamic `className` expressions — NOT `useColors()`:

```tsx
// ✅ DO: dynamic className
<Text className={isIncome ? "text-sage" : "text-text-primary"}>Amount</Text>
<View className={value ? "bg-brass" : "bg-surface-elevated"} />

// ❌ NOT: useColors() for conditional colours
const colors = useColors();
<Text style={{ color: isIncome ? colors.sage : colors.textPrimary }}>Amount</Text>
```

**Never** use `useColors()` for a static colour that has a direct Tailwind equivalent
(e.g., `style={{ backgroundColor: colors.surfaceBg }}` when `className="bg-surface-bg"` works).

**Never** duplicate a Tailwind class with an inline style — if `className` already has
`bg-surface-card`, don't add `style={{ backgroundColor: colors.surfaceCard }}`.

### 8.7 Module-Level Constants

Files that define colour arrays at module scope (e.g. `BADGE_COLORS`, `RING_COLORS`) import from the static `colors` export:

```ts
const BADGE_COLORS = [colors.brass, colors.sage, colors.rust];
```

These accent colours (brass, rust, dustyBlue) are identical in both themes, so the static import is safe.

### 8.8 Settings Integration

The Appearance section in Settings uses a segmented control (Light / Dark) that persists to SecureStore via `storage.setThemePreference()`. The actual theme switching is handled by React Native's `Appearance.setColorScheme()` (imported in settings.tsx). Future work: connect this to `ThemeContext` to support theme preference persistence and "auto" mode.

### 8.9 Key Files

| File | Role |
|---|---|
| `src/global.css` | `:root` + `@media (prefers-color-scheme: dark)` CSS variables + `@theme` |
| `src/theme/ThemeContext.tsx` | VariableContextProvider bridge (simple, no hooks yet) |
| `src/theme/darkColors.ts` | JS dark palette for inline styles |
| `src/theme/lightColors.ts` | JS light palette for inline styles |
| `src/theme/colors.ts` | Exports both palettes + default `colors` (dark) |
| `src/app/(app)/settings.tsx` | Theme segment control (Light / Dark); calls `Appearance.setColorScheme()` |

### 8.10 The `dark:` Tailwind Variant

NativeWind v5 supports the `dark:` variant, which maps to
`@media (prefers-color-scheme: dark)`. It is **available** in this project but
**rarely needed** because the project uses semantic colour tokens
(`bg-surface-bg`, `text-text-primary`, etc.) that already auto-switch via the CSS variable
mechanism (§8.4).

**When `dark:` may be useful:**
- For a one-off override where a component needs a different colour in dark mode
  beyond what the semantic token provides. Example: `dark:border-hairline` to add
  a border that only appears in dark mode.

**Why `dark:` is normally unnecessary here:**
- `bg-surface-bg` already means "the background surface colour" and swaps automatically.
- `text-text-primary` already means "the primary text colour" and swaps automatically.
- There is no need to write `bg-surface-bg-light dark:bg-surface-bg-dark` — the semantic token approach handles both modes in a single class.

**Never** mix the two approaches on the same element — don't write
`bg-surface-bg dark:bg-surface-card` (confusing: the dark value of one token is another token's light value). If a genuine one-off override is needed, use `dark:` with a literal colour or a purpose-specific token.

## 9 · Build & CI

### 9.1 EAS Profile (`eas.json`)

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

### 9.2 GitHub Actions (CI)

**Workflow file:** `.github/workflows/dev-build-android.yml`

```yaml
timeout-minutes: 50
triggers:
  - push on main
  - workflow_dispatch
  - (pull_request triggers a check-skip job, but build-and-deploy runs only on push)

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

### 9.3 Pre-commit Lint Gate (must all pass)

```bash
bun lint
```

This runs `prettier --write . && expo lint` (see `package.json` scripts).

---

## 10 · Hard Rules (agent must NEVER violate)

| # | Rule |
|---|---|
| 1 | Never add `@op-engineering/op-sqlite` to `app.json` plugins array → "Cannot find package better-sqlite3" error |
| 2 | Never use `<SafeAreaView>` → double-inset with Expo Router's SafeAreaProvider. Use `<View className="pt-safe">` |
| 3 | Never use `expo-vision-camera` (does not exist). Use `expo-camera@~57.0.0` |
| 4 | Never suppress lint with `// eslint-disable` comments. Fix root cause |
| 5 | Never store amounts as floats. Integer cents only |
| 6 | Never create `tailwind.config.js`. Use CSS-first `@theme` in `global.css` only |
| 7 | Never edit `android/` files directly — changes are wiped by `expo prebuild --clean`. Use config plugins |
| 8 | If you encounter the Reanimated immutability ESLint error, use module-scope `makeMutable` instead of `useSharedValue` inside the component body |
| 9 | Always wrap Unicode escape sequences in JSX text nodes inside `{"..."}` JS string expressions |
| 10 | EAS manages all Android credentials — no manual keystore handling in workflow files |
| 11 | Never import from `src/db/` — database code lives under `src/lib/db/` |
| 12 | Never create routes under `(tabs)` — the route group is `(app)` |
| 13 | Font alias names in `global.css` (`--font-*`) MUST match the alias keys in `useAppFonts.ts` exactly |
| 14 | **Never use `npm`, `yarn`, or `pnpm`** — only `bun` commands (`bun install`, `bun add`, `bun remove`, `bun lint`, etc.). The lock file is `bun.lock`, not `package-lock.json` |
| 15 | **Never use `useColors()` + inline `style` for a static colour** that has a Tailwind utility equivalent. Use `className="bg-surface-bg"` instead of `style={{ backgroundColor: colors.surfaceBg }}`. See §8.6 for the full rule and legitimate exceptions. |

---

## 11 · Implementation Plan (Phase-gated)

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
- [x] Screen 05: Add Transaction (`transaction/new.tsx` push)
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

## 12 · File Structure Reference

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
    │   ├── (app)/                  ← Tab group (Slot + custom pill tab bar)
    │   │   ├── _layout.tsx         ← Custom tab bar: dashboard/accounts/+/transactions/settings
    │   │   ├── dashboard.tsx       ← Screen 04
    │   │   ├── accounts.tsx        ← Screen 06
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

## 13 · Agent Behaviour Rules

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
