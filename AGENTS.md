# Agent instructions

## Git and pull requests

Follow [CONTRIBUTING.md](CONTRIBUTING.md) for branches, PR titles, PR bodies, releases and hotfixes. In short:

- Branch from `develop` as `feature/`, `fix/`, `docs/` or `chore/` plus a hyphenated slug, and open the PR into `develop`. Never commit to or push `main` or `develop`.
- The PR title becomes the squash commit: `<type>: <subject>`, with type `feat`, `fix`, `docs`, `refactor`, `test`, `chore` or `ci`, and `!` after the type for a breaking change. The subject is imperative, starts in lowercase, has no period and no scope.
- Changing what a skill, `template/` or `docs/design-repo.md` says is `feat` or `fix`, not `docs`.
- Fix problems in your own unmerged work inside the same PR. Do not open a separate `fix` for them.
- Fill in the PR template: What changed, Why, For reviewers.
- Do not release, tag, publish to npm or open a PR into `main` unless asked.
