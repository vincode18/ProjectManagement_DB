# Design System

Gaya visual: dashboard admin standar, neutral, tanpa ornamen berlebihan.

## Warna

| Token | Hex | Pemakaian |
|---|---|---|
| `--bg` | `#F5F7FB` | background halaman |
| `--surface` | `#FFFFFF` | card, panel |
| `--border` | `#E4E7EC` | garis pemisah |
| `--ink` | `#111111` | teks utama |
| `--muted` | `#64748B` | teks sekunder |
| `--primary` | `#2563EB` | tombol utama, link, elemen aktif |
| `--sidebar` | `#102A43` | background side nav |

### Warna Status (project & task)

| Status | Hex |
|---|---|
| Not Started | `#64748B` |
| Planning | `#7C3AED` |
| In Progress | `#2563EB` |
| On Hold | `#B45309` |
| Completed | `#15803D` |
| Delayed | `#B42318` |

### Warna Priority

| Priority | Hex |
|---|---|
| High | `#B42318` |
| Medium | `#B45309` |
| Low | `#64748B` |

## Tipografi

Font: **Inter** (sans, semua ukuran teks — heading dan body sama family, dibedakan lewat weight, bukan mixing font serif/sans).

| Elemen | Ukuran | Weight |
|---|---|---|
| Page title | 20px | 700 |
| Section heading | 16px | 700 |
| Body | 14px | 400–500 |
| Caption / label | 12px | 600, uppercase, tracking wide |

## Komponen

| Komponen | Radius | Border | Shadow |
|---|---|---|---|
| Card | 16px | 1px `--border` | `0 1px 2px rgba(16,42,67,.04)` |
| Button | 10px | — | — |
| Input | 8px | 1px `--border` | — |
| Badge/status pill | full (9999px) | — | — |

## Aturan

- Satu warna aksen (`--primary`) untuk seluruh tombol primer dan link — bukan multi-warna acak per elemen.
- Warna status/priority konsisten dipakai di semua modul (badge, bar gantt, dot kanban, kalender) — jangan beda mapping warna antar halaman.
- Hindari gradient, drop-shadow tebal, dan ikon dekoratif yang tidak fungsional.
- Emoji hanya dipakai untuk indikator health (🟢🟡🔴) karena fungsional (scan cepat), bukan dekorasi.
- Spacing scale: 4 / 8 / 12 / 16 / 24 / 32px — pakai kelipatan ini untuk padding/gap.
