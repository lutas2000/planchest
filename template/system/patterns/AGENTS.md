# Patterns

A pattern is a recipe made of components: how a form is laid out, how a list with filters behaves, what an empty state shows, how errors are presented, how a page is framed. Components are the words; patterns are the sentences. Agents drift most on these, so every recurring composition is written down here once.

Each pattern has `<name>.html` (a working example built only from `system/` components and tokens) and `SPEC.md` (when to use it, how to compose it, what not to do).

## Rules

- A prototype that contains a form, a list, an empty state or an error must use the matching pattern from `INDEX.md`. If no pattern fits, add one first.
- Patterns do not introduce new visual styles. They only arrange existing components with existing tokens.
- A pattern's `SPEC.md` lists the components it uses, so a component change can be traced to the patterns it affects.
