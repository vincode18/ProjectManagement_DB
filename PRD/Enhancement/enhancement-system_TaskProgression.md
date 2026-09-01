# Enhancement — Task Completion → Project Progress Cascade

## Summary

Wires up the "Complete this task" checkbox (the `Done` column on the Project Detail task table) so it actually drives the project's completion percentage and, once every task is done, flips the project's status to `Complete` automatically. This closes the loop between two things already specced separately:

- `PRD/PRD-ProjectFormsUpdate.md` §4 — the task table's `Progress` slider becomes a **checkbox** (`Done` column, checked = `progress: 100` / `status: completed`).
- `PRD/Enhancement/enhancement-02.md` §4 — project cards show **"completed ÷ total tasks"** instead of an averaged progress bar.

Neither of those, on their own, updates the `Project.status` field. This document adds that missing cascade.

| # | Requirement | Fix |
|---|---|---|
| 1 | Checking "Complete this task" increases the project's completion % | Already true by construction once `PRD-ProjectFormsUpdate.md` §4 + `enhancement-02.md` §4 both ship — §1 below explains why, and confirms the exact formula |
| 2 | All tasks done → project status auto-changes to `Complete` | A cascade in `updateTask` (`lib/store.ts`) that re-checks the project's task list on every completion toggle and updates `Project.status` when 100% is reached |
| 3 | Completing a task contributes to overall project progress | Same underlying computation as #1 — §1 and §3 are the same mechanism, viewed from "why does this work" vs. "what's the formula" |

---

## 1. Why Checking a Task Already Moves the Percentage

**No new code needed here** — this is a consequence of two already-specced changes, worth confirming explicitly since the requirement calls it out directly:

- `lib/health.ts#calculateOverallProgress` is being changed (per `enhancement-02.md` §4) from *averaging* `task.progress` to counting **completed tasks ÷ total tasks**:

```ts
// lib/health.ts
export function calculateOverallProgress(tasks: Task[], fallback = 0) {
  if (tasks.length === 0) return fallback;
  const completed = tasks.filter((task) => task.status === 'completed').length;
  return Math.round((completed / tasks.length) * 100);
}
```

- `overallProgress` is **computed on read**, not stored — `withComputedProject` (`lib/api.ts`) calls `calculateOverallProgress(tasks, ...)` every time a project is fetched. So the moment a task's `status` flips to `completed` (via the "Complete this task" checkbox, `PRD-ProjectFormsUpdate.md` §4) and the page re-renders (`router.refresh()`, already part of that checkbox's `update()` handler), the very next read recomputes `overallProgress` from the new task list — no separate "recalculate progress" step to write.

This is requirement #1 and #3 in one: because progress is derived, not cached, "completing a task contributes to overall progress" is just what `calculateOverallProgress` *is* — there's nothing to wire beyond making sure `status` (not `progress`) is what the checkbox writes, which §4's spec already covers.

---

## 2. "All Tasks Done" Label

**Fix** (`components/project-card.tsx`, `components/project-detail-client.tsx` — wherever `enhancement-02.md` §4's `X/Y · Z%` readout renders):

```tsx
function progressLabel(completedTasks: number, totalTasks: number) {
  if (totalTasks === 0) return 'No tasks yet';
  if (completedTasks === totalTasks) return 'All Tasks Done';
  return `${completedTasks}/${totalTasks} tasks · ${Math.round((completedTasks / totalTasks) * 100)}%`;
}
```

```tsx
<p className="text-sm font-semibold text-ink">{progressLabel(project.completedTasks, project.totalTasks)}</p>
```

- This is purely a display change — `completedTasks`/`totalTasks` are the same fields `enhancement-02.md` §4 already adds to `withComputedProject`.
- The reference screenshot shows `1/1 tasks · 100%` still rendering as a fraction, not yet as "All Tasks Done" — so this label swap is itself part of what makes the trigger in §3 legible: the UI should read "All Tasks Done" at the exact moment the cascade below fires.

---

## 3. Auto-Complete the Project When Every Task Is Done

**Problem:** `Project.status` is a plain stored enum field (`prisma/schema.prisma`) with no logic anywhere that reacts to task completion — a project with all tasks `completed` can still show `status: in_progress` indefinitely unless someone manually edits it.

**Fix — cascade inside `updateTask`** (`lib/store.ts`), so this fires no matter which UI path calls it (the checkbox, the task edit form, a future bulk-update):

```ts
// lib/store.ts
export async function updateTask(id: string, patch: Partial<Task>) {
  const existing = await prisma.task.findUnique({ where: { id } });
  if (!existing) return null;

  const task = await prisma.task.update({
    where: { id },
    data: {
      // ...existing field mapping
      progress: patch.progress,
      status: patch.status
    }
  });

  if (patch.status !== undefined && patch.status !== existing.status) {
    await syncProjectCompletion(task.projectId);
  }

  return task;
}

async function syncProjectCompletion(projectId: string) {
  const [project, tasks] = await Promise.all([
    prisma.project.findUnique({ where: { id: projectId } }),
    prisma.task.findMany({ where: { projectId }, select: { status: true } })
  ]);
  if (!project || tasks.length === 0) return;

  const allCompleted = tasks.every((task) => task.status === 'completed');

  if (allCompleted && project.status !== 'completed') {
    await prisma.project.update({
      where: { id: projectId },
      data: { status: 'completed', actualEndDate: new Date() }
    });
  } else if (!allCompleted && project.status === 'completed') {
    // A previously "all done" project just had a task un-checked (or a new
    // incomplete task was added) - it can no longer be Complete.
    await prisma.project.update({
      where: { id: projectId },
      data: { status: 'in_progress', actualEndDate: null }
    });
  }
}
```

- **Trigger condition:** only re-checks completion when a task's `status` actually changed (`patch.status !== undefined && patch.status !== existing.status`) — editing a task's name/dates/assignee doesn't need to re-run this.
- **Forward direction (the requirement):** every task `completed` → project `status: 'completed'`, and `actualEndDate` is stamped with "now," matching the semantics already implied by `Project.actualEndDate` in the schema (an existing field that was never actually set by any code path until now).
- **Reverse direction (necessary for correctness, not explicitly asked but follows from the same rule):** if a task on an auto-completed project gets unchecked — or a new not-yet-done task is added to it — the project can't legitimately stay `Complete` while a task is open, so it reverts to `in_progress` and clears `actualEndDate`. Flagging this as a product decision worth confirming: an alternative is to *leave* a manually-completed project alone and only auto-complete forward, never auto-revert — call this out to the user before implementing if the one-way version is preferred.
- **Empty-tasks guard:** `tasks.length === 0` short-circuits — a brand-new project with zero tasks should never be silently marked `Complete`.
- This lives in `lib/store.ts` rather than the API route (`app/api/tasks/[id]/route.ts`) so it also applies to task creation/deletion paths that route through the same module, not just the `PATCH` used by the checkbox — see §4.

---

## 4. Same Cascade on Task Create/Delete

**Problem:** completion isn't only reached by checking a box — deleting the last incomplete task, or adding a task to a project that already looked "done" via task count, both change whether "all tasks are completed" is true.

**Fix:** call the same `syncProjectCompletion` helper from `createTask` and `deleteTask` in `lib/store.ts`:

```ts
export async function createTask(data: TaskInput) {
  const task = await prisma.task.create({ data: /* ... */ });
  await syncProjectCompletion(task.projectId);
  return task;
}

export async function deleteTask(id: string) {
  const existing = await prisma.task.findUnique({ where: { id } });
  if (!existing) return false;
  await prisma.task.delete({ where: { id } });
  await syncProjectCompletion(existing.projectId);
  return true;
}
```

- Deleting the one remaining incomplete task in an otherwise-done project should complete it, same as checking its box would have.
- Adding a new (necessarily incomplete) task to a `Complete` project should revert it to `in_progress` — you can't have 100% completion with an open task sitting in the list.

## Out of Scope

- Notifying the project owner/manager when a project auto-completes (email, in-app notification) — no notification system exists in this app; flagged as a natural follow-up, not built here.
- Letting an admin "lock" a project's status so it can't be auto-reverted by the §3 reverse-direction rule — noted as the alternative in §3, not implemented unless the one-way behavior is what's wanted.
