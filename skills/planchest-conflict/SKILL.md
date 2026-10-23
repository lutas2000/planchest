---
name: planchest-conflict
description: Resolve conflicts in a design repo one at a time, with the user deciding. Covers design conflicts between sources (two documents giving different primaries, a Figma file and the live product using different terms, a prototype contradicting a decision record) and git merge or rebase conflicts in DESIGN.md, tokens, specs or pages. Shows both versions as a text diff or as rendered pages before asking. Use when organize finds sources that disagree, when a merge or rebase stops on conflicts in a design repo, or when the user says two things do not match.
---

# Resolve a conflict

Two kinds, one procedure. A **source conflict**: two pieces of material answer the same question differently, and the repo can hold only one answer. A **git conflict**: two branches changed the same thing; git has left markers, or the branches disagree without markers (both added a component under the same name, one renamed a term the other kept using). Neither is yours to settle alone. The user decides; your job is to make each decision easy and to record it.

## Procedure

1. **Collect before resolving.** Build the full list first, so the user knows the size of the job and decisions can be made in the right order.
   - Source conflicts come from `planchest-organize`'s inventory: the question, side A (source, value, date, authority), side B.
   - Git conflicts: `git diff --name-only --diff-filter=U` for marked files. For a merge, the sides are `HEAD` (ours) and `MERGE_HEAD` (theirs); for a rebase, `HEAD` and `REBASE_HEAD`. Also look for unmarked disagreements across the two sides: duplicate component names, a term renamed on one side, a token one side removed and the other still uses.

   Order the list: `DESIGN.md` and tokens first (they move everything downstream), then `system/components/`, then `flows/`, then `prototypes/`, then `concepts/`, then specs and other documents. Tell the user how many there are and that you will go through them one at a time.
2. **Show each conflict in the form that makes the difference visible.**
   - **Values and text** (`DESIGN.md` front matter, `CONTEXT.md` vocabulary, `SPEC.md`, `FLOW.md`, copy): a two-column table or a unified diff in a code block, only the lines that differ, each side labelled with its source or branch. Never show raw conflict markers.
   - **Anything visual** (a colour, a typeface, a radius, a component, a page): render it. For a git conflict, `planchest diff HEAD MERGE_HEAD --paths <the file's directory> --out .planchest/conflict --serve` shows the two sides as pages. For a source conflict, write `.planchest/conflict/index.html`: both candidates side by side (a swatch on the product's surface, a type specimen, the button, or the two screens), labelled A and B with their sources, then `planchest serve .planchest/conflict`. If a browser tool is available, open it and look, so you can describe the difference in one sentence.
   - **Say what each choice drags along.** "B's primary fails 4.5:1 on `surface`; choosing it means a darker `on-primary` or a darker primary." "A's term is already in three approved prototypes."
3. **Ask, one conflict at a time.** Offer the options that apply: **A**, **B**, **both** (a variant, an alias, two tokens with distinct jobs), **neither** (the user supplies a third value), **defer** (leave the placeholder or the markers, list it under Open questions). Recommend one and say why when there is a reason (authority, recency, consistency with what is already approved); do not recommend when it is taste. Wait for the answer before moving on. Batch only when the user asks for it, or for the mechanical consequences of a decision just made ("apply the same to the other four zone colours?").
4. **Apply and propagate.** Edit the file, remove the markers, then follow the change downstream in the same commit: `DESIGN.md` → `tokens.json` and `tokens.css`; a component → its `examples.html` and the `INDEX.md` row; a flow step → `sitemap.html` and the `SPEC.md` screen tables; a term → every page and spec that uses the old one. For git, `git add` each resolved file; continue the merge or rebase only when no file is left unresolved, then run the `planchest-review` skill on the result.
5. **Record.** A decision that outlives the PR ("we say workspace, not team"; "the run surface is dark") becomes `decisions/NNNN-<title>.md`, with both sides in its Context section. Everything else goes in the PR description under "Resolved conflicts", one line each: the question, the choice, the reason. Deferred items go under "Open questions".

`.planchest/conflict/` is git-ignored; there is nothing to clean up.

## Don't

- Don't resolve by "most recent wins" without asking. That is `planchest-organize`'s rule for trivial differences only.
- Don't take one git side wholesale (`--ours`, `--theirs`) for a file with more than one conflict. Each hunk is a decision.
- Don't make the user read conflict markers or two whole files. Show the two versions of the thing that differs.
- Don't continue a merge or rebase with a file still unresolved, and don't commit a `DESIGN.md` whose tokens no longer match `tokens.css`.
