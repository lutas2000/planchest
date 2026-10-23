# Planchest

A design repo framework for AI agents. One git repository holds every design material and every design artifact for a product; agents produce concepts and prototypes inside its rules; people review the result as a visual diff in the pull request.

Named after the plan chest: the wide, shallow-drawered cabinet where architects keep their drawings flat, sorted and ready to be pulled out and compared.

## What it is

- **A repo layout** for design work done by agents: `DESIGN.md` (Stitch format) as the single source of visual truth, `CONTEXT.md` and `BRAND.md` for everything that is not a token, `system/` for materials, `concepts/` for free exploration, `prototypes/` for strict, developer-ready screens, `decisions/` for the decisions that outlive a pull request. Everything is self-contained HTML plus Markdown. See [docs/design-repo.md](docs/design-repo.md).
- **Skills** that set up and work inside that repo: `planchest-init`, `planchest-organize`, `planchest-interview`, `planchest-concept`, `planchest-prototype`, `planchest-review`, `planchest-diff`, `planchest-conflict`.
- **A diff tool**, `planchest diff`, that renders two versions of the pages side by side (or swipe, or onionskin) at any viewport, without spending a token. Two sides can be git refs, `ref:path`, or plain directories, so "main vs. this branch" and "dashboard-v1 vs. dashboard-v2" are the same command. The `planchest-diff` skill adds the human summary.

Planchest does not depend on any design tool or canvas. Any agent that reads `AGENTS.md` can work in a Planchest repo. The skills ship as a Claude Code plugin and also work in other agents that load skills (see [Use with other agents](#use-with-other-agents)).

## Install

As a Claude Code plugin:

```bash
claude plugin marketplace add lutas2000/planchest
```

```bash
claude plugin install planchest
```

The skills run the `planchest` CLI with the `node` on your PATH, which must be Node 22.18 or newer (`node --version` to check). If it is older, install a current version from [nodejs.org](https://nodejs.org) or with a version manager such as nvm, fnm or Volta.

The CLI alone, from a clone (same Node requirement, no dependencies):

```bash
node bin/planchest.js --help
```

The CLI is not on npm yet.

### Use with other agents

The skills find everything they need through the `planchest` CLI: `planchest init` copies the template, `planchest docs design-repo` prints the reasoning behind it, `planchest diff` renders the report. They look for the CLI in this order: `planchest` on PATH; `${CLAUDE_PLUGIN_ROOT}/bin/planchest.js` inside Claude Code; `../../bin/planchest.js` next to the skill file. So in Cursor, Codex or a cloud agent, put the CLI on PATH (for example `npm link` in a clone of this repo), then copy or symlink `skills/` into the agent's skills directory. An agent that loads the skills straight from a clone needs nothing on PATH.

Every skill name starts with `planchest-`, so the skills do not collide with others in a shared skills directory. Claude Code adds the plugin's own namespace on top, which is why the commands read `/planchest:planchest-<name>`.

## Use

Start a design repo:

```
/planchest:planchest-init
```

Bring in what you have (brand guide, Figma export, screenshots, a live product). With nothing to work from, `planchest-organize` stops and asks for material; `planchest-interview` builds the brand, design system or context by asking you questions instead:

```
/planchest:planchest-organize
/planchest:planchest-interview design
```

Explore, then build:

```
/planchest:planchest-concept   → concepts/<name>/index.html, free form, several screens in one file
/planchest:planchest-prototype → prototypes/<flow>/<step>.html, strictly from system/
```

Review a change visually:

```bash
planchest diff main HEAD --paths prototypes/onboarding --serve
```

```bash
planchest diff concepts/dashboard-v1 concepts/dashboard-v2 --serve
```

When two sources disagree, or a merge stops on conflicts in the design repo, `planchest-conflict` walks through them one at a time, showing both versions as a diff or as rendered pages:

```
/planchest:planchest-conflict
```

The report (`.planchest/diff/index.html`, git-ignored) has three panels: the changed, added and removed pages and `data-page` sections on the left; both sides of the selected page in the centre, with side-by-side, swipe and onionskin modes, viewport presets, zoom and scroll sync; and on the right `summary.html` from the same directory, which the `planchest-diff` skill writes. The side panels can be hidden. `report.json` next to it is the machine-readable version. The directory is self-contained, so it can be uploaded as a CI artifact or to a preview host for the PR.

## Example

`examples/stride/` is a sample design repo for a fictional running app, in two versions: `a` is release 1.0 and `b` is 1.1, which makes runs goal-first. It shows what a Planchest repo looks like once it has some work in it, and gives `planchest diff` something real to compare. It is reference material only: the plugin does not load it and the npm package does not include it.

From a clone of this repo:

```bash
node bin/planchest.js diff examples/stride/a examples/stride/b --serve
```

## Status

Version 0.1: the repo layout, the eight skills, and `planchest diff` with directory and git-ref sources. Next: a `planchest check` command for the mechanical part of the `planchest-review` checklist, and token generation from `DESIGN.md`.

## Develop

```bash
npm install
```

```bash
npm test
```

```bash
npm run check
```

```bash
npm run build
```

Source is TypeScript run directly by Node, so a clone needs no build step. `npm run build` compiles `src/` to `dist/` for the npm package, since Node does not strip types under `node_modules/`; `npm pack` and `npm publish` run it first. `bin/planchest.js` runs `src/` when it is there and `dist/` otherwise.

## License

Apache-2.0
