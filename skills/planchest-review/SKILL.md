---
name: planchest-review
description: Check a design repo change against its rules — token compliance, component and pattern use, SPEC.md completeness, accessibility and responsiveness — and report findings. Use before opening a PR, when reviewing a PR in a design repo, or when the user asks whether a prototype follows the design system.
---

# Review a design change

This is the checklist `AGENTS.md` refers to. Run it over the files that changed (the PR's diff, or `git diff --name-only <base>`). Until `planchest check` exists, do the mechanical steps with grep and the judgement steps by reading. Report findings as a list; each item names the file and line, the rule, and the fix.

## Mechanical checks (prototypes and system only; concepts are exempt)

1. **Hard-coded values.** In `prototypes/**` and `system/components/**`, `system/patterns/**`:
   - hex, `rgb(`, `hsl(` colours outside `system/tokens/`;
   - `font-family`, `font-size`, `border-radius`, `box-shadow` with literal values instead of `var(--…)`;
   - `px` margins and paddings not expressed as `var(--space-*)`.
2. **Unregistered components.** Every `class="btn …"`-style component class used in a prototype belongs to a component listed in `system/components/INDEX.md` with status `stable` or `beta`. Every `<link rel="stylesheet">` points inside `system/` or next to the page.
3. **Self-contained.** No `http://`, `https://`, or `//` URLs in `src`, `href` or `url()`. No `<script type="module">` imports from outside the repo. Pages open from a static server at the repo root (`planchest diff` proves this: if the report shows a broken page, the rule is broken).
4. **SPEC.md.** Every artifact directory touched has a `SPEC.md` whose first line is `status: draft|review|approved|archived`, and whose screen table matches the HTML files present.
5. **Tokens in sync.** If `DESIGN.md` front matter changed, `tokens.json` and `tokens.css` changed to match, and nothing else in `tokens.css` changed.
6. **Index rows.** New component or pattern directories have a row in the matching `INDEX.md`; removed ones do not.

## Judgement checks

7. **Flow coverage.** Each prototype screen names its flow step; each edge case in the flow has a screen or a written reason.
8. **Accessibility.** Landmarks, heading order, labels on every input, visible focus, 4.5:1 text contrast against its surface (compute from the tokens), 40px minimum targets, no colour as the only signal.
9. **Responsive.** Open the diff report at 375 and 1280: no horizontal scroll at 375, nothing stretched past its measure at 1280.
10. **Copy.** Follows `BRAND.md` voice and `CONTEXT.md` vocabulary; no forbidden words; buttons are verbs.
11. **Decisions.** The change does not contradict an accepted record in `decisions/` without saying so in `SPEC.md`.

## Report

```
## Review: <PR or path>

Blocking
- prototypes/onboarding/signup.html:42 — hard-coded `#2f5bea`; use `var(--color-primary)` (rule 1)

Should fix
- …

Notes
- …
```

Blocking means the PR should not merge. Keep "Notes" for things that are fine but worth a follow-up. If nothing is found, say so in one line; do not invent findings.
