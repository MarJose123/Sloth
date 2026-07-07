---
name: uniwind-brand-tokens
description: Use when building or styling any screen/component in Sloth — color tokens (Tailwind v4 @theme syntax in global.css), typography roles, the shared ring motif, category color rules, and bottom nav conventions.
---

# Uniwind brand tokens & screen conventions (Sloth)

## Design source

19-screen HTML mockup at `design/slot-app-mockup.html` — reference before inventing new layouts.

## Where config lives

All styling config in **`src/global.css`** — no separate `tailwind.config.js` file.

**Tailwind v4 `@theme` block**:
```css
@theme {
  --color-ink: #1b1f1a;
  --color-parchment: #f3eee1;
  --font-fraunces: "Fraunces_400Regular";
  /* ... rest of tokens */
}
```

**Custom utilities**:
```css
@utility hairline {
  border-color: rgba(243, 238, 225, 0.09);
}
```

**Metro config** (`metro.config.js`):
```javascript
const { withUniwindConfig } = require("uniwind/metro");
module.exports = withUniwindConfig(config, {
  cssEntryFile: "./src/global.css",
  dtsFile: "./src/uniwind-types.d.ts",
});
```

## Token table

| Name | Value | Role |
|---|---|---|
| `ink` | `#1B1F1A` | Background |
| `ink-2` | `#242920` | Card |
| `ink-3` | `#2E3428` | Tertiary |
| `parchment` | `#F3EEE1` | Primary text |
| `parchment-dim` | `#A79F8C` | Secondary text |
| `brass` | `#C87B54` | Accent |
| `brass-soft` | `#8F5636` | Softer accent |
| `sage` | `#7FA06B` | Secondary |
| `rust` | `#9C4A3D` | Negative |
| `dusty-blue` | `#6E8FB0` | Category extra |
| `ochre` | `#C9A227` | Category extra |

**Typography roles**:
- **Fraunces** (serif) — balances, headlines
- **Manrope** — UI body text, buttons
- **IBM Plex Mono** — labels, data, privacy indicators

## Category color rule

**Use at least 5 distinct hues.** Real regression: earlier version cycled only brass/sage across 5 categories and they blended together.

Example: Categories get brass, sage, rust, dusty-blue, ochre — each distinct, no repeats until the 6th category (then pick next available unused color or add new token).

## Checklist

- [ ] Colors pulled from `src/global.css` `@theme` block, no hardcoded hex
- [ ] New tokens added to **both** `global.css` and `src/theme/colors.ts`
- [ ] Typography roles matched: Fraunces for balance/headline, Manrope for body, Mono for data
- [ ] Category/account colors don't repeat hue on same screen
- [ ] Reused existing soft-ring component, not new ring SVG
- [ ] Bottom nav (if present) maintains fixed 5-item order with brass "+" center
- [ ] Checked mockup file for closest matching screen before inventing new spacing/copy
