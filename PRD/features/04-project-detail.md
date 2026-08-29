# Project Detail

Route: `/projects/[id]`

## Tujuan

Halaman kerja utama satu project: info umum, WBS (task breakdown), dan gantt chart detail.

## Layout

1. Header hitam (dark section): kode project, deskripsi, status badge, tombol Edit/Delete
2. Grid info: Project Manager, Business Owner, Technical Lead, Health
3. Progress bar keseluruhan
4. Tabel WBS (Work Breakdown Structure)
5. Gantt chart detail (task-level, dengan drag untuk reschedule)

## Tabel WBS

| Kolom | Sumber | Catatan |
|---|---|---|
| WBS | `task.wbs_code` | |
| Task / Dependency | `task.name`, indentasi bila punya `parent_task_id`, tampilkan dependency (FS) di bawah nama | |
| Status | `task.status` badge | |
| Aksi | Edit / Delete | |
| Progress | slider 0–100 + label persen | update langsung on change |
| Timeline | `start_date` – `end_date`, tanda ◆ bila milestone | |

### Update Progress Task

Saat slider diubah:
1. Update `task.progress` di DB.
2. Hitung ulang `project.progress` = rata-rata progress seluruh task project ini, update di DB.
3. Refresh Dashboard, Calendar, dan halaman ini.

### Tambah Task

Form field: Task Name, WBS Code, Assignee, Parent Task ID (opsional), Start Date, End Date, Status, Priority, Progress, Dependency (pilih task lain, FS), Milestone (checkbox), Remarks.

### Edit / Delete Project

- Edit → form sama seperti create (lihat `03-projects.md`), field terkunci: `code`.
- Delete → hapus project beserta seluruh task-nya (cascade), konfirmasi dulu sebelum eksekusi.

## Gantt Detail

Lihat `05-gantt.md` — versi ini menampilkan task (bukan project) sebagai baris, mendukung drag horizontal untuk geser `start_date`/`end_date` sekaligus (durasi tetap).

## Business Rules

- Progress project selalu turunan dari task, tidak diedit manual langsung di halaman ini.
- Hapus task tidak menghapus subtask-nya secara otomatis — tampilkan warning bila task punya subtask.
