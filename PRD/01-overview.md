# Overview

Aplikasi manajemen project internal untuk tim yang mengelola beberapa project sekaligus, dengan breakdown task (WBS), dependency, milestone, dan beberapa cara visualisasi (kalender, gantt, kanban, planner harian).

## Entitas Inti

- **Project** — unit kerja utama, punya jadwal, PIC, status, progress.
- **Task (WBS Item)** — pecahan pekerjaan di dalam project, bisa bersarang (subtask), punya dependency ke task lain, bisa berupa milestone.
- **User** — orang yang berperan sebagai manager, owner, tech lead, atau assignee.

## Modul

| Modul | Fungsi |
|---|---|
| Dashboard | Ringkasan portfolio: jumlah project per status, progress keseluruhan, milestone terdekat, project berisiko |
| Calendar | Timeline mingguan seluruh project dengan filter |
| Projects | Daftar project dalam bentuk card |
| Project Detail | WBS table + gantt per project, edit/delete, tambah task |
| Gantt | Gantt chart seluruh project (level project) |
| Kanban | Board project per status |
| Planner | Jadwal harian per jam untuk assignment task |
| Reports | Tabel ringkas seluruh project untuk export/print |

## Di Luar Cakupan (MVP)

- Multi-tenant / multi-workspace
- Notifikasi email/push
- Role-based permission granular (hanya single role admin di MVP)
- Import/export file (CSV, MS Project)

## Konsep Turunan (Computed, Tidak Disimpan di DB)

- **Health project**: `Critical` bila `end_date` sudah lewat dan status belum Completed; `At Risk` bila progress aktual tertinggal >12% dari progress waktu berjalan; selain itu `On Track`.
- **Overall progress project**: rata-rata `progress` seluruh task di project tersebut (bisa juga diisi manual jika project belum punya task).
