---
name: nativewind-brand-tokens
description: Use when building or styling any screen/component in Sloth — color tokens, typography roles, the shared ring motif, category color rules, and bottom nav conventions. Reference before writing NativeWind classes or SVG colors.
---

# NativeWind brand tokens & screen conventions (Sloth)

Use this skill for any UI work: new screens, restyling existing ones, category/account
color assignment, or icons.

## Source of truth

The mockup file (19 screens, `vault-app-mockup.html`) is the design reference. Before
inventing a new layout, spacing value, or copy tone, check whether the mockup already
shows the pattern.

## Color tokens

Colors must be defined **once** and mirrored in both:
1. `tailwind.config.js` (for NativeWind classes)
2. `colors.ts` (for `react-native-svg` and any other non-Tailwind consumer)

If you add or change a token, update both files in the same change — a mismatch between
them is a real bug class here, not a style nit.

| Token | Value | Role |
|---|---|---|
| `ink` | `#1B1F1A` | Background |
| `ink-2` | `#242920` | Card surface |
| `ink-3` | `#2E3428` | Tertiary surface |
| `parchment` | `#F3EEE1` | Primary text |
| `parchment-dim` | `#A79F8C` | Secondary text |
| `brass` | `#C87B54` | Primary accent |
| `sage` | `#7FA06B` | Secondary accent |
| `rust` | `#9C4A3D` | Alerts / negative amounts |
| (unnamed) | `#6E8FB0` | Category extra — dusty blue |
| (unnamed) | `#C9A227` | Category extra — ochre |

## Category / account color rule

- Use **at least 5 distinct hues** across categories or account chips. Never let a
  color repeat while an unused token from the palette above is still available.
- This is a regression class: an earlier version cycled only `brass`/`sage` across 5
  categories and it was hard to distinguish them. When adding a 6th+ category, extend
  the palette deliberately rather than reusing existing hues.
- Category ring icon-circle background should be a lighter surface than the screen
  background so glyphs (including non-emoji glyphs) stay legible — set explicit text
  color on non-emoji glyphs, don't rely on inherited color.

## Typography roles

- **Fraunces** (serif) — balances, headline numbers, screen titles that need warmth/weight.
- **Manrope** — general UI body text, buttons, labels.
- **IBM Plex Mono** — category tags, data values, privacy/status indicators (e.g. "Processed on this device").

Don't mix roles — e.g. don't set a balance in Manrope or a body paragraph in Fraunces.

## Shared ring motif

One plain, soft ring shape (no lock-dial tick marks) is reused for:
- The biometric unlock frame (onboarding + lock screen)
- Budget/category progress rings on the dashboard and categories screen

Don't introduce a second ring/dial visual style — extend the existing one (e.g. via a
shared `Ring` component) rather than hand-rolling a new SVG ring per screen.

## Bottom navigation

Fixed order, don't reorder or rename: **Home / Accounts / + (Add) / Transactions / Settings**,
with the "+" rendered as a raised brass circular FAB in the center tab slot.

## Android-first chrome

- Camera cutout: neutral punch-hole, not an iOS-style pill notch.
- Back navigation icon: Material-style arrow (`←`), not an iOS chevron (`‹`).

## Checklist for a new/changed screen

- [ ] Colors pulled from the token table (via `tailwind.config.js` / `colors.ts`), no hardcoded hex
- [ ] Any new token added to *both* `tailwind.config.js` and `colors.ts`
- [ ] Correct typeface role used for each text element
- [ ] Category/account colors don't repeat a hue that's already in use elsewhere on screen
- [ ] Reused the existing `Ring` component instead of a new ring/dial SVG
- [ ] Bottom nav (if present) keeps the fixed 5-item order with brass "+" center FAB
- [ ] Checked mockup file for the closest matching screen before inventing new spacing/copy
