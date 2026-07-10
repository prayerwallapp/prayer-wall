# Figma Design System Rules — Prayer Wall

Generated from the [Prayer Wall — Design System](https://www.figma.com/design/utGO9go3xjfNUC0N6yIbzM) Figma file (v1 foundations, built July 2026) cross-referenced against the codebase. Follow these rules whenever translating a Figma design from that file into code, or pushing code changes back into Figma.

Companion documents:
- `prayer-wall-design-system-snapshot-2026-07-07.md` (repo root) — full variable/style/component inventory as captured from Figma. Diff against it before translating manual Figma edits into code.
- `PRAYER_WALL_PROJECT.md` — product source of truth; overrides anything here on scope questions.

---

## 1. Framework & styling stack

- **Framework:** Next.js 14 (App Router) + React 18 + TypeScript 5.
- **Styling:** Tailwind CSS 3.4 utility classes in JSX. No CSS-in-JS, no CSS Modules. Global CSS lives in `app/globals.css` (Tailwind directives + a few keyframe animations only).
- **Fonts:** Lexend (display/headings) and Inter (body), loaded via `next/font` and exposed as `--font-lexend` / `--font-inter`. Tailwind: `font-display`, `font-body`.

## 2. Token architecture

Tokens flow **Figma variables → CSS custom properties → Tailwind utilities**. Never skip a layer.

- **Source of values:** `app/tokens.css` — mirrors the Figma variable collections (Primitives, Layout, Color) one-to-one. Do not hand-edit values there without updating the Figma file to match, and vice versa.
- **Tailwind wiring:** `tailwind.config.ts` maps every token to a utility via `var(...)` references — colors, `spacing.{xs..2xl}`, `borderRadius.{sm,md,lg,full}`, `fontFamily.{display,body}`.
- **Primitives** (`--gray-900`, `--teal-600`, …) exist only to be aliased by semantic tokens. Never reference a primitive directly in component code.

### Figma variable → code mapping

| Figma variable | CSS custom property | Tailwind utility |
|---|---|---|
| `color/bg/page` | `--color-bg-page` | `bg-page` |
| `color/bg/card` | `--color-bg-card` | `bg-card` |
| `color/text/primary` | `--color-text-primary` | `text-primary` |
| `color/text/secondary` | `--color-text-secondary` | `text-secondary` |
| `color/text/muted` | `--color-text-muted` | `text-muted` |
| `color/border/default` | `--color-border-default` | `border-border` |
| `color/brand/primary` | `--color-brand-primary` | `bg-brand` / `text-brand` |
| `color/brand/on-primary` | `--color-brand-on-primary` | `text-brand-on` |
| `color/semantic/prayer` | `--color-semantic-prayer` | `bg-prayer` / `text-prayer` / `border-prayer` |
| `color/semantic/prayer-bg` | `--color-semantic-prayer-bg` | `bg-prayer-bg` |
| `color/semantic/prayer-text` | `--color-semantic-prayer-text` | `text-prayer-text` |
| `color/semantic/praise` (+ `-bg`, `-text`) | `--color-semantic-praise*` | `praise` variants, same pattern |
| `color/status/danger` / `success` / `warning` (+ `on-*`) | `--color-status-*` | `bg-danger`, `text-danger-on`, etc. |
| `spacing/xs..2xl` (4/8/16/24/32/48) | `--spacing-*` | `p-md`, `gap-lg`, `mt-xl`, … |
| `radius/sm..full` (8/12/20/999) | `--radius-*` | `rounded-sm/md/lg/full` |

When `get_design_context` or `get_variable_defs` returns a `var(--color-…)` reference, that is the token name — use the Tailwind utility from this table, never the resolved hex.

### Church-configurable tokens (critical, multi-tenancy)

Six tokens are **runtime-overridden per church** in `app/layout.tsx` from the `churches` row (`brand_color`, `background_color`, `prayer_color`, `praise_color`): `--color-brand-primary`, `--color-brand-on-primary`, `--color-bg-page`, and the prayer/praise base colors. The values in Figma and `tokens.css` are defaults/placeholders only.

- Never hardcode the hex for brand, page background, prayer, or praise colors anywhere — a church override would silently break.
- The `on-*` foreground colors are **not stored in the DB**; they must be computed at runtime by a WCAG-luminance contrast check (planned home: `lib/theme/contrast.ts` — **does not exist yet**, verify before referencing) and injected alongside the background they pair with.
- `--brand-color` and `--background-color` (in `globals.css` and `layout.tsx`) are **deprecated legacy aliases**, not a permanent dual system. All new code uses `--color-brand-primary` / `--color-bg-page` exclusively. Migrate existing usages opportunistically when touching a file — same policy as the legacy `zinc-*` utilities (§7.4) — until the aliases can be deleted.

## 3. Typography

Text styles from Figma map to token'd sizes in `tokens.css`:

| Figma text style | Font / weight | Size / line | Code |
|---|---|---|---|
| Display | Lexend SemiBold | 28 / 34 | `font-display font-semibold text-[length:var(--font-display-size)] leading-[var(--font-display-line)]` |
| Heading/H1 | Lexend SemiBold | 22 / 28 | `--font-h1-*` |
| Heading/H2 | Lexend Medium | 17 / 22 | `--font-h2-*` |
| Body | Inter Regular | 15 | `--font-body-size` |
| Body Small | Inter Regular | 13 | `--font-body-small-size` |
| Caption | Inter Regular | 12 | `--font-caption-size` |
| Label | Inter Medium | 13 | `--font-label-size` |

Match a text node in Figma to its named style, then use the corresponding token — don't transcribe raw px values from the inspect panel.

## 4. Effects

| Figma effect style | Value |
|---|---|
| Shadow/Card | 0 1px 3px rgba(0,0,0,0.05) |
| Shadow/Modal | 0 8px 24px rgba(0,0,0,0.12) |

These are not yet in `tokens.css`/Tailwind — if a design uses them, add `--shadow-card` / `--shadow-modal` tokens and `boxShadow` entries in `tailwind.config.ts` rather than inlining arbitrary values.

## 5. Component library

- **Code components:** `components/` — grouped by surface: `wall/` (SubmissionCard, WallGrid, SubmissionModal, ProfileMenu, …), `admin/`, `notifications/`. Client components marked `'use client'`, typed `Props` at top, named exports of PascalCase files.
- **Figma components** (one page per component in the file): Icon Button (5 style variants), Segmented Toggle, Post Card (Type=Prayer|Praise × Size=Default|Compact|Display), Submission Composer, Button (Primary|Brand|Secondary|Ghost), Text Input (Text|Color + Contrast Readout), Profile Menu, Branding Settings Modal, plus full-screen shells (Wall Grid, Onboarding, Moderation Inbox, Weekly Digest Email, Display App 1920×1080).
- **Mapping:** Figma "Post Card" = `components/wall/SubmissionCard.tsx` (implements all six variants via `size` / `submission.type`; the display app renders `size="display"`); "Wall Grid" ≈ `WallGrid.tsx`/`SubmissionsGrid.tsx`; "Profile Menu" ≈ `ProfileMenu.tsx`. No Code Connect mappings exist yet — check the actual component file before assuming its props or structure match the Figma variant model.
- **Submission Composer** (node `8:7`, page `3:62`) = the SubmissionStep inside `components/wall/SubmissionModal.tsx`: borderless textarea + bottom toolbar (Segmented Toggle pill, counter visible only in the last 50 characters, anonymous eye-off icon toggle → Filled-Brand when active, Filled-Dark arrow-up send). Code-side extensions: answered-prayer dropdown between textarea and toolbar (Praise only), care-team caption checkbox below the toolbar. The page carries a designer-annotation TEXT node (`8:30`) with the behavioral spec — read it before changing this component.
- **Post Card code-side extensions** (deliberate, not in the Figma mockup): an updates-toggle text link (Caption style) below the reaction chips on Default/Compact only — Display stays zero-interaction; and an answered-prayer pill (rounded-full, Caption, `bg-prayer-bg`/`text-prayer-text`) beside the timestamp/name on all three sizes. Keep these when re-syncing the card from Figma.
- Before building a new component from Figma, check whether an existing component covers it; extend variants rather than duplicating.

### Variant conventions

Figma variant props translate to TypeScript union props: `Type=Prayer|Praise` → `type: 'prayer' | 'praise'`; `Size=Default|Compact|Display` → `size` prop. Prayer/praise theming comes from the semantic token pair (`bg-prayer-bg text-prayer-text`, etc.), never from conditionally hardcoded colors.

## 6. Icons

The Figma file defines 21 standalone 20×20 stroke icons (Eye-Off, Arrow-Up, X, Person, Message-Circle, Credit-Card, Sliders, Info-Circle, Log-Out, Image, Palette, Chevron-Down, Chevron-Right, Pencil, Search, Plus, Trash, Check, Alert-Triangle, Mail, Calendar). They are Lucide-style. In code, render icons as inline SVG (or a shared icon component if one exists at build time) at 20×20 with `stroke="currentColor"` so they inherit the text token color. There is no icon font and no raster icon assets.

## 7. Hard rules (project invariants that override any Figma inspect output)

1. **Every user-facing string is config-driven** — sourced from `lib/labels.ts` label overrides, never hardcoded, even if the Figma frame shows literal copy. Figma copy is placeholder.
2. **Multi-tenancy:** components receive church context (`ChurchPublic` from `lib/church-context.ts`); never fetch or style outside the current church's scope.
3. **Emails** (`emails/`, Weekly Digest frame): table-based HTML with web-safe font fallbacks — do not translate the Figma email frame with flexbox. Sender address from `EMAIL_FROM_ADDRESS`; links built from `church.subdomain` + `NEXT_PUBLIC_ROOT_DOMAIN`.
4. **Legacy `zinc-*` utilities** (`text-zinc-400`, `border-zinc-100`, …) appear in older components; they predate the token layer. New/edited code uses token utilities (`text-muted`, `border-border`). Migrate opportunistically when touching a file, don't mass-rewrite.
5. Spacing and radius must come off the token scale; if a Figma measurement isn't on the scale (4/8/16/24/32/48; radii 8/12/20/999), snap to the nearest token and flag the discrepancy rather than using an arbitrary value.
   - **Documented exception — Post Card:** the per-size-variant values on Post Card are intentional design decisions, not errors: padding 10px (Compact) / 28px (Display), and accent-bar widths 3px (Compact) / 4px (Default) / 8px (Display). Implement these as literal values in the component; do not snap them to the spacing scale.

## 8. Project structure (where things go)

```
app/                 Next.js App Router
  tokens.css         Design tokens (mirror of Figma variables)
  globals.css        Tailwind directives + keyframes + legacy runtime vars
  layout.tsx         Runtime injection of church-configurable tokens
  (wall)/ (embed)/ (marketing)/ admin/ display/ onboarding/ submit/
components/          Shared React components (wall/, admin/, notifications/)
lib/                 church-context, labels, auth, supabase, email, moderation
emails/              Email templates (table-based HTML)
tailwind.config.ts   Token → utility wiring
```

## 9. Figma MCP workflow notes

- File key: `utGO9go3xjfNUC0N6yIbzM`. The file's pages are per-component; the Cover page is `0:1`.
- Use `get_design_context` with a specific `node-id` URL for implementation; `get_metadata` first when you only have a page.
- `get_variable_defs` returns tokens already named as the CSS custom properties (e.g. `var(--color-text-primary)`) — map them through §2's table.
- Known gaps logged in the snapshot doc: contrast utility not built, Post Card text properties not wired in Figma, email frame needs table-HTML translation. Verify current state in the codebase before relying on either side.
