---
name: planchest-view
description: Browse a design repository with the Planchest Viewer, inspect HTML at different viewport sizes, read specifications, or export a static library snapshot. Use for exploring current design material; use planchest-diff to compare revisions.
---

# Browse a design library

The Viewer indexes the current files in a design repo and presents HTML previews, Markdown documents, images and adjacent specifications. It generates a snapshot; it does not edit the source or compare git refs.

To run the `planchest` CLI, use the first of these that runs: `planchest` on PATH; `node "${CLAUDE_PLUGIN_ROOT}/bin/planchest.js"` when that variable is set (Claude Code); `node ../../bin/planchest.js`, resolved from this skill file's directory, when the skill sits in a Planchest checkout. Below, `planchest` means whichever one worked. It needs Node 22.18 or newer: run `node --version` first, and if it is older, stop and tell the user to install a current Node from nodejs.org or with a version manager (nvm, fnm, Volta), rather than working around it. If none of the three runs, stop and tell the user to put Planchest's `bin/planchest.js` on PATH; do not look for the files some other way.


## Use

Run from the design repository:

```sh
planchest view .
```

The command writes `.planchest/viewer/` and serves it on loopback. Open the URL printed by the CLI. Use `--port <n>` for a different port. Keep the server running while the user inspects the library.

For export without starting a server:

```sh
planchest view . --build
planchest serve .planchest/viewer
```

`--out <dir>` selects a destination, relative to the current working directory. Existing nonempty destinations must be owned Viewer output; do not bypass the ownership check. Source/output overlap is rejected except under the source's `.planchest/` directory.

When running from a Planchest source checkout, build the tool with `npm install` and `npm run build` in that checkout if compiled Viewer assets are missing. An installed package already includes them. Do not add React, Tailwind or a build system to the inspected design repository.

## Inspect and report

- Search titles, paths, statuses and section names; use the status filter to include archived concepts. Select HTML for viewport preview or Markdown for reading. The details panel renders an adjacent `SPEC.md` when present.
- Mobile, Small, Tablet and Desktop presets set the iframe's actual viewport dimensions. Fit and percentage zoom scale its presentation without changing the viewport. Verify responsiveness by changing the viewport, not just zoom.
- HTML runs in an isolated iframe. Origin storage and fetch-dependent prototypes may behave differently; use **Open original** to inspect these cases. A sandbox limitation alone is not evidence that the artifact is broken.
- Section names are indexed and displayed as metadata; the current Viewer does not isolate `data-page` sections, mirror state/language controls, synchronize iframe navigation, or provide multi-viewport comparison.
- Selection, viewport and zoom are stored in the URL hash. Share the URL on the same host; local loopback URLs are only usable on that machine.
- Rerun `view` after editing files: there is no watch/live refresh. Serve output over HTTP rather than opening `index.html` via `file://`.
- Static output includes supported design directories (`prototypes`, `concepts`, `flows`, `system`, `decisions`, `sources`) and root README/DESIGN/CONTEXT/BRAND/AGENTS Markdown. It skips symlinks and hidden files; it does not yet discover nested product/platform roots or arbitrary external asset directories. Check that requested content is actually indexed and dependencies render.
- For before/after review, use `planchest-diff`; the library Viewer does not replace the Diff report or the `planchest-review` checklist.

Keep generated `.planchest/` output out of commits. Exporting locally does not authorize uploading or publishing it. Report the served URL or export directory and any limitations actually observed.
