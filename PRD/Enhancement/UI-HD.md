# UI-HD — Helpdesk Dashboard UI Fixes + Excel Upload

## Summary

Follow-up to `PRD/Enhancement/enhancement-system_HelpdeskDashboard.md`. As built, the board looks broken with no data: the filter sidebar and the top KPI/dropdown row don't line up, the chart cards below render as blank white boxes with no indication anything is missing, and there's no way to actually get ticket data into the dashboard from the page itself. This fixes the layout and adds an Excel upload at the bottom of the page that auto-maps columns and refreshes the board immediately.

| # | Problem | Fix |
|---|---|---|
| 1 | Filter sidebar and the KPI/dropdown row don't align in height; "No options" reads as a bug, not an empty state | Shared control height across the row, and a styled empty state for the filter groups |
| 2 | Chart cards render as blank boxes with 0 data — nothing tells the user why | A `min-h` + explicit "No ticket data yet" empty state per chart card |
| 3 | No way to load data without leaving the dashboard | An Excel upload dropzone at the bottom of the page that auto-maps columns to `HelpdeskTicket` fields (no manual mapping step) and refreshes the board on success |

---

## 1. Align the Filter Sidebar, KPI Tile, and Dropdowns

**Problem:** in `components/helpdesk-dashboard-client.tsx` (from `enhancement-system_HelpdeskDashboard.md` §2d), the filter `Card` sits in the grid's left column, but the "Total Ticket" KPI tile and the two `Select`s sit in a plain `flex` row above the chart grid — none of the three share an explicit height, so they visually drift out of alignment (as seen in the screenshot: the KPI card and the filter card's first row don't line up at all).

**Fix:** apply the same `CONTROL_HEIGHT` convention already established for the Kanban toolbar (`PRD/Enhancement/system_KanbanSearch.md` §3) to the KPI tile and both dropdowns, and give the filter groups a real empty state instead of a bare "No options" string:

```tsx
const CONTROL_HEIGHT = 'h-16'; // KPI tile height; selects match via matching padding, not this same token

<div className="flex flex-wrap items-stretch gap-3">
  <Card className={cn('flex flex-col justify-center', CONTROL_HEIGHT)}>
    <CardContent className="px-6 py-0">
      <p className="label">Total Ticket</p>
      <p className="mt-1 text-2xl font-bold">{props.totalTickets}</p>
    </CardContent>
  </Card>
  <Select className={cn('w-48', CONTROL_HEIGHT)}>
    <option>All Agents</option>
    {props.agents.map((a) => <option key={a}>{a}</option>)}
  </Select>
  <Select className={cn('w-48', CONTROL_HEIGHT)}>
    <option>All Ticket Notes</option>
  </Select>
</div>
```

```tsx
function FilterGroup({ title, options, selected, onChange }: FilterGroupProps) {
  return (
    <div>
      <p className="label mb-2">{title}</p>
      {options.length === 0 ? (
        <p className="text-sm italic text-muted">No {title.toLowerCase()} yet — upload data below to populate this filter.</p>
      ) : (
        <div className="max-h-48 space-y-1 overflow-y-auto text-sm">
          {options.map((option) => (
            <label key={option} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selected.includes(option)}
                onChange={(event) => onChange(event.target.checked ? [...selected, option] : selected.filter((item) => item !== option))}
              />
              {option}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
```

- "No options" alone (the current empty state) reads like the filter is broken. The rewritten copy explains *why* it's empty and points at the fix (§3's upload widget), turning a dead end into a next step.
- `items-stretch` on the top row + a fixed-height KPI `Card` and matching-height `Select`s closes the visible misalignment in the screenshot.

---

## 2. Chart Cards Need a Real Empty State

**Problem:** each chart `Card` in the reference implementation renders `ResponsiveContainer` directly around a `recharts` chart fed by `[]`/`0` data — with nothing to plot, `recharts` renders an essentially blank `<svg>`, so the card just looks broken (matches the screenshot's cut-off, content-less white boxes).

**Fix:** wrap every chart in a small `ChartCard` helper that shows a placeholder when there's no data, and give every chart card a consistent minimum height so the grid doesn't collapse to sliver-thin rows when empty:

```tsx
// components/chart-card.tsx (new file)
import type { ReactNode } from 'react';
import { Card, CardContent } from './ui';

export function ChartCard({ title, isEmpty, children }: { title: string; isEmpty: boolean; children: ReactNode }) {
  return (
    <Card>
      <CardContent className="flex min-h-[280px] flex-col p-4 pt-6">
        <h3 className="section-title">{title}</h3>
        {isEmpty ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-1 text-center text-sm text-muted">
            <p>No ticket data yet</p>
            <p className="text-xs">Upload an Excel file below to populate this chart.</p>
          </div>
        ) : (
          <div className="mt-2 flex-1">{children}</div>
        )}
      </CardContent>
    </Card>
  );
}
```

Usage (replacing each ad-hoc `<Card><CardContent>...<ResponsiveContainer>` block from `enhancement-system_HelpdeskDashboard.md` §2d):

```tsx
<ChartCard title="Total Ticket" isEmpty={monthData.length === 0}>
  <ResponsiveContainer width="100%" height={220}>
    <BarChart data={monthData}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="month" fontSize={11} />
      <YAxis fontSize={11} />
      <Tooltip />
      <Bar dataKey="count" fill="#eab308" />
    </BarChart>
  </ResponsiveContainer>
</ChartCard>
```

Apply the same `ChartCard` wrapper to SLA, Agent Performance, Category, and Cause of Problem — every chart in `enhancement-system_HelpdeskDashboard.md` §2d gets this treatment, not just one.

---

## 3. Excel Upload at the Bottom of the Dashboard, Auto-Mapped

**Problem:** `enhancement-01.md` §8 already specs an upload endpoint (`POST /api/helpdesk/upload`) and a manual-mapping-free flow in principle, but there's no UI for it on the dashboard itself — today the only way to get data in is out of scope of what's on screen. The requirement here is explicit: upload lives **at the bottom of this page**, and mapping is **automatic** (no "match your columns" step for the user).

**Fix:**

**a) Auto column mapping** (`lib/helpdesk-upload.ts`, new file) — normalize each header and match it against known aliases, so common variations ("Ticket No", "ticket_no", "TicketNo", "Ticket Number") all resolve without user input:

```ts
const FIELD_ALIASES: Record<string, string[]> = {
  ticketNo: ['ticket no', 'ticket number', 'ticket_no', 'ticketno'],
  agentName: ['agent', 'agent name', 'agent_name'],
  category: ['category'],
  subCategory: ['sub category', 'subcategory', 'sub_category'],
  status: ['status'],
  openedAt: ['opened', 'opened at', 'opened_at', 'open date'],
  closedAt: ['closed', 'closed at', 'closed_at', 'close date'],
  slaTier: ['sla', 'sla tier', 'sla_tier'],
  causeOfProblem: ['cause of problem', 'cause_of_problem', 'root cause']
};

function normalize(header: string): string {
  return header.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function buildColumnMap(headers: string[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const header of headers) {
    const normalized = normalize(header);
    for (const [field, aliases] of Object.entries(FIELD_ALIASES)) {
      if (aliases.includes(normalized)) {
        map[header] = field;
        break;
      }
    }
  }
  return map;
}
```

- This is deliberately alias-matching, not fuzzy/AI matching — predictable and debuggable. A header that matches nothing is simply dropped from the mapped row (see validation below), rather than guessed at.

**b) Upload route uses the map directly** (`app/api/helpdesk/upload/route.ts`, extends `enhancement-01.md` §8's endpoint):

```ts
import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { prisma } from '@/lib/prisma';
import { buildColumnMap } from '@/lib/helpdesk-upload';
import { requireHelpdeskAccess } from '@/lib/session';

export async function POST(request: Request) {
  const actor = await requireHelpdeskAccess();

  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet);

  if (rows.length === 0) return NextResponse.json({ error: 'File has no rows' }, { status: 400 });

  const columnMap = buildColumnMap(Object.keys(rows[0]));
  const required = ['ticketNo', 'agentName', 'category', 'status', 'openedAt'];
  const mappedFields = new Set(Object.values(columnMap));
  const missing = required.filter((field) => !mappedFields.has(field));
  if (missing.length > 0) {
    return NextResponse.json({ error: `Could not find columns for: ${missing.join(', ')}` }, { status: 400 });
  }

  const upload = await prisma.helpdeskUpload.create({
    data: { filename: file.name, uploadedBy: actor.id, rowCount: rows.length }
  });

  await prisma.helpdeskTicket.createMany({
    data: rows.map((row) => {
      const mapped: Record<string, unknown> = {};
      for (const [header, field] of Object.entries(columnMap)) mapped[field] = row[header];
      return {
        ticketNo: String(mapped.ticketNo),
        agentName: String(mapped.agentName),
        category: String(mapped.category),
        subCategory: mapped.subCategory ? String(mapped.subCategory) : null,
        status: String(mapped.status),
        openedAt: new Date(mapped.openedAt as string),
        closedAt: mapped.closedAt ? new Date(mapped.closedAt as string) : null,
        slaTier: mapped.slaTier ? String(mapped.slaTier) : null,
        causeOfProblem: mapped.causeOfProblem ? String(mapped.causeOfProblem) : null,
        uploadId: upload.id
      };
    })
  });

  return NextResponse.json({ uploadId: upload.id, rowCount: rows.length }, { status: 201 });
}
```

- Still gated by `requireHelpdeskAccess()` (`enhancement-system_HelpdeskDashboard.md` §3) — uploading is at least as sensitive as viewing.
- Required fields (`ticketNo`, `agentName`, `category`, `status`, `openedAt`) must all resolve via `buildColumnMap`; anything else (`subCategory`, `closedAt`, `slaTier`, `causeOfProblem`) is optional and simply left `null` if its column isn't found — matches the fields already marked optional in `enhancement-system_HelpdeskDashboard.md` §2b.
- Uses `xlsx` (SheetJS) rather than `exceljs` for **reading** uploads — `exceljs` (already a dependency, per `enhancement-01.md` §7) is better suited to *writing* formatted `.xlsx` exports; `xlsx` is a lighter read-only parser for ingesting arbitrary uploaded sheets. Both can coexist; `npm install xlsx` if not already present.

**c) The upload widget itself** (`components/helpdesk-upload.tsx`, new file), placed at the bottom of the dashboard page:

```tsx
'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload } from 'lucide-react';
import { Card, CardContent, Button } from './ui';

export function HelpdeskUpload() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<{ type: 'idle' | 'uploading' | 'success' | 'error'; message?: string }>({ type: 'idle' });

  async function handleFile(file: File) {
    setStatus({ type: 'uploading' });
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/helpdesk/upload', { method: 'POST', body: formData });
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      setStatus({ type: 'error', message: data?.error ?? 'Upload failed' });
      return;
    }

    setStatus({ type: 'success', message: `Imported ${data.rowCount} tickets` });
    router.refresh(); // re-runs getHelpdeskDashboardData on the server, board updates immediately
  }

  return (
    <Card>
      <CardContent className="space-y-3 p-5 pt-7">
        <div>
          <h3 className="section-title">Upload Ticket Data</h3>
          <p className="text-sm text-muted">Drop an Excel file (.xlsx/.csv) - columns are matched automatically, no mapping step needed.</p>
        </div>
        <div
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            const file = event.dataTransfer.files[0];
            if (file) handleFile(file);
          }}
          className="flex flex-col items-center justify-center gap-2 rounded-card border border-dashed border-border bg-slate-50 px-6 py-10 text-center"
        >
          <Upload className="h-6 w-6 text-muted" />
          <p className="text-sm text-muted">Drag a file here, or</p>
          <Button variant="secondary" onClick={() => inputRef.current?.click()}>Browse files</Button>
          <input
            ref={inputRef}
            type="file"
            name="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
        </div>
        {status.type === 'uploading' ? <p className="text-sm text-muted">Uploading...</p> : null}
        {status.type === 'success' ? <p className="text-sm font-semibold text-emerald-600">{status.message}</p> : null}
        {status.type === 'error' ? <p className="text-sm font-semibold text-red-600">{status.message}</p> : null}
      </CardContent>
    </Card>
  );
}
```

**d) Wire it into the page** (`app/(dashboard)/helpdesk-dashboard/page.tsx`, extends `enhancement-system_HelpdeskDashboard.md` §1):

```tsx
export default async function HelpdeskDashboardPage() {
  await requireHelpdeskAccess();
  const data = await getHelpdeskDashboardData();
  return (
    <div className="space-y-6">
      <PageHeader title="Helpdesk Dashboard" subtitle="Ticket volume, SLA, and agent performance." />
      <HelpdeskDashboardClient {...data} />
      <HelpdeskUpload />
    </div>
  );
}
```

- `router.refresh()` after a successful upload re-runs the server component's data fetch (`getHelpdeskDashboardData`), so the KPI tile, filters, and every chart populate immediately with the newly imported rows — no separate "go check the dashboard" step, satisfying "auto masukin mapping data ke dashboardnya."
- Uploading is additive (`createMany`), matching `enhancement-01.md` §8's batch/rollback model (`uploadId` on each ticket) — re-uploading a corrected file is a new batch, not an in-place overwrite, so a bad upload can still be rolled back via `DELETE /api/helpdesk/uploads/:id` without touching other batches.
