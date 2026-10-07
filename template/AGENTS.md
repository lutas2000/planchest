# Design repo rules

This repository holds every design material and every design artifact for the product. It is maintained by AI agents and reviewed by people through pull requests. Read this file first; then read `DESIGN.md`, `CONTEXT.md` and `BRAND.md`. The closest `AGENTS.md` or `DESIGN.md` to the file you are editing wins; parent files still apply unless overridden.

## Working language

Write in **English**: `SPEC.md`, `FLOW.md`, decisions, diff summaries, PR descriptions, commit messages and replies to reviewers. Copy inside the pages follows `BRAND.md`, which may name a different language.

## Layout

| Path | What it is | Who writes it |
|---|---|---|
| `DESIGN.md` | The visual system (Stitch format). Single source of truth for tokens and visual rules. | Agents, via the `organize` skill, after a PR |
| `CONTEXT.md` | Domain vocabulary, audience, roles, forbidden words | Agents and people |
| `BRAND.md` | Logo usage, voice and tone, copy rules, naming | Agents and people |
| `system/` | Materials: tokens, components, patterns, icons, brand assets | Only through `system/`-level PRs |
| `concepts/` | Quick, unconstrained explorations for discussion | Agents, via the `concept` skill |
| `prototypes/` | Rigorous, realistic, developer-ready screens | Agents, via the `prototype` skill |
| `flows/` | Cross-platform user journeys every prototype maps back to; `flows/sitemap.html` maps every screen | Agents and people |
| `decisions/` | Decisions lifted out of PR discussions so they are not relitigated | People, or agents when asked |

Platform directories (`web/`, `mobile/`) are optional. When present, each holds its own `DESIGN.md` (platform differences only), `system/` (platform overrides), `concepts/` and `prototypes/`.

## Hard rules

1. **Every page is self-contained HTML served from the repo root.** No build step, no CDN, no absolute URLs. Reference other files in this repo with relative paths. A page must open correctly from any static file server pointed at the repo root.
2. **Two tiers, two sets of rules.**
   - `concepts/` is free. Use any colour, any layout, any amount of inline CSS. A single `index.html` may hold several screens: wrap each in `<section data-page="kebab-case-id">`. Do not edit `system/` from a concept.
   - `prototypes/` is strict. Use only `system/tokens/tokens.css` custom properties, components listed in `system/components/INDEX.md` and patterns listed in `system/patterns/INDEX.md`. No hard-coded colours, font sizes, radii or spacing. Copy follows `BRAND.md`. Every screen maps to a step in `flows/`.
3. **Every artifact directory has a `SPEC.md`** whose first line is `status: draft | review | approved | archived`. HTML says what it looks like; `SPEC.md` says why.
4. **Concepts are archived, never promoted.** After the discussion ends, move the concept to `concepts/archive/`, set `status: archived`, and record the outcome and the PR link in its `SPEC.md`. A prototype is a fresh implementation built from the concept, not an edit of it.
5. **New tokens and components go through `system/` first.** If a prototype needs something the system lacks, open a PR that adds it to `system/` (with `SPEC.md` and `examples.html`), then use it.
6. **Review happens in pull requests.** Every concept and every prototype change is a PR with a Planchest diff report attached. Rejections stay in the PR; durable decisions move to `decisions/`.

## Working here

- Before drawing anything, read the nearest `DESIGN.md`, the relevant `flows/*/FLOW.md`, and `system/components/INDEX.md`.
- Prefer editing an existing prototype over creating a parallel one. Prefer a new concept over an unconstrained edit to a prototype.
- Keep `SPEC.md` current: when the HTML changes, update the spec in the same commit.
- Keep `flows/sitemap.html` current, if it exists: when a screen is added, removed or renamed, update its entry in the same commit.
- Never hand-edit `system/tokens/tokens.json` or `tokens.css`; change `DESIGN.md` and regenerate (or, until the generator exists, change both in the same PR and say so).
- When something here conflicts with a request, say so and point to the rule instead of silently breaking it.
