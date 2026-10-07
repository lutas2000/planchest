# Flows

One directory per user journey, each with a `FLOW.md`. Flows are platform-independent: a prototype screen on any platform maps back to a step here.

```
flows/
└── onboarding/
    └── FLOW.md
```

## FLOW.md

```markdown
status: approved

# Onboarding

**Goal:** the user ends with a verified account and one workspace.
**Entry:** marketing site "Get started"; invitation link.
**Exit:** workspace home (success); abandoned (drop-off).

## Steps

| # | Step | User does | System does | Screens |
|---|---|---|---|---|
| 1 | Sign up | enters email | sends code | prototypes/onboarding/signup.html |
| 2 | Verify | enters code | creates account | prototypes/onboarding/verify.html |

## Edge cases

- Code expired → …
- Email already registered → …
```
