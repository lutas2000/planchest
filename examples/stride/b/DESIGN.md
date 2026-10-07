---
name: Stride
version: 1.1.0
colors:
  primary: "#ff5a1f"
  on-primary: "#ffffff"
  surface: "#ffffff"
  on-surface: "#16181d"
  surface-variant: "#f2f4f7"
  outline: "#e1e4ea"
  muted: "#667085"
  run-surface: "#0f1115"
  on-run-surface: "#f5f7fa"
  success: "#12a150"
  zone-easy: "#12a150"
  zone-steady: "#f5a524"
  zone-hard: "#e5484d"
  danger: "#d92d20"
typography:
  font-sans: "-apple-system, system-ui, sans-serif"
  font-num: "'SF Pro Rounded', ui-rounded, -apple-system, system-ui, sans-serif"
  scale: { xs: 12px, sm: 14px, md: 16px, lg: 20px, xl: 28px, xxl: 40px, hero: 72px }
spacing:
  unit: 4px
rounded: { sm: 6px, md: 10px, lg: 16px, full: 999px }
components:
  button: { height: 52px, radius: full }
---

# Overview
Calm and legible. Light surfaces for planning and looking back; a dark run surface while running, so numbers stay readable in sunlight and the screen does not drain the battery. Orange carries action: it reads as energy, and stays visible on the dark run surface in direct sunlight.

# Colors
`primary` is for the one action on a screen. `run-surface` is used only on screens shown during a run. The three `zone-*` colours mark pace relative to the runner's goal pace (easy / steady / hard) and appear only in splits and routes, never on buttons.

# Typography
Numbers use `font-num` with tabular figures. During a run the main number is `hero`.

# Components
See `system/components/INDEX.md`.
