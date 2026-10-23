# The design repo

This document describes what a repository looks like, and which rules it keeps, when AI agents do the design work for one product or one product line. Every design artifact is self-contained HTML, the whole repository is managed by git, and design review happens as a diff in the pull request. Planchest provides the skills that create and organize such a repo, the review checklist, and the tool that renders the visual diff report. This document describes only the repo itself; it does not depend on any canvas or design tool.

## Shared conventions

- **`DESIGN.md` always follows the [Google Stitch DESIGN.md](https://www.dsebastien.net/design-md-specification/) format.** The YAML front matter holds the machine-readable tokens (colors / typography / spacing / rounded / components); the body has, in this order, Overview, Colors, Typography, Layout, Elevation & Depth, Shapes, Components, Do's and Don'ts. Tokens follow the W3C DTCG format. `system/tokens/tokens.json` and `tokens.css` are generated from the front matter; `DESIGN.md` is the single source of truth.
- **A nested `DESIGN.md` records differences only.** Its front matter lists only the tokens it overrides, its body only the rules that differ from the parent, and the first line of its Overview says `extends: ../DESIGN.md`. Agents read the closest file first and merge upward, the same convention `AGENTS.md` uses in monorepos.
- **Three root documents, three jobs.** `AGENTS.md` holds the rules, `DESIGN.md` the visual system, `CONTEXT.md` the domain: vocabulary, business terms, audience and roles, forbidden words. `BRAND.md` holds the brand material that is not a visual token: the logo and its usage rules, voice and tone, copy rules, naming conventions. Every line of copy an agent writes in a prototype must follow `BRAND.md`.
- **Materials and artifacts are kept apart.** `system/` is material (tokens, components, patterns); `concepts/` and `prototypes/` are artifacts. A prototype may only reference material and may not invent colours or components. A concept is exempt (next section).
- **Every page is self-contained HTML that opens from a static server at the repo root.** No build step, no external CDN; every asset is referenced by a relative path to a file inside the repo. This is what lets the diff tool put any two versions side by side.
- **Every artifact directory has a `SPEC.md`.** HTML can only say what something looks like; `SPEC.md` records why, so the next agent has the context. It starts with a `status:` field (`draft` / `review` / `approved` / `archived`), which replaces directory levels as the way to express maturity.
- **Review happens in pull requests.** Every new concept and every prototype change is a PR. The PR carries the diff report Planchest generates; the `planchest-review` checklist runs in CI (a `planchest check` command for its mechanical steps is planned); rejections stay in the PR discussion. Only decisions that outlive the PR are lifted into `decisions/`.

## Two tiers of artifacts (hard rules, written into `AGENTS.md`)

| Tier | Purpose | Constraints | Lifecycle |
|---|---|---|---|
| `concepts/` | Show an idea quickly, for discussion and a decision | Not bound by the design system: any colour, any layout; one `index.html` may hold several pages and flows | When the discussion ends, adopted or not, the concept moves to `concepts/archive/`; its `SPEC.md` records the outcome and links the PR or the decision record |
| `prototypes/` | Rigorous, realistic, developer-ready screens | 100% from `system/` tokens, components and patterns; copy follows `BRAND.md`; every page maps back to `flows/` | Maintained long term; `status` goes draft → review → approved |

When a concept's `index.html` holds several pages, each one is wrapped in a `<section data-page="<id>">` with a kebab-case `id`. The diff tool uses this attribute to compare pages separately and to build the page list.

Going from concept to prototype is not "upgrading" the same file. A compliant prototype is implemented afresh, with the concept as its reference. The `planchest-prototype` skill does this with a checklist and records in the prototype's `SPEC.md` which concept it came from.

## Single product

```
product-a/
├── AGENTS.md                  # Standing rules: layout, inheritance, the two-tier hard rules,
│                              #   self-contained HTML, the PR process, what is forbidden
├── CLAUDE.md                  # One line, `@AGENTS.md`; other agents get the same one-line shim
├── DESIGN.md                  # Stitch format, complete (single source of truth)
├── CONTEXT.md                 # Vocabulary, business terms, audience and roles, forbidden words
├── BRAND.md                   # Logo usage, voice and tone, copy rules, naming
│
├── system/                    # Materials
│   ├── tokens/
│   │   ├── tokens.json        # DTCG, generated from the DESIGN.md front matter
│   │   ├── tokens.css         # CSS custom properties; the only stylesheet prototypes may reference for tokens
│   │   └── themes/            # dark.css, high-contrast.css, …; tokens.css is the default theme
│   ├── components/            # Single components: button, input, card, …
│   │   ├── AGENTS.md          # How to use the library: linking, composition, when not to improvise, how to add one
│   │   ├── INDEX.md           # Every component: name, purpose, status stable / beta / deprecated
│   │   └── button/
│   │       ├── button.html    # The real markup
│   │       ├── button.css
│   │       ├── button.js      # Optional
│   │       ├── SPEC.md        # Variants, states, accessibility, actionable do's and don'ts
│   │       └── examples.html  # Every variant on one page; the visual-regression baseline
│   ├── patterns/              # Recipes made of components: how a form is laid out, a list with filters,
│   │   │                      #   empty states, error display, page frames. Not components: rules for combining them
│   │   ├── AGENTS.md
│   │   ├── INDEX.md
│   │   └── form-layout/
│   │       ├── form-layout.html
│   │       └── SPEC.md        # When to use it, how to compose it, what not to do
│   ├── icons/
│   └── brand/                 # Logo files, brand imagery; usage rules live in the root BRAND.md
│
├── skills/                    # Only procedures specific to this product. The shared ones (init, organize,
│   └── make-report-page/      #   concept, prototype, review, diff) come from the Planchest plugin
│
├── flows/                     # Cross-platform user journeys; every prototype page maps back to one
│   ├── sitemap.html           # Map of every screen, linked to the pages that exist; written by organize
│   └── onboarding/FLOW.md
│
├── web/
│   ├── DESIGN.md              # Platform differences only: breakpoints, navigation model, density
│   ├── system/                # Platform-level token overrides and platform-only components (e.g. sidebar)
│   ├── concepts/
│   │   ├── onboarding-v2/
│   │   │   ├── index.html     # Several pages and flows, one <section data-page> each
│   │   │   └── SPEC.md        # status, the question to answer, the outcome of the discussion
│   │   └── archive/
│   │       └── onboarding-v1/
│   └── prototypes/
│       └── onboarding/
│           ├── signup.html
│           ├── verify.html
│           ├── data.json      # Fake data
│           ├── SPEC.md        # status, goal, user stories, acceptance, flow, source concept
│           └── HANDOFF.md     # Interaction detail, copy, motion, edge cases
│
├── mobile/
│   ├── DESIGN.md
│   ├── system/
│   ├── concepts/
│   └── prototypes/
│
└── decisions/                 # Decisions lifted out of PR discussions so they are not argued again
    └── 0001-no-modal-for-primary-flows.md
```

## Product line

The product-line layout lifts the single product's root up one level. The product-line root holds the shared `DESIGN.md`, `CONTEXT.md`, `BRAND.md`, `system/` and `skills/`; each product directory has exactly the single-product structure, except that its `DESIGN.md`, `CONTEXT.md`, `BRAND.md` and `system/` become difference-only versions.

```
xx-product-line/
├── AGENTS.md                  # One extra section: product line → product → platform inheritance,
│                              #   and shared-component changes go through a product-line PR
├── CLAUDE.md                  # `@AGENTS.md`
├── DESIGN.md                  # Stitch format, complete; the product line's single source of truth
├── CONTEXT.md                 # Shared vocabulary and roles
├── BRAND.md                   # The product-line brand: logo, voice, naming
│
├── system/                    # Shared materials, same structure as the single product
│   ├── tokens/
│   ├── components/
│   ├── patterns/
│   ├── icons/
│   └── brand/
│
├── skills/                    # Shared product-line procedures; products may add, not change
│
├── products/
│   ├── product-a/
│   │   ├── AGENTS.md          # Optional; if present, only this product's special rules
│   │   ├── DESIGN.md          # extends: ../../DESIGN.md, differences only
│   │   ├── CONTEXT.md         # Only this product's terms and audience
│   │   ├── BRAND.md           # Only this product's sub-brand differences; omit if none
│   │   ├── system/            # Only token overrides and product-specific components
│   │   │   ├── tokens/overrides.json
│   │   │   └── components/
│   │   ├── skills/            # Optional
│   │   ├── flows/
│   │   ├── web/               # Same structure as the single product
│   │   ├── mobile/
│   │   └── decisions/
│   │
│   └── product-b/
│
└── decisions/                 # Product-line decisions
```

### Product-line hard rules (written into the root `AGENTS.md`)

- A product may not redefine a token the product line already has; it may only override the value. A new token is first a product-line PR.
- A product's components may not share a name with a product-line component. Changing a shared component is a product-line PR, with `CODEOWNERS` pointing at the design-system owners.
- A platform-level `DESIGN.md` may only describe layout and interaction differences. It may not change colour or type; those belong to the product-line and product levels only.
- A single product that later joins a product line is moved into `products/`, its `DESIGN.md`, `CONTEXT.md` and `BRAND.md` are rewritten as difference-only files, and nothing else moves. This is why the two layouts are deliberately identical.

## What Planchest relies on

Planchest's tools require nothing to be installed in the repo. They depend only on the points below, all of which are part of the conventions above. `template/` is the empty shell of this tree, and the `planchest-init` skill starts from it:

- Pages open directly from a static server at the repo root (the diff tool mounts both versions under one server and shows them in iframes side by side).
- A concept's multi-page `index.html` is split into pages with `<section data-page>`.
- `system/components/*/examples.html` exists and serves as the visual-regression baseline.
- Prototypes reference only `system/tokens/tokens.css` and what is in `system/components/` and `system/patterns/`. The compliance check scans for hard-coded colours and unregistered components on that basis.
- Every artifact directory has a `SPEC.md` that starts with `status:`; the diff report uses it to label each page's maturity.
- Platform directories (`web/`, `mobile/`) are optional. A product with one platform may keep `concepts/` and `prototypes/` at the product root; the `planchest-init` skill asks, and a platform directory can be added later by moving those two directories into it. The tools do not assume a platform level exists.

## References

- Google Stitch DESIGN.md format: <https://www.dsebastien.net/design-md-specification/>, <https://themenonlab.blog/blog/google-design-md-ai-agents-design-systems>
- awesome-design-md, community examples: <https://www.sourcepulse.org/projects/27256155>
- Agentic design systems in four layers (AGENTS.md / skills / DESIGN.md) and the component-index pattern: <https://designproject.io/blog/agentic-design-system-context/>, <https://designproject.io/blog/design-md-component-library/>
- The AGENTS.md open standard (nesting, closest file wins): <https://site.builder.io/blog/agents-md>
- Decision-record format: <https://adr.github.io/>
- Agent design tools that emit HTML: fdesign <https://pypi.org/project/fdesign/2.0.0/>, cc-design <https://www.sourcepulse.org/projects/28347860>, pi-ui-workflow <https://libraries.io/npm/pi-ui-workflow>, Agent-Native Design <https://www.agent-native.com/apps/design>
- Figma's official MCP server: <https://www.figma.com/blog/design-systems-ai-mcp/>
