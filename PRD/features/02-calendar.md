# Calendar

Route: `/calendar`

## Tujuan

Melihat sebaran jadwal seluruh project dalam grid mingguan (bukan kalender bulanan biasa — per baris adalah 1 project, per kolom adalah 1 minggu).

## Layout

- Header: navigasi bulan (prev / nama bulan / next)
- Baris filter chip + search input
- Grid: kolom pertama nama project (sticky), 6 kolom berikutnya = minggu berjalan dalam bulan terpilih

## Filter Chip

`All Projects | My Projects | Active | Completed | Delayed | High Priority | Medium Priority | Low Priority`

- "My Projects" = `manager_id = current_user.id`
- "Active" = status in `[planning, in_progress, on_hold]`

## Search

Filter by `project.name` atau `project.code`, case-insensitive, client-side debounce 200ms.

## Grid Cell

Untuk tiap project × minggu: render bar berwarna status bila rentang `[start_date, end_date]` project overlap dengan rentang minggu tersebut. Label nama project hanya muncul di sel minggu pertama tempat bar dimulai.

Minggu berjalan (mengandung tanggal hari ini) diberi highlight background.

## Interaksi

- Klik bar/nama project → buka Project Detail drawer/halaman.
- Ganti bulan tidak reload seluruh data, hanya reposisi grid.
