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
  const captions = viewports.length > 1 ? 28 : 0;
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
            (e.contentRect.width - 64) / totalWidth,
            (e.contentRect.height - 64 - captions) / maxHeight,
          ),
        ),
      ),
    );
    if (box.current) observer.observe(box.current);
    return () => observer.disconnect();
  }, [totalWidth, maxHeight, captions]);
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
      <div className="canvas fill" ref={box}>
        {frame(0, { width: "100%", height: "100%" })}
      </div>
    );
  return (
    <div className="canvas" ref={box}>
      <div className="frames" style={{ gap: GAP * scale }}>
        {viewports.map((v, index) => (
          <figure key={v.id} className="frame-slot">
            <div
              className="frame-space"
              style={{ width: v.width * scale, height: v.height * scale }}
            >
              {frame(index, {
                width: v.width,
                height: v.height,
                transform: `scale(${scale})`,
              })}
            </div>
            {captions > 0 && (
              <figcaption className="path">{v.label}</figcaption>
            )}
          </figure>
        ))}
      </div>
    </div>
  );
}
