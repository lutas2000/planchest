---
name: planchest-organize
description: Gather scattered design material (brand guides, Figma exports, style sheets, screenshots, docs, an existing product) into the design repo's DESIGN.md, CONTEXT.md, BRAND.md, system/ and flows/sitemap.html. Use when the user has design sources to bring in, when tokens or rules are out of date, or when a prototype revealed something missing from the system. Stops and asks for material when there is none to work from.
---

# Organize design material into the repo

The repo's layout and rules are in its `AGENTS.md`; the reasoning is in Planchest's design repo document (`planchest docs design-repo`; to find the CLI, use `planchest` on PATH, else `node "${CLAUDE_PLUGIN_ROOT}/bin/planchest.js"`, else `node ../../bin/planchest.js` resolved from this skill file's directory). The job here is to turn whatever the user has into the places an agent reads before designing: `DESIGN.md`, `CONTEXT.md`, `BRAND.md`, `system/`, and, when the material shows screens, `flows/sitemap.html`.

## Procedure

0. **Find the material.** Material is anything that answers a design question about the product. Look in three places: what the user attached or named in the message; what the user pointed at (a directory, a URL, a running product); and the repo itself, for files that are not the template's own (`git ls-files`, then skip what `planchest-init` created, `concepts/archive/` included). **If all three come up empty, stop here.** Do not fill the repo from assumptions: a guessed token is worse than a placeholder, because nothing marks it as a guess. Say what you looked at, then ask for material and say what each kind would answer:
   - **File paths or a directory**: brand guide (PDF, slides), style sheet, exported tokens, existing CSS → tokens and visual rules.
   - **Figma**: a file link, if a Figma MCP server is connected; otherwise exported frames (PNG or SVG) and a Variables or Styles export → tokens, components, screens.
   - **Documents**: product brief, PRD, glossary, help centre, support macros → `CONTEXT.md`.
   - **A URL**: marketing site, live product, app store page → vocabulary, voice, screens. Say you can open it in the browser if one is available.
   - **Screenshots** → screens, layout, components; less reliable for exact values.
   - **Answers**: if nothing is written down, offer the `planchest-interview` skill, which builds `BRAND.md`, `DESIGN.md` and `CONTEXT.md` from a conversation.

   Partial material is fine: continue with what there is and leave the rest as gaps (step 6).
1. **Inventory.** List every source (files, URLs, screenshots, a running product, verbal answers). For each, write one line: what it is, what it can answer (tokens? vocabulary? voice? components? screens?), and how trustworthy it is (a brand guide beats a screenshot; the live product beats a two-year-old Figma file for what exists, the Figma file beats it for what was intended).
2. **Extract, source by source.** Record where each fact came from.
   - Colours, type, spacing, radii → `DESIGN.md` front matter.
   - Visual rules and reasoning → `DESIGN.md` sections (Overview … Do's and Don'ts). Write rules an agent can act on: "primary colour only on the one main action per screen", not "use colour thoughtfully".
   - Terms, roles, audience, business rules, forbidden words → `CONTEXT.md`.
   - Logo rules, voice and tone, copy rules → `BRAND.md`; logo files → `system/brand/`.
   - Recurring UI pieces → `system/components/<name>/` with all five files, and a row in `INDEX.md`. Recurring compositions → `system/patterns/`.

   When sources disagree, sort the disagreement first. **Trivial** (a rounding difference, an older copy of the same value, a typo): take the most recent authoritative source and list it in the PR description. **Not trivial** (two different primaries, two names for the same thing, two navigation models, a rule and a screen that breaks it): do not pick. Collect these and run the `planchest-conflict` skill before writing the files, so the user decides with both versions in front of them.
3. **Derive tokens.** Update `system/tokens/tokens.json` (DTCG) and `tokens.css` so they match the front matter exactly. Until Planchest ships a generator, do this by hand and say so in the commit message. Custom property names follow the template: `--color-*`, `--font-*`, `--text-*`, `--space-*`, `--radius-*`.
4. **Map the screens.** When the material shows the product's screens (a live product, Figma pages, a navigation spec, screenshots covering more than one screen), write `flows/sitemap.html` in the format described in `flows/README.md`: one tree of screens in navigation order, each linked to its page in the repo when one exists and marked `missing` when none does, each tagged with its flow. Write or update the `flows/<flow>/FLOW.md` the sitemap refers to, with the steps the material shows. When the material is a brand guide or a token sheet only, there is nothing to map; skip this step and say so. In later rounds, update the sitemap rather than recreating it.
5. **Check consistency.** Every token referenced in a component CSS exists in `tokens.css`. Every component in `INDEX.md` has a directory with `SPEC.md` and `examples.html`. No hex colours outside `tokens.css` and `themes/`. Every link in `sitemap.html` resolves to a file.
6. **Leave gaps visible.** Where a source did not answer something, keep the template's comment placeholder. Do not fill gaps with guesses.
7. **Open a PR** (or commit, if the user works on a branch directly) titled `Organize: <what came in>`. Attach a Planchest diff of `system/components/` when components changed: run the `planchest-diff` skill.
8. **Report back.** End with one message in three lists, and put the same three in the PR description. The user reads the chat; do not bury this in the PR alone.
   - **Done**: each file changed, and which source it came from.
   - **Missing**: each template section still a placeholder, and which kind of material (or which `planchest-interview` topic) would fill it.
   - **Needs your decision**: trivial conflicts you settled and how; judgement calls you made (a type scale inferred from three sizes, a component status set to `beta`); anything the sources implied but did not state. Write each as a question with its options. Point to `planchest-conflict` for disagreements and `planchest-interview` for open design questions.

## Later rounds

Running this again on an existing repo is normal: a new brand guide arrives, or a prototype needed a component the system lacked. Change only what the new material justifies, keep `DESIGN.md` the single source of truth, and never let a prototype carry a token or component the system does not have. If the new material contradicts what is already in the repo, that is a conflict too: `planchest-conflict`, not a silent overwrite.
