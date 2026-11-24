// The diff report page. `planchest diff` writes one self-contained copy of
// this page (built into report-dist/index.html) next to the two sides, `a/`
// and `b/`, and fills in the embedded JSON. If the diff skill has written
// `summary.html` next to it, the right panel shows that.
//
// Layout: three panels in a row. Left, the changed files; centre, the
// preview of the selected page on both sides; right, the summary. The left
// and right panels can be hidden, and the preview can be zoomed.

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { createRoot } from "react-dom/client";
import type { Report, SideInfo } from "../../../src/diff/report";
import type { PageDiff } from "../../../src/diff/compare";
import { PanelToggles, ScaledBox, Segmented, scaledSize } from "../shared/controls";
import type { Option } from "../shared/controls";
import { readStored, writeStored } from "../shared/storage";
import "../shared/base.css";
import "./report.css";

const report: Report = JSON.parse(document.getElementById("report")!.textContent!);
const cmp = report.comparison;
const sideLabel = (s: SideInfo) => s.label + (s.commit ? " @" + s.commit : "");

type Side = "a" | "b";
type Mode = "side" | "swipe" | "onion";
interface Selection {
  file: string;
  section: string | null;
  /** A state of the page's state machine: "default" or a preset name. */
  state?: string | null;
}

const modes: Option<Mode>[] = [
  { value: "side", label: "Side by side" },
  { value: "swipe", label: "Swipe" },
  { value: "onion", label: "Onionskin" },
];
const widths: Option<string>[] = ["375", "768", "1280"].map((w) => ({ value: w, label: w }));
const zooms: Option<string>[] = [
  { value: "50", label: "50%" },
  { value: "75", label: "75%" },
  { value: "100", label: "100%" },
  { value: "fit", label: "Fit", title: "Zoom so both sides fit the window" },
];
const GAP = 16;

/**
 * "#file", "#file:section" or "#file@state"; the sidebar writes each part
 * URL-encoded, summary links may not. Null when the hash names no known page.
 */
function readHash(): Selection | null {
  let raw = location.hash.slice(1);
  if (!raw) return null;
  let state: string | null = null;
  const at = raw.lastIndexOf("@");
  if (at >= 0) {
    try {
      const file = decodeURIComponent(raw.slice(0, at)), id = decodeURIComponent(raw.slice(at + 1));
      if (cmp.pages.find((p) => p.file === file)?.states?.some((s) => s.id === id)) {
        state = id;
        raw = raw.slice(0, at);
      }
    } catch {}
  }
  const i = raw.indexOf(":");
  let file: string, section: string | null;
  try {
    file = decodeURIComponent(i < 0 ? raw : raw.slice(0, i));
    section = i < 0 ? null : decodeURIComponent(raw.slice(i + 1)) || null;
  } catch {
    return null;
  }
  return cmp.pages.some((p) => p.file === file) ? { file, section, state } : null;
}

function writeHash(s: Selection) {
  history.replaceState(
    null,
    "",
    "#" +
      encodeURIComponent(s.file) +
      (s.section ? ":" + encodeURIComponent(s.section) : "") +
      (s.state ? "@" + encodeURIComponent(s.state) : ""),
  );
}

function initialSelection(): Selection | null {
  const first = cmp.pages.find((p) => p.change !== "unchanged") ?? cmp.pages[0];
  return readHash() ?? (first ? { file: first.file, section: null } : null);
}

function App() {
  const [panels, setPanels] = useState(() => ({
    nav: true,
    summary: true,
    ...readStored<Record<string, boolean>>("planchest.panels", {}),
  }));
  useEffect(() => writeStored("planchest.panels", panels), [panels]);
  const [summary, setSummary] = useState("");
  useEffect(() => {
    fetch("summary.html", { cache: "no-store" })
      .then((r) => (r.ok ? r.text() : ""))
      .then((html) => setSummary(html.trim() ? html : ""))
      .catch(() => {});
  }, []);

  const [selection, setSelection] = useState(initialSelection);
  // Summary links change the hash; the sidebar uses replaceState, which
  // fires no hashchange.
  useEffect(() => {
    const change = () => {
      const next = readHash();
      if (next) setSelection(next);
    };
    window.addEventListener("hashchange", change);
    return () => window.removeEventListener("hashchange", change);
  }, []);
  const select = (next: Selection) => {
    setSelection(next);
    writeHash(next);
  };

  return (
    <div className="app">
      <header>
        <h1>Planchest diff</h1>
        <div className="sides">
          <b>{sideLabel(report.a)}</b> → <b>{sideLabel(report.b)}</b>
        </div>
        <div className="counts">
          {(["added", "removed", "changed", "unchanged"] as const)
            .filter((k) => cmp.counts[k])
            .map((k) => (
              <span key={k} className={"count " + k}>
                {cmp.counts[k]} {k}
              </span>
            ))}
        </div>
        <PanelToggles
          panels={[
            {
              id: "nav",
              label: "Files",
              title: "Show or hide the file list",
              side: "left",
              open: panels.nav,
              toggle: () => setPanels((p) => ({ ...p, nav: !p.nav })),
            },
            {
              id: "summary",
              label: "Summary",
              title: "Show or hide the summary",
              side: "right",
              open: panels.summary,
              toggle: () => setPanels((p) => ({ ...p, summary: !p.summary })),
            },
          ]}
        />
      </header>
      <div className="workspace">
        {panels.nav && <FileList selection={selection} onSelect={select} />}
        <Stage selection={selection} />
        {panels.summary &&
          (summary ? (
            <aside dangerouslySetInnerHTML={{ __html: summary }} />
          ) : (
            <aside>
              <p className="none">
                No summary yet. The <code>diff</code> skill writes <code>summary.html</code> next to
                this page.
              </p>
            </aside>
          ))}
      </div>
    </div>
  );
}

function FileList({
  selection,
  onSelect,
}: {
  selection: Selection | null;
  onSelect: (selection: Selection) => void;
}) {
  const current = (file: string, section: string | null, state: string | null = null) =>
    selection?.file === file && selection.section === section && (selection.state ?? null) === state;
  const page = (p: PageDiff) => {
    const status = p.status && (p.status.b || p.status.a);
    return [
      <button
        key={p.file}
        className={"item " + p.change}
        title={p.title || p.file}
        aria-current={current(p.file, null)}
        onClick={() => onSelect({ file: p.file, section: null })}
      >
        {status && <span className="status">{status}</span>}
        {p.file.split("/").flatMap((part, i) => (i ? [<wbr key={i} />, "/" + part] : [part]))}
      </button>,
      ...(p.sections ?? []).map((s) => (
        <button
          key={p.file + "#" + s.id}
          className={"item section " + s.change}
          aria-current={current(p.file, s.id)}
          onClick={() => onSelect({ file: p.file, section: s.id })}
        >
          #{s.id}
        </button>
      )),
      // Only the states that look different; the rest are counted.
      ...(p.states ?? [])
        .filter((s) => s.change !== "unchanged")
        .map((s) => (
          <button
            key={p.file + "@" + s.id}
            className={"item section state " + s.change}
            aria-current={current(p.file, null, s.id)}
            title={s.label && s.label !== s.id ? s.id : undefined}
            onClick={() => onSelect({ file: p.file, section: null, state: s.id })}
          >
            @{s.label ?? s.id}
          </button>
        )),
      ...(p.states?.some((s) => s.change === "unchanged")
        ? [
            <div key={p.file + "@same"} className="same">
              {p.states.filter((s) => s.change === "unchanged").length} states look the same
            </div>,
          ]
        : []),
    ];
  };
  const groups = [
    ["changed", "Changed"],
    ["added", "Added"],
    ["removed", "Removed"],
  ] as const;
  const unchanged = cmp.pages.filter((p) => p.change === "unchanged");
  return (
    <nav aria-label="Changed files">
      {cmp.states?.skipped && (
        <p className="note" title={cmp.states.skipped}>
          States were not compared: Playwright or Chromium is missing.
        </p>
      )}
      {groups.map(([key, title]) => {
        const pages = cmp.pages.filter((p) => p.change === key);
        return (
          pages.length > 0 && (
            <section key={key}>
              <h2>{title}</h2>
              {pages.flatMap(page)}
            </section>
          )
        );
      })}
      {unchanged.length > 0 && (
        <details>
          <summary>
            <h2>Unchanged ({unchanged.length})</h2>
          </summary>
          {unchanged.flatMap(page)}
        </details>
      )}
      {cmp.files.length > 0 && (
        <details open>
          <summary>
            <h2>Other files ({cmp.files.length})</h2>
          </summary>
          <div className="files">
            {cmp.files.map((f) => (
              <div key={f.file} className={f.change}>
                {f.file}
              </div>
            ))}
          </div>
        </details>
      )}
      {!cmp.pages.length && <div className="empty">No pages on either side</div>}
    </nav>
  );
}

function Stage({ selection }: { selection: Selection | null }) {
  const [mode, setMode] = useState<Mode>("side");
  const [width, setWidth] = useState(1280);
  const [height, setHeight] = useState(800);
  const [zoom, setZoom] = useState(100);
  const [sync, setSync] = useState(true);
  const [split, setSplit] = useState(50);
  const [opacity, setOpacity] = useState(50);
  const stage = useRef<HTMLDivElement>(null);
  const custom = useRef<HTMLDetailsElement>(null);
  const frames = useRef<Partial<Record<Side, HTMLIFrameElement | null>>>({});
  const syncRef = useRef(sync);
  syncRef.current = sync;

  // The Custom menu closes on a click outside it or on Escape.
  useEffect(() => {
    const click = (e: MouseEvent) => {
      const menu = custom.current;
      if (menu?.open && !menu.contains(e.target as Node)) menu.open = false;
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape" && custom.current) custom.current.open = false;
    };
    document.addEventListener("click", click);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("click", click);
      document.removeEventListener("keydown", key);
    };
  }, []);

  const clampZoom = (percent: number) => Math.min(200, Math.max(10, Math.round(percent)));
  const pickZoom = (z: string) => {
    if (z !== "fit") return setZoom(Number(z));
    const avail = (stage.current?.clientWidth ?? 0) - 32;
    const needed = mode === "side" ? width * 2 + GAP : width;
    setZoom(clampZoom(Math.floor(((avail / needed) * 100) / 5) * 5));
  };

  const page = selection && cmp.pages.find((p) => p.file === selection.file);
  const exists = { a: page?.change !== "added", b: page?.change !== "removed" };
  const section = page?.sections?.find((s) => s.id === selection?.section);
  if (section) {
    exists.a &&= section.change !== "added";
    exists.b &&= section.change !== "removed";
  }
  const state = page?.states?.find((s) => s.id === selection?.state);
  if (state) {
    exists.a &&= !!state.a;
    exists.b &&= !!state.b;
  }

  // Hide every other `data-page` section, and mirror scrolling to the
  // other side while Sync scroll is on.
  const prepare = (side: Side) => {
    const iframe = frames.current[side];
    let doc: Document | null | undefined;
    try {
      doc = iframe?.contentDocument;
    } catch {
      return;
    }
    if (!doc || !iframe) return;
    // Show the selected state: the page renders the snapshot it is sent.
    const snap = state?.[side];
    if (snap)
      doc.defaultView?.postMessage(
        { type: "planchest:state", state: snap.state, context: snap.context },
        "*",
      );
    if (selection?.section) {
      const style = doc.createElement("style");
      style.textContent =
        'section[data-page]:not([data-page="' +
        selection.section.replace(/"/g, '\\"') +
        '"]) { display: none !important; }';
      doc.head.append(style);
    }
    const win = doc.defaultView!;
    win.addEventListener(
      "scroll",
      () => {
        if (!syncRef.current) return;
        const other = frames.current[side === "a" ? "b" : "a"];
        try {
          other?.contentWindow?.scrollTo(win.scrollX, win.scrollY);
        } catch {}
      },
      { passive: true },
    );
  };

  const scale = zoom / 100;
  const stageClass = ["stage", mode !== "side" && "overlay", mode !== "side" && mode]
    .filter(Boolean)
    .join(" ");
  const stageStyle = { "--split": split + "%", "--opacity": opacity / 100 } as CSSProperties;

  return (
    <section className="view">
      <div className="toolbar">
        <Segmented label="Compare mode" options={modes} value={mode} onChange={setMode} />
        <Segmented
          label="Viewport width"
          options={widths}
          value={String(width)}
          onChange={(w) => setWidth(Number(w))}
        />
        <details className="custom" ref={custom}>
          <summary title="Set width, height and zoom by hand">Custom</summary>
          <div className="menu">
            <label>
              Width{" "}
              <NumberInput min={200} max={4000} step={10} value={width} onChange={setWidth} />
            </label>
            <label>
              Height{" "}
              <NumberInput min={200} max={6000} step={10} value={height} onChange={setHeight} />
            </label>
            <label>
              Zoom{" "}
              <NumberInput
                min={10}
                max={200}
                step={5}
                value={zoom}
                commit
                onChange={(z) => setZoom(clampZoom(z))}
              />
            </label>
          </div>
        </details>
        <Segmented label="Zoom" options={zooms} value={String(zoom)} onChange={pickZoom} />
        <label>
          <input type="checkbox" checked={sync} onChange={(e) => setSync(e.target.checked)} /> Sync
          scroll
        </label>
        <label hidden={mode !== "swipe"}>
          Split{" "}
          <input
            type="range"
            min={0}
            max={100}
            value={split}
            onChange={(e) => setSplit(Number(e.target.value))}
          />
        </label>
        <label hidden={mode !== "onion"}>
          Opacity{" "}
          <input
            type="range"
            min={0}
            max={100}
            value={opacity}
            onChange={(e) => setOpacity(Number(e.target.value))}
          />
        </label>
        <span className="path">
          {selection &&
            selection.file +
              (selection.section ? " #" + selection.section : "") +
              (state ? " @" + (state.label ?? state.id) : "")}
        </span>
      </div>
      <div className={stageClass} style={stageStyle} ref={stage}>
        {!page ? (
          <div className="empty">Pick a page on the left</div>
        ) : (
          <div className="pair">
            {(["a", "b"] as const).map((side) => {
              const tag = (
                <span className="tag">
                  <b>{side.toUpperCase()}</b>
                  {sideLabel(report[side])}
                </span>
              );
              // A side without the page keeps the frame's size, so the
              // overlay modes still line up, with an unscaled note in it.
              if (!exists[side])
                return (
                  <div
                    key={side}
                    className="frame missing"
                    style={scaledSize(width, height, scale)}
                  >
                    {tag}
                    {side === "a" ? "Not in A" : "Not in B"}
                  </div>
                );
              return (
                <ScaledBox
                  key={side}
                  className="frame"
                  width={width}
                  height={height}
                  scale={scale}
                  overlay={tag}
                >
                  <iframe
                    // A new section needs a fresh load to hide the others.
                    key={selection.file + "#" + (selection.section ?? "") + "@" + (selection.state ?? "")}
                    ref={(el) => {
                      frames.current[side] = el;
                    }}
                    src={side + "/" + selection.file.split("/").map(encodeURIComponent).join("/")}
                    onLoad={() => prepare(side)}
                  />
                </ScaledBox>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

/**
 * A number field that keeps what the user is typing and reports valid
 * numbers. With `commit`, it reports only on change (blur or Enter).
 * On blur or Enter the field shows the value again, so a number the parent
 * clamped or an entry it ignored does not stay on screen.
 */
function NumberInput({
  value,
  onChange,
  commit,
  ...rest
}: {
  value: number;
  onChange: (n: number) => void;
  commit?: boolean;
  min: number;
  max: number;
  step: number;
}) {
  const [text, setText] = useState(String(value));
  // Bumped on blur and Enter; the parent's clamped value may equal the old one.
  const [settled, setSettled] = useState(0);
  // Before paint, so the typed number never flashes after Enter.
  useLayoutEffect(() => setText(String(value)), [value, settled]);
  const report = (raw: string) => {
    const n = Number(raw);
    if (raw && n) onChange(n);
  };
  const settle = () => {
    if (commit) report(text);
    setSettled((s) => s + 1);
  };
  return (
    <input
      type="number"
      {...rest}
      value={text}
      onChange={(e) => {
        setText(e.target.value);
        if (!commit) report(e.target.value);
      }}
      onBlur={settle}
      onKeyDown={(e) => {
        if (e.key === "Enter") settle();
      }}
    />
  );
}

createRoot(document.getElementById("root")!).render(<App />);
