# Architecture and Routes

## Architecture

The app uses a single Next.js application with shared TypeScript modules for:

- data modeling
- validation
- computed summaries
- in-memory mutations
- reusable UI components

This keeps the UI and the route handlers aligned with the PRD while remaining backend-ready.

## Folder Structure

- `Development/app` - App Router pages, layouts, and API route handlers
- `Development/components` - Shared UI and feature components
- `Development/lib` - Mock data, business logic, validation, and helpers
- `Documentation` - Implementation notes and PRD-aligned docs

## Pages

- `/` - Redirects to dashboard
- `/dashboard` - Summary cards, status distribution, milestones, and risk panel
- `/projects` - Project list and create form
- `/projects/[id]` - Project detail, WBS, progress, and task actions
- `/calendar` - Month grid and project distribution
- `/gantt` - Timeline bars and date header
- `/kanban` - Project cards grouped by status
- `/planner` - Hourly planning view
- `/reports` - Compact reporting table

## API Routes

- `GET /api/projects`
- `POST /api/projects`
- `GET /api/projects/[id]`
- `PATCH /api/projects/[id]`
- `DELETE /api/projects/[id]`
- `GET /api/projects/[id]/tasks`
- `POST /api/tasks`
- `PATCH /api/tasks/[id]`
- `DELETE /api/tasks/[id]`
- `POST /api/tasks/[id]/dependencies`
- `DELETE /api/tasks/[id]/dependencies/[dependsOnId]`
- `GET /api/users`

## Behavior

- Project progress is derived from related tasks.
- Health status is computed from schedule and completion conditions.
- Task dependency labels are exposed through the shared data layer.
- Calendar, Gantt, Kanban, Planner, and Reports all read from the same mock source of truth.
