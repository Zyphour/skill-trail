import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  ChevronLeft,
  Search,
  Filter,
  Layers,
  Map as MapIcon,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Check,
  SkipForward,
  ExternalLink,
  GitMerge,
  GitBranch,
  Info,
  RotateCw,
  TriangleAlert,
  Compass,
} from 'lucide-react';
import { api } from '../lib/api';
import type { NodeStatus, ProgressMap, RMNode, Roadmap, RMEdge } from '../lib/types';
import { useCrossProgress } from '../lib/useCrossProgress';
import RoadmapSVG from '../components/RoadmapSVG';
import PanZoom from '../components/PanZoom';
import { ProgressBand } from '../components/ProgressSegments';
import { SkeletonBar, SkeletonCanvas, LoadingAnnouncer } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import ResourcesPanel from '../components/ResourcesPanel';
import NotesEditor from '../components/NotesEditor';
import TimeTracker from '../components/TimeTracker';

type Tab = 'checklist' | 'map';
type StatusFilter = 'all' | 'not-started' | 'learning' | 'done' | 'skipped' | 'covered';
type CategoryFilter = string; // section id or 'all'

function labelOf(n: RMNode) {
  return (n.data?.label || n.id || '').trim();
}

// Section headers and connector primitives are layout, not checklist items.
// All other node types (including currently unknown types) remain visible.
function checklistNodes(roadmap: Roadmap) {
  return roadmap.nodes.filter((node) => !['section', 'vertical', 'horizontal'].includes(node.type));
}

/** Group by explicit section/parent metadata when present; otherwise use the nearest
 * section header by canvas position. With no sections, retain one generic group. */
function groupBySection(roadmap: Roadmap) {
  const sections = roadmap.nodes
    .filter((n) => n.type === 'section')
    .sort((a, b) => (a.position?.y ?? 0) - (b.position?.y ?? 0));
  const items = checklistNodes(roadmap);
  // If no sections, single generic group (not a fabricated roadmap section).
  if (!sections.length) return [{ section: null as RMNode | null, nodes: items }];

  const groups: { section: RMNode | null; nodes: RMNode[] }[] = sections.map((s) => ({
    section: s,
    nodes: [],
  }));
  const groupById = new Map(groups.filter((g) => g.section).map((g) => [g.section!.id, g]));
  const nodeById = new Map(roadmap.nodes.map((node) => [node.id, node]));
  const findMetadataGroup = (node: RMNode) => {
    const visited = new Set<string>();
    let current: RMNode | undefined = node;
    while (current) {
      const currentData = current.data as RMNode['data'] & { parentId?: string; sectionId?: string };
      const metadata = current as RMNode & { parentId?: string; sectionId?: string };
      const parentId = metadata.sectionId || currentData.sectionId || metadata.parentId || currentData.parentId;
      if (!parentId || visited.has(parentId)) return undefined;
      visited.add(parentId);
      const section = groupById.get(parentId);
      if (section) return section;
      current = nodeById.get(parentId);
    }
    return undefined;
  };
  // leftover bucket for nodes before first section
  const before: RMNode[] = [];

  for (const node of items) {
    const explicitGroup = findMetadataGroup(node);
    if (explicitGroup) {
      explicitGroup.nodes.push(node);
      continue;
    }
    // Otherwise find the nearest section header above the node by canvas position.
    let best: (typeof groups)[number] | null = null;
    let bestDist = Infinity;
    for (const g of groups) {
      if (!g.section) continue;
      const dy = (node.position?.y ?? 0) - (g.section.position?.y ?? 0);
      if (dy >= -5 && dy < bestDist) {
        bestDist = dy;
        best = g;
      }
    }
    // If bestDist is huge (e.g., node far below all), pick closest above
    if (best) best.nodes.push(node);
    else before.push(node);
  }
  if (before.length) groups.unshift({ section: null, nodes: before });
  // Remove empty groups (except before)
  return groups.filter((g) => g.nodes.length > 0);
}

function buildEdgeMaps(edges: RMEdge[]) {
  const incoming = new Map<string, string[]>();
  const outgoing = new Map<string, string[]>();
  for (const e of edges) {
    if (!outgoing.has(e.source)) outgoing.set(e.source, []);
    outgoing.get(e.source)!.push(e.target);
    if (!incoming.has(e.target)) incoming.set(e.target, []);
    incoming.get(e.target)!.push(e.source);
  }
  return { incoming, outgoing };
}

export default function BackendChecklistView() {
  const slug = 'backend';
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [progress, setProgress] = useState<ProgressMap>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('checklist');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [showOptional, setShowOptional] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [resourceNode, setResourceNode] = useState<RMNode | null>(null);
  const [resourceTab, setResourceTab] = useState<'resources' | 'notes'>('resources');
  const [highlightPath, setHighlightPath] = useState(false);

  const [searchParams] = useSearchParams();
  const focusNodeId = searchParams.get('node');

  useEffect(() => {
    setError(null);
    Promise.all([api.getRoadmap(slug), api.getProgress(), api.getNotes(slug)])
      .then(([rm, prog, n]) => {
        // This exact API response drives both presentations below; the Map tab
        // renders this same object without another roadmap request.
        setRoadmap(rm);
        setProgress((prog.nodeProgress[slug] as ProgressMap) || {});
        setNotes(n.notes || {});
      })
      .catch((e) => setError(String(e)));
  }, []);

  // auto-expand focused node
  useEffect(() => {
    if (focusNodeId) setExpanded((e) => ({ ...e, [focusNodeId]: true }));
  }, [focusNodeId]);

  const { displayProgress, coveredBy, refreshCoverage, effectiveCount } = useCrossProgress(
    slug,
    roadmap,
    progress,
  );

  const edgeMaps = useMemo(() => {
    if (!roadmap) return { incoming: new Map(), outgoing: new Map() };
    return buildEdgeMaps(roadmap.edges || []);
  }, [roadmap]);

  const groups = useMemo(() => {
    if (!roadmap) return [];
    return groupBySection(roadmap);
  }, [roadmap]);

  const nodeById = useMemo(() => {
    if (!roadmap) return new Map<string, RMNode>();
    return new Map(roadmap.nodes.map((n) => [n.id, n]));
  }, [roadmap]);

  const stats = useMemo(() => {
    if (!roadmap) return { total: 0, done: 0, covered: 0, learning: 0, skipped: 0, pct: 0 };
    const items = checklistNodes(roadmap);
    let total = 0,
      done = 0,
      covered = 0,
      learning = 0,
      skipped = 0;
    const tally = (st?: string) => {
      if (st === 'done') done++;
      else if (st === 'covered' && effectiveCount) covered++;
      else if (st === 'learning') learning++;
      else if (st === 'skipped') skipped++;
    };
    for (const n of items) {
      total += 1;
      tally(displayProgress[n.id]);
    }
    return { total, done, covered, learning, skipped, pct: total ? Math.round(((done + covered) / total) * 100) : 0 };
  }, [roadmap, displayProgress, effectiveCount]);

  // Filtered groups
  const filteredGroups = useMemo(() => {
    const q = search.trim().toLowerCase();
    return groups
      .map((g) => {
        let nodes = g.nodes;
        // category filter
        if (categoryFilter !== 'all') {
          if (g.section?.id !== categoryFilter) nodes = [];
        }
        nodes = nodes.filter((node) => {
          const st = displayProgress[node.id];
          // optional filter
          const isOptional = Boolean((node.data as Record<string, unknown> | undefined)?.optional);
          if (!showOptional && isOptional) return false;
          // status filter
          if (statusFilter !== 'all') {
            const effective = st || 'not-started';
            if (effective !== statusFilter) return false;
          }
          // search
          if (q) {
            const label = labelOf(node).toLowerCase();
            const note = (notes[node.id] || '').toLowerCase();
            const sectionLabel = (g.section?.data?.label || '').toLowerCase();
            if (!label.includes(q) && !note.includes(q) && !sectionLabel.includes(q)) return false;
          }
          return true;
        });
        return { ...g, nodes };
      })
      .filter((g) => g.nodes.length > 0);
  }, [groups, search, statusFilter, categoryFilter, showOptional, displayProgress, notes]);

  const allSections = useMemo(() => {
    if (!roadmap) return [];
    return roadmap.nodes.filter((n) => n.type === 'section');
  }, [roadmap]);

  async function setStatus(nodeId: string, status: NodeStatus | null) {
    setProgress((p) => {
      const next = { ...p };
      if (status) next[nodeId] = status;
      else delete next[nodeId];
      return next;
    });
    await api.setNodeStatus(slug, nodeId, status);
    refreshCoverage();
  }

  if (error)
    return (
      <div className="grid h-[70vh] place-items-center px-6">
        <EmptyState
          tone="danger"
          role="alert"
          icon={<TriangleAlert className="h-5 w-5" />}
          title="Could not load Backend roadmap"
          description={
            <>
              {error} — check that the existing roadmap data is available to the local server and that the server is running.
            </>
          }
          action={
            <>
              <Link to="/" className="btn btn-primary">
                <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" /> Back to all roadmaps
              </Link>
              <button type="button" className="btn btn-quiet" onClick={() => window.location.reload()}>
                <RotateCw className="h-3.5 w-3.5" aria-hidden="true" /> Retry
              </button>
            </>
          }
        />
      </div>
    );

  if (!roadmap)
    return (
      <div className="flex h-[calc(100vh-3.5rem)] flex-col" style={{ backgroundColor: 'var(--theme-bg)' }}>
        <LoadingAnnouncer label="Loading Backend roadmap" />
        <div className="bar flex items-center gap-2.5 border-b px-4 py-2.5 sm:px-6" aria-hidden="true">
          <SkeletonBar width="11rem" height="1rem" />
          <div className="flex-1" />
          <SkeletonBar width="5.5rem" height="1.9rem" />
        </div>
        <div className="flex-1 overflow-hidden">
          <SkeletonCanvas />
        </div>
      </div>
    );

  const groupStats = (nodes: RMNode[]) => {
    let done = 0,
      learning = 0,
      skipped = 0;
    for (const n of nodes) {
      const st = displayProgress[n.id];
      if (st === 'done') done++;
      else if (st === 'learning') learning++;
      else if (st === 'skipped') skipped++;
    }
    return { done, learning, skipped, total: nodes.length };
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col" style={{ backgroundColor: 'var(--theme-bg)' }}>
      {/* Subheader */}
      <div
        className="bar flex flex-wrap items-center gap-2.5 border-b px-4 py-2.5 shadow-2xs sm:px-6 z-10"
        style={{ color: 'var(--theme-text)' }}
      >
        <Link to="/" className="btn btn-ghost btn-sm">
          <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="hidden sm:inline">All maps</span>
        </Link>
        <h1 className="t-heading truncate" style={{ color: 'var(--theme-text)' }}>
          {roadmap.title?.page || roadmap.title?.card || 'Backend Developer'}
        </h1>
        <span
          className="hidden rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide sm:inline"
          style={{ backgroundColor: 'var(--theme-surface-2)', color: 'var(--theme-text-muted)', border: '1px solid var(--theme-border)' }}
        >
          {roadmap.title?.card || 'Backend'}
        </span>
        <span className="divider mx-1 hidden h-4 w-px sm:block" aria-hidden="true" />

        {/* Tabs */}
        <div className="seg" role="tablist" aria-label="Backend view">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'checklist'}
            onClick={() => setTab('checklist')}
            className={`seg-item ${tab === 'checklist' ? 'is-active' : ''}`}
          >
            <Layers className="h-3.5 w-3.5" aria-hidden="true" />
            Checklist
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'map'}
            onClick={() => setTab('map')}
            className={`seg-item ${tab === 'map' ? 'is-active' : ''}`}
          >
            <MapIcon className="h-3.5 w-3.5" aria-hidden="true" />
            Map
          </button>
        </div>

        <div className="flex-1" />

        <button
          type="button"
          className={`btn btn-sm ${highlightPath ? 'btn-on' : 'btn-quiet'}`}
          onClick={() => setHighlightPath((h) => !h)}
          aria-pressed={highlightPath}
          title="Emphasise learning path"
        >
          <Compass className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="hidden lg:inline">Learning path</span>
        </button>
      </div>

      <ProgressBand
        parts={{ done: stats.done, learning: stats.learning, skipped: stats.skipped, covered: stats.covered, total: stats.total }}
        pct={stats.pct}
      />

      {tab === 'map' ? (
        <div className="flex-1 overflow-hidden">
          <PanZoom onBackgroundClick={() => setResourceNode(null)}>
            <RoadmapSVG
              roadmap={roadmap}
              progress={displayProgress}
              highlightPath={highlightPath}
              onNodeClick={(node, e) => {
                // In map tab, open resources drawer
                e.preventDefault();
                setResourceNode(node);
                setResourceTab('resources');
              }}
              onChecklistToggle={(id) => setStatus(id, displayProgress[id] === 'done' ? null : 'done')}
            />
          </PanZoom>
          <ResourcesPanel slug={slug} node={resourceNode} defaultTab={resourceTab} onClose={() => setResourceNode(null)} />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[860px] px-4 py-6 sm:px-6">
            {/* Intro */}
            <div
              className="mb-6 rounded-xl border p-4 sm:p-5"
              style={{ backgroundColor: 'var(--theme-surface)', borderColor: 'var(--theme-border)' }}
            >
              <h2 className="t-heading text-[15px]" style={{ color: 'var(--theme-text)' }}>
                {roadmap.title?.page || roadmap.title?.card || 'Backend'} — checklist
              </h2>
              <p className="t-micro mt-1.5 leading-relaxed" style={{ color: 'var(--theme-text-muted)' }}>
                {(roadmap.description || '').replace('@currentYear@', String(new Date().getFullYear())) ||
                  'Checklist presentation of the loaded roadmap data.'}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span
                  className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium"
                  style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-muted)', backgroundColor: 'var(--theme-surface-2)' }}
                >
                  <GitMerge className="h-3 w-3" /> {Array.from(edgeMaps.incoming.values()).filter((v) => v.length > 1).length} nodes with multiple incoming links
                </span>
                <span
                  className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium"
                  style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-muted)', backgroundColor: 'var(--theme-surface-2)' }}
                >
                  <GitBranch className="h-3 w-3" /> {Array.from(edgeMaps.outgoing.values()).filter((v) => v.length > 1).length} nodes with multiple outgoing links
                </span>
                <span
                  className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium"
                  style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-muted)', backgroundColor: 'var(--theme-surface-2)' }}
                >
                  <Info className="h-3 w-3" /> Graph links are shown as relationships, not requirements
                </span>
              </div>
            </div>

            {/* Filters */}
            <div
              className="sticky top-0 z-20 -mx-4 mb-4 flex flex-col gap-3 border-b bg-[var(--theme-bg)] px-4 py-3 sm:mx-0 sm:rounded-xl sm:border sm:px-4"
              style={{ borderColor: 'var(--theme-border)' }}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="field-wrap flex-1">
                  <Search className="h-3.5 w-3.5" aria-hidden="true" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search items, notes, categories…"
                    className="field"
                    aria-label="Search backend topics"
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch('')}
                      className="btn btn-ghost btn-icon absolute right-1 top-1/2 -translate-y-1/2"
                      aria-label="Clear search"
                    >
                      ×
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="seg" role="tablist" aria-label="Filter by status">
                    {(['all', 'not-started', 'learning', 'done', 'skipped', 'covered'] as StatusFilter[]).map((k) => (
                      <button
                        key={k}
                        type="button"
                        role="tab"
                        aria-selected={statusFilter === k}
                        onClick={() => setStatusFilter(k)}
                        className={`seg-item ${statusFilter === k ? 'is-active' : ''}`}
                      >
                        {k === 'not-started' ? 'todo' : k}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                  <Filter className="h-3 w-3" aria-hidden="true" />
                  Category
                </label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="field w-auto min-w-[160px] py-1.5 text-xs"
                  aria-label="Filter by category"
                >
                  <option value="all">All categories ({groups.length})</option>
                  {allSections.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.data?.label || s.id}
                    </option>
                  ))}
                </select>
                <label className="flex items-center gap-2 text-xs cursor-pointer" style={{ color: 'var(--theme-text-muted)' }}>
                  <input
                    type="checkbox"
                    checked={showOptional}
                    onChange={(e) => setShowOptional(e.target.checked)}
                    className="rounded"
                  />
                  Show optional
                </label>
                <span className="ml-auto text-xs" style={{ color: 'var(--theme-text-faint)' }}>
                  {filteredGroups.reduce((a, g) => a + g.nodes.length, 0)} / {stats.total} items
                </span>
              </div>
            </div>

            {filteredGroups.length === 0 ? (
              <EmptyState
                icon={<Search className="h-5 w-5" />}
                title={search ? `Nothing matches “${search}”` : 'No items in this filter'}
                description="Try a different status or clear the search."
                action={
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => {
                      setSearch('');
                      setStatusFilter('all');
                      setCategoryFilter('all');
                      setShowOptional(true);
                    }}
                  >
                    Clear filters
                  </button>
                }
              />
            ) : (
              <div className="space-y-5">
                {filteredGroups.map((group) => {
                  const sectionLabel = group.section?.data?.label || (group.section ? group.section.id : 'Unsectioned nodes');
                  const isChoiceGroup = Boolean((group.section?.data as Record<string, unknown> | undefined)?.isChoice);
                  const isOptionalGroup = Boolean((group.section?.data as Record<string, unknown> | undefined)?.optional);
                  const sgStat = groupStats(group.nodes);
                  return (
                    <section
                      key={group.section?.id || 'general'}
                      className="overflow-hidden rounded-xl border"
                      style={{ backgroundColor: 'var(--theme-surface)', borderColor: 'var(--theme-border)' }}
                    >
                      <div
                        className="flex flex-wrap items-center gap-3 border-b px-4 py-3"
                        style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-surface-2)' }}
                      >
                        <h3 className="t-heading text-[13px]" style={{ color: 'var(--theme-text)' }}>
                          {sectionLabel}
                        </h3>
                        {isChoiceGroup && (
                          <span
                            className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                            style={{ backgroundColor: 'var(--theme-note-soft)', color: 'var(--theme-note)', border: '1px solid var(--theme-note)' }}
                          >
                            Pick one
                          </span>
                        )}
                        {isOptionalGroup && (
                          <span
                            className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                            style={{ backgroundColor: 'var(--theme-surface)', color: 'var(--theme-text-faint)', border: '1px solid var(--theme-border)' }}
                          >
                            Optional
                          </span>
                        )}
                        <span className="t-label ml-auto" style={{ color: 'var(--theme-text-faint)' }}>
                          {sgStat.done}/{sgStat.total} done
                        </span>
                        <span className="hidden h-1 w-16 overflow-hidden rounded-full sm:block" style={{ backgroundColor: 'var(--theme-border)' }}>
                          <span
                            className="block h-full rounded-full"
                            style={{ width: `${sgStat.total ? Math.round((sgStat.done / sgStat.total) * 100) : 0}%`, backgroundColor: 'var(--theme-primary)' }}
                          />
                        </span>
                      </div>
                      <ul className="divide-y" style={{ borderColor: 'var(--theme-border)' }}>
                        {group.nodes.map((node) => {
                          const status = displayProgress[node.id] as NodeStatus | undefined;
                          const relatedFrom = edgeMaps.incoming.get(node.id) || [];
                          const downstream = edgeMaps.outgoing.get(node.id) || [];
                          const hasMultipleIncoming = relatedFrom.length > 1;
                          const isDivergence = downstream.length > 1;
                          const isChoice = Boolean((node.data as Record<string, unknown> | undefined)?.choiceGroup);
                          const isOptional = Boolean((node.data as Record<string, unknown> | undefined)?.optional);
                          const isExpanded = Boolean(expanded[node.id] || focusNodeId === node.id);
                          const coveredInfo = coveredBy(labelOf(node));

                          return (
                            <li
                              key={node.id}
                              className="p-4"
                              style={{ backgroundColor: focusNodeId === node.id ? 'var(--theme-surface-2)' : 'transparent' }}
                            >
                              <div className="flex items-start gap-3">
                                {/* Status circle */}
                                <div className="mt-0.5 flex shrink-0 items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => setStatus(node.id, status === 'done' ? null : 'done')}
                                    className="grid h-6 w-6 place-items-center rounded-full border transition-colors active:scale-95"
                                    style={{
                                      backgroundColor: status === 'done' ? 'var(--theme-done)' : 'var(--theme-surface)',
                                      borderColor: status === 'done' ? 'var(--theme-done)' : 'var(--theme-border-strong)',
                                      color: status === 'done' ? 'var(--theme-primary-ink)' : 'var(--theme-text-faint)',
                                    }}
                                    aria-label={status === 'done' ? 'Mark not done' : 'Mark done'}
                                    title="Toggle done"
                                  >
                                    <Check className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setStatus(node.id, status === 'learning' ? null : 'learning')}
                                    className="grid h-6 w-6 place-items-center rounded-full border transition-colors active:scale-95"
                                    style={{
                                      backgroundColor: status === 'learning' ? 'var(--theme-learning)' : 'var(--theme-surface)',
                                      borderColor: status === 'learning' ? 'var(--theme-learning)' : 'var(--theme-border-strong)',
                                      color: status === 'learning' ? 'var(--theme-primary-ink)' : 'var(--theme-text-faint)',
                                    }}
                                    aria-label={status === 'learning' ? 'Clear learning' : 'Mark learning'}
                                    title="Toggle learning"
                                  >
                                    <BookOpen className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setStatus(node.id, status === 'skipped' ? null : 'skipped')}
                                    className="grid h-6 w-6 place-items-center rounded-full border transition-colors active:scale-95"
                                    style={{
                                      backgroundColor: status === 'skipped' ? 'var(--theme-skipped)' : 'var(--theme-surface)',
                                      borderColor: status === 'skipped' ? 'var(--theme-skipped)' : 'var(--theme-border-strong)',
                                      color: status === 'skipped' ? 'var(--theme-primary-ink)' : 'var(--theme-text-faint)',
                                    }}
                                    aria-label={status === 'skipped' ? 'Clear skipped' : 'Skip'}
                                    title="Toggle skipped"
                                  >
                                    <SkipForward className="h-3 w-3.5" />
                                  </button>
                                </div>

                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span
                                      className="t-small font-medium leading-tight"
                                      style={{
                                        color: status === 'done' ? 'var(--theme-done)' : status === 'learning' ? 'var(--theme-learning)' : status === 'skipped' ? 'var(--theme-text-faint)' : 'var(--theme-text)',
                                        textDecoration: status === 'skipped' ? 'line-through' : 'none',
                                      }}
                                    >
                                      {labelOf(node)}
                                    </span>
                                    {isChoice && (
                                      <span
                                        className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                                        style={{ backgroundColor: 'var(--theme-surface-2)', color: 'var(--theme-text-muted)', border: '1px solid var(--theme-border)' }}
                                      >
                                        alternative
                                      </span>
                                    )}
                                    {isOptional && (
                                      <span
                                        className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                                        style={{ backgroundColor: 'var(--theme-surface)', color: 'var(--theme-text-faint)', border: '1px dashed var(--theme-border)' }}
                                      >
                                        optional
                                      </span>
                                    )}
                                    {status === 'covered' && (
                                      <span
                                        className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
                                        style={{ backgroundColor: 'var(--theme-accent-soft)', color: 'var(--theme-accent)', border: '1px solid var(--theme-accent)' }}
                                      >
                                        covered elsewhere
                                      </span>
                                    )}
                                  </div>

                                  {/* Convergence / divergence badges */}
                                  {(hasMultipleIncoming || isDivergence || isChoice) && (
                                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                                      {hasMultipleIncoming && (
                                        <span
                                          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
                                          style={{ backgroundColor: 'var(--theme-surface-2)', color: 'var(--theme-text-muted)', border: '1px solid var(--theme-border)' }}
                                        >
                                          <GitMerge className="h-3 w-3" /> multiple incoming links • {relatedFrom.length}
                                        </span>
                                      )}
                                      {isDivergence && (
                                        <span
                                          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
                                          style={{ backgroundColor: 'var(--theme-note-soft)', color: 'var(--theme-note)', border: '1px solid var(--theme-note)' }}
                                        >
                                          <GitBranch className="h-3 w-3" /> multiple outgoing links • {downstream.length}
                                        </span>
                                      )}
                                      {isChoiceGroup && isChoice && (
                                        <span className="t-micro" style={{ color: 'var(--theme-text-faint)' }}>
                                          Choose what fits your stack — you don’t need all.
                                        </span>
                                      )}
                                    </div>
                                  )}

                                  {/* Edge relationships (not asserted prerequisites) */}
                                  {(relatedFrom.length > 0 || downstream.length > 0) && (
                                    <div className="mt-2 flex flex-col gap-1 text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                                      {relatedFrom.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5">
                                          <span className="t-label shrink-0">Connected from:</span>
                                          {relatedFrom.map((pid: string) => {
                                            const pn = nodeById.get(pid);
                                            return (
                                              <span
                                                key={pid}
                                                className="rounded-full border px-2 py-0.5 text-[11px]"
                                                style={{ backgroundColor: 'var(--theme-surface-2)', borderColor: 'var(--theme-border)', color: 'var(--theme-text-muted)' }}
                                              >
                                                {pn ? labelOf(pn) : pid}
                                              </span>
                                            );
                                          })}
                                        </div>
                                      )}
                                      {downstream.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5">
                                          <span className="t-label shrink-0">Connected to:</span>
                                          {downstream.map((did: string) => {
                                            const dn = nodeById.get(did);
                                            return (
                                              <span
                                                key={did}
                                                className="rounded-full border px-2 py-0.5 text-[11px]"
                                                style={{ backgroundColor: 'var(--theme-surface)', borderColor: 'var(--theme-border)', color: 'var(--theme-text-muted)' }}
                                              >
                                                {dn ? labelOf(dn) : did}
                                              </span>
                                            );
                                          })}
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {coveredInfo.length > 0 && (
                                    <div className="t-micro mt-1.5" style={{ color: 'var(--theme-text-faint)' }}>
                                      Covered in: {coveredInfo.map((r) => r.title).join(', ')}
                                    </div>
                                  )}

                                  {/* Expanded panel */}
                                  {isExpanded && (
                                    <div
                                      className="mt-3 rounded-xl border p-3 sm:p-4"
                                      style={{ backgroundColor: 'var(--theme-bg)', borderColor: 'var(--theme-border)' }}
                                    >
                                      <div className="flex flex-wrap gap-2">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setResourceNode(node);
                                            setResourceTab('resources');
                                          }}
                                          className="btn btn-quiet btn-sm"
                                        >
                                          <ExternalLink className="h-3.5 w-3.5" /> Resources
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setResourceNode(node);
                                            setResourceTab('notes');
                                          }}
                                          className="btn btn-quiet btn-sm"
                                        >
                                          <BookOpen className="h-3.5 w-3.5" /> Notes
                                        </button>
                                      </div>
                                      <div className="t-micro mt-3" style={{ color: 'var(--theme-text-muted)' }}>
                                        <span className="font-medium" style={{ color: 'var(--theme-text)' }}>
                                          About:
                                        </span>{' '}
                                        {node.data?.label || node.id}. Type: {node.type}.{' '}
                                        {isOptional ? 'The source marks this optional.' : ''}{' '}
                                        {isChoice ? 'The source marks this as an alternative.' : ''}{' '}
                                        {hasMultipleIncoming ? `This node has ${relatedFrom.length} incoming graph links.` : ''}
                                      </div>
                                      {/* Inline notes */}
                                      <div className="mt-4">
                                        <NotesEditor
                                          slug={slug}
                                          nodeId={node.id}
                                          onNoteChange={(note) => setNotes((current) => ({ ...current, [node.id]: note }))}
                                        />
                                        <div className="mt-4">
                                          <TimeTracker slug={slug} nodeId={node.id} />
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>

                                <button
                                  type="button"
                                  onClick={() => setExpanded((e) => ({ ...e, [node.id]: !e[node.id] }))}
                                  className="btn btn-ghost btn-icon shrink-0"
                                  aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
                                  aria-expanded={isExpanded}
                                >
                                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                </button>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </section>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Drawer */}
      <ResourcesPanel slug={slug} node={resourceNode} defaultTab={resourceTab} onClose={() => setResourceNode(null)} />
    </div>
  );
}

