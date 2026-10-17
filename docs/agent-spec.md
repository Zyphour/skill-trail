# Backend Checklist Presentation — Implementation Notes

**Scope:** presentation-only redesign for `/roadmap/backend`. Other roadmap routes, renderer defaults, roadmap files, and persistence schemas remain unchanged.

## Data and rendering contract

- The view requests `api.getRoadmap('backend')` once per mount, alongside existing progress and notes requests.
- The returned `Roadmap` object is the sole input for checklist nodes, labels, IDs, grouping, status totals, relationship links, and the Map tab. The Map tab passes that same object to `RoadmapSVG`; switching tabs does not fetch roadmap data again.
- The server's existing source resolution is unchanged: `GET /api/roadmaps/:slug` → `loadRoadmap(slug)` → `DATA_DIR/roadmaps/<slug>.json`.
- No roadmap file is generated, copied, downloaded, cloned, transformed, or persisted by this view. The API response is adapted in memory only.

## Checklist adapter rules

- Use runtime node IDs and labels. Group by section/parent metadata where available; otherwise group by section position. With no sections, keep a generic unsectioned list.
- Exclude section headers and known vertical/horizontal layout connectors from checklist rows. Show other node types as generic rows so unrecognized types are not silently discarded.
- Display edge relationships as `Connected from` / `Connected to`. Treat visual edges as relationships, not mandatory prerequisites.
- Show optional/choice indicators only if explicit response metadata supplies them. Never infer curriculum structure from topic names.
- Search, category/status filters, progress indicators, resource references, notes, and time tracking operate on the returned node IDs and existing APIs.

## State and compatibility

- Status changes use `api.setNodeStatus`; progress and notes remain in existing server state and status schema.
- Notes use existing `NotesEditor`/notes API. Its optional change callback keeps the checklist's in-memory note search current; other consumers retain existing behavior.
- Backend routing is the only conditional route. Every other slug continues to render through `RoadmapView` and the existing graph renderer.
- On request failure, retain the ordinary loading/error state. There is no data-generation fallback.

## Data provenance caveat

The current ignored `data/roadmaps/backend.json` was previously synthesized and is not verified as an authentic official roadmap.sh snapshot. This implementation uses whatever the existing API returns, and does not certify the returned data's provenance or fidelity. Do not claim official-data fidelity until an authentic source is available and verified. This caveat does not justify creating or substituting another dataset.
