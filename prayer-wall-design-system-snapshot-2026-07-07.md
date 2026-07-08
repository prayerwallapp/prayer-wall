# Prayer Wall — Design System Snapshot

**Captured:** July 7, 2026
**File:** [Prayer Wall — Design System](https://www.figma.com/design/utGO9go3xjfNUC0N6yIbzM)
**Purpose:** Baseline for diffing against manual edits made directly in Figma. Compare a future snapshot against this one to get a clean list of what actually changed before translating anything into code.

---

## Variables

### Primitives (raw values, hidden from pickers)
| Name | Value |
|---|---|
| gray/0 | #FAFAFA |
| gray/white | #FFFFFF |
| gray/100 | #E4E4E7 |
| gray/300 | #94A3B8 |
| gray/400 | #64748B |
| gray/900 | #18181B |
| teal/50 | #E1F5EE |
| teal/100 | #9FE1CB |
| teal/600 | #0F6E56 |
| teal/800 | #085041 |
| amber/50 | #FAEEDA |
| amber/100 | #FAC775 |
| amber/600 | #854F0B |
| amber/800 | #633806 |
| red/600 | #DC2626 |
| blue/600 | #2563EB |

### Layout (spacing + radius)
| Name | Value | Scope |
|---|---|---|
| spacing/xs | 4 | GAP |
| spacing/sm | 8 | GAP |
| spacing/md | 16 | GAP |
| spacing/lg | 24 | GAP |
| spacing/xl | 32 | GAP |
| spacing/2xl | 48 | GAP |
| radius/sm | 8 | CORNER_RADIUS |
| radius/md | 12 | CORNER_RADIUS |
| radius/lg | 20 | CORNER_RADIUS |
| radius/full | 999 | CORNER_RADIUS |

### Color (semantic, aliased to primitives)
| Name | Aliases | Scope |
|---|---|---|
| color/bg/page | gray/0 | FRAME_FILL, SHAPE_FILL |
| color/bg/card | gray/white | FRAME_FILL, SHAPE_FILL |
| color/text/primary | gray/900 | TEXT_FILL |
| color/text/secondary | gray/400 | TEXT_FILL |
| color/text/muted | gray/300 | TEXT_FILL |
| color/border/default | gray/100 | STROKE_COLOR |
| color/brand/primary | blue/600 (placeholder — church-configurable at runtime) | FRAME_FILL, SHAPE_FILL |
| color/brand/on-primary | gray/white | TEXT_FILL |
| color/semantic/prayer | teal/600 (church-adjustable at runtime) | FRAME_FILL, SHAPE_FILL, STROKE_COLOR |
| color/semantic/prayer-bg | teal/100 | FRAME_FILL, SHAPE_FILL |
| color/semantic/prayer-text | teal/800 | TEXT_FILL |
| color/semantic/praise | amber/600 (church-adjustable at runtime) | FRAME_FILL, SHAPE_FILL, STROKE_COLOR |
| color/semantic/praise-bg | amber/100 | FRAME_FILL, SHAPE_FILL |
| color/semantic/praise-text | amber/800 | TEXT_FILL |
| color/status/danger | red/600 | FRAME_FILL, SHAPE_FILL, TEXT_FILL |
| color/status/on-danger | gray/white | TEXT_FILL |
| color/status/success | teal/600 | FRAME_FILL, SHAPE_FILL, TEXT_FILL |
| color/status/on-success | gray/white | TEXT_FILL |
| color/status/warning | amber/600 | FRAME_FILL, SHAPE_FILL, TEXT_FILL |
| color/status/on-warning | gray/white | TEXT_FILL |

---

## Text styles
| Name | Font | Weight | Size | Line height |
|---|---|---|---|---|
| Display | Lexend | SemiBold | 28 | 34px |
| Heading/H1 | Lexend | SemiBold | 22 | 28px |
| Heading/H2 | Lexend | Medium | 17 | 22px |
| Body | Inter | Regular | 15 | Auto |
| Body Small | Inter | Regular | 13 | Auto |
| Caption | Inter | Regular | 12 | Auto |
| Label | Inter | Medium | 13 | Auto |

## Effect styles
| Name | Type | Offset | Blur | Opacity |
|---|---|---|---|---|
| Shadow/Card | Drop shadow | 0, 1 | 3 | 5% |
| Shadow/Modal | Drop shadow | 0, 8 | 24 | 12% |

---

## Component inventory

| Page | Component | Variants (name — w×h) |
|---|---|---|
| Icon Button | Icon Button (set) | Style=Outline — 32×32 · Style=Filled-Brand — 32×32 · Style=Filled-Dark — 36×36 · Style=Filled-Dark-Disabled — 36×36 · Style=Plain — 28×28 |
| Icon Button | 21 standalone icons | Eye-Off, Arrow-Up, X, Person, Message-Circle, Credit-Card, Sliders, Info-Circle, Log-Out, Image, Palette, Chevron-Down, Chevron-Right, Pencil, Search, Plus, Trash, Check, Alert-Triangle, Mail, Calendar — all 20×20 |
| Segmented Toggle | Segmented Toggle (set) | Selected=Prayer — 148×36 · Selected=Praise — 148×36 |
| Segmented Toggle | Toggle Group (set) | Selected=Small — 138×36 · Selected=Large — 138×36 |
| Post Card | Post Card (set) | Type=Prayer, Size=Default — 340×100 · Type=Prayer, Size=Compact — 220×100 · Type=Praise, Size=Default — 340×100 · Type=Praise, Size=Compact — 220×100 · Type=Prayer, Size=Display — 560×100 · Type=Praise, Size=Display — 560×100 |
| Submission Composer | Submission Composer | 380×224 |
| Button | Button (set) | Style=Primary — 82×36 · Style=Brand — 82×36 · Style=Secondary — 82×36 · Style=Ghost — 82×36 |
| Text Input | Text Input (set) | Type=Text — 240×58 · Type=Color — 240×60 |
| Text Input | Contrast Readout (set) | State=Pass — 98×15 · State=Low — 125×15 |
| Profile Menu | Profile Menu | 240×258 |
| Branding Settings Modal | Branding Settings Modal | 420×622 |
| Wall Grid (Desktop) | Two shells | Large — 3 col, Default cards · Small — 5 col, Compact cards |
| Church Onboarding | 3 step cards | Church details → Branding → Done |
| Wall Display Settings | Settings row | Toggle Group in admin context |
| Moderation Inbox | Inbox shell | Tabs + 3 example rows |
| Weekly Digest Email | Email | Fixed 600px width |
| Display App | Fullscreen shell | 1920×1080 |

---

## Known gaps flagged during the build (not yet resolved, log for the build session)
- `churches` table needs `prayer_color`, `praise_color`, `wall_density` columns added
- Luminance-based auto-foreground utility (background/primary/brand-adjacent text contrast) is a runtime function, not built anywhere yet
- Post Card has no editable TEXT properties — every instance currently shows the same placeholder copy
- Email template needs table-based HTML (not flexbox) and a web-safe font fallback stack for client compatibility
