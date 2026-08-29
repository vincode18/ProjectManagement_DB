# Enhancement

Perbaikan UI/UX dari hasil review prototype, plus modul baru (Helpdesk Report). Dokumen ini melengkapi `features/*.md` — perubahan di sini override behavior yang sudah ditulis sebelumnya.

## Ringkasan

| # | Modul | Masalah | Perbaikan |
|---|---|---|---|
| 1 | Dashboard | Spacing card terlalu rapat | Perbesar padding & gap |
| 2 | Calendar | Tombol Prev/Next tidak berfungsi | Perbaiki navigasi bulan |
| 3 | Projects | Form create project menempel di halaman | Ubah jadi modal popup |
| 4 | Gantt | Tidak bisa di-scroll, tidak ada garis waktu, tidak bisa drill-down ke task | Scrollable weekly grid + today-line + popup detail per task |
| 5 | Kanban | Card rapat, title kolom statis, tidak draggable | Spacing + editable title + drag antar kolom |
| 6 | Planner | Belum per-user, tidak ada tombol add, belum draggable | Scope per user login + tombol add + drag slot |
| 7 | Reports | Hanya level project, tidak bisa export | Detail sampai task + export Excel |
| 8 | Helpdesk Report | Belum ada | Modul baru: upload data + dashboard otomatis |

---

## 1. Dashboard — Spacing Card

**Masalah:** jarak antar summary card dan padding internal card terlalu kecil, terkesan sesak.

**Perbaikan:**
- Gap antar card: `16px` → `20px` (desktop), tetap `12px` di mobile.
- Padding internal card: `16px` → `20px`.
- Berlaku juga untuk card di Risk Panel dan Status Distribution — samakan token spacing dengan `05-design-system.md`.

---

## 2. Calendar — Navigasi Bulan

**Masalah:** tombol Prev/Next tidak mengubah tampilan grid, kalender stuck di bulan berjalan.

**Perbaikan:**
- Tombol Prev/Next mengubah state `calendarMonth` (month/year), lalu grid dan header bulan re-render dari state tersebut, bukan hardcoded ke tanggal hari ini.
- Tombol nama bulan (mis. "August 2026") reset ke bulan berjalan saat diklik.
- Highlight minggu berjalan hanya aktif ketika `calendarMonth` = bulan & tahun hari ini.

---

## 3. Projects — Create Project sebagai Popup

**Masalah:** form "New Project" tampil menempel di bawah list card, bukan modal.

**Perbaikan:**
- Pindahkan form ke modal/dialog (overlay + card di tengah), trigger dari tombol "New Project" di header.
- Tutup modal: klik backdrop, tombol X, atau `Esc`.
- Field form tetap sama seperti di `04-project-detail.md`.

---

## 4. Gantt — Weekly Timeline, Scroll, Today-Line, Drill-down

**Masalah:**
- Chart tidak bisa digeser/scroll horizontal untuk melihat rentang tanggal di luar layar.
- Tidak ada garis penunjuk waktu berjalan (today marker).
- Kolom timeline saat ini beberapa titik tanggal acak, bukan grid mingguan yang konsisten.
- Tidak ada cara melihat detail task per project dari tampilan project-level.

**Perbaikan:**
- Container gantt: `overflow-x: auto`, grid dengan `min-width` tetap (lihat pola yang sudah ada di `02-architecture.md` referensi `.gantt-frame`), sehingga bisa di-scroll horizontal di semua device.
- Header kolom = **minggu**, bukan titik tanggal sembarang. Setiap kolom mewakili 1 minggu (Senin–Minggu), label header format `MMM D`.
- Garis vertikal merah "today marker" digambar menembus seluruh baris, posisi dihitung dari `(today - range.start) / total_hari * 100%`, update tiap render.
- Klik nama project (atau tombol expand di baris) → buka **modal popup** berisi Gantt task-level project tersebut (reuse komponen Gantt, data source = `tasks(project_id)` bukan `projects()`), termasuk today-line versi task-level.
- Bar tetap bisa di-drag untuk reschedule (behavior lama dipertahankan), tapi sekarang snap ke grid mingguan.

---

## 5. Kanban — Spacing, Editable Title, Draggable Card

**Masalah:** kolom dan card rapat, title kolom (`Not Started`, `Planning`, dst) tidak bisa diubah, card tidak bisa dipindah antar kolom.

**Perbaikan:**
- Spacing: gap antar kolom `12px` → `16px`, padding kolom `12px` → `16px`, gap antar card `12px` → `12–14px` (cukup, sebelumnya terlalu rapat karena padding kolom kecil).
- **Title kolom editable**: klik judul kolom → jadi input text, simpan on blur/Enter. Perlu tabel konfigurasi label kolom (lihat Data Model di bawah), karena title custom terpisah dari `status` enum yang tetap dipakai untuk logic.
- **Card draggable antar kolom** (dnd-kit `DndContext` + `SortableContext`): drop card ke kolom lain → update `project.status` sesuai kolom tujuan.

### Data Model Tambahan

```prisma
model KanbanColumnConfig {
  id      String        @id @default(uuid())
  status  ProjectStatus @unique
  label   String        // title custom, default = nama enum status
}
```

---

## 6. Planner — Per User, Tombol Add, Draggable

**Masalah:** planner saat ini generic (belum terikat user login), tidak ada cara menambah task langsung ke slot selain drag dari inbox, slot belum bisa di-drag ulang.

**Perbaikan:**
- Data planner di-scope ke `assignee_id = current_user.id` — inbox hanya menampilkan task milik user yang login, slot per hari juga per user.
- Tambah tombol **"+ Add"** di tiap slot jam → buka dropdown/search pilih task (dari task milik user tsb) tanpa harus drag dari inbox.
- Slot mendukung drag: dari inbox ke slot, antar slot (pindah jam), dan dari slot balik ke inbox (unassign).
- Simpan ke tabel `planner_slots` yang sudah didefinisikan di `03-database-schema.md` (`id, user_id, task_id, date, hour`) — pastikan endpoint create/delete slot tersedia, bukan hanya state lokal di browser.

### Endpoint Tambahan

| Method | Path | Body |
|---|---|---|
| GET | `/api/planner?date=2026-08-29` | — (scoped ke user login) |
| POST | `/api/planner` | `{ task_id, date, hour }` |
| DELETE | `/api/planner/:id` | — |

---

## 7. Reports — Detail Task + Export Excel

**Masalah:** report hanya level project, tidak ada breakdown task, tidak bisa di-download.

**Perbaikan:**
- Setiap baris project bisa di-**expand** (accordion) menampilkan breakdown task di bawahnya: WBS, nama task, assignee, status, progress, tanggal.
- Tombol **"Download Excel (.xlsx)"** di header halaman.

### Struktur File Excel

| Sheet | Isi |
|---|---|
| `Summary` | 1 baris per project: kode, nama, manager, tanggal, progress, health |
| `Gantt Detail` | 1 baris per task, dengan kolom `project_code` untuk mengelompokkan, kolom tanggal per minggu diisi warna sesuai status (simulasi bar gantt pakai cell fill) |

- Library: `exceljs` (server-side, Next.js Route Handler), respons `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`.
- Endpoint: `GET /api/reports/export` → stream file `.xlsx`.

---

## 8. Helpdesk Report (Modul Baru)

**Tujuan:** laporan bulanan tiket helpdesk, admin upload data mentah, sistem generate dashboard otomatis. Role Helpdesk User hanya melihat (view-only).

Route: `/helpdesk-report`

### Layout

1. (Admin only) Tombol **Upload Data** (CSV/XLSX) + filter bulan
2. Summary cards: Total Ticket (bulan terpilih), Total Agent Aktif
3. Panel Top Agent (ranking berdasarkan ticket closed, top 5)
4. Chart/breakdown Category Problem (distribusi jumlah tiket per kategori)
5. Chart/breakdown Sub Category Problem
6. Tabel detail tiket (opsional, bisa di-collapse)

### Upload Flow

1. Admin upload file (CSV/XLSX) berisi kolom minimal: `ticket_no, agent_name, category, sub_category, status, opened_at, closed_at`.
2. Server parse file (`papaparse` untuk CSV, `xlsx`/`exceljs` untuk Excel), validasi kolom wajib.
3. Insert ke tabel `helpdesk_tickets`, catat histori di `helpdesk_uploads`.
4. Dashboard otomatis re-agregasi (query langsung, tidak perlu proses tambahan) berdasarkan bulan `opened_at`.

### Data Model

```prisma
enum HelpdeskTicketStatus {
  open
  in_progress
  closed
}

model HelpdeskTicket {
  id           String                @id @default(uuid())
  ticketNo     String
  agentName    String
  category     String
  subCategory  String
  status       HelpdeskTicketStatus
  openedAt     DateTime
  closedAt     DateTime?
  uploadId     String
  upload       HelpdeskUpload        @relation(fields: [uploadId], references: [id])

  @@index([openedAt])
  @@index([agentName])
  @@index([category])
}

model HelpdeskUpload {
  id          String   @id @default(uuid())
  filename    String
  uploadedBy  String
  uploadedAt  DateTime @default(now())
  rowCount    Int
  tickets     HelpdeskTicket[]
}
```

Tambahan role di `User`:

```
role: admin | member | helpdesk_user
```

- `admin` — bisa upload, hapus upload, lihat semua modul.
- `helpdesk_user` — hanya bisa akses `/helpdesk-report`, read-only.

### Endpoint

| Method | Path | Body / Query | Response |
|---|---|---|---|
| POST | `/api/helpdesk/upload` | multipart file | `{ upload_id, row_count }` |
| GET | `/api/helpdesk/summary` | query: `month` (YYYY-MM) | `{ total_tickets, by_agent[], top_agent, by_category[], by_sub_category[] }` |
| GET | `/api/helpdesk/tickets` | query: `month`, `agent`, `category` | `HelpdeskTicket[]` |
| GET | `/api/helpdesk/uploads` | — | riwayat upload (admin only) |
| DELETE | `/api/helpdesk/uploads/:id` | — | hapus batch upload beserta ticket-nya |

### Business Rules

- Satu file upload = satu batch (`upload_id`), agar bisa di-rollback (hapus) tanpa mengganggu data bulan lain.
- Agregasi dashboard dihitung on-the-fly dari `helpdesk_tickets` (bukan disimpan terpisah), agar selalu konsisten dengan data terbaru.
- "Top Agent" = agent dengan jumlah `status = closed` terbanyak pada bulan terpilih.