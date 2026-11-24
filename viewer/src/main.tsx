import React, { useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import {Document} from "./Document";
import {Preview} from "./Preview";
import type {PageControl} from "./Preview";
import {asset} from "./paths";
import type { Catalog, Entry, Viewport } from "../../src/viewer/index";
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
// Page control values live in the Viewer hash as c-<name>=<value>.
const controlKey = (name: string) => "c-" + name;
function readControls(data: unknown): PageControl[] | undefined {
  const d = data as { type?: unknown; controls?: unknown };
  if (d?.type !== "planchest:controls" || !Array.isArray(d.controls)) return;
  const text = (v: unknown) => (typeof v === "string" ? v : undefined);
  return d.controls.flatMap((c: any) => {
    const name = text(c?.name);
    if (!name || !/^[\w.-]+$/.test(name) || !Array.isArray(c.options)) return [];
    const options = c.options.flatMap((o: any) =>
      text(o?.value) !== undefined ? [{ value: o.value, label: text(o.label) }] : [],
    );
    return [{ name, label: text(c.label), value: text(c.value) ?? "", options }];
  });
}
function readRoute() {
  return new URLSearchParams(location.hash.slice(1));
}
function App() {
  const [catalog, setCatalog] = useState<Catalog>();
  const [error, setError] = useState("");
  const [route, setRoute] = useState(readRoute);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [details, setDetails] = useState(innerWidth >= 1024);
  const [nav, setNav] = useState(innerWidth >= 768);
  // No choice stored: follow the system, as the diff report does.
  const [theme, setTheme] = useState<string | null>(() => {
    try {
      return localStorage.getItem("planchest.theme");
    } catch {
      return null;
    }
  });
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
    try {
      if (theme) localStorage.setItem("planchest.theme", theme);
    } catch {}
  }, [theme]);
  const dark = theme ? theme === "dark" : systemDark;
  const search = useRef<HTMLInputElement>(null);
  const [controls, setControls] = useState<PageControl[]>([]);
  const frames = useRef<(HTMLIFrameElement | null)[]>([]);
  const routeRef = useRef(route);
  routeRef.current = route;
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
  useEffect(() => {
    const receive = (event: MessageEvent) => {
      const index = frames.current.findIndex(
        (f) => f && f.contentWindow === event.source,
      );
      const list = index < 0 ? undefined : readControls(event.data);
      // The first frame's report is what the toolbar shows.
      if (list && index === 0) setControls(list);
    };
    window.addEventListener("message", receive);
    return () => window.removeEventListener("message", receive);
  }, []);
  const update = (values: Record<string, string>) => {
    const next = new URLSearchParams(route);
    for (const [k, v] of Object.entries(values)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    location.hash = next.toString();
  };
  const select = (file: string) => {
    update({ file });
    if (innerWidth < 768) setNav(false);
  };
  const file = route.get("file"),
    entry = catalog?.entries.find((e) => e.file === file);
  useEffect(() => {
    setControls([]);
  }, [file]);
  // After each load, hand the frame the control values kept in the hash.
  // A page ignores names and values it does not offer.
  const restoreControls = (index: number) => {
    const target = frames.current[index]?.contentWindow;
    for (const [key, value] of routeRef.current)
      if (key.startsWith("c-"))
        target?.postMessage(
          { type: "planchest:set", name: key.slice(2), value, restore: true },
          "*",
        );
  };
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
  const setControl = (name: string, value: string) => {
    update({ [controlKey(name)]: value });
    setControls((list) =>
      list.map((c) => (c.name === name ? { ...c, value } : c)),
    );
    for (const frame of frames.current)
      frame?.contentWindow?.postMessage(
        { type: "planchest:set", name, value },
        "*",
      );
  };
  // Archived: moved under an archive/ directory or marked status: archived.
  const isArchived = (e: Entry) =>
    e.file.includes("/archive/") || e.status === "archived";
  const active = catalog?.entries.filter((e) => !isArchived(e)) ?? [];
  const isEntry = (f: string) => !!catalog?.entries.some((e) => e.file === f);
  const entries =
    catalog?.entries.filter(
      (e) =>
        (status === "archived"
          ? isArchived(e)
          : !isArchived(e) && (!status || e.status === status)) &&
        `${e.title} ${e.file} ${e.status ?? ""} ${e.sections.join(" ")}`
          .toLowerCase()
          .includes(query.toLowerCase()),
    ) ?? [];
  const statuses = ["draft", "review", "approved"];
  const statusCounts = statuses
    .map((s) => [s, active.filter((e) => e.status === s).length] as const)
    .filter(([, n]) => n > 0);
  const zooms = [
    ["fit", "Fit"],
    ["1", "100%"],
    ["0.75", "75%"],
    ["0.5", "50%"],
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
        <div className="group panels">
          <button
            data-panel="nav"
            onClick={() => setNav(!nav)}
            aria-pressed={nav}
            title="Show or hide the library"
          >
            Library
          </button>
          <button
            data-panel="details"
            onClick={() => setDetails(!details)}
            aria-pressed={details}
            title="Show or hide the details"
          >
            Details
          </button>
        </div>
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
              <input
                type="search"
                ref={search}
                aria-label="Search library"
                placeholder="Search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <select
                aria-label="Filter status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="">All active</option>
                {[...statuses, "archived"].map((s) => (
                  <option key={s} value={s}>
                    {label(s)}
                  </option>
                ))}
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
                          setStatus("");
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
                    <div className="group">
                      {viewports.map((v) => (
                        <button
                          key={v.id}
                          aria-pressed={viewport === v.id}
                          title={`${v.width} × ${v.height}`}
                          onClick={() => update({ viewport: v.id })}
                        >
                          {v.label}
                        </button>
                      ))}
                      {compareSet.length > 1 && (
                        <button
                          aria-pressed={viewport === "compare"}
                          title="Show several viewports side by side"
                          onClick={() => update({ viewport: "compare" })}
                        >
                          Compare
                        </button>
                      )}
                      <button
                        aria-pressed={viewport === "fill"}
                        title="Fill the window"
                        onClick={() => update({ viewport: "fill" })}
                      >
                        Fill
                      </button>
                    </div>
                    {shown.length === 1 && viewport !== "fill" && (
                      <span className="dims">
                        {shown[0].width} × {shown[0].height}
                      </span>
                    )}
                    {viewport !== "fill" && (
                      <div className="group">
                        {zooms.map(([z, label]) => (
                          <button
                            key={z}
                            aria-pressed={zoom === z}
                            onClick={() => update({ zoom: z })}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    )}
                    {controls.map((c) => (
                      <label key={c.name}>
                        {c.label ?? c.name}{" "}
                        <select
                          value={c.value}
                          onChange={(e) => setControl(c.name, e.target.value)}
                        >
                          {c.options.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label ?? o.value}
                            </option>
                          ))}
                        </select>
                      </label>
                    ))}
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
                  onFrameLoad={restoreControls}
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
