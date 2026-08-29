# API Reference

Route handlers Next.js (`app/api/*`), format REST + JSON.

## Projects

| Method | Path | Body / Query | Response |
|---|---|---|---|
| GET | `/api/projects` | query: `status`, `priority`, `search` | `Project[]` |
| GET | `/api/projects/:id` | — | `Project` + `tasks[]` |
| POST | `/api/projects` | project fields | `Project` |
| PATCH | `/api/projects/:id` | partial fields | `Project` |
| DELETE | `/api/projects/:id` | — | `204`, cascade hapus task |

## Tasks

| Method | Path | Body / Query | Response |
|---|---|---|---|
| GET | `/api/projects/:id/tasks` | — | `Task[]` |
| POST | `/api/tasks` | task fields + `project_id` | `Task` |
| PATCH | `/api/tasks/:id` | partial fields (termasuk `progress`) | `Task`, trigger recalculate `project.progress` |
| DELETE | `/api/tasks/:id` | — | `204` |
| POST | `/api/tasks/:id/dependencies` | `{ depends_on_task_id, type }` | `TaskDependency` |
| DELETE | `/api/tasks/:id/dependencies/:dependsOnId` | — | `204` |

## Users

| Method | Path | Body / Query | Response |
|---|---|---|---|
| GET | `/api/users` | — | `User[]`, dipakai untuk dropdown assignee/manager/owner |

## Validasi

Semua body divalidasi dengan `zod` di `lib/validators.ts` sebelum masuk ke Prisma. Error validasi → `400` dengan detail field.

## Error Format

```json
{ "error": "message", "field": "start_date" }
```
