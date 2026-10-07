# Prototypes

Rigorous, realistic, developer-ready screens. One directory per flow or feature; one HTML file per screen; `data.json` for fake data; `SPEC.md`; `HANDOFF.md` once approved.

- Only `system/tokens/tokens.css` custom properties, components in `system/components/INDEX.md` and patterns in `system/patterns/INDEX.md`.
- Copy follows `BRAND.md`; vocabulary follows `CONTEXT.md`.
- Every screen names the flow step it implements.

## SPEC.md

```markdown
status: draft

# Onboarding

**Flow:** flows/onboarding
**From concept:** concepts/archive/onboarding-v2 (PR #12)

## Screens

| File | Flow step | Notes |
|---|---|---|
| signup.html | 1 | |
| verify.html | 2 | |

## Acceptance

- [ ] Every state in the flow's edge cases has a screen or a documented reason not to.
- [ ] Passes the `review` checklist.

## Decisions

Things decided while building this, with a PR link. Durable ones move to `decisions/`.
```

## HANDOFF.md

Written when `status: approved`. Interaction details, exact copy, motion, boundary conditions, and anything a developer would otherwise have to guess.
