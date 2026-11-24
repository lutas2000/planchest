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
- The screens of a flow go in an `<ol data-flow="run">`, one `<li>` per step in the order of `flows/run/FLOW.md`. The page draws them as numbered steps joined by a line (dashed into a missing step), so the journey reads at a glance. `data-flow` names the flow directory (`data-flow="run"` → `flows/run/FLOW.md`).
- Screens that are not a sequence, such as the sections of a concept, go in a plain `<ul>`; put `data-flow` on each `<li>` if they belong to a flow.
- A screen that exists in the repo is a link with a relative path: `../prototypes/run/start.html`, or `../concepts/home/index.html#today` for a concept section. A screen that does not exist yet is plain text.
- Use `data-status` for a concept's `SPEC.md` status, or `missing` when there is no page. Omit it for prototypes: they are developer-ready by definition.
- Its own inline `<style>
:root { --bg: #fafaf8; --fg: #1c1c1a; --muted: #6b6b66; --line: #e3e2dc; --accent: #2f5bea; --approved: #1f8a4c; --missing: #c0392b; --draft: #9a6412; --mono: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
@media (prefers-color-scheme: dark) { :root { --bg: #161614; --fg: #ecece8; --muted: #9a9a93; --line: #2c2c29; --accent: #7c9bff; --approved: #5ccc85; --missing: #ff7b6b; --draft: #e6b45a; } }
body { margin: 0; padding: 16px 24px; background: var(--bg); color: var(--fg); font: 14px/1.45 ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
h1 { font-size: 15px; font-weight: 500; margin: 0 0 4px; }
body > p { margin: 0 0 8px; max-width: 560px; font-size: 12px; color: var(--muted); }
ul, ol { list-style: none; margin: 8px 0 0; padding: 0; }
body > ul > li { position: relative; max-width: 560px; margin-top: 24px; font-size: 12px; font-weight: 500; color: var(--muted); }
body > ul > li > :is(ul, ol) { font-size: 14px; font-weight: 400; color: var(--fg); }
a { color: inherit; text-decoration: none; }
a:hover { color: var(--accent); text-decoration: underline; }
/* Screens that are not a sequence, such as a concept's sections. */
ul ul { padding-left: 16px; border-left: 1px solid var(--line); }
ul ul li { padding: 4px 0; }
li[data-flow]::before { content: attr(data-flow); float: right; margin-left: 12px; font: 12px/20px var(--mono); color: var(--muted); }
/* A flow: the steps in order, numbered and joined by a line. */
ol[data-flow] { counter-reset: step; }
ol[data-flow]::before { content: "flow: " attr(data-flow); position: absolute; top: 0; right: 0; font: 12px/18px var(--mono); color: var(--muted); }
ol[data-flow] > li { counter-increment: step; position: relative; min-height: 20px; padding: 0 0 20px 32px; --join: color-mix(in srgb, var(--muted) 60%, transparent); }
ol[data-flow] > li:last-child { padding-bottom: 0; }
ol[data-flow] > li::before { content: counter(step); position: absolute; left: 0; top: 0; width: 20px; height: 20px; box-sizing: border-box; border: 1px solid var(--muted); border-radius: 50%; background: var(--bg); font: 11px/18px var(--mono); text-align: center; color: var(--fg); }
ol[data-flow] > li:not(:last-child) { background: linear-gradient(var(--join), var(--join)) 10px 22px / 1px calc(100% - 24px) no-repeat; }
ol[data-flow] > li:has(+ li[data-status="missing"]) { background: repeating-linear-gradient(var(--join) 0 3px, transparent 3px 6px) 10px 22px / 1px calc(100% - 24px) no-repeat; }
ol[data-flow] > li[data-status="missing"]::before { border-style: dashed; color: var(--muted); }
/* Status: a concept's SPEC.md status, or missing when there is no page yet. */
li[data-status]::after { content: attr(data-status); margin-left: 8px; font: 12px var(--mono); color: var(--muted); }
li[data-status="draft"]::after { color: var(--draft); }
li[data-status="review"]::after { color: var(--accent); }
li[data-status="approved"]::after { color: var(--approved); }
li[data-status="missing"] { color: var(--muted); }
li[data-status="missing"]::after { color: var(--missing); }
</style></head>
<body>
<h1>Sitemap</h1>
<ul>
  <li>Run <ol data-flow="run">
    <li><a href="../prototypes/run/start.html">Start</a></li>
    <li data-status="missing">Countdown</li>
  </ol></li>
  <li>History <ol data-flow="history">
    <li><a href="../prototypes/history/list.html">List</a></li>
  </ol></li>
</ul>
</body></html>
```
