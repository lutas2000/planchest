# 0002. Skill names carry a `planchest-` prefix

status: accepted
date: 2026-10-23
supersedes: 0001 (the reason given for skill `review`; the skill rows otherwise stand, with the prefix added)

## Context

0001 chose `review` over `design-review` because "the plugin prefix is already `planchest`". That prefix exists only inside Claude Code. The skills also run in other agents (Cursor, Codex, cloud agents) from a shared skills directory, where there is no plugin namespace, and short names like `init`, `review` and `diff` collide with other skills. Claude Code itself ships an `init` skill.

The Agent Skills specification requires a skill's `name` to match its directory name. Claude Code builds a plugin skill's command from the plugin name and that `name`, so a prefixed name cannot be shortened back to `/planchest:init`.

## Decision

Name every skill `planchest-<name>`, in both the directory and the `name` field: `planchest-init`, `planchest-organize`, `planchest-interview`, `planchest-concept`, `planchest-prototype`, `planchest-review`, `planchest-diff`, `planchest-conflict`. Choose the part after the prefix by the rules in 0001.

## Consequences

- The names are unique in a shared skills directory, and the skills pass the Agent Skills name rule.
- In Claude Code the commands repeat the prefix: `/planchest:planchest-init`.
- The old names are not kept as aliases. Design repos created before this change mention the old names in `AGENTS.md`; rename them by hand.
- The CLI keeps its short subcommands (`planchest init`, `planchest diff`); only skills are renamed.
