# Contributing

How branches, commits and pull requests work in this repo. The same rules apply to people and to agents (Claude Code, Codex). CI checks branch names, PR bases and PR titles, so a PR that breaks them cannot merge.

## Branches

| Branch | What it holds |
| --- | --- |
| `main` | The latest release. Anyone who installs the plugin from the marketplace gets `main`, so a commit here reaches users right away. Only release and hotfix PRs merge into it. |
| `develop` | The next release. All other work merges here first. |

Nobody pushes to `main` or `develop` directly. Work happens on a branch named `<prefix>/<slug>`:

| Prefix | For | Branch from and merge into |
| --- | --- | --- |
| `feature/` | New or changed behaviour | `develop` |
| `fix/` | A bug in a release or in `develop` | `develop` |
| `docs/` | Documentation that changes no behaviour (see [What counts as docs](#what-counts-as-docs)) | `develop` |
| `chore/` | Everything else: refactors, tests, CI, dependencies, release prep | `develop` |
| `hotfix/` | A fix that cannot wait for the next release | `main` |

The slug is a few lowercase words joined by hyphens, naming the change: `feature/flow-map`, `fix/npm-bin-path`. The branch is deleted when its PR merges.

## Pull request titles

PRs into `develop` are squash-merged, so the PR title becomes the one commit on `develop` and the line in the release notes. Write it for someone reading the release notes.

```
<type>: <subject>
<type>!: <subject>     a breaking change
```

| Type | For |
| --- | --- |
| `feat` | New or changed behaviour |
| `fix` | A bug someone could hit in a release or in `develop` |
| `docs` | Documentation that changes no behaviour |
| `refactor` | Code that changes and behaves the same |
| `test` | Tests only |
| `chore` | Tooling, dependencies, releases |
| `ci` | GitHub workflows |

The subject:

- says what changes for the user, not which file changed: `fix: keep the planchest bin when publishing to npm`, not `fix: update package.json`
- is imperative and starts in lowercase: `add`, `keep`, `show`
- has no period at the end
- has no scope: `feat: ...`, not `feat(viewer): ...`

A breaking change gets `!` after the type (`feat!: prefix every skill name with planchest-`) and a **Breaking** line in the PR body saying what breaks and what to use instead.

### What counts as docs

Skills, `template/` and `docs/design-repo.md` are the product: they tell agents and designers what to do. Changing what they say is `feat` or `fix`, even though the files are Markdown. `docs` is for the README, this file, `docs/decisions/` and code comments.

### Fixes to unmerged work

A `fix` is for a bug that exists in `develop` or in a release. A problem found while a PR is still open is fixed in that PR, as part of its `feat`.

### Commits on a branch

Write them however helps review: the squash replaces them. Conventional messages are welcome but not checked.

## Pull requests

- One change per PR. A change may touch many parts of the repo (the state machine PR changed the Viewer, the diff, skills and docs together) as long as it is one thing to review and one line in the release notes.
- Fill in the template: **What changed**, **Why**, **For reviewers**.
- CI must pass before merging.
- Merge into `develop` with **Squash and merge**. Use **Create a merge commit** only for PRs between `main` and `develop` (releases, and bringing a hotfix back). Squashing those splits the two branches' histories, and the next release conflicts.

## Releases

Until 1.0, a release with a breaking change or a new feature bumps the minor version (0.3.0), and a release with only fixes bumps the patch (0.2.1).

1. Branch `chore/release-vX.Y.Z` from `develop`. Run `npm version X.Y.Z --no-git-tag-version`, which sets `package.json` and `package-lock.json`, and set the same version in `.claude-plugin/plugin.json`. A test checks that the three agree. Open a PR into `develop` titled `chore: release vX.Y.Z`.
2. Open a PR from `develop` into `main` titled `chore: release vX.Y.Z` and merge it with a merge commit.
3. Tag `main` and publish:

   ```sh
   git switch main && git pull
   git tag vX.Y.Z && git push origin vX.Y.Z
   npm publish
   ```

4. Create a GitHub release for the tag. `git log --oneline --no-merges vPREV..vX.Y.Z` lists one line per PR to write the notes from.

## Hotfixes

1. Branch `hotfix/<slug>` from `main`. Make the fix and bump the patch version (as in release step 1) on the same branch. Keep it to one commit whose message follows the title format: the merge keeps it on `main` as it is.
2. Open a PR into `main` titled `fix: ...`, merge it with a merge commit, then tag and publish as in release steps 3 and 4.
3. Open a PR from `main` into `develop` titled `chore: bring vX.Y.Z back to develop` and merge it with a merge commit.

## Checks

- **PR rules** (`.github/workflows/pr-rules.yml`) checks the branch prefix, that the PR targets the right branch, and the title. It runs again when the title is edited.
- **CI** (`.github/workflows/ci.yml`) runs the type check and tests on every PR and on every push to `main` and `develop`.

## Repository settings

These live in GitHub rather than in the repo:

- Squash and merge commits take the PR title as their message.
- Branches are deleted after their PR merges.
- `main` and `develop` take changes only through PRs that pass CI and PR rules. `main` allows merge commits only; `develop` allows squash, plus merge commits for bringing a hotfix back.
