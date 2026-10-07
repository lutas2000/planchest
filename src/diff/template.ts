// The report page. Kept as one string so the build has nothing to copy.
// The page reads its data from the embedded JSON and, if the diff skill
// has written `summary.html` next to it, shows that at the top.

export const TEMPLATE = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Planchest diff</title>
<style>
:root {
  --bg: #fafaf8; --fg: #1c1c1a; --muted: #6b6b66; --line: #e3e2dc; --panel: #ffffff;
  --accent: #2f5bea; --added: #1f8a4c; --removed: #c0392b; --changed: #b7791f;
  --sans: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --mono: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --bg: #161614; --fg: #ecece8; --muted: #9a9a93; --line: #2c2c29; --panel: #1f1f1c;
    --accent: #7c9bff; --added: #5ccc85; --removed: #ff7b6b; --changed: #e6b45a;
  }
}
* { box-sizing: border-box; }
html, body { height: 100%; }
body { margin: 0; background: var(--bg); color: var(--fg); font: 14px/1.45 var(--sans); display: grid; grid-template-rows: auto auto 1fr; }
header { display: flex; flex-wrap: wrap; gap: 8px 16px; align-items: baseline; padding: 10px 16px; border-bottom: 1px solid var(--line); background: var(--panel); }
header h1 { font-size: 15px; margin: 0; font-weight: 600; }
header .sides { font-family: var(--mono); font-size: 12px; color: var(--muted); }
header .sides b { color: var(--fg); font-weight: 600; }
header .counts { margin-left: auto; display: flex; gap: 10px; font-size: 12px; }
.count { padding: 1px 8px; border-radius: 999px; border: 1px solid var(--line); color: var(--muted); }
.count.added { color: var(--added); border-color: currentColor; }
.count.removed { color: var(--removed); border-color: currentColor; }
.count.changed { color: var(--changed); border-color: currentColor; }
#summary { padding: 0 16px; border-bottom: 1px solid var(--line); background: var(--panel); max-height: 40vh; overflow: auto; }
#summary:empty { display: none; }
#summary > * { max-width: 72ch; }
#summary h2 { font-size: 11px; text-transform: uppercase; letter-spacing: .06em; color: var(--muted); font-weight: 600; margin: 14px 0 4px; }
#summary p, #summary ul, #summary ol { margin: 0 0 10px; }
#summary ul, #summary ol { padding-left: 18px; }
#summary li + li { margin-top: 4px; }
#summary a { color: var(--accent); text-decoration: none; font-family: var(--mono); font-size: 12px; }
#summary a:hover { text-decoration: underline; }
#summary code { font-family: var(--mono); font-size: 12px; padding: 0 4px; border-radius: 4px; background: color-mix(in srgb, var(--fg) 8%, transparent); }
main { display: grid; grid-template-columns: 280px 1fr; min-height: 0; }
nav { border-right: 1px solid var(--line); overflow: auto; padding: 8px 0; background: var(--panel); }
nav h2 { font-size: 11px; text-transform: uppercase; letter-spacing: .06em; color: var(--muted); margin: 12px 16px 4px; font-weight: 600; }
nav h2:first-child { margin-top: 4px; }
nav button { display: block; width: 100%; text-align: left; border: 0; background: none; color: inherit; font: inherit; padding: 5px 16px 5px 28px; cursor: pointer; position: relative; word-break: break-all; }
nav button:hover { background: color-mix(in srgb, var(--accent) 8%, transparent); }
nav button[aria-current="true"] { background: color-mix(in srgb, var(--accent) 14%, transparent); }
nav button::before { content: ""; position: absolute; left: 14px; top: 11px; width: 7px; height: 7px; border-radius: 50%; background: var(--line); }
nav button.added::before { background: var(--added); }
nav button.removed::before { background: var(--removed); }
nav button.changed::before { background: var(--changed); }
nav button .status { float: right; font-size: 10px; color: var(--muted); border: 1px solid var(--line); border-radius: 4px; padding: 0 4px; margin-left: 6px; }
nav button.section { padding-left: 44px; font-family: var(--mono); font-size: 12px; }
nav button.section::before { left: 30px; }
nav details summary { cursor: pointer; list-style: none; }
nav details summary::-webkit-details-marker { display: none; }
nav details summary h2::after { content: " ▸"; }
nav details[open] summary h2::after { content: " ▾"; }
nav .files { padding: 0 16px 8px 28px; font-family: var(--mono); font-size: 11px; color: var(--muted); }
nav .files div { padding: 2px 0; word-break: break-all; }
nav .files .added { color: var(--added); } nav .files .removed { color: var(--removed); } nav .files .changed { color: var(--changed); }
section.view { display: grid; grid-template-rows: auto 1fr; min-height: 0; min-width: 0; }
.toolbar { display: flex; flex-wrap: wrap; gap: 6px 14px; align-items: center; padding: 8px 16px; border-bottom: 1px solid var(--line); font-size: 12px; }
.toolbar .group { display: inline-flex; border: 1px solid var(--line); border-radius: 6px; overflow: hidden; }
.toolbar .group button { border: 0; background: none; color: inherit; font: inherit; font-size: 12px; padding: 4px 10px; cursor: pointer; }
.toolbar .group button + button { border-left: 1px solid var(--line); }
.toolbar .group button[aria-pressed="true"] { background: var(--accent); color: #fff; }
.toolbar label { display: inline-flex; gap: 6px; align-items: center; color: var(--muted); }
.toolbar input[type=number] { width: 64px; font: inherit; padding: 2px 4px; border: 1px solid var(--line); border-radius: 4px; background: var(--panel); color: inherit; }
.toolbar .path { margin-left: auto; font-family: var(--mono); font-size: 12px; color: var(--muted); }
.stage { position: relative; overflow: auto; padding: 16px; }
.pair { position: relative; display: flex; gap: 16px; align-items: flex-start; width: max-content; margin: 0 auto; }
.frame { position: relative; flex: 0 0 auto; background: var(--panel); border: 1px solid var(--line); border-radius: 6px; overflow: hidden; }
.frame .tag { position: absolute; top: 0; left: 0; z-index: 2; font: 600 10px/1 var(--mono); padding: 4px 6px; background: var(--fg); color: var(--bg); border-bottom-right-radius: 6px; opacity: .85; pointer-events: none; }
.frame iframe { display: block; border: 0; background: #fff; }
.frame.missing { display: grid; place-items: center; color: var(--muted); font-size: 12px; }
.stage.overlay .pair .frame + .frame { position: absolute; top: 0; left: 0; }
.stage.overlay.swipe .frame + .frame { clip-path: inset(0 0 0 var(--split, 50%)); }
.stage.overlay.swipe .frame + .frame::after { content: ""; position: absolute; top: 0; bottom: 0; left: var(--split, 50%); width: 2px; background: var(--accent); }
.stage.overlay.onion .frame + .frame { opacity: var(--opacity, .5); }
.empty { color: var(--muted); padding: 40px; text-align: center; }
@media (max-width: 800px) { main { grid-template-columns: 1fr; } nav { max-height: 40vh; border-right: 0; border-bottom: 1px solid var(--line); } }
</style>
</head>
<body>
<header>
  <h1>Planchest diff</h1>
  <div class="sides"><b id="label-a"></b> → <b id="label-b"></b></div>
  <div class="counts" id="counts"></div>
</header>
<div id="summary"></div>
<main>
  <nav id="nav"></nav>
  <section class="view">
    <div class="toolbar">
      <div class="group" id="modes">
        <button data-mode="side" aria-pressed="true">Side by side</button>
        <button data-mode="swipe">Swipe</button>
        <button data-mode="onion">Onionskin</button>
      </div>
      <div class="group" id="viewports">
        <button data-w="375">375</button>
        <button data-w="768">768</button>
        <button data-w="1280" aria-pressed="true">1280</button>
        <button data-w="fit" title="Fit both sides in the window">Fit</button>
      </div>
      <label>width <input type="number" id="width" min="200" max="4000" step="10" value="1280"></label>
      <label>height <input type="number" id="height" min="200" max="6000" step="10" value="800"></label>
      <label><input type="checkbox" id="sync" checked> sync scroll</label>
      <label id="split-label" hidden>split <input type="range" id="split" min="0" max="100" value="50"></label>
      <label id="opacity-label" hidden>opacity <input type="range" id="opacity" min="0" max="100" value="50"></label>
      <span class="path" id="path"></span>
    </div>
    <div class="stage" id="stage"><div class="empty">Pick a page on the left.</div></div>
  </section>
</main>
<script id="report" type="application/json">__REPORT_JSON__</script>
<script>
(() => {
  const report = JSON.parse(document.getElementById("report").textContent);
  const cmp = report.comparison;
  const $ = (id) => document.getElementById(id);

  const sideLabel = (s) => s.label + (s.commit ? " @" + s.commit : "");
  $("label-a").textContent = sideLabel(report.a);
  $("label-b").textContent = sideLabel(report.b);
  $("counts").innerHTML = ["added", "removed", "changed", "unchanged"]
    .filter((k) => cmp.counts[k])
    .map((k) => '<span class="count ' + k + '">' + cmp.counts[k] + " " + k + "</span>").join("");

  fetch("summary.html", { cache: "no-store" }).then((r) => r.ok ? r.text() : "").then((html) => {
    $("summary").innerHTML = html;
  }).catch(() => {});

  // --- navigation -------------------------------------------------------
  const nav = $("nav");
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const groups = [["changed", "Changed"], ["added", "Added"], ["removed", "Removed"]];
  let html = "";
  for (const [key, title] of groups) {
    const pages = cmp.pages.filter((p) => p.change === key);
    if (!pages.length) continue;
    html += "<h2>" + title + "</h2>" + pages.map(pageButton).join("");
  }
  const unchanged = cmp.pages.filter((p) => p.change === "unchanged");
  if (unchanged.length) {
    html += "<details><summary><h2>Unchanged (" + unchanged.length + ")</h2></summary>" + unchanged.map(pageButton).join("") + "</details>";
  }
  if (cmp.files.length) {
    html += "<details open><summary><h2>Other files (" + cmp.files.length + ")</h2></summary><div class=\\"files\\">" +
      cmp.files.map((f) => '<div class="' + f.change + '">' + esc(f.file) + "</div>").join("") + "</div></details>";
  }
  if (!cmp.pages.length) html += '<div class="empty">No pages on either side.</div>';
  nav.innerHTML = html;

  function pageButton(p) {
    const st = p.status && (p.status.b || p.status.a);
    let out = '<button class="' + p.change + '" data-file="' + esc(p.file) + '" title="' + esc(p.title || p.file) + '">' +
      (st ? '<span class="status">' + esc(st) + "</span>" : "") + esc(p.file) + "</button>";
    for (const s of p.sections || []) {
      out += '<button class="section ' + s.change + '" data-file="' + esc(p.file) + '" data-section="' + esc(s.id) + '">#' + esc(s.id) + "</button>";
    }
    return out;
  }

  nav.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-file]");
    if (!b) return;
    show(b.dataset.file, b.dataset.section);
    history.replaceState(null, "", "#" + encodeURIComponent(b.dataset.file) + (b.dataset.section ? ":" + encodeURIComponent(b.dataset.section) : ""));
  });

  // --- stage --------------------------------------------------------------
  const stage = $("stage");
  const state = { mode: "side", width: 1280, height: 800, file: null, section: null };
  let frames = [];

  function show(file, section) {
    state.file = file; state.section = section || null;
    for (const b of nav.querySelectorAll("button[aria-current]")) b.removeAttribute("aria-current");
    const sel = 'button[data-file="' + CSS.escape(file) + '"]' + (section ? '[data-section="' + CSS.escape(section) + '"]' : ":not([data-section])");
    nav.querySelector(sel)?.setAttribute("aria-current", "true");
    $("path").textContent = file + (section ? " #" + section : "");

    const page = cmp.pages.find((p) => p.file === file);
    const exists = { a: page.change !== "added", b: page.change !== "removed" };
    if (section && page.sections) {
      const s = page.sections.find((x) => x.id === section);
      if (s) { exists.a = exists.a && s.change !== "added"; exists.b = exists.b && s.change !== "removed"; }
    }
    stage.innerHTML = "";
    const pair = document.createElement("div");
    pair.className = "pair";
    stage.append(pair);
    frames = ["a", "b"].map((side) => {
      const wrap = document.createElement("div");
      wrap.className = "frame";
      wrap.innerHTML = '<span class="tag">' + side.toUpperCase() + "</span>";
      if (!exists[side]) {
        wrap.classList.add("missing");
        wrap.append(side === "a" ? "not in A" : "not in B");
        pair.append(wrap);
        return { wrap, iframe: null };
      }
      const iframe = document.createElement("iframe");
      iframe.src = side + "/" + file.split("/").map(encodeURIComponent).join("/");
      iframe.addEventListener("load", () => prepare(iframe));
      wrap.append(iframe);
      pair.append(wrap);
      return { wrap, iframe };
    });
    applySize();
    applyMode();
  }

  function prepare(iframe) {
    let doc;
    try { doc = iframe.contentDocument; } catch { return; }
    if (!doc) return;
    if (state.section) {
      const style = doc.createElement("style");
      style.textContent = 'section[data-page]:not([data-page="' + state.section.replace(/"/g, '\\\\"') + '"]) { display: none !important; }';
      doc.head.append(style);
    }
    doc.defaultView.addEventListener("scroll", () => {
      if (!$("sync").checked) return;
      for (const f of frames) {
        if (!f.iframe || f.iframe === iframe) continue;
        try { f.iframe.contentWindow.scrollTo(doc.defaultView.scrollX, doc.defaultView.scrollY); } catch {}
      }
    }, { passive: true });
  }

  function applySize() {
    for (const f of frames) {
      f.wrap.style.width = state.width + "px";
      f.wrap.style.height = state.height + "px";
      if (f.iframe) { f.iframe.width = state.width; f.iframe.height = state.height; }
    }
  }

  function applyMode() {
    stage.classList.toggle("overlay", state.mode !== "side");
    stage.classList.toggle("swipe", state.mode === "swipe");
    stage.classList.toggle("onion", state.mode === "onion");
    $("split-label").hidden = state.mode !== "swipe";
    $("opacity-label").hidden = state.mode !== "onion";
    for (const b of $("modes").children) b.setAttribute("aria-pressed", String(b.dataset.mode === state.mode));
  }

  $("modes").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-mode]");
    if (b) { state.mode = b.dataset.mode; applyMode(); }
  });
  $("viewports").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-w]");
    if (!b) return;
    if (b.dataset.w === "fit") {
      const avail = stage.clientWidth - 32;
      $("width").value = Math.max(200, Math.floor(state.mode === "side" ? (avail - 16) / 2 : avail));
    } else {
      $("width").value = b.dataset.w;
    }
    $("width").dispatchEvent(new Event("input"));
  });
  $("width").addEventListener("input", () => {
    state.width = Number($("width").value) || state.width;
    for (const b of $("viewports").children) b.setAttribute("aria-pressed", String(b.dataset.w !== "fit" && Number(b.dataset.w) === state.width));
    applySize();
  });
  $("height").addEventListener("input", () => { state.height = Number($("height").value) || state.height; applySize(); });
  $("split").addEventListener("input", () => stage.style.setProperty("--split", $("split").value + "%"));
  $("opacity").addEventListener("input", () => stage.style.setProperty("--opacity", $("opacity").value / 100));

  // --- selection from the hash -------------------------------------------
  // "#file" or "#file:section"; the sidebar writes each part URL-encoded,
  // summary links may not. Returns false when the hash names no known page.
  function showHash() {
    const raw = location.hash.slice(1);
    if (!raw) return false;
    const i = raw.indexOf(":");
    let file, section;
    try {
      file = decodeURIComponent(i < 0 ? raw : raw.slice(0, i));
      section = i < 0 ? null : decodeURIComponent(raw.slice(i + 1)) || null;
    } catch { return false; }
    if (!cmp.pages.some((p) => p.file === file)) return false;
    // The sidebar updates the hash with replaceState (no hashchange), but skip
    // re-rendering anyway if the hash already matches what is on stage.
    if (file !== state.file || section !== state.section) show(file, section);
    return true;
  }
  window.addEventListener("hashchange", showHash);

  if (!showHash()) {
    const first = cmp.pages.find((p) => p.change !== "unchanged") || cmp.pages[0];
    if (first) show(first.file);
  }
})();
</script>
</body>
</html>
`;
