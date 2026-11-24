import { useState, useEffect, useRef } from "react";
import type { CSSProperties } from "react";
import type { Entry, Viewport } from "../../src/viewer/index";
import { asset } from "./paths";

/** One control a previewed page offers, such as its locale or state. */
export interface PageControl {
  name: string;
  label?: string;
  value: string;
  options: { value: string; label?: string }[];
}

const GAP = 24;

/**
 * Renders one frame per viewport (several when comparing), or one frame that
 * fills the canvas. Pages talk to the Viewer with postMessage:
 *   page → Viewer  { type: "planchest:controls", controls: PageControl[] }
 *   Viewer → page  { type: "planchest:set", name, value, restore? }
 * `restore` marks values re-sent from the Viewer hash right after a load.
 */
export function Preview({
  entry,
  viewports,
  fill,
  zoom,
  onFrames,
  onFrameLoad,
}: {
  entry: Entry;
  viewports: Viewport[];
  fill: boolean;
  zoom: string;
  onFrames: (frames: (HTMLIFrameElement | null)[]) => void;
  onFrameLoad: (index: number) => void;
}) {
  const box = useRef<HTMLDivElement>(null);
  const frames = useRef<(HTMLIFrameElement | null)[]>([]);
  const [fit, setFit] = useState(1);
  const [loaded, setLoaded] = useState<Record<number, boolean>>({});
  const count = fill ? 1 : viewports.length;
  const totalWidth =
    viewports.reduce((sum, v) => sum + v.width, 0) +
    GAP * (viewports.length - 1);
  const maxHeight = Math.max(...viewports.map((v) => v.height));
  useEffect(() => {
    setLoaded({});
  }, [entry.file]);
  useEffect(() => {
    frames.current.length = count;
    onFrames(frames.current);
  });
  useEffect(() => {
    const observer = new ResizeObserver(([e]) =>
      setFit(
        Math.max(
          0.05,
          Math.min(
            1,
            (e.contentRect.width - 32) / totalWidth,
            (e.contentRect.height - 32) / maxHeight,
          ),
        ),
      ),
    );
    if (box.current) observer.observe(box.current);
    return () => observer.disconnect();
  }, [totalWidth, maxHeight]);
  const scale = zoom === "fit" ? fit : Number(zoom);
  const frame = (index: number, style: CSSProperties) => (
    <div className="frame" style={style}>
      {!loaded[index] && <span className="loading">Loading preview…</span>}
      <iframe
        key={entry.file}
        ref={(el) => {
          frames.current[index] = el;
        }}
        title={entry.title}
        src={asset(entry.file)}
        sandbox="allow-scripts allow-forms"
        onLoad={() => {
          setLoaded((l) => ({ ...l, [index]: true }));
          onFrameLoad(index);
        }}
      />
    </div>
  );
  if (fill)
    return (
      <div className="stage fill" ref={box}>
        {frame(0, { width: "100%", height: "100%" })}
      </div>
    );
  return (
    <div className="stage" ref={box}>
      <div className="frames" style={{ gap: GAP * scale }}>
        {viewports.map((v, index) => (
          <div
            key={v.id}
            className="frame-space"
            style={{ width: v.width * scale, height: v.height * scale }}
          >
            {viewports.length > 1 && (
              <span className="tag">
                <b>{v.label}</b>
                {v.width} × {v.height}
              </span>
            )}
            {frame(index, {
              width: v.width,
              height: v.height,
              transform: `scale(${scale})`,
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
