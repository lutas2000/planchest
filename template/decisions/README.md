# Decision records

Decisions that outlive one PR: "no modals for primary flows", "forms are single-column", "danger actions always confirm". Each is a numbered file, `NNNN-short-title.md`, written when a PR discussion settles something that would otherwise be argued again.

```markdown
# 0001. No modals for primary flows

status: accepted
date: 2026-10-08
supersedes: —

## Context

Why this came up. Link the PR.

## Decision

One or two sentences, in the imperative.

## Consequences

What becomes easier, what becomes harder, what has to change.
```

Agents read this directory before proposing a concept. A new concept that contradicts an accepted record must say so in its `SPEC.md` and argue for superseding it.
