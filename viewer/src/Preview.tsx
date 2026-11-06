import {useState,useEffect,useRef} from "react";
import type {Entry} from "../../src/viewer/index";
import {asset} from "./paths";
export function Preview({
  entry,
  size,
  zoom,
}: {
  entry: Entry;
  size: [number, number];
  zoom: string;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState(1);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    setLoaded(false);
  }, [entry.file]);
  useEffect(() => {
    const observer = new ResizeObserver(([e]) =>
      setFit(
        Math.max(
          0.05,
          Math.min(
            1,
            (e.contentRect.width - 64) / size[0],
            (e.contentRect.height - 64) / size[1],
          ),
        ),
      ),
    );
    if (box.current) observer.observe(box.current);
    return () => observer.disconnect();
  }, [size[0], size[1]]);
  const scale = zoom === "fit" ? fit : Number(zoom);
  return (
    <div className="canvas" ref={box}>
      <div
        className="frame-space"
        style={{ width: size[0] * scale, height: size[1] * scale }}
      >
        <div
          className="frame"
          style={{
            width: size[0],
            height: size[1],
            transform: `scale(${scale})`,
          }}
        >
          {!loaded && <span className="loading">Loading preview…</span>}
          <iframe
            key={entry.file}
            title={entry.title}
            src={asset(entry.file)}
            sandbox="allow-scripts allow-forms"
            onLoad={() => setLoaded(true)}
          />
        </div>
      </div>
    </div>
  );
}
