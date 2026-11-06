import React, { useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import {Document} from "./Document";
import {Preview} from "./Preview";
import {asset} from "./paths";
import type { Catalog } from "../../src/viewer/index";
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
const presets: Record<string, [number, number]> = {
  Mobile: [390, 844],
  Small: [320, 568],
  Tablet: [768, 1024],
  Desktop: [1440, 900],
};
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
  const viewport = route.get("viewport") ?? "Mobile";
  const zoom = route.get("zoom") ?? "fit";
  const size = presets[viewport] ?? presets.Mobile;
  const entries =
    catalog?.entries.filter(
      (e) =>
        (status === "archived" ? true : !e.file.includes("/archive/")) &&
        (!status || e.status === status) &&
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
                  const count = catalog.entries.filter(
                    (e) => e.kind === g,
                  ).length;
                  return (
                    count > 0 && (
                      <button
                        key={g}
                        onClick={() => {
                          setQuery("");
                          select(
                            catalog.entries.find((e) => e.kind === g)!.file,
                          );
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
                        {Object.keys(presets).map((p) => (
                          <option key={p}>{p}</option>
                        ))}
                      </select>
                    </label>
                    <span className="path">
                      {size[0]} × {size[1]}
                    </span>
                    <label>
                      Zoom{" "}
                      <select
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
                    <span className="muted">Isolated preview</span>
                  </div>
                  <Preview entry={entry} size={size} zoom={zoom} />
                </>
              ) : entry.format === "markdown" ? (
                <div className="doc-scroll">
                  <Document file={entry.file} onSelect={select} />
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
            <span className="eyebrow">STATUS</span>
            <p>
              <span className="badge">{entry.status ?? "Unspecified"}</span>
            </p>
            {entry.sections.length > 0 && (
              <>
                <h3>Sections</h3>
                <p className="muted">{entry.sections.join(" · ")}</p>
              </>
            )}
            {entry.spec ? (
              <>
                <h3>Specification</h3>
                <Document file={entry.spec} onSelect={select} />
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
