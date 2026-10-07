# 0001 Goal-first runs, pause in place

Status: accepted, 2026-10-06

## Context
Session recordings from the 1.0 beta: 41% of runs that were ended by mistake came from the paused screen, where End sat where Pause had been a second earlier. 23% of runners never tapped Save and lost the run when the app was killed.

## Decision
- The runner picks a goal before starting. Free run stays the default.
- Pause is a state of the active screen, not a separate screen. Ending a run is a 1.5 s long press.
- Runs save automatically when they end. Deleting is on the summary screen.

## Consequences
The active screen carries more: goal ring, current split, pause and end. Distance must stay the largest number.
