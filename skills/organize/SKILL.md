---
name: organize
description: Gather scattered design material (brand guides, Figma exports, style sheets, screenshots, docs, an existing product) into the design repo's DESIGN.md, CONTEXT.md, BRAND.md and system/. Use when the user has design sources to bring in, when tokens or rules are out of date, or when a prototype revealed something missing from the system.
---

# Organize design material into the repo

The repo's layout and rules are in its `AGENTS.md`; the reasoning is in `${CLAUDE_PLUGIN_ROOT}/docs/design-repo.md`. The job here is to turn whatever the user has into the four places an agent reads before designing: `DESIGN.md`, `CONTEXT.md`, `BRAND.md`, `system/`.

## Procedure

1. **Inventory.** List every source the user gave (files, URLs, screenshots, a running product, verbal answers). For each, write one line: what it is, what it can answer (tokens? vocabulary? voice? components?), and how trustworthy it is (a brand guide beats a screenshot).
2. **Extract, source by source.** Record where each fact came from. When sources disagree, prefer the most recent authoritative one and note the conflict in the PR description, not in the files.
   - Colours, type, spacing, radii → `DESIGN.md` front matter.
   - Visual rules and reasoning → `DESIGN.md` sections (Overview … Do's and Don'ts). Write rules an agent can act on: "primary colour only on the one main action per screen", not "use colour thoughtfully".
   - Terms, roles, audience, business rules, forbidden words → `CONTEXT.md`.
   - Logo rules, voice and tone, copy rules → `BRAND.md`; logo files → `system/brand/`.
   - Recurring UI pieces → `system/components/<name>/` with all five files, and a row in `INDEX.md`. Recurring compositions → `system/patterns/`.
3. **Derive tokens.** Update `system/tokens/tokens.json` (DTCG) and `tokens.css` so they match the front matter exactly. Until Planchest ships a generator, do this by hand and say so in the commit message. Custom property names follow the template: `--color-*`, `--font-*`, `--text-*`, `--space-*`, `--radius-*`.
4. **Check consistency.** Every token referenced in a component CSS exists in `tokens.css`. Every component in `INDEX.md` has a directory with `SPEC.md` and `examples.html`. No hex colours outside `tokens.css` and `themes/`.
5. **Leave gaps visible.** Where a source did not answer something, keep the template's comment placeholder and add the question to the PR description under "Open questions". Do not fill gaps with guesses.
6. **Open a PR** (or commit, if the user works on a branch directly) titled `Organize: <what came in>`. Attach a Planchest diff of `system/components/` when components changed: run the `diff` skill.

## Later rounds

Running this again on an existing repo is normal: a new brand guide arrives, or a prototype needed a component the system lacked. Change only what the new material justifies, keep `DESIGN.md` the single source of truth, and never let a prototype carry a token or component the system does not have.
