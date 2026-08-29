# Planner

Route: `/planner`

## Tujuan

Penjadwalan harian per jam (08:00–17:00) untuk assignment task ke slot waktu tertentu.

## Layout

- Panel kiri (lebar): 10 baris slot jam, tiap slot area drop
- Panel kanan (sidebar gelap): "Inbox" — daftar task yang belum selesai (`status != completed`), maksimal 8, sebagai item yang bisa di-drag

## Interaksi

- Drag task dari Inbox ke slot jam → slot menampilkan nama task.
- Ini adalah penjadwalan personal per hari, bukan pengubah `start_date`/`end_date` task.

## Data

MVP: simpan penjadwalan ini di tabel opsional `planner_slots (id, user_id, task_id, date, hour)`, satu task bisa dijadwalkan ke lebih dari satu slot pada hari berbeda. Bila tidak dibutuhkan persist antar sesi, boleh disimpan di client state saja untuk versi awal.
