# Planchest

A design repository framework for agent-created design artifacts and visual review.

## Language

**Concept**:
An exploration used to discuss an idea and reach a decision. Its status describes its lifecycle: draft, review, approved or archived.

**Prototype**:
A developer-ready design deliverable built from the design system, with specifications and handoff details. It has no maturity status; changes are reviewed through pull requests.

**State machine**:
What a page whose screen changes in place reports to the Viewer: its states, the transitions between them, its presets and its context. The page only renders a snapshot; the Viewer and the diff drive it.

**Context**:
The data a page shows in a state, such as a distance or a GPS status. Edited in the Viewer; kept in its URL as the keys that differ from the page's defaults.

**Preset**:
A named state and context of a page's state machine, for an edge case worth looking at. The Viewer applies presets, `planchest shots` captures them, and `planchest diff` compares each one between the two sides.
