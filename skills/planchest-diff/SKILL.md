---
name: planchest-diff
description: Produce a visual diff report of design pages between two git refs, branches, or directories using the planchest CLI, then write the human summary that goes with it. Use when a design PR needs a review page, when the user wants to compare two versions or two variants of a design, or asks what changed visually.
---

# Visual diff of design pages

`planchest diff` renders two versions of the repo's pages side by side without spending tokens: it checks out refs into temporary worktrees (or takes directories as they are), lists which pages and `data-page` sections changed, copies both sides into a report directory, and writes `index.html` plus `report.json`. Your job is the part a script cannot do: say what changed and why it matters.

To run the `planchest` CLI, use the first of these that runs: `planchest` on PATH; `node "${CLAUDE_PLUGIN_ROOT}/bin/planchest.js"` when that variable is set (Claude Code); `node ../../bin/planchest.js`, resolved from this skill file's directory, when the skill sits in a Planchest checkout. Below, `planchest` means whichever one worked. It needs Node 22.18 or newer: run `node --version` first, and if it is older, stop and tell the user to install a current Node from nodejs.org or with a version manager (nvm, fnm, Volta), rather than working around it. If none of the three runs, stop and tell the user to put Planchest's `bin/planchest.js` on PATH; do not look for the files some other way.

## Procedure

1. **Pick the two sides.** Each side is a directory, a ref, or `<ref>:<path>`:
   - PR review: `planchest diff <base> HEAD --paths <dir that changed>`
   - two variants: `planchest diff concepts/dashboard-v1 concepts/dashboard-v2`
   - history: `planchest diff v1.0:prototypes/checkout HEAD:prototypes/checkout`
   Run it from the design repo. The report goes to `.planchest/diff/` (git-ignored) unless `--out` says otherwise.
2. **Read `report.json`.** `comparison.pages[]` has `change` per page and per section, and `status` (from `SPEC.md`) on both sides. `comparison.files[]` lists non-page files that differ (specs, tokens, data). Use `git diff <a> <b> -- <file>` on those to learn what changed in the specs and tokens.
3. **Look at the changed pages.** Serve the report (`planchest serve`, or `--serve` on the diff) and open it in the browser; or read the two HTML files directly. Note what moved, what was added, what state or copy changed, and whether `system/` material changed underneath the pages (a token change moves every page).
4. **Write `summary.html`** into the report directory. The report page shows it at the top. Plain HTML, no styles of its own, under ~300 words:

   ```html
   <h2>What changed</h2>
   <p>One paragraph: the intent of the change, in the reviewer's terms.</p>
   <ul>
     <li><a href="#prototypes/onboarding/signup.html">signup.html</a> — added the "takes a minute" reassurance line under the heading; button radius follows the new token.</li>
     <li><a href="#concepts/dashboard/index.html:billing">dashboard #billing</a> — new section, argues for …</li>
   </ul>
   <h2>Look at</h2>
   <p>Where a reviewer should spend their attention, and anything you are unsure about.</p>
   <h2>Checks</h2>
   <p>Result of the <code>review</code> skill, or "not run".</p>
   ```

   Links use the report's own hash format: `#<file>` or `#<file>:<section>`.
5. **Publish for the PR.** The report directory is self-contained: upload it as a CI artifact or to a preview host, or run `planchest serve` for a local review. Put the summary text and the report link in the PR description. Never commit `.planchest/` to the design repo.

## Reading the report page

Three panels in a row. **Left, the files**: changed, added and removed pages (and their `data-page` sections), unchanged pages collapsed, then other changed files. **Centre, the preview**: both sides of the selected page, side by side, swipe (drag the split) or onionskin (overlay with opacity); viewport presets 375 / 768 / 1280 or any width and height; scroll sync. **Right, the summary**: `summary.html`, or a note that none has been written. The Files and Summary buttons in the header hide and show the side panels, so the preview can take the whole window. The zoom buttons (50 / 75 / 100 %, or any percentage) scale the preview without changing the viewport the pages render at; Fit picks the zoom at which both sides fit the window. The status badge is the `SPEC.md` status on side B.

## Don't

- Don't describe pixel positions; describe intent and consequence.
- Don't paste the HTML of the pages into the summary or the PR.
- Don't claim a check passed if you did not run it.
