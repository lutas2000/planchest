import { test } from "node:test";
import assert from "node:assert/strict";
import {
  applyPreset,
  available,
  changedContext,
  fire,
  matchingPreset,
  readMachine,
  sameSnapshot,
  sameType,
} from "../src/machine.ts";
import { shotSnapshot } from "../src/shots.ts";

const report = {
  type: "planchest:machine",
  states: ["idle", { id: "active", label: "Active" }, { id: "bad id!" }],
  transitions: [
    { event: "START", from: "idle", to: "active", context: { started: true } },
    { event: "STOP", from: ["active"], to: "idle" },
    { event: "RESET", from: "*", to: "idle" },
    { event: "GHOST", from: "idle", to: "nowhere" },
    { event: "LOST", from: "nowhere", to: "idle" },
  ],
  presets: [
    { name: "busy", state: "active", context: { load: 9 } },
    { name: "broken", state: "nowhere" },
  ],
  fields: { load: { label: "Load", options: ["1", { value: "9", label: "Nine" }] } },
  state: "idle",
  context: { load: 1, started: false },
};

test("a machine report is read defensively", () => {
  const m = readMachine(report)!;
  assert.deepEqual(m.states.map((s) => s.id), ["idle", "active"]);
  assert.deepEqual(m.transitions.map((t) => t.event), ["START", "STOP", "RESET"]);
  assert.deepEqual(m.transitions[2].from, []);
  assert.deepEqual(m.presets.map((p) => p.name), ["busy"]);
  assert.deepEqual(m.fields.load.options, [{ value: "1", label: undefined }, { value: "9", label: "Nine" }]);
  assert.equal(readMachine({ type: "planchest:controls", controls: [] }), undefined);
  assert.equal(readMachine({ type: "planchest:machine", states: [] }), undefined);
  assert.equal(readMachine({ ...report, state: "nowhere" })!.state, "idle");
});

test("events, presets and diffs work on snapshots", () => {
  const m = readMachine(report)!;
  const defaults = { state: m.state, context: m.context };
  assert.deepEqual(available(m, "idle").map((t) => t.event), ["START", "RESET"]);
  const started = fire(m, defaults, "START")!;
  assert.deepEqual(started, { state: "active", context: { load: 1, started: true } });
  assert.equal(fire(m, defaults, "STOP"), undefined);
  const busy = applyPreset(defaults, m.presets[0]);
  assert.deepEqual(busy, { state: "active", context: { load: 9, started: false } });
  assert.equal(matchingPreset(defaults, m.presets, { state: "active", context: { started: false, load: 9 } }), m.presets[0]);
  assert.ok(sameSnapshot(busy, { state: "active", context: { started: false, load: 9 } }));
  assert.deepEqual(changedContext(defaults.context, { load: 1, started: true, extra: [1] }), { started: true, extra: [1] });
});

test("a screenshot's preset, state and context apply in that order", () => {
  const shot = { page: "p.html", out: "o.png", width: 1, height: 1 };
  assert.equal(shotSnapshot(shot, report), undefined);
  assert.deepEqual(shotSnapshot({ ...shot, preset: "busy", state: "idle", context: { load: 3 } }, report), {
    state: "idle",
    context: { load: 3, started: false },
  });
  assert.throws(() => shotSnapshot({ ...shot, preset: "nope" }, report), /no preset "nope"/);
  assert.throws(() => shotSnapshot({ ...shot, state: "nope" }, report), /no state "nope"/);
  assert.throws(() => shotSnapshot({ ...shot, state: "idle" }, undefined), /reports no state machine/);
});

test("an option keeps the type of the context value it replaces", () => {
  assert.equal(sameType("9", 1), 9);
  assert.equal(sameType("false", true), false);
  assert.equal(sameType("lost", "good"), "lost");
  assert.equal(sameType("many", 1), "many");
  assert.equal(sameType("", 1), "");
});
