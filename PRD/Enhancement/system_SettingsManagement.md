# Enhancement — System Settings Management (Settings, User Management, Dev Console)

## Summary

This introduces a new **Settings** area of the app with two sections — **User Management** and **Dev Console** — neither of which exist in the codebase today (there is no `/settings` route, no admin-only pages, and `role` on `User` is a free-form string with no enforcement anywhere). This document specs the pages, the data-model/auth changes they depend on, and three concrete requirements:

| # | Area | Requirement |
|---|---|---|
| 1 | Settings landing cards + Dev Console page | Fix top padding so content isn't flush against the card edge |
| 2 | User Management | Admin-only create/delete of users |
| 3 | Dev Console | A "Filter Query" builder that queries the database safely and renders results as a table |

---

## 0. Baseline — What Doesn't Exist Yet

Before speccing the fixes, note what this build depends on, since none of it is in the codebase today:

- **No `/settings` route.** Nothing under `app/(dashboard)/settings/`.
- **No admin/auth session.** The app has no login flow (`app/page.tsx` is just a marketing/onboarding screen), so there is no concept of "the current logged-in user" to check a role against yet. Every "Admin only" requirement below assumes a `getCurrentUser()`/session helper will exist — until real auth lands, gate these routes behind a stand-in (e.g. a hardcoded "acting as" user in `lib/session.ts`, clearly marked `// TODO: replace with real auth`) rather than leaving them open.
- **`role` is an unconstrained string.** `prisma/schema.prisma`'s `User.role` is `String`, not an enum (`lib/types.ts#User.role: string` matches). To gate anything on "is Admin", this needs to become a real enum:

```prisma
enum UserRole {
  admin
  member
}

model User {
  // ...existing fields
  role UserRole @default(member)
}
```

```ts
// lib/validators.ts
export const userRoleSchema = z.enum(['admin', 'member']);
```

- **Sidebar entry.** `components/side-nav.tsx` currently has no "Manage Users"/"Settings" item (it was intentionally left out in an earlier pass because no page backed it — see `Documentation/rebranding-workzen.md`). Add it back now that the page exists:

```tsx
const bottomNavItems = [
  { href: '/planner', label: 'MyPlanner', icon: ClipboardList },
  { href: '/reports', label: 'Reports', icon: Table2 },
  { href: '/settings', label: 'Manage Users', icon: ShieldCheck } // new
];
```

(`ShieldCheck` from `lucide-react`, matching the shield icon already used for "Manage Users" in the target sidebar design.)

---

## 1. Top Padding — Settings Cards & Dev Console

**Problem:** in the target layout, the two Settings landing cards (User Management, Dev Console) have their icon badge sitting flush against the card's top edge, and the Dev Console page's title block ("Dev Console" / "Admin-only runtime snapshot...") sits flush against its containing card's top edge too — the same "content flush against card top" issue already fixed elsewhere in this app (see `Documentation/projects-tab-ui-update.md` and `PRD/PRD-ProjectTabsinformation.md`).

**Fix — Settings landing cards** (`app/(dashboard)/settings/page.tsx`):

```tsx
<div className="grid gap-4 md:grid-cols-2">
  <Link href="/settings/users">
    <Card className="h-full transition hover:-translate-y-0.5 hover:shadow-md">
      <CardContent className="space-y-3 p-5 pt-7">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
          <ShieldCheck className="h-4 w-4" />
        </span>
        <h3 className="section-title">User Management</h3>
        <p className="text-sm text-muted">Update roles, teams, and account status.</p>
      </CardContent>
    </Card>
  </Link>
  <Link href="/settings/dev-console">
    <Card className="h-full transition hover:-translate-y-0.5 hover:shadow-md">
      <CardContent className="space-y-3 p-5 pt-7">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
          <Terminal className="h-4 w-4" />
        </span>
        <h3 className="section-title">Dev Console</h3>
        <p className="text-sm text-muted">Runtime diagnostics for administrators.</p>
      </CardContent>
    </Card>
  </Link>
</div>
```

The key change is `p-5` → `p-5 pt-7` on `CardContent`, same pattern used on `ProjectCard`.

**Fix — Dev Console page** (`app/(dashboard)/settings/dev-console/page.tsx`): wrap the title block and snapshot table in a `Card`/`CardContent` with the same top-padding bump (`p-6 pt-8` for the outer container), rather than raw `<div>`s with no padding at all.

---

## 2. User Management — Admin-Only Create/Delete

**Problem:** there is no UI or API for creating or removing users; `app/api/users/route.ts` only has `GET`.

**Fix:**

**a) API — gate by role, add POST/DELETE** (`app/api/users/route.ts`):

```ts
import { NextResponse } from 'next/server';
import { getUsers } from '@/lib/api';
import { createUser } from '@/lib/store';
import { userSchema } from '@/lib/validators';
import { requireAdmin } from '@/lib/session';

export async function GET() {
  return NextResponse.json(await getUsers());
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

  const body = await request.json();
  const parsed = userSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid user payload' }, { status: 400 });
  }

  const user = await createUser(parsed.data);
  return NextResponse.json(user, { status: 201 });
}
```

```ts
// app/api/users/[id]/route.ts (new file)
import { NextResponse } from 'next/server';
import { deleteUser } from '@/lib/store';
import { requireAdmin } from '@/lib/session';

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

  const { id } = await params;
  await deleteUser(id);
  return NextResponse.json({ ok: true });
}
```

```ts
// lib/validators.ts
export const userSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  role: userRoleSchema.default('member')
});
```

- Deleting a user who owns/manages projects or is assigned tasks needs a decision: block the delete (`409 Conflict` with a clear message) if `managedProjects`/`ownedProjects`/`assignedTasks` is non-empty, rather than silently cascading — reassigning ownership isn't something this endpoint should guess at.

**b) UI — user table + create/delete, admin-gated** (`app/(dashboard)/settings/users/page.tsx`):

```tsx
import { PageHeader } from '@/components/page-header';
import { getUsers } from '@/lib/api';
import { getCurrentUser } from '@/lib/session';
import { UserManagementClient } from '@/components/user-management-client';

export default async function UserManagementPage() {
  const [users, currentUser] = await Promise.all([getUsers(), getCurrentUser()]);
  const isAdmin = currentUser?.role === 'admin';

  return (
    <div className="space-y-6">
      <PageHeader title="User Management" subtitle="Update roles, teams, and account status." />
      <UserManagementClient users={users} isAdmin={isAdmin} />
    </div>
  );
}
```

```tsx
// components/user-management-client.tsx (new file) — sketch
'use client';
// table of users (name, email, role, actions)
// isAdmin === true -> show "+ Add User" button (opens a modal with name/email/role fields, same
//   NewProjectModal + ProjectForm pattern already used elsewhere) and a "Delete" action per row
// isAdmin === false -> render the table read-only, no create/delete controls at all
```

- Enforce admin-only **both** in the API (section a — the real boundary) **and** by hiding the controls client-side (defense in depth / avoids a confusing UI where a non-admin sees buttons that always fail).

---

## 3. Dev Console — Filter Query Builder

**Problem:** the Dev Console currently only shows a static read-only snapshot (Node environment, user/project/task counts). There's no way to query/filter the underlying data from the UI.

**Security note (must-follow):** "run queries to filter data directly from the database" must **not** mean accepting raw SQL or string-built queries from the browser — that's a direct SQL-injection / data-exfiltration risk, especially on an admin page. Instead, build a **structured filter** (field + operator + value, like the attached reference image) that the server translates into a **whitelisted Prisma `where` clause**. The user only ever picks from known fields/operators; the server never concatenates user input into a query string.

**a) Whitelisted filterable fields** (`lib/dev-console.ts`, new file):

```ts
export const FILTERABLE_ENTITIES = {
  projects: {
    label: 'Projects',
    fields: {
      status: { label: 'Status', type: 'enum', options: ['not_started', 'planning', 'in_progress', 'on_hold', 'completed', 'delayed'] },
      priority: { label: 'Priority', type: 'enum', options: ['high', 'medium', 'low'] },
      code: { label: 'Code', type: 'text' },
      name: { label: 'Name', type: 'text' }
    }
  },
  tasks: {
    label: 'Tasks',
    fields: {
      status: { label: 'Status', type: 'enum', options: ['not_started', 'planning', 'in_progress', 'on_hold', 'completed', 'delayed'] },
      priority: { label: 'Priority', type: 'enum', options: ['high', 'medium', 'low'] },
      isMilestone: { label: 'Milestone', type: 'boolean' }
    }
  },
  users: {
    label: 'Users',
    fields: {
      role: { label: 'Role', type: 'enum', options: ['admin', 'member'] }
    }
  }
} as const;

export type FilterableEntity = keyof typeof FILTERABLE_ENTITIES;
```

**b) Request/response contract** (`lib/validators.ts`):

```ts
const filterConditionSchema = z.object({
  field: z.string(),
  operator: z.enum(['is', 'is_not', 'contains']),
  value: z.union([z.string(), z.array(z.string())])
});

export const devConsoleQuerySchema = z.object({
  entity: z.enum(['projects', 'tasks', 'users']),
  conjunction: z.enum(['AND', 'OR']),
  conditions: z.array(filterConditionSchema).min(1).max(10)
});
```

**c) API — validate against the whitelist, build a Prisma `where`** (`app/api/dev-console/query/route.ts`, new file):

```ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { devConsoleQuerySchema } from '@/lib/validators';
import { FILTERABLE_ENTITIES } from '@/lib/dev-console';
import { requireAdmin } from '@/lib/session';

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

  const parsed = devConsoleQuerySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid query' }, { status: 400 });
  }

  const { entity, conjunction, conditions } = parsed.data;
  const allowedFields = FILTERABLE_ENTITIES[entity].fields;

  // Reject any field not in the whitelist for this entity - never trust the client's field name.
  for (const condition of conditions) {
    if (!(condition.field in allowedFields)) {
      return NextResponse.json({ error: `Unknown field "${condition.field}" for ${entity}` }, { status: 400 });
    }
  }

  const clauses = conditions.map((condition) => {
    if (condition.operator === 'contains') {
      return { [condition.field]: { contains: condition.value, mode: 'insensitive' } };
    }
    const isNot = condition.operator === 'is_not';
    const value = Array.isArray(condition.value) ? { in: condition.value } : condition.value;
    return { [condition.field]: isNot ? { not: value } : value };
  });

  const where = conjunction === 'AND' ? { AND: clauses } : { OR: clauses };
  const model = { projects: prisma.project, tasks: prisma.task, users: prisma.user }[entity];
  const rows = await model.findMany({ where: where as never, take: 200 });

  return NextResponse.json({ rows });
}
```

- `take: 200` caps result size — an admin diagnostic tool shouldn't be able to dump an entire table unbounded.
- Field validation happens **before** the query is built — an unrecognized field name is rejected outright rather than passed through.

**d) UI — filter builder + results table** (`components/dev-console-filter.tsx`, new file), matching the attached reference image's shape:

```tsx
'use client';

import { useState } from 'react';
import { Button, Select, Input, Card, CardContent } from './ui';
import { FILTERABLE_ENTITIES, type FilterableEntity } from '@/lib/dev-console';

type Condition = { field: string; operator: 'is' | 'is_not' | 'contains'; value: string };

export function DevConsoleFilter() {
  const [entity, setEntity] = useState<FilterableEntity>('projects');
  const [conjunction, setConjunction] = useState<'AND' | 'OR'>('AND');
  const [conditions, setConditions] = useState<Condition[]>([{ field: '', operator: 'is', value: '' }]);
  const [rows, setRows] = useState<Record<string, unknown>[] | null>(null);
  const [loading, setLoading] = useState(false);

  const fields = FILTERABLE_ENTITIES[entity].fields;

  async function applyFilter() {
    setLoading(true);
    const response = await fetch('/api/dev-console/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entity, conjunction, conditions })
    });
    const data = await response.json();
    setLoading(false);
    setRows(response.ok ? data.rows : []);
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-3 p-5 pt-7">
          <div className="flex flex-wrap items-center gap-2">
            <span className="label">Entity</span>
            <Select value={entity} onChange={(event) => setEntity(event.target.value as FilterableEntity)}>
              {Object.entries(FILTERABLE_ENTITIES).map(([key, def]) => (
                <option key={key} value={key}>{def.label}</option>
              ))}
            </Select>
          </div>

          {conditions.map((condition, index) => (
            <div key={index} className="flex flex-wrap items-center gap-2">
              <Select value={condition.field} onChange={(event) => updateCondition(index, { field: event.target.value })}>
                <option value="">Property</option>
                {Object.entries(fields).map(([key, def]) => <option key={key} value={key}>{def.label}</option>)}
              </Select>
              <Select value={condition.operator} onChange={(event) => updateCondition(index, { operator: event.target.value as Condition['operator'] })}>
                <option value="is">is</option>
                <option value="is_not">is not</option>
                <option value="contains">contains</option>
              </Select>
              <Input placeholder="Value" value={condition.value} onChange={(event) => updateCondition(index, { value: event.target.value })} />
              {index > 0 && (
                <div className="flex gap-1">
                  <Button variant={conjunction === 'AND' ? 'primary' : 'secondary'} onClick={() => setConjunction('AND')}>AND</Button>
                  <Button variant={conjunction === 'OR' ? 'primary' : 'secondary'} onClick={() => setConjunction('OR')}>OR</Button>
                </div>
              )}
            </div>
          ))}

          <Button variant="ghost" onClick={() => setConditions((current) => [...current, { field: '', operator: 'is', value: '' }])}>
            + Add Property
          </Button>

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setRows(null)}>Cancel</Button>
            <Button onClick={applyFilter} disabled={loading}>{loading ? 'Running...' : 'Apply Filter'}</Button>
          </div>
        </CardContent>
      </Card>

      {rows ? (
        <Card>
          <CardContent className="overflow-x-auto p-0">
            <table className="min-w-full text-sm">
              <thead>
                <tr>
                  {rows[0] ? Object.keys(rows[0]).map((key) => <th key={key} className="border-b border-border px-4 py-3 text-left">{key}</th>) : null}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={index}>
                    {Object.values(row).map((value, cellIndex) => (
                      <td key={cellIndex} className="border-b border-border px-4 py-3">{String(value ?? '—')}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length === 0 ? <p className="p-4 text-sm text-muted">No matching rows.</p> : null}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );

  function updateCondition(index: number, patch: Partial<Condition>) {
    setConditions((current) => current.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }
}
```

- Switching `entity` should reset `conditions` to `[{ field: '', operator: 'is', value: '' }]` (an effect keyed on `entity`) since field options differ per entity — omitted above for brevity but needed before this ships.
- The reference image's "Boston OR 8 others" multi-value chip UI is a nice-to-have; the spec above supports a single value per condition to start, with multi-value (`in`) as a fast-follow once the basic flow works.
