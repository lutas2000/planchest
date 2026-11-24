# Flows

One directory per user journey, each with a `FLOW.md`. Flows are platform-independent: a prototype screen on any platform maps back to a step here.

```
flows/
└── onboarding/
    └── FLOW.md
```

## FLOW.md

```markdown
status: approved

# Onboarding

**Goal:** the user ends with a verified account and one workspace.
**Entry:** marketing site "Get started"; invitation link.
**Exit:** workspace home (success); abandoned (drop-off).

## Steps

| # | Step | User does | System does | Screens |
|---|---|---|---|---|
| 1 | Sign up | enters email | sends code | prototypes/onboarding/signup.html |
| 2 | Verify | enters code | creates account | prototypes/onboarding/verify.html |

## Edge cases

- Code expired → …
- Email already registered → …
```

## sitemap.html

The map of the product's screens: one self-contained page, written by the `planchest-organize` skill when the material shows more than one screen, and kept current by `planchest-prototype` when screens are added, removed or renamed. It is the one page in the repo that is about the product rather than part of it. The diff report shows it like any other page, so a reorganised navigation is visible as a visual diff.

- One `<ul>` tree. One `<li>` per screen or group, nested the way the navigation is, in navigation order.
- A screen that exists in the repo is a link with a relative path: `../prototypes/run/start.html`, or `../concepts/home/index.html#today` for a concept section. A screen that does not exist yet is plain text.
- Use `data-status` for a concept's `SPEC.md` status, or `missing` when there is no page. Omit it for prototypes: they are developer-ready by definition.
- `data-flow` names the flow directory the screen belongs to (`data-flow="run"` → `flows/run/FLOW.md`).
- Its own inline `<style>`, copied from the example below; it is not a product screen and does not use `system/` tokens. The example matches the Planchest diff report and viewer, in light and dark.

```html
<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>Sitemap</title>
<style>
:root { --bg: #fafaf8; --fg: #1c1c1a; --muted: #6b6b66; --line: #e3e2dc; --accent: #2f5bea; --approved: #1f8a4c; --missing: #c0392b; --draft: #b7791f; }
@media (prefers-color-scheme: dark) { :root { --bg: #161614; --fg: #ecece8; --muted: #9a9a93; --line: #2c2c29; --accent: #7c9bff; --approved: #5ccc85; --missing: #ff7b6b; --draft: #e6b45a; } }
body { margin: 0; padding: 16px 24px; background: var(--bg); color: var(--fg); font: 14px/1.45 ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
h1 { font-size: 15px; font-weight: 600; margin: 0 0 2px; }
body > p { margin: 0 0 4px; font-size: 12px; color: var(--muted); }
ul { list-style: none; margin: 4px 0 0; padding-left: 14px; border-left: 1px solid var(--line); }
body > ul { padding: 0; border: 0; }
body > ul > li { margin-top: 14px; font-size: 11px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; color: var(--muted); }
body > ul > li > ul { font-size: 14px; font-weight: 400; letter-spacing: 0; text-transform: none; color: var(--fg); }
li li { padding: 3px 0; max-width: 560px; }
a { color: inherit; text-decoration: none; }
a:hover { color: var(--accent); text-decoration: underline; }
li[data-flow]::before { content: attr(data-flow); float: right; margin-left: 12px; font: 11px/20px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; color: var(--muted); }
li[data-status]::after { content: attr(data-status); margin-left: 6px; padding: 0 4px; font-size: 10px; border: 1px solid var(--line); border-radius: 4px; color: var(--muted); }
li[data-status="draft"]::after { color: var(--draft); }
li[data-status="review"]::after { color: var(--accent); }
li[data-status="approved"]::after { color: var(--approved); }
li[data-status="missing"] { color: var(--muted); }
li[data-status="missing"]::after { color: var(--missing); border-color: currentColor; }
</style></head>
<body>
<h1>Sitemap</h1>
<ul>
  <li>Run <ul>
    <li data-flow="run"><a href="../prototypes/run/start.html">Start</a></li>
    <li data-flow="run" data-status="missing">Countdown</li>
  </ul></li>
  <li>History <ul>
    <li data-flow="history"><a href="../prototypes/history/list.html">List</a></li>
  </ul></li>
</ul>
</body></html>
```
