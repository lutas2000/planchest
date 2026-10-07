# 0001. Names

status: accepted
date: 2026-10-08

## Context

Planchest introduces a handful of names that users, agents and tools all have to share: the project, the directories in a design repo, the skills, and the parts of the diff report. Each name should point at exactly one thing and be chosen from what that thing is for. This record keeps the reasoning so the names are not reopened one at a time.

## Decision

| Name | Instead of | Why |
|---|---|---|
| **Planchest** | | A plan chest is the wide, shallow-drawered cabinet where architects keep their drawings flat, sorted and ready to be pulled out and compared. The emphasis is on the repo. Unused on npm, PyPI, crates and GitHub. |
| `docs/design-repo.md` | `design-architecture.md` | The document describes what a design repo looks like and which rules it keeps. "Architecture" reads as system architecture. |
| `template/` | `scaffold/` | `init` copies a template. A scaffold is something you take down afterwards. |
| `concepts/` | `poc/`, `wireframes/` | "PoC" is an engineering word. "Wireframe" means low fidelity, but fidelity is free when an agent draws; the real line is whether the design system binds the work. |
| `prototypes/` | `prototypes/` + `ui/` | Two tiers are enough. Maturity is the `status` field in `SPEC.md`, not a directory level. |
| `BRAND.md` | `PRODUCT.md` | Audience and positioning belong in `CONTEXT.md`; personality is already in the `DESIGN.md` Overview. What was missing is the logo, voice and copy rules, and that is brand. |
| `decisions/` | `adr/` | The repo is read by designers. "ADR" is an engineering abbreviation; "decisions" says the same thing to everyone. The record format (Context, Decision, Consequences, status, supersedes) stays. |
| skill `prototype` | `promote-to-ui` | A prototype is not the same file upgraded; it is reimplemented from the concept. `concept` and `prototype` are symmetric names, one per directory. |
| skill `review` | `design-review` | The plugin prefix is already `planchest`; no need to repeat the domain. |
| skill `organize` | `intake`, `gather` | Organize also covers every round after the first; intake only covers the first. |
| `flows/sitemap.html` | `MAP.md`, `screens.md` | A sitemap is what designers call the map of a product's screens. HTML rather than Markdown so the diff report renders it and a reorganised navigation shows as a visual diff. |
| `.planchest/` | | Local output directory inside a design repo, git-ignored. |
| `onionskin` (report mode) | | From animation: the previous frame laid over the next to see the change. |
| `summary.html` | `notes.html` | The human-written part of the diff report. It is a summary for the reviewer, not working notes. |

## Consequences

- Documents, skills and the CLI use one vocabulary: concept / prototype / system / flow / decision / report / summary. Check this table before introducing a new term.
