# Prototypes

Rigorous, realistic, developer-ready screens. One directory per flow or feature; one HTML file per screen, and a state machine on a screen whose states change in place (see `planchest docs design-repo`); `data.json` for fake data; `SPEC.md`; `HANDOFF.md` with every delivery. Prototypes are developer-ready by definition and have no `status` field. PR review still applies.

- Only `system/tokens/tokens.css` custom properties, components in `system/components/INDEX.md` and patterns in `system/patterns/INDEX.md`.
- Copy follows `BRAND.md`; vocabulary follows `CONTEXT.md`.
- Every screen names the flow step it implements.

## SPEC.md

```markdown
# Onboarding

**Flow:** flows/onboarding
**From concept:** concepts/archive/onboarding-v2 (PR #12)

## Screens

| File | Flow step | Notes |
|---|---|---|
| signup.html | 1 | |
| verify.html | 2 | State machine: `waiting`, `expired` |

## States

For a screen with a state machine: its presets and the edge case each one shows.

| Screen | Preset | Shows |
|---|---|---|
| verify.html | `code-expired` | The code ran out; resend is the only action |

## Acceptance

- [ ] Every state in the flow's edge cases has a screen, a preset, or a documented reason not to.
- [ ] Passes the `planchest-review` checklist.

## Decisions

Things decided while building this, with a PR link. Durable ones move to `decisions/`.
```

## HANDOFF.md

Written and kept current alongside the screens and `SPEC.md`. Interaction details, exact copy, motion, boundary conditions, and anything a developer would otherwise have to guess.
