// A page's state machine, as the page reports it to the Viewer.
//
//   page → Viewer  { type: "planchest:machine", states, transitions, presets,
//                    fields, state, context }
//   Viewer → page  { type: "planchest:state", state, context, restore? }
//
// The page only has to render a (state, context) snapshot; the Viewer works
// out transitions and presets itself and sends back the whole snapshot. This
// module has no Node or DOM dependencies, so the Viewer and `planchest shots`
// share it.

export type Context = Record<string, unknown>;

export interface MachineState {
  id: string;
  label?: string;
  description?: string;
}

export interface Transition {
  event: string;
  label?: string;
  /** State ids the event can fire from; empty means every state. */
  from: string[];
  to: string;
  /** Merged into the context when the event fires. */
  context?: Context;
}

/** A named snapshot. Its context is merged over the page's default context. */
export interface Preset {
  name: string;
  label?: string;
  description?: string;
  state?: string;
  context?: Context;
}

/** How the Viewer edits one context key. Keys without one are edited by value type. */
export interface Field {
  label?: string;
  description?: string;
  options?: { value: string; label?: string }[];
}

export interface Snapshot {
  state: string;
  context: Context;
}

export interface Machine extends Snapshot {
  states: MachineState[];
  transitions: Transition[];
  presets: Preset[];
  fields: Record<string, Field>;
}

const ID = /^[\w.:-]+$/;
const text = (v: unknown) => (typeof v === "string" ? v : undefined);
const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

/** The machine in a `planchest:machine` message, or undefined for any other data. */
export function readMachine(data: unknown): Machine | undefined {
  if (!isObject(data) || data.type !== "planchest:machine" || !Array.isArray(data.states)) return;
  const states: MachineState[] = data.states.flatMap((s: unknown) => {
    const id = typeof s === "string" ? s : isObject(s) ? text(s.id) : undefined;
    if (!id || !ID.test(id)) return [];
    return isObject(s)
      ? [{ id, label: text(s.label), description: text(s.description) }]
      : [{ id }];
  });
  if (!states.length) return;
  const known = new Set(states.map((s) => s.id));
  const transitions: Transition[] = (Array.isArray(data.transitions) ? data.transitions : []).flatMap(
    (t: unknown) => {
      if (!isObject(t)) return [];
      const event = text(t.event), to = text(t.to);
      if (!event || !to || !known.has(to)) return [];
      const from = (t.from === undefined || t.from === "*" ? [] : [t.from].flat()).filter(
        (f): f is string => typeof f === "string" && known.has(f),
      );
      if (t.from !== undefined && t.from !== "*" && !from.length) return [];
      return [{ event, label: text(t.label), from, to, context: isObject(t.context) ? t.context : undefined }];
    },
  );
  const presets: Preset[] = (Array.isArray(data.presets) ? data.presets : []).flatMap((p: unknown) => {
    if (!isObject(p)) return [];
    const name = text(p.name), state = text(p.state);
    if (!name || (state !== undefined && !known.has(state))) return [];
    return [{
      name,
      label: text(p.label),
      description: text(p.description),
      state,
      context: isObject(p.context) ? p.context : undefined,
    }];
  });
  const fields: Record<string, Field> = {};
  if (isObject(data.fields))
    for (const [key, f] of Object.entries(data.fields)) {
      if (!isObject(f)) continue;
      const options = Array.isArray(f.options)
        ? f.options.flatMap((o: unknown) => {
            const value = typeof o === "string" ? o : isObject(o) ? text(o.value) : undefined;
            return value === undefined ? [] : [{ value, label: isObject(o) ? text(o.label) : undefined }];
          })
        : undefined;
      fields[key] = { label: text(f.label), description: text(f.description), options };
    }
  const state = text(data.state);
  return {
    states,
    transitions,
    presets,
    fields,
    state: state && known.has(state) ? state : states[0].id,
    context: isObject(data.context) ? data.context : {},
  };
}

/** The transitions that can fire from `state`, in the order the page listed them. */
export function available(machine: Machine, state: string): Transition[] {
  return machine.transitions.filter((t) => !t.from.length || t.from.includes(state));
}

/** The snapshot after `event` fires, or undefined when it cannot fire from here. */
export function fire(machine: Machine, from: Snapshot, event: string): Snapshot | undefined {
  const t = available(machine, from.state).find((t) => t.event === event);
  if (!t) return;
  return { state: t.to, context: t.context ? { ...from.context, ...t.context } : from.context };
}

/** A preset's snapshot, starting from the page's defaults. */
export function applyPreset(defaults: Snapshot, preset: Preset): Snapshot {
  return {
    state: preset.state ?? defaults.state,
    context: { ...defaults.context, ...preset.context },
  };
}

/** JSON with object keys sorted, so equal values compare equal. */
export function stable(value: unknown): string {
  return JSON.stringify(value, (_, v) =>
    isObject(v) ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, v[k]])) : v,
  );
}

export function sameSnapshot(a: Snapshot, b: Snapshot): boolean {
  return a.state === b.state && stable(a.context) === stable(b.context);
}

/** The top-level context keys whose values differ from the defaults. */
export function changedContext(defaults: Context, context: Context): Context {
  const out: Context = {};
  for (const [k, v] of Object.entries(context))
    if (!(k in defaults) || stable(defaults[k]) !== stable(v)) out[k] = v;
  return out;
}

/** The preset a snapshot matches exactly, if any. */
export function matchingPreset(defaults: Snapshot, presets: Preset[], snapshot: Snapshot) {
  return presets.find((p) => sameSnapshot(applyPreset(defaults, p), snapshot));
}
