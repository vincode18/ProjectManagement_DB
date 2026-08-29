# Kanban

Route: `/kanban`

## Tujuan

Board project dikelompokkan per status untuk melihat distribusi kerja secara visual.

## Layout

6 kolom sesuai enum status (`not_started`...`delayed`), tiap kolom header menampilkan nama status + jumlah project.

## Kartu Project

- Nama project
- Progress % dan priority
- "Timer": durasi berjalan sejak `start_date` hingga hari ini, dihitung 8 jam kerja/hari, format `Xd YYh elapsed · 8h/day`. Tidak berjalan bila project belum mulai atau sudah `completed`.

## Interaksi

- Klik card → buka Project Detail.
- (Opsional, di luar MVP) drag antar kolom untuk ubah status — bila diimplementasi, update `project.status` on drop.
- Timer di-refresh tiap 60 detik selagi halaman aktif.
