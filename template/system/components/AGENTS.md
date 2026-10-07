# Components

One directory per component. Each has `<name>.html` (the markup), `<name>.css` (styles using only `tokens.css` custom properties), optional `<name>.js`, `SPEC.md` (variants, states, accessibility, do and don't) and `examples.html` (every variant on one page; the visual-regression baseline).

## Using a component in a prototype

Link the component stylesheet with a relative path and copy its markup verbatim, including class names and ARIA attributes:

```html
<link rel="stylesheet" href="../../system/tokens/tokens.css">
<link rel="stylesheet" href="../../system/components/button/button.css">
<button class="btn btn--primary">Continue</button>
```

## Rules

- Only components listed in `INDEX.md` with status `stable` or `beta` may be used in `prototypes/`.
- Do not restyle a component inside a prototype. If a variant is missing, add it here first, in its own PR.
- Composition rules (how components sit together on a page) are patterns, not components: see `../patterns/`.

## Adding a component

1. Create the directory with all five files. `examples.html` must show every variant and state, including focus, disabled, loading and error.
2. Add a row to `INDEX.md` with status `beta`.
3. Open a PR. The PR must include a Planchest diff of `system/components/` and pass the `review` checklist.
4. Promote to `stable` after it has been used by two prototypes without changes.
