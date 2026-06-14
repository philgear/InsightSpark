# GearArts Design System & Styles Reference

This guide provides a comprehensive reference for the design system, visual guidelines, UI constraints, and architectural conventions used throughout the GearArts learning platform.

---

## 1. Design Philosophy & Constraints

To maintain a distinctive, high-contrast, tactile, and highly legible visual language, all development must adhere strictly to the following parameters:

*   **Flat Design Only:** No drop shadows (`shadow-*`), box-shadows, or elevations.
*   **Solid Borders:** All borders must be exactly `border-2` (2px solid) using primary/accent colors. Do not use standard thin `border` or thick `border-4`/`border-8`.
*   **Zero Gradients:** Do not use `bg-gradient-*` or background color gradients of any kind. All background fills must be solid colors.
*   **Zero Blur/Glassmorphism:** Do not use `backdrop-filter: blur()` or translucent glassmorphism effects.
*   **No Tailwind Opacity Suffixes:** Avoid opacity modifiers on text or background classes (e.g., `text-teal/20`, `bg-black/50`, `opacity-80`). Colors must remain solid and fully opaque to guarantee contrast.
*   **No Rounded Corners for Main Layout Elements:** Set `border-radius: 0 !important` (or Tailwind `rounded-none`) on all primary structural components, including card containers, buttons, input fields, header bars, and strategy steps.
*   **Readability-First Elements:** All cards, modal panels, text fields, and list components must use pure black background (in dark mode) or pure white background (in light theme) to maximize text legibility.

---

## 2. Color Palette & CSS Variables

GearArts utilizes a curated 3-color accent palette combined with high-contrast text and adaptive dark/light backgrounds.

### Core Variables (`styles.css`)

| CSS Variable | Value (Dark) | Value (Light) | Usage / Context |
| :--- | :--- | :--- | :--- |
| `--primary-color` | `#3ebc9e` | `#3ebc9e` | Brand Teal - primary borders, select buttons, headings |
| `--secondary-color` | `#ef6658` | `#ef6658` | Brand Coral - secondary actions, header navigation chips |
| `--tertiary-color` | `#faa63c` | `#faa63c` | Brand Amber - accent titles (`h2`), special callouts |
| `--background-color` | `#faa63c` | `#faa63c` | Outer framing backdrop (Solid Amber) |
| `--card-background-color` | `#000000` | `#ffffff` | Content container fill (Pure Black / Pure White) |
| `--text-color` | `#ffffff` | `#000000` | High-contrast readable body text (White / Black) |
| `--secondary-text-color` | `#000000` | `#000000` | Secondary contextual text, labels |
| `--border-color` | `--primary-color` | `--primary-color` | Uniform border styling color |

### Custom Tailwind Color Map (`tailwind.config.mjs`)
Extend colors under the `brand` namespace for Tailwind:
*   `brand-teal`: `#3ebc9e` (Matches `--primary-color`)
*   `brand-coral`: `#ef6658` (Matches `--secondary-color`)
*   `brand-amber`: `#faa63b` (Matches `--tertiary-color`)

---

## 3. Typography System

The typography configuration utilizes two primary Google Fonts loaded via `@import` rules in `styles.css`.

*   **Primary Headings (`h1`, `h2`, `h3`, `h4`, `h5`, `h6`):**
    *   **Font Family:** `DM Serif Display`, serif
    *   **Styling:** Sharp, classical serif typography representing the "artistic" and "creative" pillar of GearArts.
    *   **Rule:** Titles have no text-shadows or gradients.
*   **Body & UI Text:**
    *   **Font Family:** `Inter`, sans-serif
    *   **Styling:** Highly readable, neutral sans-serif layout.
    *   **Line Height:** Golden Ratio line height (`1.618`) to ensure optimum reading comfort.

---

## 4. Key Styles & Component Classes

### 1. Navigation Header Buttons (`.header-chip`)
The main navigation header links/buttons use a vibrant, high-contrast, and fully accessible coral theme:
```css
.header-chip {
  background-color: var(--secondary-color); /* Coral base */
  color: #ffffff;
  border: 2px solid var(--secondary-color);
  font-family: 'Kanit', sans-serif;
  font-weight: 800;
  border-radius: 0; /* Strict 90-degree corners */
}
```
*   **Default State:** Coral background, white text.
*   **Hover State:** Darkened Coral (`#d94f44` or 20% darker) for visible feedback.
*   **Focus State (`:focus-visible`):** High-visibility white `3px` focus ring.
*   **Active / Selected State (`.active`):** Deep pressed coral (`#bf3e34`).

### 2. Strategy & Organic Buttons (`.strategy-button`, `.organic-button`)
Tactile, flat buttons used in generative interactive layouts:
*   Solid colors that invert on hover.
*   `border-radius: 0` (no rounded edges).
*   Thick `border-2 border-[var(--primary-color)]` edges.

### 3. Generate Button (`.generate-button`)
The primary action generator button uses the vibrant coral theme to match important interactive elements:
*   **Default State:** Solid Coral background (`var(--secondary-color)`), white text, solid coral border (`border-2`).
*   **Hover State:** Darkened Coral (`#d94f44`) for high contrast feedback.
*   **Active State:** Deep coral (`#bf3e34`) with minor scale-down click animation.
*   **Corners:** Strict `border-radius: 0 !important` layout.

### 4. Cards & Container Containers (`.card`, `.step-section`)
*   Background is bound to `var(--card-background-color)` (pure solid black or white).
*   Borders are always solid `2px` colored frames.
*   No shadows or rounded corners.

---

## 5. Tailwind Utility Patterns & Conventions

Avoid vanilla CSS overrides where Tailwind is more maintainable. Follow these syntax patterns:

*   **Borders:** Use `border-2 border-[var(--primary-color)]` or `border-2 border-brand-teal`.
*   **Backgrounds:** Use `bg-[var(--card-background-color)]` or `bg-black` / `bg-white`.
*   **Fonts:** Use `font-sans` for interface copy, `font-serif` for titles.
*   **Hover states:** Use simple foreground/background state changes, e.g., `hover:bg-[var(--primary-color)] hover:text-black transition-colors duration-200`.

---

## 6. HTML & Marked Custom Rendering Flow

For rendering rich curriculum content (Markdown/HTML), the application uses the `marked` library coupled with a custom renderer. All generated elements map directly back to the design tokens:

*   **Tables:** Must use solid flat borders (`border-2 border-[var(--border-color)]`), with header cells in bold text.
*   **Lists:** Custom padding and numbers/bullets styled in primary teal color.
*   **Code blocks:** Styled as pure solid black code blocks with `border-2 border-[var(--primary-color)]` wrapper boxes.

---

## 7. Accessibility Checklist (WCAG AA Compliance)

1.  **Min Interaction Area:** All buttons and interactive links must have a minimum clickable height of `44px` or `44px` width.
2.  **Focus States:** Use distinct `:focus-visible` ring outlines for keyboard-only navigation.
3.  **Contrast:** Do not use gray-on-gray or low-contrast combinations. Since outer backdrops are Amber (`#faa63c`), nested panels must contain pure black or pure white backgrounds with text colored to match.
