# Enhancement — Helpdesk Dashboard Tab

## Summary

Add a new **Helpdesk Dashboard** tab: a role-gated analytics board (KPI cards + filters + charts) over helpdesk ticket data, matching the attached reference design. This builds directly on the **Helpdesk Report** module already specced in `PRD/Enhancement/enhancement-01.md` §8 (`HelpdeskTicket`/`HelpdeskUpload` models, `helpdesk_user` role, upload flow) — that document is the data-ingestion side; this one is the **Board view** on top of it.

| # | Requirement | Fix |
|---|---|---|
| 1 | Create the Dashboard | New route `app/(dashboard)/helpdesk-dashboard/page.tsx` + sidebar nav entry, built on the existing `HelpdeskTicket` data model |
| 2 | Display the Board per the design | KPI row, Category/Sub Category filter sidebar, Agent/Ticket Note dropdowns, and 4 charts (Total Ticket trend, SLA, Agent Performance, Category breakdown, Cause of Problem) using `recharts` |
| 3 | Board visible only to helpdesk users | Role-gated at both the sidebar (hidden for other roles) and the route itself (403 for anyone who isn't `helpdesk_user` or `admin`) |

---

## 0. Depends On — `enhancement-01.md` §8

That document already specs:
- `HelpdeskTicket` (`ticketNo`, `agentName`, `category`, `subCategory`, `status`, `openedAt`, `closedAt`, `uploadId`)
- `HelpdeskUpload` (upload batches, for rollback)
- `role: admin | member | helpdesk_user` on `User`
- Upload endpoint `POST /api/helpdesk/upload` and summary endpoint `GET /api/helpdesk/summary`

This document doesn't repeat that schema — it assumes it exists and adds the **dashboard/board UI** and a couple of fields the reference design needs that weren't in the original spec (`slaTier`, `causeOfProblem` — see §2b) plus the **role gate** for viewing it (§3).

---

## 1. Route + Sidebar Entry

**Sidebar** (`components/side-nav.tsx`) — add a nav item, but only when the current user's role allows it (see §3 for the actual gate; the entry itself is conditionally rendered):

```tsx
const bottomNavItems = [
  { href: '/planner', label: 'MyPlanner', icon: ClipboardList },
  { href: '/reports', label: 'Reports', icon: Table2 },
  { href: '/helpdesk-dashboard', label: 'Helpdesk', icon: Headset, roles: ['helpdesk_user', 'admin'] }, // new
  { href: '/settings', label: 'Manage Users', icon: ShieldCheck }
];
```

`SideNav` filters `bottomNavItems` by `roles` (when present) against the current user's role — same idea as §3's `requireHelpdeskAccess`, just applied client-side to decide what to render, not as the security boundary.

**Route** (`app/(dashboard)/helpdesk-dashboard/page.tsx`, new file):

```tsx
import { PageHeader } from '@/components/page-header';
import { requireHelpdeskAccess } from '@/lib/session';
import { getHelpdeskDashboardData } from '@/lib/helpdesk';
import { HelpdeskDashboardClient } from '@/components/helpdesk-dashboard-client';

export default async function HelpdeskDashboardPage() {
  await requireHelpdeskAccess(); // redirects/403s if not allowed - see §3

  const data = await getHelpdeskDashboardData();
  return (
    <div className="space-y-6">
      <PageHeader title="Helpdesk Dashboard" subtitle="Ticket volume, SLA, and agent performance." />
      <HelpdeskDashboardClient {...data} />
    </div>
  );
}
```

---

## 2. The Board (Requirement 2)

### 2a. New dependency

No charting library exists in this codebase yet. Add `recharts` (works cleanly with Next.js App Router client components, no extra config):

```bash
npm install recharts
```

### 2b. Data needed beyond `enhancement-01.md` §8

The reference design's **SLA** panel and **Cause of Problem** chart need two fields the original `HelpdeskTicket` model doesn't have yet:

```prisma
enum SlaTier {
  default_1d
  escalation_1w
}

model HelpdeskTicket {
  // ...existing fields from enhancement-01.md §8
  slaTier         SlaTier?
  causeOfProblem  String?
}
```

Both are optional and populated from the same upload flow (§8's CSV/XLSX columns gain `sla_tier` and `cause_of_problem`).

### 2c. Aggregation (`lib/helpdesk.ts`, new file)

```ts
import { prisma } from '@/lib/prisma';

export async function getHelpdeskDashboardData(filters: { agentName?: string; category?: string[]; subCategory?: string[] } = {}) {
  const where = {
    agentName: filters.agentName || undefined,
    category: filters.category?.length ? { in: filters.category } : undefined,
    subCategory: filters.subCategory?.length ? { in: filters.subCategory } : undefined
  };

  const tickets = await prisma.helpdeskTicket.findMany({ where });

  const byMonth = groupCount(tickets, (t) => monthLabel(t.openedAt));
  const bySla = groupCount(tickets, (t) => t.slaTier ?? 'unspecified');
  const byAgent = groupCount(tickets, (t) => t.agentName);
  const byCategory = groupCount(tickets, (t) => t.category);
  const byCause = groupCount(tickets, (t) => t.causeOfProblem ?? 'unspecified');

  return {
    totalTickets: tickets.length,
    totalTicketByMonth: byMonth,
    slaBreakdown: bySla,
    agentPerformance: Object.entries(byAgent).sort((a, b) => b[1] - a[1]).slice(0, 5),
    categoryBreakdown: byCategory,
    causeOfProblem: Object.entries(byCause).sort((a, b) => b[1] - a[1])
  };
}

function groupCount<T>(rows: T[], keyFn: (row: T) => string): Record<string, number> {
  return rows.reduce<Record<string, number>>((acc, row) => {
    const key = keyFn(row);
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
}

function monthLabel(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'long' });
}
```

### 2d. Board layout (`components/helpdesk-dashboard-client.tsx`, new file, sketch)

Matches the reference: a left filter sidebar (Category/Sub Category checkboxes) + top filter bar (Agent, Ticket Note dropdowns) + a KPI tile + 4 chart cards.

```tsx
'use client';

import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardContent, Select } from './ui';

interface HelpdeskDashboardProps {
  totalTickets: number;
  totalTicketByMonth: Record<string, number>;
  slaBreakdown: Record<string, number>;
  agentPerformance: [string, number][];
  categoryBreakdown: Record<string, number>;
  causeOfProblem: [string, number][];
  categories: string[];
  subCategories: string[];
  agents: string[];
}

export function HelpdeskDashboardClient(props: HelpdeskDashboardProps) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSubCategories, setSelectedSubCategories] = useState<string[]>([]);

  const monthData = useMemo(
    () => Object.entries(props.totalTicketByMonth).map(([month, count]) => ({ month, count })),
    [props.totalTicketByMonth]
  );
  const categoryData = useMemo(
    () => Object.entries(props.categoryBreakdown).map(([name, value]) => ({ name, value })),
    [props.categoryBreakdown]
  );

  return (
    <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
      {/* Category / Sub Category filter sidebar */}
      <Card>
        <CardContent className="space-y-4 p-4 pt-6">
          <FilterGroup title="Category" options={props.categories} selected={selectedCategories} onChange={setSelectedCategories} />
          <FilterGroup title="Sub Category" options={props.subCategories} selected={selectedSubCategories} onChange={setSelectedSubCategories} />
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Card><CardContent className="px-6 py-4"><p className="label">Total Ticket</p><p className="mt-1 text-2xl font-bold">{props.totalTickets}</p></CardContent></Card>
          <Select className="w-48"><option>All Agents</option>{props.agents.map((a) => <option key={a}>{a}</option>)}</Select>
          <Select className="w-48"><option>All Ticket Notes</option></Select>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-4 pt-6">
              <h3 className="section-title">Total Ticket</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={monthData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" fontSize={11} />
                  <YAxis fontSize={11} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#eab308" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 pt-6">
              <h3 className="section-title">SLA</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={Object.entries(props.slaBreakdown).map(([name, value]) => ({ name, value }))} layout="vertical">
                  <XAxis type="number" fontSize={11} />
                  <YAxis type="category" dataKey="name" width={100} fontSize={11} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#eab308" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 pt-6">
              <h3 className="section-title">Agent Performance</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={props.agentPerformance.map(([name, value]) => ({ name, value }))}>
                  <XAxis dataKey="name" fontSize={9} interval={0} angle={-20} textAnchor="end" height={50} />
                  <YAxis fontSize={11} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#eab308" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardContent className="p-4 pt-6">
              <h3 className="section-title">Category</h3>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={categoryData} dataKey="value" nameKey="name" outerRadius={100} label>
                    {categoryData.map((_, index) => <Cell key={index} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 pt-6">
              <h3 className="section-title">Cause Of Problem</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={props.causeOfProblem.map(([name, value]) => ({ name, value }))}>
                  <XAxis dataKey="name" fontSize={9} interval={0} angle={-20} textAnchor="end" height={60} />
                  <YAxis fontSize={11} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#eab308" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

const CATEGORY_COLORS = ['#2563eb', '#0ea5e9', '#f97316', '#a855f7', '#1e3a8a', '#eab308', '#ec4899', '#14b8a6', '#64748b'];

function FilterGroup({ title, options, selected, onChange }: { title: string; options: string[]; selected: string[]; onChange: (next: string[]) => void }) {
  return (
    <div>
      <p className="label mb-2">{title}</p>
      <div className="max-h-48 space-y-1 overflow-y-auto text-sm">
        {options.map((option) => (
          <label key={option} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={selected.includes(option)}
              onChange={(event) =>
                onChange(event.target.checked ? [...selected, option] : selected.filter((item) => item !== option))
              }
            />
            {option}
          </label>
        ))}
      </div>
    </div>
  );
}
```

- Every chart card gets the same `p-4 pt-6` top-padding treatment already established across this app's other cards (`PRD/PRD-ProjectTabsinformation.md`, `Documentation/projects-tab-ui-update.md`).
- Filter state (`selectedCategories`/`selectedSubCategories`/Agent/Ticket Note) should re-fetch `getHelpdeskDashboardData(filters)` — wire this the same way `KanbanToolbar` drives `getProjectsFiltered` via URL params (`PRD/Enhancement/system_KanbanSearch.md` §1), so filters stay bookmarkable, rather than only living in local `useState`. Sketched above with local state for brevity; the URL-param version is the one to actually ship.
- Colors above use a neutral placeholder palette (the reference's Category donut uses a wider hue range than the yellow-accent bars elsewhere) — swap for the app's actual chart palette when this is implemented.

---

## 3. Restricting the Board to Helpdesk Users

**Problem:** every other page in the app is visible to any authenticated user; this one must be scoped to `role === 'helpdesk_user'` (plus `admin`, who should be able to see everything, consistent with `system_SettingsManagement.md`'s admin-only gates).

**Fix — `lib/session.ts` (extends the `requireAdmin`/`getCurrentUser` helpers already depended on by `system_SettingsManagement.md` and `enhancement-system_LogManagement.md`):**

```ts
export async function requireHelpdeskAccess() {
  const user = await getCurrentUser();
  if (!user || !['helpdesk_user', 'admin'].includes(user.role)) {
    redirect('/dashboard'); // or return a 403 if called from a Route Handler instead of a page
  }
  return user;
}
```

- Called at the top of `app/(dashboard)/helpdesk-dashboard/page.tsx` (§1) — this is the actual security boundary. A `member`/`manager`-role user hitting the URL directly gets redirected, not just visually hidden.
- The sidebar filtering in §1 is the UX layer on top of this — hiding the nav item for roles that can't access it, so people aren't offered a link that immediately redirects them away. Same defense-in-depth pattern already used for admin-only UI in `system_SettingsManagement.md` §2.
- If `getHelpdeskDashboardData` is ever exposed as its own API route (rather than only called server-side from the page), that route needs the same `requireHelpdeskAccess()` check — never rely on the page-level gate alone to protect the data.

## Out of Scope

- CSV/XLSX upload UI for `slaTier`/`causeOfProblem` columns — covered by extending the existing upload flow in `enhancement-01.md` §8, not re-specced here.
- Date-range picker / month switcher seen in the reference's "Dashboard Juli 2026" / "Dashboard Juni 2026" title — the aggregation in §2c already scopes by whatever `openedAt` range the caller filters to; wiring a month switcher into the UI is straightforward once URL-param filtering (§2d) is in place, but isn't detailed here.
