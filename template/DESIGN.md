---
# Machine-readable tokens. Keys follow the Google Stitch DESIGN.md spec;
# values follow the W3C Design Tokens (DTCG) format where they overlap.
# `system/tokens/tokens.json` and `tokens.css` are derived from this block.
name: Product name
version: 0.1.0
colors:
  primary: "#2f5bea"
  on-primary: "#ffffff"
  surface: "#ffffff"
  on-surface: "#1c1c1a"
  surface-variant: "#f3f2ee"
  outline: "#e3e2dc"
  success: "#1f8a4c"
  warning: "#b7791f"
  danger: "#c0392b"
typography:
  font-sans: "Inter, ui-sans-serif, system-ui, sans-serif"
  font-mono: "ui-monospace, SFMono-Regular, Menlo, monospace"
  scale:
    xs: 12px
    sm: 14px
    md: 16px
    lg: 20px
    xl: 28px
    xxl: 40px
  line-height: 1.5
spacing:
  unit: 4px
  scale: [0, 4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px]
rounded:
  sm: 4px
  md: 8px
  lg: 16px
  full: 999px
components:
  button:
    height: 40px
    padding-x: 16px
    radius: md
  input:
    height: 40px
    radius: sm
---

# Overview

<!-- One paragraph: what this product looks and feels like, in words an agent can act on. Name the personality (e.g. "calm, dense, professional") and the two or three visual ideas that carry it. -->

# Colors

<!-- How the palette is used: which colour carries action, which carries state, where surfaces layer. Contrast requirements. What never gets a colour. -->

# Typography

<!-- Faces, the scale and where each step is used, weights, measure (line length), how headings relate to body. -->

# Layout

<!-- Grid, gutters, breakpoints, density, how pages are framed (sidebar? top nav? none?). -->

# Elevation & Depth

<!-- Shadows, borders, or neither; how layers are told apart. -->

# Shapes

<!-- Radii and where each is used; icon style; illustration style if any. -->

# Components

<!-- Rules that cut across components: states every interactive element must have, focus treatment, loading and empty states, motion. Per-component detail lives in `system/components/<name>/SPEC.md`. -->

# Do's and Don'ts

- Do …
- Don't …
