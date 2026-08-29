# Projects

Route: `/projects`

## Tujuan

Daftar seluruh project dalam bentuk card, untuk browsing cepat.

## Layout

Grid card responsif: 1 kolom mobile, 2 kolom tablet, 3 kolom desktop.

## Isi Card

| Elemen | Sumber |
|---|---|
| Kode project | `project.code` |
| Nama project | `project.name` |
| Status badge | `project.status` |
| Owner | `project.owner.name` |
| Rentang tanggal | `start_date` – `end_date` |
| Priority | `project.priority` |
| Progress bar + persen | `project.progress` |
| Health | dihitung (lihat `01-overview.md`) |

## Interaksi

- Klik card → navigasi ke `/projects/[id]` (Project Detail).
- Tombol "New Project" di header global → buka form create project (lihat `04-project-detail.md` untuk field form).
