# Stride design repo

Stride is a running app for iOS and Android. This repo holds its design: concepts, prototypes and the system they are built from.

## Working language

Write in **English**: `SPEC.md`, `FLOW.md`, decisions, diff summaries, PR descriptions, commit messages and replies to reviewers. Copy inside the pages follows `BRAND.md`.

## Rules

- `DESIGN.md` is the single source of visual truth. `system/tokens/tokens.css` is derived from it.
- `concepts/` is free exploration. `prototypes/` uses only `system/` and copy that follows `BRAND.md`.
- Every page is self-contained HTML at phone width (390 px design width) and opens from a static server at the repo root.
- Every artifact directory has a `SPEC.md` starting with `status:`.
- Each prototype page maps back to a step in `flows/`.
