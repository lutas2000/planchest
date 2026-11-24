import { useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import {Document} from "./Document";
import {Preview} from "./Preview";
import { PresetSelect, StatePanel } from "./StatePanel";
import type { Commit, Step } from "./StatePanel";
import { readMachine, readObject, sameSnapshot, changedContext, stable } from "../../src/machine";
import type { Context, Machine, Snapshot } from "../../src/machine";
import {asset} from "./paths";
import { PanelToggles, Segmented } from "./shared/controls";
import type { Option } from "./shared/controls";
import { readText, writeText } from "./shared/storage";
import type { Catalog, Entry, Viewport } from "../../src/viewer/index";
import "./shared/base.css";
import "./style.css";
const groups = [
  "prototypes",
  "concepts",
  "flows",
  "system",
  "documents",
  "decisions",
  "sources",
];
// Sentence case for collection and status names, which are lowercase ids.
const label = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
// Used when the design repo's planchest.json does not list viewports.
const defaultViewports: Viewport[] = [
  { id: "Mobile", label: "Mobile", width: 390, height: 844 },
  { id: "Small", label: "Small", width: 320, height: 568 },
  { id: "Tablet", label: "Tablet", width: 768, height: 1024 },
  { id: "Desktop", label: "Desktop", width: 1440, height: 900 },
];
// The state machine's snapshot lives in the Viewer hash as state=<id> and
// ctx=<JSON of the context keys that differ from the page's defaults>.
const readContext = (raw: string | null): Context => (raw && readObject(raw)) || {};
// What a page's machine is, apart from its current snapshot.
const definition = (m: Machine) =>
  stable({ states: m.states, transitions: m.transitions, presets: m.presets, fields: m.fields });
// How long after a snapshot is sent a different report still counts as its echo.
const ECHO_WINDOW = 1000;
// How long before a reload's load event its first report may arrive.
const RELOAD_WINDOW = 3000;
function readRoute() {
  return new URLSearchParams(location.hash.slice(1));
}
function App() {
  const [catalog, setCatalog] = useState<Catalog>();
  const [error, setError] = useState("");
  const [route, setRoute] = useState(readRoute);
  const [query, setQuery] = useState("");
  // "" shows every active collection; "archived" shows archived files only.
  const [category, setCategory] = useState("");
  const [details, setDetails] = useState(innerWidth >= 1024);
  const [nav, setNav] = useState(innerWidth >= 768);
  // No choice stored: follow the system, as the diff report does.
  // Stored as a plain string ("dark"), not JSON, so earlier choices still read.
  const [theme, setTheme] = useState<string | null>(() => readText("planchest.theme"));
  const [systemDark, setSystemDark] = useState(
    () => matchMedia("(prefers-color-scheme: dark)").matches,
  );
  useEffect(() => {
    const media = matchMedia("(prefers-color-scheme: dark)");
    const change = () => setSystemDark(media.matches);
    media.addEventListener("change", change);
    return () => media.removeEventListener("change", change);
  }, []);
  useEffect(() => {
    if (theme) document.documentElement.dataset.theme = theme;
    else delete document.documentElement.dataset.theme;
    if (theme) writeText("planchest.theme", theme);
  }, [theme]);
  const dark = theme ? theme === "dark" : systemDark;
  const search = useRef<HTMLInputElement>(null);
  // The page's state machine, the snapshot it reported first after loading
  // (its defaults) and the steps taken since, for Back.
  const [machine, setMachine] = useState<Machine>();
  const [defaults, setDefaults] = useState<Snapshot>();
  const [steps, setSteps] = useState<Step[]>([]);
  const frames = useRef<(HTMLIFrameElement | null)[]>([]);
  // Per frame: the snapshot it last reported or was sent, and snapshots sent
  // but not yet echoed back (with when), so a late echo is not taken for a change.
  const known = useRef(new WeakMap<HTMLIFrameElement, string>());
  const pending = useRef(new WeakMap<HTMLIFrameElement, { key: string; at: number }[]>());
  // Per frame: how often it has loaded, its last report and the machine it
  // reported first, so a reload or a link followed inside the frame is told
  // apart from a step the page took. `pageMove` is the last such step.
  const loads = useRef(new WeakMap<HTMLIFrameElement, number>());
  const lastReport = useRef(new WeakMap<HTMLIFrameElement, { machine: Machine; key: string }>());
  const pageDef = useRef(new WeakMap<HTMLIFrameElement, string>());
  const pageMove = useRef<{ frame: HTMLIFrameElement; key: string; before: Snapshot; at: number } | undefined>(undefined);
  const routeRef = useRef(route);
  routeRef.current = route;
  const defaultsRef = useRef(defaults);
  defaultsRef.current = defaults;
  useEffect(() => {
    fetch("catalog.json")
      .then((r) => {
        if (!r.ok) throw Error("Catalog unavailable");
        return r.json();
      })
      .then(setCatalog)
      .catch((e) =>
        setError(
          location.protocol === "file:"
            ? "Serve this directory over HTTP with planchest serve."
            : e.message,
        ),
      );
    const change = () => setRoute(readRoute());
    window.addEventListener("hashchange", change);
    const key = (e: KeyboardEvent) => {
      if (
        e.key === "/" &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement)
      ) {
        e.preventDefault();
        search.current?.focus();
      }
      if (e.key === "Escape") {
        search.current?.blur();
        setDetails(false);
      }
    };
    window.addEventListener("keydown", key);
    return () => {
      window.removeEventListener("hashchange", change);
      window.removeEventListener("keydown", key);
    };
  }, []);
  const update = (values: Record<string, string>, opts: { replace?: boolean } = {}) => {
    const next = new URLSearchParams(routeRef.current);
    for (const [k, v] of Object.entries(values)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    // Keep the route current at once, so a page report that arrives before
    // hashchange compares against the new snapshot.
    routeRef.current = next;
    if (opts.replace) history.replaceState(null, "", "#" + next.toString());
    else location.hash = next.toString();
    setRoute(next);
  };
  const select = (file: string) => {
    update({ file, state: "", ctx: "" });
    if (innerWidth < 768) setNav(false);
  };
  const file = route.get("file"),
    entry = catalog?.entries.find((e) => e.file === file);
  useEffect(() => {
    setMachine(undefined);
    defaultsRef.current = undefined;
    setDefaults(undefined);
    setSteps([]);
    pageMove.current = undefined;
  }, [file]);
  // The snapshot the hash describes, on top of the page's defaults.
  const snapshotOf = (r: URLSearchParams, d: Snapshot, m?: Machine): Snapshot => {
    const state = r.get("state");
    return {
      state: state && (!m || m.states.some((s) => s.id === state)) ? state : d.state,
      context: { ...d.context, ...readContext(r.get("ctx")) },
    };
  };
  const current = defaults && snapshotOf(route, defaults, machine);
  const send = (frame: HTMLIFrameElement, snap: Snapshot, restore?: boolean) => {
    const key = stable(snap);
    if (known.current.get(frame) === key) return;
    known.current.set(frame, key);
    pending.current.set(
      frame,
      [...(pending.current.get(frame) ?? []), { key, at: performance.now() }].slice(-20),
    );
    frame.contentWindow?.postMessage(
      { type: "planchest:state", state: snap.state, context: snap.context, ...(restore && { restore }) },
      "*",
    );
  };
  const write = (snap: Snapshot, d: Snapshot, opts: { replace?: boolean } = {}) => {
    const ctx = changedContext(d.context, snap.context);
    update(
      {
        state: snap.state === d.state ? "" : snap.state,
        ctx: Object.keys(ctx).length ? JSON.stringify(ctx) : "",
      },
      opts,
    );
  };
  const commit: Commit = (snap, label, opts = {}) => {
    const d = defaultsRef.current;
    if (!d) return;
    const before = snapshotOf(routeRef.current, d);
    if (sameSnapshot(before, snap)) return;
    pageMove.current = undefined;
    // Typing in one field is one step, not one per keystroke.
    setSteps((h) =>
      opts.coalesce && h.at(-1)?.label === label ? h : [...h, { label, before }].slice(-50),
    );
    write(snap, d, { replace: opts.coalesce });
  };
  const back = () => {
    const d = defaultsRef.current, last = steps.at(-1);
    if (!d || !last) return;
    pageMove.current = undefined;
    setSteps((h) => h.slice(0, -1));
    write(last.before, d);
  };
  // A frame that loads again has a new document, which starts from its own
  // first snapshot. Its first report usually arrives before the load event
  // and so looks like a step the page took; take that step back, then hand
  // the frame the hash's snapshot as on a first load. A different machine
  // means a link inside the frame led to another page: start over from it.
  const frameLoaded = (frame: HTMLIFrameElement) => {
    const n = (loads.current.get(frame) ?? 0) + 1;
    loads.current.set(frame, n);
    if (n === 1) return;
    known.current.delete(frame);
    pending.current.delete(frame);
    const report = lastReport.current.get(frame), d = defaultsRef.current;
    if (!report || !d) return;
    const def = definition(report.machine);
    const reported = { state: report.machine.state, context: report.machine.context };
    if (def !== pageDef.current.get(frame)) {
      pageDef.current.set(frame, def);
      known.current.set(frame, report.key);
      pageMove.current = undefined;
      defaultsRef.current = reported;
      setDefaults(reported);
      setSteps([]);
      update({ state: "", ctx: "" }, { replace: true });
      return;
    }
    const move = pageMove.current;
    let want = snapshotOf(routeRef.current, d, report.machine);
    if (
      move?.frame === frame &&
      move.key === report.key &&
      move.key === stable(d) &&
      performance.now() - move.at < RELOAD_WINDOW
    ) {
      pageMove.current = undefined;
      setSteps((h) => h.slice(0, -1));
      write(move.before, d, { replace: true });
      want = move.before;
    }
    send(frame, want, true);
  };
  useEffect(() => {
    const receive = (event: MessageEvent) => {
      const frame = frames.current.find((f) => f && f.contentWindow === event.source);
      const m = frame && readMachine(event.data);
      if (!frame || !m) return;
      setMachine(m);
      const reported: Snapshot = { state: m.state, context: m.context };
      const key = stable(reported);
      lastReport.current.set(frame, { machine: m, key });
      if (!pageDef.current.has(frame)) pageDef.current.set(frame, definition(m));
      let d = defaultsRef.current;
      if (!d) {
        // The first report after a page loads is its default.
        d = defaultsRef.current = reported;
        setDefaults(reported);
      }
      const fresh = !known.current.has(frame);
      known.current.set(frame, key);
      const want = snapshotOf(routeRef.current, d, m);
      if (sameSnapshot(want, reported)) {
        pending.current.delete(frame);
        return;
      }
      // A newly loaded frame takes the snapshot kept in the hash.
      if (fresh) return send(frame, want, true);
      // An echo of something the Viewer sent earlier is not a change. A page
      // may report back a little more or less than it was sent (a value it
      // rounds, a key it works out), so the next report soon after a send
      // counts as that send's echo even when it differs.
      const sent = pending.current.get(frame) ?? [];
      const at = sent.findIndex((s) => s.key === key);
      if (at >= 0) {
        pending.current.set(frame, sent.slice(at + 1));
        return;
      }
      if (sent.length && performance.now() - sent[0].at < ECHO_WINDOW) {
        pending.current.set(frame, sent.slice(1));
        return;
      }
      pending.current.delete(frame);
      // Otherwise the page moved by itself, such as a tap on its own button.
      const before = want;
      pageMove.current = { frame, key, before, at: performance.now() };
      setSteps((h) => [...h, { label: "In the page", before }].slice(-50));
      write(reported, d);
    };
    window.addEventListener("message", receive);
    return () => window.removeEventListener("message", receive);
  }, []);
  // Every frame shows the hash's snapshot: after a commit, Back, a page's own
  // change (the other frames follow) and browser history.
  const currentKey = current && stable(current);
  useEffect(() => {
    if (!current) return;
    for (const frame of frames.current) if (frame && known.current.has(frame)) send(frame, current);
  }, [currentKey]);
  const viewports = catalog?.viewer?.viewports ?? defaultViewports;
  const byId = (id: string) => viewports.find((v) => v.id === id);
  const fallback = byId(catalog?.viewer?.default ?? "") ?? viewports[0];
  const compareSet = (catalog?.viewer?.compare ?? viewports.map((v) => v.id))
    .map(byId)
    .filter((v): v is Viewport => !!v);
  const requested = route.get("viewport") ?? fallback.id;
  const viewport =
    requested === "compare" || requested === "fill" || byId(requested)
      ? requested
      : fallback.id;
  const shown =
    viewport === "compare" ? compareSet : [byId(viewport) ?? fallback];
  const zoom = route.get("zoom") ?? "fit";
  // Archived: moved under an archive/ directory or marked status: archived.
  const isArchived = (e: Entry) =>
    e.file.includes("/archive/") || e.status === "archived";
  const active = catalog?.entries.filter((e) => !isArchived(e)) ?? [];
  const isEntry = (f: string) => !!catalog?.entries.some((e) => e.file === f);
  const entries =
    catalog?.entries.filter(
      (e) =>
        (category === "archived"
          ? isArchived(e)
          : !isArchived(e) && (!category || e.kind === category)) &&
        `${e.title} ${e.file} ${e.status ?? ""} ${e.sections.join(" ")}`
          .toLowerCase()
          .includes(query.toLowerCase()),
    ) ?? [];
  const statuses = ["draft", "review", "approved"];
  const statusCounts = statuses
    .map((s) => [s, active.filter((e) => e.status === s).length] as const)
    .filter(([, n]) => n > 0);
  const zooms: Option<string>[] = [
    { value: "fit", label: "Fit" },
    { value: "1", label: "100%" },
    { value: "0.75", label: "75%" },
    { value: "0.5", label: "50%" },
  ];
  const viewportOptions: Option<string>[] = [
    ...viewports.map((v) => ({
      value: v.id,
      label: v.label,
      title: `${v.width} × ${v.height}`,
    })),
    ...(compareSet.length > 1
      ? [{ value: "compare", label: "Compare", title: "Show several viewports side by side" }]
      : []),
    { value: "fill", label: "Fill", title: "Fill the window" },
  ];
  return (
    <div className="app">
      <header>
        <button className="brand" onClick={() => update({ file: "" })}>
          Planchest viewer
        </button>
        <div className="sides">
          <b>{catalog?.name ?? "Design library"}</b>
          {entry && <> / {entry.title}</>}
        </div>
        <div className="counts">
          {statusCounts.map(([s, n]) => (
            <span key={s} className={"count " + s}>
              {n} {s}
            </span>
          ))}
        </div>
        <PanelToggles
          panels={[
            {
              id: "nav",
              label: "Library",
              title: "Show or hide the library",
              side: "left",
              open: nav,
              toggle: () => setNav(!nav),
            },
            {
              id: "details",
              label: "Details",
              title: "Show or hide the details",
              side: "right",
              open: details,
              toggle: () => setDetails(!details),
            },
          ]}
        />
        <div className="group">
          <button
            onClick={() => setTheme(dark ? "light" : "dark")}
            title="Switch between light and dark"
          >
            {dark ? "Light" : "Dark"}
          </button>
        </div>
      </header>
      <div className="workspace">
        {nav && (
          <nav aria-label="Design library">
            <div className="search">
              <label>
                <input
                  type="search"
                  ref={search}
                  aria-label="Search library"
                  aria-keyshortcuts="/"
                  placeholder="Search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                <kbd aria-hidden="true">/</kbd>
              </label>
              <select
                aria-label="Filter collection"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">All collections</option>
                {groups
                  .filter((g) => active.some((e) => e.kind === g))
                  .map((g) => (
                    <option key={g} value={g}>
                      {label(g)}
                    </option>
                  ))}
                {catalog?.entries.some(isArchived) && (
                  <option value="archived">Archived</option>
                )}
              </select>
            </div>
            <button
              className="item"
              aria-current={!file}
              onClick={() => update({ file: "" })}
            >
              Overview
            </button>
            {groups.map((group) => {
              const items = entries.filter((e) => e.kind === group);
              return (
                items.length > 0 && (
                  <section key={group}>
                    <h2>
                      {label(group)}
                      <span>{items.length}</span>
                    </h2>
                    {items.map((e) => (
                      <button
                        className={"item " + (isArchived(e) ? "archived" : e.status ?? "")}
                        aria-current={e.file === file}
                        key={e.file}
                        onClick={() => select(e.file)}
                        title={e.file}
                      >
                        {e.status && <span className="status">{e.status}</span>}
                        {e.title}
                        <small>{e.file.replace(group + "/", "")}</small>
                      </button>
                    ))}
                  </section>
                )
              );
            })}
            {!entries.length && <p className="none">No matching files</p>}
          </nav>
        )}
        <main>
          {error ? (
            <div className="empty">
              <h1>Unable to open library</h1>
              <p>{error}</p>
            </div>
          ) : !catalog ? (
            <div className="empty">Loading library…</div>
          ) : !file ? (
            <div className="overview">
              <h1>{catalog.name}</h1>
              <p className="none">
                {active.length} files. Snapshot generated{" "}
                {new Date(catalog.generatedAt).toLocaleString()}; rerun{" "}
                <code>planchest view</code> to refresh.
              </p>
              <h2>Collections</h2>
              <div className="cards">
                {groups.map((g) => {
                  const count = active.filter((e) => e.kind === g).length;
                  return (
                    count > 0 && (
                      <button
                        key={g}
                        onClick={() => {
                          setQuery("");
                          setCategory("");
                          select(active.find((e) => e.kind === g)!.file);
                        }}
                      >
                        <span>{label(g)}</span>
                        <strong>{count}</strong>
                      </button>
                    )
                  );
                })}
              </div>
              {statusCounts.length > 0 && (
                <>
                  <h2>Status</h2>
                  <div className="counts">
                    {statusCounts.map(([s, n]) => (
                      <span key={s} className={"count " + s}>
                        {n} {s}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : !entry ? (
            <div className="empty">
              <h1>File not found</h1>
              <p>{file}</p>
              <button onClick={() => update({ file: "" })}>
                Return to overview
              </button>
            </div>
          ) : (
            <>
              <div className="toolbar">
                {entry.format === "html" && (
                  <>
                    <Segmented
                      label="Viewport"
                      options={viewportOptions}
                      value={viewport}
                      onChange={(v) => update({ viewport: v })}
                    />
                    {shown.length === 1 && viewport !== "fill" && (
                      <span className="dims">
                        {shown[0].width} × {shown[0].height}
                      </span>
                    )}
                    {viewport !== "fill" && (
                      <Segmented
                        label="Zoom"
                        options={zooms}
                        value={zoom}
                        onChange={(z) => update({ zoom: z })}
                      />
                    )}
                    {machine && defaults && current && (
                      <>
                        <PresetSelect
                          machine={machine}
                          defaults={defaults}
                          current={current}
                          onCommit={commit}
                        />
                        <button
                          className="state-chip"
                          title={details ? "The state machine is in Details" : "Show the state machine in Details"}
                          onClick={() => setDetails(true)}
                        >
                          {machine.states.find((s) => s.id === current.state)?.label ?? current.state}
                        </button>
                      </>
                    )}
                  </>
                )}
                <span className="where">
                  <span className="path">{entry.file}</span>
                  <a
                    className="open"
                    href={asset(entry.file)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open original ↗
                  </a>
                </span>
              </div>
              {entry.format === "html" ? (
                <Preview
                  entry={entry}
                  viewports={shown}
                  fill={viewport === "fill"}
                  zoom={zoom}
                  onFrames={(list) => (frames.current = list)}
                  onFrameLoad={frameLoaded}
                />
              ) : entry.format === "markdown" ? (
                <div className="doc-scroll">
                  <Document file={entry.file} onSelect={select} isEntry={isEntry} />
                </div>
              ) : (
                <div className="stage">
                  <img
                    className="image"
                    src={asset(entry.file)}
                    alt={entry.title}
                  />
                </div>
              )}
            </>
          )}
        </main>
        {details && entry && (
          <aside aria-label="Details">
            {entry.format === "html" && machine && defaults && current && (
              <StatePanel
                machine={machine}
                defaults={defaults}
                current={current}
                history={steps}
                onCommit={commit}
                onBack={back}
              />
            )}
            {!entry.file.split("/").includes("prototypes") && (
              <>
                <h2>Status</h2>
                <p>
                  <span className={"badge " + (entry.status ?? "")}>
                    {entry.status ?? "unspecified"}
                  </span>
                </p>
              </>
            )}
            {entry.sections.length > 0 && (
              <>
                <h2>Sections</h2>
                <p className="chips">
                  {entry.sections.map((s) => (
                    <span key={s} className="chip">
                      #{s}
                    </span>
                  ))}
                </p>
              </>
            )}
            <h2>Specification</h2>
            {entry.spec ? (
              <Document file={entry.spec} onSelect={select} isEntry={isEntry} />
            ) : (
              <p className="none">No adjacent specification</p>
            )}
            {entry.format === "html" && (
              <p className="none notice">
                Preview scripts run in isolation. If a prototype requires origin
                storage or data access, open the original page.
              </p>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
