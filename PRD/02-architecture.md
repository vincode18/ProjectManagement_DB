# Architecture

## Stack

| Layer | Pilihan | Alasan |
|---|---|---|
| Frontend | Next.js 14 (App Router) + TypeScript | Routing per-modul cocok dengan struktur view (dashboard/calendar/projects/...), mendukung server component untuk data awal dan client component untuk interaksi drag-drop |
| Styling | Tailwind CSS | Cepat untuk membangun card/badge/table tanpa CSS terpisah, konsisten dengan design token |
| State server | TanStack Query | Cache + refetch otomatis untuk data project/task, menggantikan pola manual `refreshData()` |
| ORM | Prisma | Skema tipe-aman, migration jelas, cocok untuk relasi self-referencing pada task |
| Database | PostgreSQL | Data relasional (project → task → subtask → dependency), butuh query agregat (progress rata-rata, filter tanggal) yang lebih natural di SQL dibanding NoSQL |
| Drag & drop (gantt/kanban/planner) | dnd-kit | Library drag-drop React yang aktif maintained, gantikan native pointer events di versi lama |
| Chart/progress bar | Komponen custom (Tailwind) | Kebutuhan visual sederhana (bar, badge), tidak perlu library chart berat |
| Auth | NextAuth.js (credentials/email) | Opsional untuk MVP, siapkan tabel `users` agar mudah ditambahkan nanti |
| Deployment | Vercel (app) + Neon/Supabase (Postgres) | Setup minim, cocok untuk Next.js fullstack |

Next.js dipakai sebagai monolith fullstack (Route Handlers di `app/api/*`) — tidak perlu backend terpisah untuk skala MVP ini.

## Struktur Folder

```
project-management-dashboard/
├─ app/
│  ├─ (dashboard)/
│  │  ├─ dashboard/page.tsx
│  │  ├─ calendar/page.tsx
│  │  ├─ projects/page.tsx
│  │  ├─ projects/[id]/page.tsx
│  │  ├─ gantt/page.tsx
│  │  ├─ kanban/page.tsx
│  │  ├─ planner/page.tsx
│  │  └─ reports/page.tsx
│  ├─ api/
│  │  ├─ projects/route.ts
│  │  ├─ projects/[id]/route.ts
│  │  ├─ tasks/route.ts
│  │  ├─ tasks/[id]/route.ts
│  │  └─ users/route.ts
│  └─ layout.tsx
├─ components/
│  ├─ nav/side-nav.tsx
│  ├─ cards/summary-card.tsx
│  ├─ cards/project-card.tsx
│  ├─ gantt/gantt-chart.tsx
│  ├─ kanban/kanban-board.tsx
│  ├─ calendar/calendar-grid.tsx
│  └─ ui/ (badge, button, input, drawer, modal)
├─ lib/
│  ├─ prisma.ts
│  ├─ health.ts        # kalkulasi health/progress
│  └─ validators.ts     # zod schema untuk form
├─ prisma/
│  ├─ schema.prisma
│  └─ seed.ts
└─ .env
```

## Setup

```bash
npx create-next-app@latest project-management-dashboard --typescript --tailwind --app
cd project-management-dashboard
npm install @tanstack/react-query @dnd-kit/core @dnd-kit/sortable zod prisma @prisma/client
npx prisma init
```

`.env`:
```
DATABASE_URL="postgresql://user:password@localhost:5432/pmdashboard"
```

```bash
npx prisma migrate dev --name init
npx prisma db seed
npm run dev
```

## Kalkulasi yang Perlu Dipindahkan ke Server (bukan client-side murni)

- Progress project = rata-rata `task.progress` seluruh task project → dihitung di API saat task di-update, atau via database view/trigger.
- Health project → dihitung on-the-fly di API response (bukan kolom tersimpan), agar selalu akurat terhadap tanggal berjalan.
