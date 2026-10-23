---
name: planchest-concept
description: Make a quick, unconstrained design concept in the design repo's concepts/ directory to explore an idea before committing to it. Use when the user wants to try a direction, sketch several screens or a flow fast, compare alternatives, or asks for a mockup that is not yet bound to the design system.
---

# Make a concept

A concept exists to settle a question in discussion. It is fast and free; it is not the thing that ships. Read the repo's `AGENTS.md`, the relevant `flows/*/FLOW.md`, `CONTEXT.md`, and `decisions/` before starting, so the concept argues with the decisions already taken instead of ignoring them.

## Do

1. **Name the question.** Write it as the first line of `SPEC.md` after `status: draft`. If the user has not stated one, propose it and confirm.
2. **One directory, one `index.html`.** `concepts/<kebab-name>/index.html`. Several screens go in one file, each in `<section data-page="screen-id">`. Give each section a visible heading so a reviewer knows where they are. Keep CSS inline or in one `concept.css` next to it.
3. **Use the vocabulary, ignore the visual rules.** Terms and copy follow `CONTEXT.md` and `BRAND.md` so the discussion is about the idea, not the words. Colours, layout and components are free; this is the only place they are.
4. **Alternatives are sections too.** `data-page="checkout-a"`, `data-page="checkout-b"`. The diff report shows them side by side.
5. **Write `SPEC.md`:** question, flow, screen list, notes arguing for and against. Use the template in `concepts/README.md`.
6. **Open a PR** with a Planchest diff (run the `planchest-diff` skill against the base branch) so reviewers see the screens without checking out.

## When the discussion ends

Move the directory to `concepts/archive/`, set `status: archived`, fill the Outcome section with the decision and the PR link. If adopted, the `planchest-prototype` skill builds the real thing from it. If a durable rule came out of the discussion, write it to `decisions/`.

## Don't

- Don't touch `system/`, `prototypes/`, or `DESIGN.md` from a concept.
- Don't polish. If the user asks for pixel accuracy or real components, that is a prototype.
- Don't delete archived concepts. They are how the next agent learns what was tried.
