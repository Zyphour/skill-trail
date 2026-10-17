# Backend Roadmap — Runtime Checklist Presentation

**Updated:** 2026-10-18  
**Scope:** backend route only; runtime presentation changes only.

## Data flow and current source status

`RoadmapView.tsx` loads with `api.getRoadmap(slug)` and passes that returned `roadmap` object to `<RoadmapSVG roadmap={roadmap} ... />`. The backend-only route in `main.tsx` selects `BackendChecklistView`, which makes one `api.getRoadmap('backend')` request alongside the existing progress and notes requests. The resulting single `roadmap` state powers the checklist and is passed unchanged to `<RoadmapSVG roadmap={roadmap} ... />` in the Map tab. Switching tabs performs no additional roadmap request.

Server trace is unchanged: `GET /api/roadmaps/backend` → `server/src/store.js:loadRoadmap('backend')` → `DATA_DIR/roadmaps/backend.json`. Runtime verification succeeded against the current working tree: the API returned the Backend title and a roadmap object with nodes and edges. However, the ignored local file's provenance explicitly says it was reconstructed with synthesized topology from Markdown. Therefore, **this verifies the presentation consumes the API response; it does not verify that the current local API data is an authentic official roadmap**. No data file was fetched, created, changed, or copied during this runtime-view task. A fresh checkout still needs the existing bootstrap/source data to be available.

## Runtime adapter behavior

`BackendChecklistView.tsx` now derives visible rows, section groupings, relationship chips, progress counts, and the optional map from the API-returned `Roadmap` object:

- Uses node IDs and labels from the response; no topic IDs, topic labels, section names, roadmap counts, or edges are embedded in the component.
- Groups by section/parent IDs when those references are available. Otherwise uses the nearest section by canvas position. If the response has no sections, it uses a generic “Unsectioned nodes” group.
- Keeps all node types as checklist entries except section headers and the known visual connector primitives (`vertical`/`horizontal`). Unknown/unhandled node types are rendered as generic rows with their runtime type shown in details.
- Derives link chips from response edges and labels them “Connected from/to”; it does not claim edges are prerequisites. Multiple incoming/outgoing edges are described as graph links.
- Optional and choice badges are shown only when the corresponding metadata is present in the response. No alternatives or dependencies are inferred from topic names.
- Uses `api.getProgress`, `api.getNotes`, `api.setNodeStatus`, existing `NotesEditor`/`ResourcesPanel`/`TimeTracker`, and the existing progress schema. No new client store or server schema was added.
- The Map tab renders the exact same loaded object held in component state. Backend-only routing remains in `RoadmapRouter`; other slugs continue to use `RoadmapView` unchanged.
- API failures continue to show the existing loading/error states; there is no generated-data fallback and no synthesis-marker check in the checklist path.

## Changed files

- `app/src/views/BackendChecklistView.tsx` — dynamic checklist adapter, runtime metadata grouping, neutral graph-link language, generic handling for unknown node types; one API response shared by Checklist and Map.
- `app/src/components/NotesEditor.tsx` — optional note-change callback, used to keep the checklist's note-search index current while preserving the existing notes API.
- `app/src/main.tsx` — backend-only router import organization/comment cleanup; routing behavior unchanged.
- `docs/BACKEND-REDESIGN.md` — this report.
- `docs/agent-spec.md` — updated status caveat to distinguish runtime adapter completion from unresolved data provenance.

Existing uncommitted `app/src/main.tsx` routing was not altered in this task. The old generator script is absent; ignored local roadmap files were not touched.

## Validation

- `cd app && node_modules/.bin/tsc -b` — passed.
- `npm run app:build` — passed (1907 modules); existing >500 kB chunk warning remains.
- `npm test` — 63 passed, 0 failed. Existing offline external-data warnings appear during the suite.
- Static flow check: one `api.getRoadmap('backend')` in the checklist view; both presentations consume `roadmap` state; Map's `RoadmapSVG` receives `roadmap={roadmap}`.
- API check: current local server returned `/api/roadmaps/backend`; the API loads from the existing `DATA_DIR/roadmaps/backend.json` path.
- Persistence check: ran a temporary server `DATA_DIR` with a symlink to the existing roadmap directory (no roadmap copy). Existing progress and notes POST→GET round trips returned the submitted learning status and note. The temporary state directory was removed after the test.

No browser automation was available here to exercise visual Checklist/Map interaction or browser reload behavior. The Map code path was checked statically: it passes the same `roadmap` state object that drives the Checklist to `RoadmapSVG`; switching tabs does not call `api.getRoadmap`.

## Limitations / data caveat

The current ignored Backend JSON was previously synthesized and is not proven official. This change deliberately treats it only as whatever data the existing API returns and does not replace or validate its provenance. Official data fidelity, fresh-checkout availability, and content-reference mapping remain unverified. The runtime checklist is data-driven and will adapt to changes in the API response within the schema assumptions above; it is not a certification of the current dataset.
