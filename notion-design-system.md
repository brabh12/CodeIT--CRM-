# Notion-Inspired Design System — CodeIt CRM

Use this as the single source of truth for all visual styling. Implement these as CSS variables / a Tailwind config (whichever the project uses) so every component pulls from the same tokens.

---

## 1. Color Tokens

### Base (Light mode — primary mode)
```css
--color-bg-default: #ffffff;
--color-bg-secondary: #f7f6f3;   /* sidebar, subtle section backgrounds */
--color-bg-hover: #f1f1ef;       /* row/item hover */
--color-bg-selected: #e9e9e7;    /* active sidebar item, selected row */

--color-border-default: #e9e9e7;
--color-border-strong: #d3d1cb;

--color-text-primary: #37352f;   /* main text, near-black */
--color-text-secondary: #787774; /* muted/secondary text, captions */
--color-text-disabled: #b9b8b5;
--color-text-on-accent: #ffffff;
```

### Accent (primary action color — muted blue, Notion-style)
```css
--color-accent: #2383e2;
--color-accent-hover: #1a73cf;
--color-accent-bg-subtle: #e7f3fe;  /* light blue background for selected/info states */
```

### Status Colors (pill badges)
```css
--color-status-available-bg: #eaf6ea;   --color-status-available-text: #2f7a2f;  /* accounts: available */
--color-status-sold-bg: #e7f3fe;        --color-status-sold-text: #2383e2;       /* accounts: sold */
--color-status-expired-bg: #f1f1ef;     --color-status-expired-text: #787774;    /* accounts: expired/disabled */

--color-status-delivered-bg: #eaf6ea;   --color-status-delivered-text: #2f7a2f;  /* orders: delivered */
--color-status-pending-bg: #fdf3d7;     --color-status-pending-text: #a86400;    /* orders: pending */
--color-status-cancelled-bg: #fbe4e4;   --color-status-cancelled-text: #c4372b;  /* orders: cancelled */
```

### Semantic feedback
```css
--color-success: #2f7a2f;
--color-warning: #a86400;
--color-danger:  #c4372b;
--color-danger-bg-subtle: #fbe4e4;
```

---

## 2. Typography

**Font family:**
```css
--font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
```

**Scale:**
| Token | Size | Weight | Line-height | Usage |
|---|---|---|---|---|
| `--text-xs` | 12px | 400 | 16px | captions, table meta, timestamps |
| `--text-sm` | 14px | 400 | 20px | body text, table cells, form inputs |
| `--text-base` | 15px | 400 | 24px | default paragraph |
| `--text-md` | 16px | 600 | 24px | card titles, sub-headers |
| `--text-lg` | 20px | 600 | 28px | page titles (e.g. "Customers") |
| `--text-xl` | 28px | 700 | 36px | dashboard hero numbers/stats |

Rules:
- Headings: weight 600–700, `--color-text-primary`.
- Body/table text: weight 400, `--color-text-primary` or `--color-text-secondary` for muted fields.
- Never use pure black (`#000`) — always `#37352f`.

---

## 3. Spacing Scale
```css
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 24px;
--space-6: 32px;
--space-7: 48px;
--space-8: 64px;
```
- Page container padding: `--space-6` (32px) desktop, `--space-4` (16px) mobile.
- Gap between sidebar items: `--space-1`.
- Gap between form fields: `--space-4`.
- Card/table cell padding: `--space-2` vertical, `--space-3` horizontal.

---

## 4. Radius & Elevation
```css
--radius-sm: 4px;   /* badges, inputs */
--radius-md: 6px;   /* buttons, cards, table containers */
--radius-lg: 8px;   /* modals, side panels */

--shadow-sm: 0 1px 2px rgba(0,0,0,0.04);
--shadow-md: 0 2px 8px rgba(0,0,0,0.08);      /* dropdowns, popovers */
--shadow-lg: 0 4px 24px rgba(0,0,0,0.12);     /* modal, slide-over panel */
```
Notion rarely uses shadows — prefer **1px borders** (`--color-border-default`) over shadows for cards/tables. Reserve `--shadow-md`/`--shadow-lg` only for floating elements (modals, dropdown menus, slide-over panels) that sit above the page.

---

## 5. Layout

**App shell:**
- Sidebar: fixed width `240px`, background `--color-bg-secondary`, right border `1px solid --color-border-default`.
- Main content: `background: --color-bg-default`, max content width `1100px`, centered, padding `--space-6`.
- Top bar inside main content (optional): page title (`--text-lg`) + primary action button aligned right.

**Sidebar structure (top to bottom):**
1. Workspace label ("CodeIt CRM") — `--text-sm`, weight 600, padding `--space-4`.
2. Nav items: Dashboard, Customers, Accounts, Orders, Settings — each `--text-sm`, icon (16px, `lucide-react`) + label, `--space-2` vertical padding, full-width clickable row, `--radius-sm`.
   - Default: `color: --color-text-secondary`
   - Hover: `background: --color-bg-hover`
   - Active/selected: `background: --color-bg-selected`, `color: --color-text-primary`, icon color `--color-accent`.
3. Bottom-pinned: Logout button, same row style, icon + "Log out" text, `--color-text-secondary`.

---

## 6. Components

### Buttons
```css
/* Primary */
background: var(--color-accent);
color: #fff;
font-size: var(--text-sm);
font-weight: 500;
padding: 6px 12px;
border-radius: var(--radius-md);
border: none;
hover: background var(--color-accent-hover);

/* Secondary (default) */
background: transparent;
border: 1px solid var(--color-border-default);
color: var(--color-text-primary);
hover: background var(--color-bg-hover);

/* Danger (delete actions) */
background: transparent;
color: var(--color-danger);
hover: background var(--color-danger-bg-subtle);
```
All buttons: height 32px (default), 28px (compact/inline table actions).

### Status Pills / Badges
```css
display: inline-flex;
align-items: center;
gap: 4px;
padding: 2px 8px;
border-radius: var(--radius-sm); /* pill look: 9999px is also acceptable if you prefer fully rounded */
font-size: var(--text-xs);
font-weight: 500;
```
Colors pulled from the status tokens in section 1 (e.g. `background: var(--color-status-delivered-bg); color: var(--color-status-delivered-text);`). Optionally prefix with a small 6px colored dot instead of/alongside text for a more Notion-native feel.

### Tables
- Header row: `--text-xs`, weight 500, `color: --color-text-secondary`, `background: --color-bg-secondary`, bottom border `1px solid --color-border-default`, uppercase optional (Notion doesn't uppercase, keep normal case).
- Body rows: `--text-sm`, `color: --color-text-primary`, height 40px, bottom border `1px solid --color-border-default` (row dividers, no vertical column borders).
- Row hover: `background: --color-bg-hover`.
- Editable cell (click-to-edit): on click, cell becomes an inline `<input>` with no visible border until focused (`focus: border 1px solid --color-accent`, `border-radius: --radius-sm`).
- Empty table state: centered icon (32px, muted), `--text-sm` message in `--color-text-secondary`, primary button below to add first item.

### Forms / Inputs
```css
height: 36px;
padding: 0 var(--space-3);
border: 1px solid var(--color-border-default);
border-radius: var(--radius-sm);
font-size: var(--text-sm);
background: var(--color-bg-default);

focus: border-color var(--color-accent); outline: 2px solid var(--color-accent-bg-subtle);
```
- Label above input: `--text-xs`, weight 500, `color: --color-text-secondary`, margin-bottom 4px.
- Error state: border `--color-danger`, helper text below in `--text-xs`, `color: --color-danger`.

### Modal / Slide-over Panel (for Add/Edit Customer, Add/Edit Account, Add Order)
- Prefer a **right-side slide-over panel** (like Notion's page peek), width `420px–480px`, full height, `background: --color-bg-default`, `box-shadow: --shadow-lg`, slides in from the right with a semi-transparent overlay (`rgba(0,0,0,0.15)`) behind it.
- Panel header: title (`--text-md`, weight 600) + close (X) icon button, bottom border.
- Panel body: padded `--space-5`, form fields stacked with `--space-4` gaps.
- Panel footer: sticky bottom, right-aligned Cancel (secondary) + Save (primary) buttons.

### Dashboard Stat Cards
- Simple bordered box (no shadow), `1px solid --color-border-default`, `--radius-md`, padding `--space-4`.
- Label on top (`--text-xs`, `--color-text-secondary`), big number below (`--text-xl`, weight 700, `--color-text-primary`).
- Grid of 3–4 cards per row, `gap: --space-4`.

### Icons
- Use `lucide-react` exclusively, stroke-width `1.5–2`, size `16px` (inline/table) or `20px` (headers/nav).
- Icon color follows the text color of its context — never a separate bright color unless indicating status.

---

## 7. Interaction & Motion
- Transitions: `all 120ms ease-in-out` on hover/focus states only (background-color, border-color). No large animations.
- Slide-over panel: `transform 200ms ease-out`.
- No skeleton shimmer needed — simple muted-gray placeholder blocks (`--color-bg-hover`) for loading states, `--radius-sm`.

---

## 8. Do / Don't (to keep it authentically "Notion")
**Do:**
- Keep generous white space, thin 1px borders, flat surfaces.
- Keep one accent color used sparingly (primary buttons, links, active nav, focus rings).
- Keep status communicated via small colored text/pills, not heavy colored buttons or banners.

**Don't:**
- Don't use drop shadows on every card (only floating/overlay elements).
- Don't use more than one accent color.
- Don't use bold saturated colors for backgrounds — always pastel/subtle tints.
- Don't use rounded-full buttons or neumorphism — stick to 4–8px radii.
