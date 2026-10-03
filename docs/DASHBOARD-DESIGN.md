# Dashboard design language

Phase 0 output. Extracted from the attached reference (`play around` → KORO, the Waya
design system) so the dashboard redesign is built against a written spec rather than
my memory of a screenshot. **No application code is changed in this phase.**

Source inspected: `dist/settings-dashboard/sidebar-system.{css,js}`, `home-dashboard.css`,
`dashboard-pages.css`, `account-page.css`, `audit-log.css`, `refinements.css`,
`styles.css`, and `src/styles/product-tokens.css`.

## Two things that shape every phase

1. **The reference is a different stack.** Vite + React Router + a localStorage data
   layer. This app is Next.js App Router + Supabase. The design is *ported*, never
   dropped in: no component is copied across, only its behaviour and tokens.
2. **The reference and this app share lineage already.** `globals.css` here contains
   the same token vocabulary as the reference — `--tt-*` (tooltips), `--dropdown-*`,
   `--badge-*`, `--toast-*`, `--motion-duration-*` shadows. So the tooltip, dropdown,
   badge and toast layers largely exist. What is genuinely missing is the **layout
   and motion layer** and the **shell**.

## Brand colour

`--color-accent` in the reference is **`#6d3bf5`** (Waya purple). This app keeps its
present brand colour: the dashboard accent maps to the existing site accent
(`--accent` / `site.accentColor`) and never to purple. Every `accent`-derived token
below (`--color-accent-hover`, `--color-focus-ring`, `--color-accent-surface`) is
derived from the existing accent instead.

## Colour

Taken from the reference; `accent` row is the one deliberate deviation.

| Purpose | Reference value | Use |
| --- | --- | --- |
| page / surface | `#ffffff` | cards, panels, page ground |
| surface-panel | `#f8f8f8` | sidebars, table headers |
| surface-subtle | `#f6f6f6` | empty states, inset blocks |
| surface-hover / selected | `#f3f3f3` / `#eeeeee` | row and item states |
| text / strong | `#262626` / `#222222` | body and headings |
| text-secondary / muted / soft | `#555555` / `#7b7b7b` / `#898989` | hierarchy |
| border / border-strong | `#f0f0f0` / `#e3e3e3` | hairlines (**1px or less**, never heavy) |
| **accent** | ~~`#6d3bf5`~~ → **present brand colour** | links, active nav, focus |
| action-primary | `#252525` → `#101010` hover | primary buttons stay near-black, not accent |
| danger / success / warning / info | `#ba3a35` / `#00a94f` / `#d89600` / `#25a4ff` | status only |
| each status also has a `-surface` tint | e.g. `#fbecec`, `#e9f8ef` | badges, banners |
| overlay | `rgba(25,25,25,.32)` | dialog and drawer scrims |

## Density

The reference is **tight and small-type**, which is the clearest thing to copy:

| Token | Value |
| --- | --- |
| body | 15px |
| body-sm / label | 14px / 13px |
| caption / xs / 2xs | 12px / 10px / 9px |
| title / title-sm | 20px / 18px |
| display / display-mobile | 48px / 39px |
| headings | `"Ashcroft", "Playfair Display", Georgia, serif` |
| body font | `"Geist", "DM Sans", Arial, sans-serif` |
| mono | system monospace stack |

Spacing is **not** a free-for-all: content width is driven by
`--layout-content-gutter` with explicit `-compact`, `-large` and `-mobile` variants,
so density changes per breakpoint rather than per component. Overlays are sized in
the same spirit — toast `370px`, audit drawer `clamp(540px, 30vw, 600px)`.

## Sidebar behaviour (the part worth copying exactly)

- The shell is a **CSS grid**, not a flex row. The sidebar is a grid column whose
  width is a variable, so collapsing animates one property:
  `transition: grid-template-columns var(--sidebar-motion-duration) var(--sidebar-motion-ease)`.
- Two widths only: `--layout-sidebar-expanded` and `--layout-sidebar-collapsed`,
  surfaced as `--sidebar`.
- Collapsed state is a **class on the shell** (`is-collapsed`), not a per-item state,
  and it is **persisted in localStorage** along with workspace and preference keys.
- When collapsed, collapsed items get **floating tooltips** injected on hover
  (`floating-sidebar-tooltip`, `is-open`) — the app already has the `--tt-*` tooltip
  layer, so this is a re-use rather than new machinery.
- Motion is centralised: `--motion-duration-{quick,base,slow,sidebar,emphasis,exit}`
  and `--motion-ease-{out,standard,spring}`. Nothing hard-codes a duration.

## What this app already has, and what Phase 1 adds

| Layer | Status |
| --- | --- |
| tooltips, dropdowns, badges, toasts | present in `globals.css` |
| colour + type scale | present, needs the reference's ramp |
| **layout tokens** (`--layout-*`) | **missing — Phase 1** |
| **motion tokens** (`--motion-*`) | **missing — Phase 1** |
| **grid-based collapsible shell** | **missing — Phase 1** |
| audit-log drawer pattern | missing — later phase |

## Phase 1 entry criteria

1. Add the layout, motion, space and type tokens to `globals.css`, accent-derived from
   the present brand colour.
2. Rebuild `app/admin/(protected)/layout.js`'s sidebar as the grid shell with
   `is-collapsed`, persistence and collapsed tooltips.
3. Rebuild the `learn` layout on the same shell so the two dashboards cannot drift.
4. Styling only: every existing admin and student page keeps working untouched.

## Known gaps in this document

The numeric values for `--layout-*` and `--motion-*` were not extracted in this pass —
the token files were located but only the colour and type ramps were read. They are in
`src/styles/product-tokens.css` and `tokens.css` and get pulled in at the start of
Phase 1, before any styling is written.

Screenshots in the reference (`refined.png`, `sidebar-collapsed.png`,
`sidebar-expanded.png`, `workspace-menu.png`, `theme-detail.png`, `current.png`,
`final-check*.png`) were **not** reviewed: this model cannot read images. Anything that
lives only in those images is not represented here and needs to be described or
approved as-is.
