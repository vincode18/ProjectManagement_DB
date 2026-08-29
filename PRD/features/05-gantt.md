# Gantt

Route: `/gantt` (level project) — juga dipakai di dalam Project Detail (level task, lihat `04-project-detail.md`)

## Tujuan

Visualisasi timeline dalam bentuk bar horizontal per baris, dengan garis vertikal "hari ini".

## Layout

- Kolom kiri sticky: label baris (nama project atau nama task)
- Kolom kanan: grid 7 timepoint (header tanggal), bar digambar berdasarkan posisi relatif terhadap rentang tanggal keseluruhan data yang tampil
- Garis merah vertikal menandai tanggal hari ini

## Perhitungan Posisi Bar

```
range = [min(start_date) - 3 hari, max(end_date) + 5 hari]
total_hari = range.end - range.start
left%  = (bar.start - range.start) / total_hari * 100
width% = (bar.end - bar.start + 1) / total_hari * 100
```

Milestone digambar sebagai ikon ◆, bukan bar.

## Interaksi

- Drag bar horizontal → hitung pergeseran hari berdasarkan pergeseran pixel dibagi lebar kolom per hari.
- Saat drop: update `start_date` dan `end_date` (durasi tetap) via API, gagal → rollback posisi dan tampilkan toast error.

## Constraint yang Perlu Divalidasi di Backend

- `end_date >= start_date`.
- Jika task punya dependency FS, `start_date` task tidak boleh lebih awal dari `end_date` predecessor — tampilkan warning (boleh soft-warning, tidak harus blocking di MVP).
