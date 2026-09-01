# Enhancement — Log Management (Settings)

## Summary

Add a third card, **Log Management**, to the Settings landing page (`app/(dashboard)/settings/page.tsx`, specced in `PRD/Enhancement/system_SettingsManagement.md`), alongside the existing User Management and Dev Console cards. It links to a new admin-only page that shows per-user activity logs and login status.

| # | Requirement | Fix |
|---|---|---|
| 1 | Generate logs on a per-profile basis | Every log entry (`AuditLog`) is tied to the `User` who performed it — logs are always queryable "by profile" |
| 2 | Display login date/time status | A `lastLoginAt` timestamp on `User`, surfaced as a status column ("Online now" / "Xh ago" / "Never logged in") |
| 3 | A list of user activity logs | A paginated activity log table (action, entity, timestamp, actor) fed by a `logActivity()` helper called from the existing mutating API routes |
| 4 | Filter by user | A user picker above the log table that filters the list to one user (or "All users") |

This depends on the same auth/session baseline already flagged in `PRD/Enhancement/system_SettingsManagement.md` §0 (no login system yet, `requireAdmin()` is a stand-in) — login *events* specifically can't be captured for real until that lands, but the schema, UI, and non-login activity logging (create/update/delete) can be built now.

---

## 1. Settings Landing Card

**Fix** (`app/(dashboard)/settings/page.tsx`) — add a third card in the same grid, following the same padding fix already specced for the other two cards:

```tsx
<div className="grid gap-4 md:grid-cols-3">
  {/* existing User Management, Dev Console cards (md:grid-cols-2 -> md:grid-cols-3) */}
  <Link href="/settings/logs">
    <Card className="h-full transition hover:-translate-y-0.5 hover:shadow-md">
      <CardContent className="space-y-3 p-5 pt-7">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
          <ScrollText className="h-4 w-4" />
        </span>
        <h3 className="section-title">Log Management</h3>
        <p className="text-sm text-muted">Review login activity and audit logs per user.</p>
      </CardContent>
    </Card>
  </Link>
</div>
```

(`ScrollText` from `lucide-react`.) Note the grid changes from `md:grid-cols-2` to `md:grid-cols-3` to fit the new card without shrinking the existing two.

---

## 2. Data Model — `AuditLog` + `lastLoginAt`

```prisma
enum AuditAction {
  login
  create
  update
  delete
}

model AuditLog {
  id         String      @id @default(cuid())
  userId     String
  action     AuditAction
  entityType String      // e.g. "Project", "Task", "User"
  entityId   String?
  metadata   Json?       // e.g. { "status": "completed" } - a small diff/summary, not a full payload dump
  createdAt  DateTime    @default(now())

  user User @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([createdAt])
}

model User {
  // ...existing fields
  lastLoginAt DateTime?
  auditLogs   AuditLog[]
}
```

- `userId` is required (never nullable) — this is what makes every log "per-profile": there is no such thing as an unattributed log entry. Once real auth exists, `login` actions come from the auth callback itself; until then, `login` rows simply won't be produced (see §3).
- `metadata` stays a small `Json` summary (e.g. `{ "from": "planning", "to": "in_progress" }`), not the full request body — avoids logging sensitive fields (like a password change) and keeps rows small.
- Indexes on `userId` and `createdAt` support the two access patterns this page needs: "logs for user X" and "most recent logs first."

---

## 3. Generating Logs (Requirement 1 + 3)

**`lib/audit-log.ts`** (new file) — a single helper called from every mutating route:

```ts
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

export async function logActivity(params: {
  userId: string;
  action: 'login' | 'create' | 'update' | 'delete';
  entityType: string;
  entityId?: string;
  metadata?: Prisma.InputJsonValue;
}) {
  await prisma.auditLog.create({ data: params });
}
```

**Integration points** — call `logActivity()` from the existing routes right after each mutation succeeds:

| Route | Action | Example call |
|---|---|---|
| `POST /api/projects` | `create` | `logActivity({ userId: actor.id, action: 'create', entityType: 'Project', entityId: project.id, metadata: { code: project.code } })` |
| `PATCH /api/projects/[id]` | `update` | `logActivity({ userId: actor.id, action: 'update', entityType: 'Project', entityId: id, metadata: parsed.data })` |
| `DELETE /api/projects/[id]` | `delete` | `logActivity({ userId: actor.id, action: 'delete', entityType: 'Project', entityId: id })` |
| `POST /api/tasks`, `PATCH /api/tasks/[id]`, `DELETE /api/tasks/[id]` | same pattern, `entityType: 'Task'` | |
| `POST /api/users`, `DELETE /api/users/[id]` (from `system_SettingsManagement.md` §2) | same pattern, `entityType: 'User'` | |

Example, applied to `app/api/projects/[id]/route.ts`:

```ts
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const parsed = projectSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid project payload' }, { status: 400 });
  }

  const project = await updateProject(id, parsed.data);
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

  const actor = await getCurrentUser();
  if (actor) await logActivity({ userId: actor.id, action: 'update', entityType: 'Project', entityId: id, metadata: parsed.data });

  return NextResponse.json(project);
}
```

- `getCurrentUser()` is the same session helper depended on throughout this Settings work — wiring `logActivity` in now means every route already has the one line to add once real sessions exist; until then this can run against the "acting as" stand-in user.
- Logging is fire-and-forget relative to the response (don't block/fail the request if the audit write fails) — wrap in `.catch(() => {})` or run it after `NextResponse.json(...)` is constructed, so a logging outage never breaks a real user action.

---

## 4. Login Date/Time Status (Requirement 2)

**Fix:**
- `User.lastLoginAt` (§2) is set the moment a session is established: `prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })`, alongside a `logActivity({ action: 'login', ... })` call — both belong in the auth callback once it exists (not buildable for real today, per the baseline note in §0).
- **Status rendering** (`components/log-management-client.tsx`, part of §5's page) — a small helper turns the timestamp into the "Online now / Xh ago / Never logged in" copy from the reference-style status column:

```ts
// lib/format.ts (addition)
export function loginStatus(lastLoginAt: string | null): string {
  if (!lastLoginAt) return 'Never logged in';
  const minutesAgo = Math.floor((Date.now() - new Date(lastLoginAt).getTime()) / 60000);
  if (minutesAgo < 5) return 'Online now';
  if (minutesAgo < 60) return `${minutesAgo}m ago`;
  if (minutesAgo < 24 * 60) return `${Math.floor(minutesAgo / 60)}h ago`;
  return new Date(lastLoginAt).toLocaleString();
}
```

- This status renders per-user in both the User Management table (§ cross-reference to `system_SettingsManagement.md` §2) and at the top of this user's filtered log view (§5), so "is this person currently active" is visible from either page.

---

## 5. Activity Log List + Filter by User (Requirement 3 + 4)

**API** (`app/api/logs/route.ts`, new file) — admin-only, paginated, optionally filtered by `userId`:

```ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';

export async function GET(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId') || undefined;
  const cursor = searchParams.get('cursor') || undefined;

  const logs = await prisma.auditLog.findMany({
    where: userId ? { userId } : undefined,
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: 'desc' },
    take: 50,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {})
  });

  return NextResponse.json({ logs, nextCursor: logs.length === 50 ? logs[logs.length - 1].id : null });
}
```

- Cursor pagination (`take: 50` + `cursor`) rather than offset pagination — an activity log grows unbounded, so this keeps each page cheap regardless of table size.
- `userId` filter is a plain equality match on an indexed column (§2) — the "filter by user" requirement, not a free-text search.

**Page** (`app/(dashboard)/settings/logs/page.tsx`, new file):

```tsx
import { PageHeader } from '@/components/page-header';
import { getUsers } from '@/lib/api';
import { LogManagementClient } from '@/components/log-management-client';

export default async function LogManagementPage() {
  const users = await getUsers();
  return (
    <div className="space-y-6">
      <PageHeader title="Log Management" subtitle="Review login activity and audit logs per user." />
      <LogManagementClient users={users} />
    </div>
  );
}
```

**Client component** (`components/log-management-client.tsx`, new file, sketch):

```tsx
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, Select } from './ui';
import { loginStatus } from '@/lib/format';
import type { User } from '@/lib/types';

interface LogRow {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  createdAt: string;
  user: { id: string; name: string; email: string };
}

export function LogManagementClient({ users }: { users: User[] }) {
  const [selectedUserId, setSelectedUserId] = useState('');
  const [logs, setLogs] = useState<LogRow[]>([]);

  useEffect(() => {
    const query = selectedUserId ? `?userId=${selectedUserId}` : '';
    fetch(`/api/logs${query}`)
      .then((response) => response.json())
      .then((data) => setLogs(data.logs));
  }, [selectedUserId]);

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 p-5 pt-7">
          <span className="label">Filter by user</span>
          <Select value={selectedUserId} onChange={(event) => setSelectedUserId(event.target.value)}>
            <option value="">All users</option>
            {users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="min-w-full border-separate border-spacing-0 text-sm">
            <thead>
              <tr>
                <th className="border-b border-border px-4 py-3 text-left">User</th>
                <th className="border-b border-border px-4 py-3 text-left">Action</th>
                <th className="border-b border-border px-4 py-3 text-left">Entity</th>
                <th className="border-b border-border px-4 py-3 text-left">When</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="border-b border-border px-4 py-3">
                    <p className="font-medium text-ink">{log.user.name}</p>
                    <p className="text-xs text-muted">{log.user.email}</p>
                  </td>
                  <td className="border-b border-border px-4 py-3 capitalize">{log.action}</td>
                  <td className="border-b border-border px-4 py-3">{log.entityType}{log.entityId ? ` · ${log.entityId}` : ''}</td>
                  <td className="border-b border-border px-4 py-3 text-muted">{new Date(log.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {logs.length === 0 ? <p className="p-4 text-sm text-muted">No activity yet.</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
```

- "Load more" (using the API's `nextCursor`) is a straightforward follow-up once the base list works — omitted here for brevity, but the API already supports it.
- Every card on this page uses `p-5 pt-7` (§1's padding convention), consistent with the rest of the Settings area.

## Out of Scope

- Exporting logs (CSV/Excel) — can reuse the same `exceljs` pattern already used for Reports (`app/api/reports/export/route.ts`) as a fast follow, but wasn't asked for here.
- Real-time "who's online now" beyond the `lastLoginAt`-derived "Online now" heuristic (§4) — a true presence system (websockets/heartbeat) is a much larger feature and out of scope for this doc.
