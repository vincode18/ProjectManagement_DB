# Enhancement — Kanban Search, Filter & View Toggle

## Summary

The Kanban page (`app/(dashboard)/kanban/page.tsx`) currently renders only a `PageHeader` and the drag-and-drop board (`components/kanban-board.tsx`) — there's no search, no filtering, and no alternate view. This adds a single toolbar row above the board with:

| # | Requirement | Fix |
|---|---|---|
| 1 | Search and filter, represented with icons | A search input (leading `Search` icon) + a "Filters" popover button (`Filter` icon + chevron), both driving the existing `getProjectsFiltered` search/status/priority filters |
| 2 | Board/List view toggle next to the search bar, same height | A two-segment toggle (`LayoutGrid` "Board" / `List` "List") pinned to the same row, all three controls sharing one explicit height so they align pixel-for-pixel |

Everything below is scoped to the toolbar + view toggle only. The reference image's avatar stacks and comment-count badges on each card are **out of scope** — `Project` has single `owner`/`manager`/`techLead` fields (not a team list) and there's no `Comment` model in `prisma/schema.prisma`, so those aren't part of this requirement.

---

## 1. Toolbar Layout

**New component** `components/kanban-toolbar.tsx`, rendered in `app/(dashboard)/kanban/page.tsx` between the `PageHeader` and the board/list, right-aligned to match the reference layout:

```tsx
// app/(dashboard)/kanban/page.tsx
import { PageHeader } from '@/components/page-header';
import { KanbanBoard } from '@/components/kanban-board';
import { KanbanListView } from '@/components/kanban-list-view';
import { KanbanToolbar } from '@/components/kanban-toolbar';
import { getKanbanColumns, getProjectsFiltered } from '@/lib/api';

export default async function KanbanPage({
  searchParams
}: {
  searchParams?: Promise<{ search?: string; status?: string; priority?: string; view?: string }>;
}) {
  const resolved = (await searchParams) ?? {};
  const view = resolved.view === 'list' ? 'list' : 'board';
  const [projects, columnLabels] = await Promise.all([
    getProjectsFiltered({ search: resolved.search, status: resolved.status, priority: resolved.priority }),
    getKanbanColumns()
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader title="Kanban" subtitle="Projects grouped by workflow status. Drag cards between columns, click a column title to rename it." />
        <KanbanToolbar />
      </div>
      {view === 'board' ? <KanbanBoard projects={projects} columnLabels={columnLabels} /> : <KanbanListView projects={projects} />}
    </div>
  );
}
```

- `PageHeader` already renders as a flex row with `justify-between` internally, but it only accepts a single `actions` node aligned to its own title — since the toolbar needs to sit in its own right-aligned block above the board (matching the reference image, which puts it on its own line under the subtitle), it's placed as a sibling next to `PageHeader` inside a shared flex row rather than passed through `actions`.
- `search` / `status` / `priority` / `view` all live in the URL (via `searchParams`), same pattern as `app/(dashboard)/calendar/page.tsx` — this keeps the toolbar's state shareable/bookmarkable and lets `getProjectsFiltered` (already supports `search`/`status`/`priority`) do the filtering server-side with no new API surface.

---

## 2. Search + Filters (Icon-Driven Controls)

**`components/kanban-toolbar.tsx`:**

```tsx
'use client';

import { useState, useTransition } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Search, Filter, ChevronDown, LayoutGrid, List as ListIcon } from 'lucide-react';
import { cn } from './utils';

const statusOptions = ['not_started', 'planning', 'in_progress', 'on_hold', 'completed', 'delayed'] as const;
const priorityOptions = ['high', 'medium', 'low'] as const;

const CONTROL_HEIGHT = 'h-10'; // shared by the search input, Filters button, and each view-toggle segment

export function KanbanToolbar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const search = searchParams.get('search') ?? '';
  const status = searchParams.get('status') ?? '';
  const priority = searchParams.get('priority') ?? '';
  const view = searchParams.get('view') === 'list' ? 'list' : 'board';
  const activeFilterCount = [status, priority].filter(Boolean).length;

  function updateParam(key: string, value: string) {
    const next = new URLSearchParams(searchParams.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    startTransition(() => router.push(`${pathname}?${next.toString()}`));
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          className={cn('input w-64 pl-9', CONTROL_HEIGHT)}
          name="search"
          defaultValue={search}
          placeholder="Search projects..."
          onChange={(event) => updateParam('search', event.target.value)}
        />
      </div>

      <div className="relative">
        <button
          type="button"
          onClick={() => setFiltersOpen((open) => !open)}
          className={cn('btn-secondary gap-1.5', CONTROL_HEIGHT)}
        >
          <Filter className="h-4 w-4" />
          Filters
          {activeFilterCount > 0 ? <span className="pill bg-primary/10 text-primary">{activeFilterCount}</span> : null}
          <ChevronDown className={cn('h-4 w-4 transition-transform', filtersOpen && 'rotate-180')} />
        </button>
        {filtersOpen ? (
          <div className="absolute right-0 z-20 mt-2 w-56 space-y-3 rounded-card border border-border bg-surface p-4 shadow-card">
            <div>
              <p className="label mb-1">Status</p>
              <select className="input" value={status} onChange={(event) => updateParam('status', event.target.value)}>
                <option value="">Any status</option>
                {statusOptions.map((option) => <option key={option} value={option}>{option.replaceAll('_', ' ')}</option>)}
              </select>
            </div>
            <div>
              <p className="label mb-1">Priority</p>
              <select className="input" value={priority} onChange={(event) => updateParam('priority', event.target.value)}>
                <option value="">Any priority</option>
                {priorityOptions.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </div>
          </div>
        ) : null}
      </div>

      <div className={cn('flex items-center rounded-button border border-border bg-white p-0.5', CONTROL_HEIGHT)}>
        <button
          type="button"
          onClick={() => updateParam('view', 'board')}
          className={cn(
            'flex h-full items-center gap-1.5 rounded-[7px] px-3 text-sm font-semibold transition',
            view === 'board' ? 'bg-primary text-white' : 'text-muted hover:text-ink'
          )}
        >
          <LayoutGrid className="h-4 w-4" />
          Board
        </button>
        <button
          type="button"
          onClick={() => updateParam('view', 'list')}
          className={cn(
            'flex h-full items-center gap-1.5 rounded-[7px] px-3 text-sm font-semibold transition',
            view === 'list' ? 'bg-primary text-white' : 'text-muted hover:text-ink'
          )}
        >
          <ListIcon className="h-4 w-4" />
          List
        </button>
      </div>
    </div>
  );
}
```

Notes on requirement #1 (**icons for search and filtering**):
- The search field is led by a `Search` icon inside the input (same pattern already used on the Projects tab, see `Documentation/projects-tab-ui-update.md`), not a separate "search" button — typing directly filters.
- The Filters control is a single icon-labeled button (`Filter` icon + "Filters" + a count badge when active + a `ChevronDown` that flips on open) that expands a small popover with the two selects (Status, Priority). Icons carry the affordance; no unlabeled icon-only buttons that would fail accessibility — each icon sits next to text, matching the reference image.
- Closing the popover on outside click / `Escape` should be added the same way `components/modal.tsx` already handles it, for consistency — omitted above for brevity.

---

## 3. Board / List Toggle (Same Height, Next to Search)

- The toggle is the third control in the same flex row as the search input and Filters button (`components/kanban-toolbar.tsx` above), so it's already "alongside the search bar."
- **Height parity** is enforced explicitly rather than left to padding: `CONTROL_HEIGHT = 'h-10'` is applied to the search `<input>`, the Filters `<button>`, and the toggle's outer container — relying on `.input`/`.btn` padding alone (`py-2`) can drift by a pixel or two across elements with different border/line-height, so pinning all three to the same `h-10` guarantees they line up exactly, matching the reference image where Search, Filters, and Board/List all sit at one uniform height.
- `view` state lives in the URL (`?view=board|list`), read server-side in `KanbanPage` (section 1) to decide which component to render — no client-side flicker between views on navigation/refresh, and the choice is shareable via URL like the rest of the app's filters.

**New component** `components/kanban-list-view.tsx` — a flat table alternative to the drag-and-drop board, reusing the existing table conventions from `components/reports-table.tsx`:

```tsx
import Link from 'next/link';
import { Card, CardContent } from './ui';
import { StatusPill, PriorityPill } from './status-pill';
import { formatDate } from '@/lib/date';
import type { ComputedProject } from '@/lib/api';

export function KanbanListView({ projects }: { projects: ComputedProject[] }) {
  return (
    <Card>
      <CardContent className="overflow-x-auto p-0">
        <table className="min-w-full border-separate border-spacing-0 text-sm">
          <thead>
            <tr>
              <th className="border-b border-border px-4 py-3 text-left">Project</th>
              <th className="border-b border-border px-4 py-3 text-left">Status</th>
              <th className="border-b border-border px-4 py-3 text-left">Priority</th>
              <th className="border-b border-border px-4 py-3 text-left">Progress</th>
              <th className="border-b border-border px-4 py-3 text-left">Timeline</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((project) => (
              <tr key={project.id}>
                <td className="border-b border-border px-4 py-3">
                  <Link href={`/projects/${project.id}`} className="font-semibold text-ink hover:text-primary">{project.name}</Link>
                  <p className="text-xs text-muted">{project.code}</p>
                </td>
                <td className="border-b border-border px-4 py-3"><StatusPill status={project.status} /></td>
                <td className="border-b border-border px-4 py-3"><PriorityPill priority={project.priority} /></td>
                <td className="border-b border-border px-4 py-3">{project.overallProgress}%</td>
                <td className="border-b border-border px-4 py-3 text-muted">{formatDate(project.startDate)} – {formatDate(project.endDate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {projects.length === 0 ? <p className="p-4 text-sm text-muted">No projects match the current search/filters.</p> : null}
      </CardContent>
    </Card>
  );
}
```

This is a read-only table by design (no drag-and-drop) — status changes stay on the Board view, where the existing `KanbanBoard` drag interaction already handles them.

## Out of Scope (from the reference image)

- Per-card assignee avatar stacks and comment-count badges — no team/comment data model exists yet; would need a separate spec once `Comment`/project-team data is introduced.
- Multi-select "Filters" beyond Status/Priority (the reference only shows those two dimensions used elsewhere in the app, e.g. Calendar's filter chips) — can extend the same popover later if more dimensions are needed.
