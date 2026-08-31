# Enhancement 02 — Gantt Row Height, Task Form as Popup, Simplified Task Fields, Task-Count Progress

This document extends `enhancement-01.md` with a second round of UI/UX fixes requested after reviewing the current build: the Gantt chart rows read as too short, the "New Task" form is inline instead of a popup, the form has more fields than needed, and project completion is shown as a slider instead of a task-count percentage.

## Summary

| # | Module | Problem | Fix |
|---|---|---|---|
| 1 | Gantt Chart | Row/bar height is too short, chart reads as cramped | Increase row height (and header height to match) |
| 2 | Task Form | "New Task" form renders inline on the page instead of as a popup | Wrap `TaskForm` (create mode) in a modal, triggered by an "Add Task" button |
| 3 | Task Form | Too many fields, inconsistent labeling, no task-size field | Simplify to a fixed field set with plain labels, add a Task Level (`small` / `medium` / `big`) field |
| 4 | Project Card / Kanban Card | Progress shown as a slider/progress bar with an average percentage | Show progress as "completed tasks / total tasks" and its percentage, no slider |

---

## 1. Gantt Chart — Taller Rows

**Problem:** in `components/gantt-chart.tsx`, each project/task row wraps its bar in a fixed `h-14` (56px) container (`<div className="relative flex h-14 items-center">`, around line 129), and the header cells use `py-3`. At the current height the bars and week-header text feel cramped, especially compared to the target Gantt layout (taller bars, more breathing room per row).

**Fix:**
- Increase the row height from `h-14` (56px) to `h-20` (80px) in `GanttChart`'s row container.
- Increase the bar height proportionally (currently `h-6`, 24px) to roughly `h-8` (32px) so it stays visually centered in the taller row.
- Increase the header row's vertical padding (`py-3` → `py-4`) so the header height stays proportional to the new row height.
- This affects every place that renders `GanttChart`: the project-level Gantt (`app/(dashboard)/gantt/page.tsx` via `components/gantt-page-client.tsx`) and its task-level drill-down modal — both reuse the same component, so the height change applies everywhere automatically.

---

## 2. Task Form — Convert "New Task" to a Popup

**Problem:** in `components/project-detail-client.tsx` (around line 180), the create-mode `TaskForm` is rendered inline at the bottom of the project's task list (`<TaskForm project={project} tasks={tasks} users={users} mode="create" />`), pushing the page layout down every time a task is added. This is the same pattern that `enhancement-01.md` #3 already fixed for "New Project".

**Fix:**
- Add an **"+ Add Task"** button (primary style, `Plus` icon) near the task list header on the project detail page.
- Introduce a client component (e.g. `components/new-task-modal.tsx`), mirroring `components/new-project-modal.tsx`: it holds `open` state, and renders `<Modal>` wrapping `<TaskForm mode="create" ... onSaved={() => setOpen(false)} />`.
- Remove the always-visible inline `TaskForm` from `project-detail-client.tsx` and replace it with the new modal trigger.
- Close behavior matches the existing `Modal` component: backdrop click, close (×) button, or `Esc`.

---

## 3. Task Form — Simplified Fields + Task Level

**Problem:** the current `TaskForm` (`components/task-form.tsx`) exposes many fields with terse or database-style labels: WBS code, assignee, parent task, start/end date, status, priority, a manual `0–100` progress number, a milestone checkbox, a dependency task + dependency type (`FS`/`SS`/`FF`/`SF`), and free-text remarks. This is more than a task-creation popup needs, and none of it currently expresses "how big" a task is.

> **Minor edit:** the dependency **type** selector (`FS`/`SS`/`FF`/`SF`) is not needed — keep only the dependency task picker itself.

**Fix — target field set (simple, self-explanatory labels):**

| Field | Label | Notes |
|---|---|---|
| `name` | **Task Name** | existing field, unchanged |
| dependency | **Dependency** | keep only the existing "depends on task" picker (`dependsOnTaskId`) as a single **Dependency** field — drop the dependency type (`FS`/`SS`/`FF`/`SF`) selector, it isn't needed |
| `startDate` | **Start** | existing field, unchanged |
| `endDate` | **End** | existing field, unchanged |
| `remarks` | **Description** | rename the existing free-text field from "Remarks" to "Description" |
| `status` | **Status** | existing field; this is also the field used to place the task into the Kanban board (see Open Question below) |
| *(new)* `level` | **Task Level** | new `small` / `medium` / `big` selector — sizes the task (a lightweight substitute for story points) |

- WBS code stays server-generated (the popup already tells the user "Task Code is generated automatically by the server after save"), so it is dropped from the visible form rather than typed manually.
- Assignee, priority, milestone, and the manual progress number move out of the primary simplified form. If they are still needed operationally, they can live under a collapsed "More fields" section rather than the default view — flag this trade-off with the user before removing them outright, since priority currently feeds the `PriorityPill` shown elsewhere.

**Data model change:**

```prisma
enum TaskLevel {
  small
  medium
  big
}

model Task {
  // ...existing fields
  level TaskLevel @default(medium)
}
```

**Open question — Status driving Kanban:** today the Kanban board (`app/(dashboard)/kanban/page.tsx`, rendered by `components/kanban-board.tsx`) is **project-level** — columns are `ProjectStatus`, and each card is a project, not a task. Making a task's `Status` field "used to add it in Kanban" implies either (a) a new **task-level** Kanban view scoped to a project, using `Task.status` for columns, or (b) reusing the existing project-level board as-is. This needs a decision before implementation — the fix above assumes a new task-level Kanban is in scope, since the current board has no task cards at all.

---

## 4. Project Card / Kanban Card — Task-Count Progress Instead of a Slider

**Problem:** `overallProgress` (computed in `lib/health.ts#calculateOverallProgress`) is the **average of each task's `progress` field** (0–100), and both `components/project-card.tsx` and the `KanbanCard` in `components/kanban-board.tsx` render it with a `ProgressBar` (a filled slider/bar) plus a `%` label next to it. This doesn't reflect "how many tasks are actually done" — e.g. 8 tasks each at 50% progress shows the same bar as 4 tasks fully done and 4 not started.

**Fix:**
- Change the progress metric from "average task progress" to **"completed tasks ÷ total tasks"**. Example: a project with 8 tasks where 4 have `status = completed` shows **4/8 (50%)**.
- Remove the `ProgressBar` slider from `ProjectCard` and from the Kanban card; replace it with a plain text readout, e.g. `4/8 tasks · 50%`.
- Add a new computed field (e.g. `completedTasks` / `totalTasks`) alongside `overallProgress` in `withComputedProject` (`lib/api.ts`), computed from the same `tasks` array already loaded there — `totalTasks = tasks.length`, `completedTasks = tasks.filter(t => t.status === 'completed').length`.
- Projects with zero tasks keep a sane fallback (e.g. `0/0 · —` or fall back to `project.progress` as today) rather than dividing by zero.
- `ProgressBar` itself doesn't need to be deleted from `components/ui.tsx` — it may still be used elsewhere (e.g. an individual task's own `progress` field) — only its usage on project/kanban cards for *project-level* completion is being replaced.

> **Minor addition:** on the "Project Tasks" table in `components/project-detail-client.tsx` (the `Progress` column, rendering `TaskProgressSlider` from `components/task-progress-slider.tsx` — see line 164), replace the `type="range"` slider with a plain **checkbox**: unchecked = task not done, checked = task's `progress` is set to `100` and `status` is set to `completed`. This checkbox is the actual mechanism that feeds the "completed ÷ total" percentage above — checking a task's box increments the project's completed-task count and immediately updates its `X/Y · Z%` readout on the project card. `TaskProgressSlider` becomes e.g. `TaskCompletionCheckbox`, still `PATCH`-ing `/api/tasks/:id` (now with `{ progress: checked ? 100 : 0, status: checked ? 'completed' : 'not_started' }`) and calling `router.refresh()` the same way.
