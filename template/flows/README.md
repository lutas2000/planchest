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

The map of the product's screens: one self-contained page, written by the `organize` skill when the material shows more than one screen, and kept current by `prototype` when screens are added, removed or renamed. It is the one page in the repo that is about the product rather than part of it. The diff report shows it like any other page, so a reorganised navigation is visible as a visual diff.

- One `<ul>` tree. One `<li>` per screen or group, nested the way the navigation is, in navigation order.
- A screen that exists in the repo is a link with a relative path: `../prototypes/run/start.html`, or `../concepts/home/index.html#today` for a concept section. A screen that does not exist yet is plain text.
- `data-status` on each screen `<li>` is the `status` from the page's `SPEC.md`, or `missing` when there is no page.
- `data-flow` names the flow directory the screen belongs to (`data-flow="run"` → `flows/run/FLOW.md`).
- Its own small inline `<style>`; it is not a product screen and does not use `system/` tokens.

```html
<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>Sitemap</title>
<style>
body { font: 14px/1.5 system-ui, sans-serif; margin: 24px; }
ul { list-style: none; padding-left: 20px; border-left: 1px solid #ddd; }
li { margin: 4px 0; }
li::after { content: attr(data-status); font-size: 11px; color: #777; margin-left: 8px; }
li[data-status="missing"]::after { color: #c0392b; }
</style></head>
<body>
<h1>Sitemap</h1>
<ul>
  <li>Run <ul>
    <li data-flow="run" data-status="approved"><a href="../prototypes/run/start.html">Start</a></li>
    <li data-flow="run" data-status="missing">Countdown</li>
  </ul></li>
  <li>History <ul>
    <li data-flow="history" data-status="approved"><a href="../prototypes/history/list.html">List</a></li>
  </ul></li>
</ul>
</body></html>
```
