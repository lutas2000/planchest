# Concepts

Fast, unconstrained explorations made to be discussed, not shipped. One directory per concept, one `index.html`, one `SPEC.md`.

- Any colour, any layout. `system/` rules do not apply.
- Several screens in one file: wrap each in `<section data-page="kebab-case-id">`. The Planchest diff lists and compares sections individually.
- When the discussion ends, move the directory to `archive/`, set `status: archived`, record the outcome. Keep it: the next agent reads archives to learn what was already tried.

## SPEC.md

```markdown
status: draft

# Dashboard v2

**Question:** can the overview replace the three report pages?
**Flow:** flows/reporting
**Screens:** overview, settings, billing

## Notes

What this concept argues for and against. Update as the discussion goes.

## Outcome

(filled when archived) Adopted / rejected / split. PR: #… Prototype: prototypes/…
```
