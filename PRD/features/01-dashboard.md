# Dashboard

Route: `/dashboard`

## Tujuan

Ringkasan portfolio semua project untuk dilihat pertama kali saat login.

## Layout

1. Header — judul halaman, tanggal hari ini
2. Summary cards (grid 6 kolom di desktop, 2 di mobile)
3. Dua panel sejajar: Status Distribution (kiri, lebar 2/3) + Upcoming Milestones (kanan, 1/3)
4. Panel Risk / At-Risk Projects (lebar penuh)

## Summary Cards

| Card | Nilai |
|---|---|
| Total Projects | `count(projects)` |
| Active Projects | `count(status in [planning, in_progress, on_hold])` |
| Completed | `count(status = completed)` |
| Delayed | `count(status = delayed OR health = critical)` |
| Upcoming | `count(start_date > today)` |
| Overall Progress | rata-rata `progress` semua project |

## Status Distribution

List 6 status (`not_started`...`delayed`) dengan jumlah project masing-masing dan dot warna sesuai status.

## Upcoming Milestones

Ambil task dengan `is_milestone = true`, urutkan `end_date` ascending, tampilkan 4 teratas: nama task, tanggal, kode project.

## Risk Panel

6 project pertama ditampilkan sebagai card kecil: nama, health badge (🟢/🟡/🔴), rentang tanggal, progress. Klik → buka Project Detail.

## Interaksi

- Klik card di Risk Panel atau Milestone → navigasi ke `/projects/[id]`.
- Tombol refresh di header → invalidate query cache, reload data.
