import { useEffect, useState } from "react";
import {
  applyPreset,
  available,
  changedContext,
  fire,
  matchingPreset,
  stable,
} from "../../src/machine";
import type { Context, Field, Machine, Snapshot } from "../../src/machine";

export interface Step {
  label: string;
  /** The snapshot before this step, which Back returns to. */
  before: Snapshot;
}

export type Commit = (snapshot: Snapshot, label: string, opts?: { coalesce?: boolean }) => void;

const stateLabel = (machine: Machine, id: string) =>
  machine.states.find((s) => s.id === id)?.label ?? id;

/** The preset select in the toolbar: Default, the page's presets, and Custom when none matches. */
export function PresetSelect({
  machine,
  defaults,
  current,
  onCommit,
}: {
  machine: Machine;
  defaults: Snapshot;
  current: Snapshot;
  onCommit: Commit;
}) {
  const match = matchingPreset(defaults, machine.presets, current);
  const isDefault = !match && stable(defaults) === stable(current);
  const value = match ? "p:" + match.name : isDefault ? "default" : "custom";
  return (
    <label>
      Preset{" "}
      <select
        value={value}
        onChange={(e) => {
          const v = e.target.value;
          if (v === "default") onCommit(defaults, "Default");
          const preset = machine.presets.find((p) => "p:" + p.name === v);
          if (preset) onCommit(applyPreset(defaults, preset), preset.label ?? preset.name);
        }}
      >
        <option value="default">Default</option>
        {machine.presets.map((p) => (
          <option key={p.name} value={"p:" + p.name}>
            {p.label ?? p.name}
          </option>
        ))}
        {value === "custom" && (
          <option value="custom" disabled>
            Custom
          </option>
        )}
      </select>
    </label>
  );
}

/** The Details panel's state machine: state, events, presets, context and history. */
export function StatePanel({
  machine,
  defaults,
  current,
  history,
  onCommit,
  onBack,
}: {
  machine: Machine;
  defaults: Snapshot;
  current: Snapshot;
  history: Step[];
  onCommit: Commit;
  onBack: () => void;
}) {
  const events = available(machine, current.state);
  const match = matchingPreset(defaults, machine.presets, current);
  const isDefault = stable(defaults) === stable(current);
  const description = machine.states.find((s) => s.id === current.state)?.description;
  return (
    <section className="machine" aria-label="State machine">
      <h2>State</h2>
      <div className="states" role="group" aria-label="States">
        {machine.states.map((s) => (
          <button
            key={s.id}
            aria-pressed={s.id === current.state}
            title={s.description ?? `Go to ${s.label ?? s.id} without an event`}
            onClick={() =>
              s.id !== current.state &&
              onCommit({ ...current, state: s.id }, `Go to ${s.label ?? s.id}`)
            }
          >
            {s.label ?? s.id}
          </button>
        ))}
      </div>
      {description && <p className="none">{description}</p>}

      <h2>Events</h2>
      {events.length ? (
        <div className="events">
          {events.map((t) => (
            <button
              key={t.event + t.to}
              onClick={() => {
                const next = fire(machine, current, t.event);
                if (next) onCommit(next, t.label ?? t.event);
              }}
            >
              <span>{t.label ?? t.event}</span>
              <small>→ {stateLabel(machine, t.to)}</small>
            </button>
          ))}
        </div>
      ) : (
        <p className="none">No events leave {stateLabel(machine, current.state)}</p>
      )}

      <h2>Presets</h2>
      <div className="presets">
        <button aria-pressed={isDefault} onClick={() => onCommit(defaults, "Default")}>
          <span>Default</span>
          <small>{stateLabel(machine, defaults.state)}</small>
        </button>
        {machine.presets.map((p) => (
          <button
            key={p.name}
            aria-pressed={match === p && !isDefault}
            title={p.description}
            onClick={() => onCommit(applyPreset(defaults, p), p.label ?? p.name)}
          >
            <span>{p.label ?? p.name}</span>
            <small>{stateLabel(machine, p.state ?? defaults.state)}</small>
          </button>
        ))}
      </div>

      <ContextEditor
        fields={machine.fields}
        defaults={defaults}
        current={current}
        onCommit={onCommit}
      />

      <h2>
        History
        {history.length > 0 && (
          <button className="link" onClick={onBack} title="Undo the last step">
            Back
          </button>
        )}
      </h2>
      {history.length ? (
        <ol className="history">
          {history
            .slice(-8)
            .reverse()
            .map((h, i) => (
              <li key={history.length - i}>
                {h.label}
                <small>from {stateLabel(machine, h.before.state)}</small>
              </li>
            ))}
        </ol>
      ) : (
        <p className="none">Events, presets and edits are listed here</p>
      )}
    </section>
  );
}

function ContextEditor({
  fields,
  defaults,
  current,
  onCommit,
}: {
  fields: Record<string, Field>;
  defaults: Snapshot;
  current: Snapshot;
  onCommit: Commit;
}) {
  const [json, setJson] = useState<string>();
  const [copied, setCopied] = useState<string>();
  // An open JSON editor follows changes made elsewhere (events, presets, the page).
  const outside = stable(current.context);
  useEffect(() => {
    setCopied(undefined);
    setJson((text) => {
      if (text === undefined) return text;
      try {
        if (stable(JSON.parse(text)) === outside) return text;
      } catch {}
      return JSON.stringify(current.context, null, 2);
    });
  }, [outside, current.state]);
  const changed = changedContext(defaults.context, current.context);
  const keys = [...new Set([...Object.keys(defaults.context), ...Object.keys(current.context)])];
  const set = (key: string, value: unknown) =>
    onCommit(
      { ...current, context: { ...current.context, [key]: value } },
      `Edit ${fields[key]?.label ?? key}`,
      { coalesce: true },
    );
  const preset = JSON.stringify(
    {
      name: "New preset",
      ...(current.state !== defaults.state && { state: current.state }),
      ...(Object.keys(changed).length > 0 && { context: changed }),
    },
    null,
    2,
  );
  const copy = () =>
    navigator.clipboard
      .writeText(preset)
      .then(() => setCopied("Copied"))
      .catch(() => setCopied(preset));
  return (
    <>
      <h2>
        Context
        <button
          className="link"
          onClick={() => setJson(json === undefined ? JSON.stringify(current.context, null, 2) : undefined)}
        >
          {json === undefined ? "Edit as JSON" : "Edit as fields"}
        </button>
      </h2>
      {json !== undefined ? (
        <JsonEditor
          value={json}
          onChange={setJson}
          onApply={(context) => {
            onCommit({ ...current, context }, "Edit context");
            setJson(JSON.stringify(context, null, 2));
          }}
        />
      ) : keys.length ? (
        <div className="fields">
          {keys.map((key) => (
            <FieldRow
              key={key}
              name={key}
              field={fields[key]}
              value={current.context[key]}
              changed={key in changed}
              onChange={(v) => set(key, v)}
              onReset={() =>
                onCommit(
                  { ...current, context: { ...current.context, [key]: defaults.context[key] } },
                  `Reset ${fields[key]?.label ?? key}`,
                )
              }
            />
          ))}
        </div>
      ) : (
        <p className="none">This page reports no context</p>
      )}
      <p className="actions">
        <button onClick={copy} title="Copy this state as a preset to paste into the page">
          Copy as preset
        </button>
        {copied === "Copied" && <span className="none">Copied</span>}
      </p>
      {copied && copied !== "Copied" && (
        <textarea className="json" readOnly value={copied} aria-label="Preset JSON" />
      )}
    </>
  );
}

function FieldRow({
  name,
  field,
  value,
  changed,
  onChange,
  onReset,
}: {
  name: string;
  field?: Field;
  value: unknown;
  changed: boolean;
  onChange: (value: unknown) => void;
  onReset: () => void;
}) {
  const label = field?.label ?? name;
  let input;
  if (field?.options?.length) {
    const values = field.options.map((o) => o.value);
    input = (
      <select value={String(value ?? "")} onChange={(e) => onChange(e.target.value)}>
        {!values.includes(String(value ?? "")) && <option value={String(value ?? "")}>{String(value ?? "")}</option>}
        {field.options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label ?? o.value}
          </option>
        ))}
      </select>
    );
  } else if (typeof value === "boolean") {
    input = <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} />;
  } else if (typeof value === "number") {
    input = (
      <input
        type="number"
        value={value}
        step="any"
        onChange={(e) => e.target.value !== "" && onChange(Number(e.target.value))}
      />
    );
  } else if (typeof value === "string") {
    input = <input type="text" value={value} onChange={(e) => onChange(e.target.value)} />;
  } else {
    input = <InlineJson value={value} onChange={onChange} />;
  }
  return (
    <div className={"field" + (changed ? " changed" : "")}>
      <label title={field?.description ?? name}>
        <span>
          {label}
          {label !== name && <code>{name}</code>}
        </span>
        {input}
      </label>
      {changed && (
        <button className="link" onClick={onReset} title="Back to the page's default">
          Reset
        </button>
      )}
    </div>
  );
}

/** A JSON value (object, array, null) edited as text; applied when it parses. */
function InlineJson({ value, onChange }: { value: unknown; onChange: (v: unknown) => void }) {
  const [text, setText] = useState(() => JSON.stringify(value));
  const [error, setError] = useState(false);
  // Follow changes from elsewhere (a preset, Back) without fighting the typing.
  const outside = stable(value);
  useEffect(() => {
    let mine: string | undefined;
    try {
      mine = stable(JSON.parse(text));
    } catch {}
    if (mine !== outside) {
      setText(JSON.stringify(value));
      setError(false);
    }
  }, [outside]);
  return (
    <input
      type="text"
      className={"mono" + (error ? " invalid" : "")}
      aria-invalid={error}
      value={text}
      onChange={(e) => {
        setText(e.target.value);
        try {
          onChange(JSON.parse(e.target.value));
          setError(false);
        } catch {
          setError(true);
        }
      }}
    />
  );
}

function JsonEditor({
  value,
  onChange,
  onApply,
}: {
  value: string;
  onChange: (v: string) => void;
  onApply: (context: Context) => void;
}) {
  const [error, setError] = useState("");
  const apply = () => {
    try {
      const parsed = JSON.parse(value);
      if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed))
        throw Error("Context must be a JSON object");
      setError("");
      onApply(parsed);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };
  return (
    <div className="json-editor">
      <textarea
        className="json"
        aria-label="Context JSON"
        aria-invalid={!!error}
        spellCheck={false}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) apply();
        }}
      />
      {error && <p className="error">{error}</p>}
      <p className="actions">
        <button onClick={apply}>Apply</button>
        <span className="none">Keys you remove come back from the defaults</span>
      </p>
    </div>
  );
}
