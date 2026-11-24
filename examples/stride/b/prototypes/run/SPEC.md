# Record a run

Flow: `flows/run/FLOW.md`. Decision: `decisions/0001-goal-first-run.md`. Source concept: `concepts/home` (#plan).

## Goal
Start, track and save a run with as few taps as possible, toward a goal the runner chose.

## States

`active.html` pauses in place, so it has a state machine (`running`, `paused`) instead of a separate paused page. Its presets are the edge cases to review:

| Preset | Shows |
|---|---|
| `just-started` | The first minute: tiny distance, ring almost empty |
| `almost-there` | Under 200 m to the goal |
| `weak-gps` | GPS signal weak; distance keeps counting |
| `paused-halfway` | Paused at 2.5 km; metrics dim, Resume replaces Pause |

## Acceptance
- Start is one tap from the home tab when the last goal is reused.
- During the run, distance is the largest number on screen.
- Pause and resume never lose GPS points.
- Ending a run needs a long press of at least 1.5 s.
- A run is saved the moment it ends; there is no Save step.
- Each split shows its pace and zone colour relative to goal pace.
