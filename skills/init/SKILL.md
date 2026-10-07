---
name: init
description: Create a new design repo from the Planchest template. Use when the user wants to start a design repo, set up a place for design material, or asks what structure a design repo should have.
---

# Create a design repo

The template lives at `${CLAUDE_PLUGIN_ROOT}/template`. Its structure and the reasoning behind it are described in `${CLAUDE_PLUGIN_ROOT}/docs/design-repo.md`; read that file if the user asks why something is laid out the way it is.

## Ask first

Ask these together, in one message, and accept defaults when the user does not care:

1. **Product or product line?** A product line puts shared `DESIGN.md`, `CONTEXT.md`, `BRAND.md`, `system/` at the root and each product under `products/<name>/` with difference-only files. Default: single product.
2. **Platforms.** None (default: `concepts/` and `prototypes/` at the product root), or a list such as `web`, `mobile`. With platforms, each gets its own directory holding `DESIGN.md` (differences only), `system/` (overrides), `concepts/`, `prototypes/`. Platform directories are optional and can be added later by moving the two artifact directories into them.
3. **Which agents will work here?** Claude Code reads `CLAUDE.md` (already `@AGENTS.md`). For others, add their entry file pointing at `AGENTS.md` the same way (for example `.cursor/rules/agents.mdc`, `GEMINI.md`). Do not duplicate the rules.
4. **Working language?** The language agents use for specs, diff summaries and PR descriptions, which can differ from the product's UI copy language. Default: the language the user is writing in.
5. **Existing material?** If the user has design files, docs, screenshots or a live product, say that the `organize` skill will take them next.

## Do

1. Copy the template into the target directory (empty, or a fresh `git init`). Do not overwrite existing files; list any you skipped.
2. Apply the answers: create `products/<name>/` or platform directories, moving `concepts/` and `prototypes/` as needed; add agent entry files.
3. Set the language under "Working language" in `AGENTS.md` (replace **English**).
4. Replace `Product name` in `DESIGN.md` front matter with the real name. Leave the prose sections as comments for `organize` to fill.
5. If the directory is a git repository, make one commit: `Create design repo from Planchest template`.
6. Report the tree in a few lines and name the next step: run `organize` with the material, or `concept` to start exploring.

## Don't

- Don't invent tokens, components or brand rules. The template's values are placeholders; the `organize` skill replaces them from real material.
- Don't add a build system, package.json or framework. Pages are plain HTML by design.
