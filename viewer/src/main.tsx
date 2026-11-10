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
  const [dark, setDark] = useState(false);
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
  return (
    <div className={"app " + (dark ? "dark" : "")}>
      <header>
        <button className="brand" onClick={() => update({ file: "" })}>
          <span className="logo">▤</span> Planchest{" "}
          <span className="tag">VIEWER</span>
        </button>
        <span className="project">{catalog?.name ?? "Design library"}</span>
        <div className="header-actions">
          <button onClick={() => setNav(!nav)} aria-pressed={nav}>
            Library
          </button>
          <button onClick={() => setDetails(!details)} aria-pressed={details}>
            Details
          </button>
          <button onClick={() => setDark(!dark)}>
            {dark ? "Light" : "Dark"}
          </button>
        </div>
      </header>
      <div className="workspace">
        {nav && (
          <nav aria-label="Design library">
            <div className="nav-head">
              <span className="eyebrow">WORKSPACE</span>
              <h2>Design library</h2>
              <input
                ref={search}
                aria-label="Search library"
                placeholder="Search library…  /"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <select
                aria-label="Filter status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="">Active · all statuses</option>
                {["draft", "review", "approved", "archived"].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
            <button
              className={"nav-item " + (!file ? "selected" : "")}
              onClick={() => update({ file: "" })}
            >
              Overview
            </button>
            {groups.map((group) => {
              const items = entries.filter((e) => e.kind === group);
              return (
                items.length > 0 && (
                  <section key={group}>
                    <h3>
                      {group}
                      <span>{items.length}</span>
                    </h3>
                    {items.map((e) => (
                      <button
                        className={
                          "nav-item " + (e.file === file ? "selected" : "")
                        }
                        key={e.file}
                        onClick={() => select(e.file)}
                        title={e.file}
                      >
                        <span className="file-icon">
                          {e.format === "html"
                            ? "▣"
                            : e.format === "markdown"
                              ? "≡"
                              : "◇"}
                        </span>
                        <span>
                          {e.title}
                          <small>{e.file.replace(group + "/", "")}</small>
                        </span>
                      </button>
                    ))}
                  </section>
                )
              );
            })}
            {!entries.length && (
              <p className="muted padded">No matching files.</p>
            )}
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
              <span className="eyebrow">YOUR DESIGN WORKSPACE</span>
              <h1>Every idea, in view.</h1>
              <p className="muted">
                Explore screens, understand decisions, and inspect the details.
              </p>
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
                        <span>{g}</span>
                        <strong>{count}</strong>
                        <small>Explore collection →</small>
                      </button>
                    )
                  );
                })}
              </div>
              <p className="muted">
                Snapshot generated{" "}
                {new Date(catalog.generatedAt).toLocaleString()}. Rerun
                planchest view to refresh.
              </p>
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
              <div className="titlebar">
                <div>
                  <span className="eyebrow">{entry.kind}</span>
                  <h1>{entry.title}</h1>
                  <small className="path">{entry.file}</small>
                </div>
                <a
                  className="button"
                  href={asset(entry.file)}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open original ↗
                </a>
              </div>
              {entry.format === "html" ? (
                <>
                  <div className="toolbar">
                    <label>
                      Viewport{" "}
                      <select
                        value={viewport}
                        onChange={(e) => update({ viewport: e.target.value })}
                      >
                        {viewports.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.label}
                          </option>
                        ))}
                        {compareSet.length > 1 && (
                          <option value="compare">Compare</option>
                        )}
                        <option value="fill">Fill</option>
                      </select>
                    </label>
                    {shown.length === 1 && viewport !== "fill" && (
                      <span className="path">
                        {shown[0].width} × {shown[0].height}
                      </span>
                    )}
                    <label>
                      Zoom{" "}
                      <select
                        disabled={viewport === "fill"}
                        value={zoom}
                        onChange={(e) => update({ zoom: e.target.value })}
                      >
                        <option value="fit">Fit</option>
                        {[1, 0.75, 0.5].map((n) => (
                          <option key={n} value={n}>
                            {n * 100}%
                          </option>
                        ))}
                      </select>
                    </label>
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
                    <span className="muted">Isolated preview</span>
                  </div>
                  <Preview
                    entry={entry}
                    viewports={shown}
                    fill={viewport === "fill"}
                    zoom={zoom}
                    onFrames={(list) => (frames.current = list)}
                    onFrameLoad={restoreControls}
                  />
                </>
              ) : entry.format === "markdown" ? (
                <div className="doc-scroll">
                  <Document file={entry.file} onSelect={select} isEntry={isEntry} />
                </div>
              ) : (
                <div className="canvas">
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
          <aside>
            <div className="aside-heading">
              <h2>Details</h2>
              <button
                onClick={() => setDetails(false)}
                aria-label="Close details"
              >
                ×
              </button>
            </div>
            {!entry.file.split("/").includes("prototypes") && (
              <>
                <span className="eyebrow">STATUS</span>
                <p>
                  <span className="badge">{entry.status ?? "Unspecified"}</span>
                </p>
              </>
            )}
            {entry.sections.length > 0 && (
              <>
                <h3>Sections</h3>
                <p className="muted">{entry.sections.join(" · ")}</p>
              </>
            )}
            {entry.spec ? (
              <>
                <h3>Specification</h3>
                <Document file={entry.spec} onSelect={select} isEntry={isEntry} />
              </>
            ) : (
              <p className="muted">No adjacent specification.</p>
            )}
            {entry.format === "html" && (
              <p className="notice">
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
