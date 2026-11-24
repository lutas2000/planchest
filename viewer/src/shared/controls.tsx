// Controls the Viewer and the diff report both use.
import type { ReactNode } from "react";

export interface Option<T extends string> {
  value: T;
  label: ReactNode;
  title?: string;
}

/** A row of buttons of which exactly one is pressed. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Accessible name for the group. */
  label?: string;
}) {
  return (
    <div className="group" role="group" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.value}
          aria-pressed={o.value === value}
          title={o.title}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export interface Panel {
  id: string;
  label: string;
  title: string;
  /** Which side of the window the panel sits on; draws the button's icon. */
  side: "left" | "right";
  open: boolean;
  toggle: () => void;
}

/** Header buttons that show or hide the side panels. */
export function PanelToggles({ panels }: { panels: Panel[] }) {
  return (
    <div className="group panels">
      {panels.map((p) => (
        <button
          key={p.id}
          data-panel={p.id}
          data-side={p.side}
          aria-pressed={p.open}
          title={p.title}
          onClick={p.toggle}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}

/**
 * A box that shows its content at `width` × `height` scaled by `scale`.
 * The content keeps its real size (so a page inside sees the real
 * viewport); the outer box takes the scaled size so the stage scrolls and
 * neighbouring boxes line up. Give the outer box a position in CSS so the
 * overlay sits on it.
 */
export function ScaledBox({
  width,
  height,
  scale,
  className,
  innerClassName,
  overlay,
  children,
}: {
  width: number;
  height: number;
  scale: number;
  className?: string;
  innerClassName?: string;
  /** Drawn over the content at its scaled size, such as a label. */
  overlay?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div
      className={className}
      style={{ width: Math.round(width * scale), height: Math.round(height * scale) }}
    >
      {overlay}
      <div
        className={innerClassName}
        style={{ width, height, transform: `scale(${scale})`, transformOrigin: "0 0" }}
      >
        {children}
      </div>
    </div>
  );
}
