---
name: prototype
description: Build or revise a rigorous, developer-ready prototype in the design repo's prototypes/ directory, strictly from the design system. Use when a concept has been adopted, when the user asks for a real screen, a handoff-quality design, or a change to an existing prototype.
---

# Build a prototype

A prototype is the deliverable. Everything in it must come from `system/`; everything about it must be explained in `SPEC.md`. Read `AGENTS.md`, the nearest `DESIGN.md`, `BRAND.md`, `CONTEXT.md`, `system/components/INDEX.md`, `system/patterns/INDEX.md`, the flow it implements, and the concept it comes from (if any) before writing HTML.

## Do

1. **Start from the flow.** Every screen is a step in `flows/<flow>/FLOW.md`. If the flow does not exist or does not cover the screen, add or extend the flow first, in the same PR.
2. **Build from the system only.**
   - Stylesheets: `system/tokens/tokens.css`, then the component CSS you use, via relative paths.
   - Markup: copy component markup from `system/components/<name>/<name>.html` verbatim; compose with patterns from `system/patterns/`.
   - Page-level CSS may position and size things using tokens; it may not set colours, fonts, radii or shadows directly.
   - If something is missing from the system, stop and add it to `system/` in its own PR (see `system/components/AGENTS.md`). Do not improvise it in the prototype.
3. **Real copy, real states.** Text follows `BRAND.md`; terms follow `CONTEXT.md`. Build the empty, loading, error and success states the flow's edge cases call for. Fake data goes in `data.json` next to the pages.
4. **One file per screen.** `prototypes/<flow>/<step>.html`. No `data-page` sections here; sections are for concepts.
5. **Write `SPEC.md`** from the template in `prototypes/README.md`: flow, source concept, screen table, acceptance checklist, decisions. Set `status: draft`; a reviewer moves it to `review`, then `approved`.
6. **Review yourself** with the `review` skill before opening the PR, and fix what it finds.
7. **Open a PR** with a Planchest diff (`diff` skill) against the base branch, scoped to the prototype directory. For a revision, the diff shows exactly which screens moved.
8. **When approved,** write `HANDOFF.md` and archive the source concept if it is still in `concepts/`.

## Don't

- Don't hard-code a colour, size or font "just this once". That is what the review will catch and what the system exists to prevent.
- Don't restyle a component locally. Add the variant to the component.
- Don't leave `SPEC.md` behind the HTML; update both in the same commit.
