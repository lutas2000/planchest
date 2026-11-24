# Flows

One directory per user journey, each with a `FLOW.md`. Flows are platform-independent: a prototype screen on any platform maps back to a step here.

```
flows/
└── onboarding/
    └── FLOW.md
```

## FLOW.md

```markdown
status: approved

# Onboarding

**Goal:** the user ends with a verified account and one workspace.
**Entry:** marketing site "Get started"; invitation link.
**Exit:** workspace home (success); abandoned (drop-off).

## Steps

| # | Step | User does | System does | Screens |
|---|---|---|---|---|
| 1 | Sign up | enters email | sends code | prototypes/onboarding/signup.html |
| 2 | Verify | enters code | creates account | prototypes/onboarding/verify.html |

## Edge cases

- Code expired → …
- Email already registered → …
```

## sitemap.html

The map of the product's screens and how they connect: one self-contained page, written by the `planchest-organize` skill when the material shows more than one screen, and kept current by `planchest-prototype` when screens are added, removed or renamed. It is the one page in the repo that is about the product rather than part of it. The diff report shows it like any other page, so a reorganised navigation or a new flow step is visible as a visual diff.

It has two parts.

**Flow map.** One `<ol class="nodes">` with a `<li data-node>` per screen, placed on a grid with `style="--col:2;--row:3"` (set `--cols` on the `<ol>`). Lay the bottom tabs or top-level screens out in the first column and let each flow run to the right.

- `data-to="a b"` lists the screens this one leads to **as written in a `FLOW.md`**; they draw as solid arrows. `data-maybe="c"` is a link the material suggests but no `FLOW.md` states yet; it draws dashed. Confirm a dashed link by writing it into the flow, then move it to `data-to`.
- `data-status`: `prototype`, a concept's `SPEC.md` status (`draft`, `review`, `approved`), or `missing` when there is no page. Missing screens draw with a red dashed border.
- Each node links to its step below (`href="#run-start"`). A `<li class="label">` on the grid labels a column, such as *Bottom tabs*.

**Areas.** One `<section class="panel area" id="…" data-status="…">` per flow or concept, in navigation order: a header with the name, status and a link to its `FLOW.md`, a one-paragraph `summary` of the journey, and an `<ol class="steps">` with one `<li id>` per step in `FLOW.md` order. Each step has a `.head` (name, then links to the prototype or concept and its `SPEC.md`) and a `.shots` row with one `<figure>` per state:

```html
<figure><img src="shots/run-start.png" data-shot="../prototypes/run/start.html" alt="Start: GPS ready"><figcaption>GPS ready</figcaption></figure>
```

- `data-shot` is the page to capture, relative to the sitemap; `#id` captures one `section[data-page]` of a concept. On a page with a state machine, `data-preset="paused-halfway"` applies a preset, `data-state="paused"` picks a state and `data-context='{"gps":"lost"}'` merges into the context, in that order. `data-viewport="1440x900"` on the `<img>` or any ancestor changes the size (default 390x844).
- `src` is where the PNG goes, under `flows/shots/`. Run `planchest shots` from the repo root after any screen in the map changes; it renders every `data-shot` with Playwright and overwrites the PNGs. Commit them with the change. The viewer does not list `flows/shots/` as entries.
- A step with no page yet is `<li data-status="missing">` with `<figure><div class="empty">Not built yet</div></figure>` in place of a screenshot.

The script fills in each area's counts, the index of areas and the All / Built / Not built filter, so leave `<span class="meta"></span>` and `<nav class="index"></nav>` empty. Copy the `<style>` and `<script>` below unchanged; the page is not a product screen and does not use `system/` tokens. It matches the Planchest diff report and viewer, in light and dark.

```html
<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Sitemap</title>
<style>
:root {
  --bg: #fafaf8; --fg: #1c1c1a; --muted: #6b6b66; --line: #e3e2dc; --panel: #ffffff;
  --accent: #2f5bea; --built: #1f8a4c; --missing: #c0392b; --draft: #9a6412; --review: #2f5bea;
  --mono: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  color-scheme: light;
}
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #161614; --fg: #ecece8; --muted: #9a9a93; --line: #2c2c29; --panel: #1f1f1c;
    --accent: #7c9bff; --built: #5ccc85; --missing: #ff7b6b; --draft: #e6b45a; --review: #7c9bff;
    color-scheme: dark;
  }
}
* { box-sizing: border-box; }
body { margin: 0; padding: 24px; background: var(--bg); color: var(--fg); font: 14px/1.45 ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; font-variant-numeric: tabular-nums; }
a { color: inherit; }
a:hover { color: var(--accent); }
h1 { font-size: 20px; font-weight: 500; margin: 0 0 4px; }
h2 { font-size: 16px; font-weight: 500; margin: 0; }
h3 { font-size: 14px; font-weight: 500; margin: 0; }
body > p { margin: 0 0 24px; max-width: 720px; color: var(--muted); }
.panel { border: 1px solid var(--line); border-radius: 12px; background: var(--panel); padding: 20px 24px; margin-bottom: 24px; }

/* Flow map: nodes on a grid, edges drawn by the script below. */
.map h2 { margin-bottom: 16px; }
.map .scroll { overflow-x: auto; padding-bottom: 8px; }
.nodes { position: relative; display: grid; grid-template-columns: repeat(var(--cols, 4), 152px); grid-auto-rows: auto; gap: 32px 56px; list-style: none; margin: 0; padding: 0 0 40px; width: max-content; }
.nodes > li { grid-column: var(--col); grid-row: var(--row); position: relative; z-index: 1; }
.nodes .label { align-self: end; font-size: 12px; color: var(--muted); margin-bottom: -24px; }
.map h2 + .scroll { margin-top: -8px; }
.nodes a { display: block; height: 100%; min-height: 56px; padding: 8px 12px; border: 1.5px solid var(--built); border-radius: 8px; background: var(--panel); text-decoration: none; }
.nodes a:hover { background: color-mix(in srgb, var(--fg) 5%, var(--panel)); }
.nodes b { display: block; font-weight: 500; }
.nodes small { font-size: 12px; color: var(--muted); }
[data-status="draft"] > a { border-color: var(--draft); }
[data-status="review"] > a { border-color: var(--review); }
[data-status="missing"] > a { border: 1.5px dashed var(--missing); color: var(--muted); }
.nodes svg { position: absolute; inset: 0; overflow: visible; pointer-events: none; z-index: 0; }
.nodes path { fill: none; stroke: var(--muted); stroke-width: 1.25; }
.nodes path.maybe { stroke-dasharray: 5 4; }
.nodes marker path { fill: var(--muted); stroke: none; }
.legend { display: flex; flex-wrap: wrap; gap: 8px 24px; margin: 8px 0 0; padding: 12px 0 0; border-top: 1px solid var(--line); font-size: 12px; color: var(--muted); list-style: none; }
.legend li { display: inline-flex; align-items: center; gap: 8px; }
.legend i { display: inline-block; width: 24px; border-top: 1.5px solid var(--muted); }
.legend i.maybe { border-top-style: dashed; }
.legend i.box { width: 16px; height: 12px; border: 1.5px solid var(--built); border-radius: 3px; }
.legend i.box.draft { border-color: var(--draft); }
.legend i.box.missing { border: 1.5px dashed var(--missing); }

/* Filter and index. */
.bar { display: flex; flex-wrap: wrap; align-items: center; gap: 12px 24px; margin-bottom: 24px; }
.filter { display: inline-flex; border: 1px solid var(--line); border-radius: 8px; overflow: hidden; }
.filter button { font: inherit; font-size: 12px; height: 28px; padding: 0 12px; border: 0; background: none; color: var(--muted); cursor: pointer; }
.filter button + button { border-left: 1px solid var(--line); }
.filter button:hover { color: var(--fg); background: color-mix(in srgb, var(--fg) 5%, transparent); }
.filter button[aria-pressed="true"] { color: var(--fg); background: color-mix(in srgb, var(--fg) 10%, transparent); }
.index { display: flex; flex-wrap: wrap; gap: 4px 16px; font-size: 12px; }
button:focus-visible, a:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

/* One panel per area: its steps in order, each with its screenshots. */
.area header { display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px 12px; margin-bottom: 12px; }
.area .status { font: 12px var(--mono); color: var(--built); }
.area[data-status="draft"] .status { color: var(--draft); }
.area[data-status="review"] .status { color: var(--review); }
.area[data-status="missing"] .status, .steps > li[data-status="missing"] .status { color: var(--missing); }
.area .meta { font-size: 12px; color: var(--muted); }
.area header > a { margin-left: auto; font-size: 12px; }
.area .summary { margin: 0 0 20px; padding: 12px 16px; border-radius: 8px; background: color-mix(in srgb, var(--fg) 4%, transparent); max-width: 960px; }
.steps { display: flex; align-items: flex-start; gap: 32px; overflow-x: auto; list-style: none; margin: 0; padding: 0 0 8px; counter-reset: step; }
.steps > li { flex: none; counter-increment: step; position: relative; }
.steps > li:not(:last-child)::after { content: ""; position: absolute; top: 12px; left: 24px; right: -32px; border-top: 1px solid var(--muted); opacity: .5; }
.steps > li:has(+ li[data-status="missing"])::after { border-top-style: dashed; }
.steps .head { position: relative; z-index: 1; display: inline-flex; flex-wrap: wrap; align-items: baseline; gap: 4px 12px; min-height: 24px; margin-bottom: 12px; padding-right: 12px; background: var(--panel); font-size: 12px; }
.steps .head::before { content: counter(step); align-self: center; width: 24px; height: 24px; border-radius: 50%; background: var(--fg); color: var(--bg); font: 500 12px/24px var(--mono); text-align: center; }
.steps > li[data-status="missing"] .head::before { background: var(--panel); color: var(--muted); border: 1.5px dashed var(--muted); line-height: 21px; }
.shots { display: flex; gap: 12px; overflow-x: auto; padding-bottom: 4px; }
.shots figure { flex: none; margin: 0; }
.shots img { display: block; width: 196px; border: 1px solid var(--line); border-radius: 16px; background: #fff; }
.shots figcaption { margin-top: 8px; max-width: 196px; font-size: 12px; color: var(--muted); }
.shots .empty { display: grid; place-items: center; width: 196px; aspect-ratio: 390 / 844; border: 1.5px dashed var(--missing); border-radius: 16px; font-size: 12px; color: var(--muted); }

/* Filter states, set on <body> by the script. */
[data-filter="built"] .area[data-status="missing"],
[data-filter="built"] .steps > li[data-status="missing"],
[data-filter="missing"] .area:not([data-has-missing]) { display: none; }
[data-filter="built"] .nodes [data-status="missing"],
[data-filter="missing"] .nodes [data-node]:not([data-status="missing"]) { opacity: .35; }
</style></head>
<body data-filter="all">
<h1>Product 1.0</h1>
<p>Every screen is a step in a flow or a section of a concept.</p>

<section class="panel map" aria-labelledby="map-title">
  <h2 id="map-title">Flow map</h2>
  <div class="scroll">
  <ol class="nodes" style="--cols:3">
    <li class="label" style="--col:1;--row:1">Bottom tabs</li>
    <li data-node="start" data-status="prototype" data-to="countdown" style="--col:1;--row:2"><a href="#run-start"><b>Start</b><small>Prototype</small></a></li>
    <li data-node="countdown" data-status="missing" style="--col:2;--row:2"><a href="#run-countdown"><b>Countdown</b><small>Not built</small></a></li>
  </ol>
  </div>
  <ul class="legend">
    <li><i></i>In FLOW.md</li>
    <li><i class="maybe"></i>Inferred, not yet in FLOW.md</li>
    <li><i class="box"></i>Prototype</li>
    <li><i class="box draft"></i>Concept</li>
    <li><i class="box missing"></i>Not built</li>
  </ul>
</section>

<div class="bar">
  <div class="filter" role="group" aria-label="Show">
    <button data-filter="all" aria-pressed="true">All</button>
    <button data-filter="built" aria-pressed="false">Built</button>
    <button data-filter="missing" aria-pressed="false">Not built</button>
  </div>
  <nav class="index" aria-label="Areas"></nav>
</div>

<section class="panel area" id="run" data-status="prototype">
  <header>
    <h2>Record a run</h2>
    <span class="status">prototype</span>
    <span class="meta"></span>
    <a href="run/FLOW.md">FLOW.md</a>
  </header>
  <p class="summary">Start → countdown. The runner taps Start and a countdown lets GPS lock.</p>
  <ol class="steps">
    <li id="run-start">
      <div class="head"><h3>Start</h3> <a href="../prototypes/run/start.html">Prototype</a> <a href="../prototypes/run/SPEC.md">SPEC</a></div>
      <div class="shots">
        <figure><img src="shots/run-start.png" data-shot="../prototypes/run/start.html" alt="Start: GPS ready"><figcaption>GPS ready</figcaption></figure>
      </div>
    </li>
    <li id="run-countdown" data-status="missing">
      <div class="head"><h3>Countdown</h3> <span class="status">not built</span></div>
      <div class="shots"><figure><div class="empty">Not built yet</div></figure></div>
    </li>
  </ol>
</section>

<script>
// Draws the flow map edges, fills in counts, the index and the filter.
// Edges: data-to (confirmed in FLOW.md, solid) and data-maybe (inferred, dashed).
(() => {
  const nodes = document.querySelector(".nodes");
  if (nodes) {
    const ns = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(ns, "svg");
    svg.innerHTML = '<defs><marker id="arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L8 4L0 8z"/></marker></defs>';
    nodes.prepend(svg);
    const draw = () => {
      for (const p of svg.querySelectorAll(":scope > path")) p.remove();
      const box = nodes.getBoundingClientRect();
      const rect = (el) => {
        const r = el.getBoundingClientRect();
        const l = r.left - box.left, t = r.top - box.top;
        return { l, t, r: l + r.width, b: t + r.height, x: l + r.width / 2, y: t + r.height / 2 };
      };
      for (const from of nodes.querySelectorAll("[data-node]")) {
        for (const [key, kind] of [["to", "sure"], ["maybe", "maybe"]]) {
          for (const id of (from.dataset[key] || "").split(/\s+/).filter(Boolean)) {
            const to = nodes.querySelector('[data-node="' + id + '"]');
            if (!to) continue;
            const a = rect(from), b = rect(to);
            let d;
            if (b.l >= a.r) {
              // Forward: right side to left side.
              const dx = Math.max(24, (b.l - a.r) / 2);
              d = `M${a.r} ${a.y}C${a.r + dx} ${a.y} ${b.l - dx} ${b.y} ${b.l - 2} ${b.y}`;
            } else if (b.r <= a.l) {
              // Backward: under both nodes, so it never crosses the forward edges.
              const low = Math.max(a.b, b.b) + 28;
              d = `M${a.x} ${a.b}C${a.x} ${low} ${b.x} ${low} ${b.x} ${b.b + 2}`;
            } else if (b.t >= a.b) {
              d = `M${a.x} ${a.b}L${b.x} ${b.t - 2}`;
            } else {
              d = `M${a.x - 12} ${a.t}L${b.x - 12} ${b.b + 2}`;
            }
            const path = document.createElementNS(ns, "path");
            path.setAttribute("d", d);
            path.setAttribute("class", kind);
            path.setAttribute("marker-end", "url(#arrow)");
            svg.append(path);
          }
        }
      }
      svg.setAttribute("width", nodes.scrollWidth);
      svg.setAttribute("height", nodes.scrollHeight);
    };
    draw();
    addEventListener("resize", draw);
    document.fonts && document.fonts.ready.then(draw);
  }

  const index = document.querySelector(".index");
  for (const area of document.querySelectorAll(".area")) {
    const steps = area.querySelectorAll(".steps > li");
    const missing = area.querySelectorAll('.steps > li[data-status="missing"]').length;
    const shots = area.querySelectorAll(".shots img").length;
    if (missing || area.dataset.status === "missing") area.dataset.hasMissing = "";
    const meta = area.querySelector(".meta");
    if (meta && !meta.textContent.trim())
      meta.textContent = [
        steps.length + (steps.length === 1 ? " step" : " steps"),
        shots + (shots === 1 ? " screenshot" : " screenshots"),
        missing ? missing + " not built" : "",
      ].filter(Boolean).join(" · ");
    if (index) {
      const link = document.createElement("a");
      link.href = "#" + area.id;
      link.textContent = area.querySelector("h2").textContent;
      index.append(link);
    }
  }
  // Screenshots are taken at the page's viewport size; show them at half.
  for (const img of document.querySelectorAll(".shots img")) {
    const fit = () => img.naturalWidth && (img.style.width = img.naturalWidth / 2 + "px");
    img.complete ? fit() : img.addEventListener("load", fit);
  }

  const filter = document.querySelector(".filter");
  filter && filter.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-filter]");
    if (!b) return;
    document.body.dataset.filter = b.dataset.filter;
    for (const x of filter.children) x.setAttribute("aria-pressed", String(x === b));
  });
})();
</script>
</body></html>
```
