# 🛋️ NORDIC LIVING - Marketplace Furnitur Terdistribusi (Gaya IKEA)
### Tugas Besar Mata Kuliah: Sistem Basis Data Terdistribusi (SBDT)

Platform marketplace furnitur bergaya Skandinavia/IKEA yang dirancang dan dioptimalkan secara mendalam pada arsitektur **Sistem Basis Data Terdistribusi (SBDT)** menggunakan **PostgreSQL + Citus Data (1 Coordinator, 2 Worker, 1 Physical Streaming Replica)**, Nginx Reverse Proxy & Load Balancer, Backend multi-instance Express, dan Frontend Next.js (App Router) + Tailwind CSS.

---

## ⚡ Panduan Menjalankan Sistem (Single Command)

Seluruh ekosistem layanan dapat dijalankan hanya dengan **SATU PERINTAH**:

```bash
docker compose up --build
```

Setelah perintah di atas selesai, buka browser Anda pada alamat:
👉 **[http://localhost](http://localhost)** (atau port cadangan: **[http://localhost:8080](http://localhost:8080)**)

---

## 🔑 Matriks Akun Bawaan (Seed Data Akun & RBAC)

Tersedia tombol **"Mode Demo SBDT"** di bilah paling atas website untuk melakukan **1-Click Login Instan** tanpa perlu mengetik kredensial manual:

| Role Pengguna | Email | Password | Halaman & Hak Akses Utama |
|---|---|---|---|
| **Pembeli (User)** | `buyer@ikea-sbdt.local` | `User123!` | Katalog, Detail Produk, Keranjang Belanja, Checkout Transaksi Terdistribusi, Riwayat & Pelacakan Pesanan |
| **Pembeli Kedua** | `budi@ikea-sbdt.local` | `User123!` | Akun pembeli kedua khusus pengujian *Race Condition* simultan |
| **Orang Gudang** | `gudang@ikea-sbdt.local` | `Gudang123!` | Dashboard Stok per Gudang, Input Mutasi Stok (`IN`/`OUT`/`ADJUSTMENT`), Pemrosesan Antrean Pesanan (`diproses` ➔ `dikemas` ➔ `dikirim`), Audit Mutasi |
| **Admin Sistem** | `admin@ikea-sbdt.local` | `Admin123!` | Master Panel CRUD Produk & Kategori (Reference Tables), CRUD Kode Promo, Manajemen Pengguna & Hak Akses, Pantau Seluruh Pesanan |
| **Business Owner** | `owner@ikea-sbdt.local` | `Owner123!` | Dashboard Analitik Eksekutif: Grafik Recharts Laporan Omzet Harian, Perbandingan Performa Gudang, Valuasi Aset Stok, Kelola Administrator |

---

## 🏗️ Topologi Kluster & Port Layanan

| Service | Container Name | Port Eksternal | Peran & Deskripsi Arsitektur |
|---|---|---|---|
| **Nginx** | `nginx_lb` | `80`, `8080` | Reverse proxy utama & round-robin load balancer ke 2 instance backend |
| **Frontend** | `frontend` | `3000` (internal) | Next.js 16 App Router (Standalone build) bernuansa biru-kuning khas Nordik/IKEA |
| **Backend 1** | `backend1` | `5000` (internal) | REST API Node.js/Express instance 1 dengan connection pool ke Citus |
| **Backend 2** | `backend2` | `5000` (internal) | REST API Node.js/Express instance 2 (Penyedia skalabilitas & failover) |
| **Citus Coordinator** | `citus_coordinator` | `5432` | Master node Citus: Distributed Query Planner, Transaction Manager (2PC), Metadata Kluster |
| **Citus Worker 1** | `citus_worker1` | `5432` (internal) | Worker node 1: Menyimpan shard fisik tabel transaksional & salinan reference table |
| **Citus Worker 2** | `citus_worker2` | `5432` (internal) | Worker node 2: Menyimpan shard fisik tabel transaksional & salinan reference table |
| **Citus Replica** | `citus_replica` | `5433` | Physical Streaming Standby: Menampung query pembacaan katalog dari backend |
| **Citus Initializer**| `citus_init` | - | Kontainer otomasi registrasi worker, pembuatan sharding, dan seed data awal |

---

## 🧪 Menjalankan Skenario Demonstrasi Terdistribusi (`/demo`)

Folder `/demo` berisi skrip pengujian otomatis yang dapat dijalankan langsung menggunakan **Node.js** (kompatibel lintas OS Windows PowerShell / Linux / Mac) maupun **Bash Script**:

### 1. Demo Distribusi Shard & Pemetaan Worker
Menampilkan tabel metadata `citus_tables`, `citus_shards`, membuktikan sharding horizontal pada `warehouse_id`, dan replikasi 100% pada reference tables:
```bash
node demo/demo_1_shard_distribution.js
# atau: bash demo/demo_1_shard_distribution.sh
```

### 2. Demo Query Lintas Shard (Distributed Aggregation & EXPLAIN)
Menampilkan rencana eksekusi terdistribusi Citus (`EXPLAIN (VERBOSE)`), membuktikan *pushdown aggregation* ke worker nodes dan eliminasi *network shuffle join* berkat colocation:
```bash
node demo/demo_2_cross_shard_query.js
# atau: bash demo/demo_2_cross_shard_query.sh
```

### 3. Demo Simulasi Race Condition (Stok Terakhir)
Menguji keamanan transaksi terdistribusi checkout secara atomik dengan menembakkan 2 request pembelian simultan di milidetik yang sama pada produk dengan sisa 1 unit stok:
- 1 Pembeli berhasil (HTTP 201).
- 1 Pembeli ditolak dengan aman (HTTP 400 - `INSUFFICIENT_STOCK`).
- Sisa stok akhir terbukti **0 (Nol)** dan **TIDAK PERNAH MENJADI NEGATIF (-1)**!
```bash
node demo/demo_3_race_condition.js
# atau: bash demo/demo_3_race_condition.sh
```

### 4. Demo Simulasi Failover & Ketahanan Sistem (Fault Tolerance)
Mensimulasikan pematian kontainer `backend1` (membuktikan Nginx mengalihkan traffic secara instan ke `backend2`) dan pematian kontainer `citus_replica` (membuktikan connection pool otomatis failover ke Coordinator tanpa kegagalan layanan):
```bash
node demo/demo_4_failover.js
# atau: bash demo/demo_4_failover.sh
```

### 5. Demo Skalabilitas Horizontal & Rebalance Shard On-the-Fly
Menyalakan kontainer worker ke-3 (`citus_worker3`), mendaftarkannya ke kluster Citus, memicu online shard rebalancer (`citus_rebalance_start`), dan membuktikan perpindahan shard secara online tanpa downtime:
```bash
node demo/demo_5_add_worker_rebalance.js
# atau: bash demo/demo_5_add_worker_rebalance.sh
```

---

## 📚 Dokumentasi Akademik SBDT Terperinci (`/docs`)

Untuk kajian teknis mendalam tugas mata kuliah SBDT, silakan telusuri dokumen berikut:

1. 🏛️ **[docs/arsitektur.md](file:///c:/Users/mathe/OneDrive/Documents/Kuliah%20Tugas%20Sem7/SBDT/E-Comerce/docs/arsitektur.md)**: Diagram arsitektur topologi sistem, protokol komunikasi, dan implementasi Transparansi Lokasi.
2. 📊 **[docs/erd.md](file:///c:/Users/mathe/OneDrive/Documents/Kuliah%20Tugas%20Sem7/SBDT/E-Comerce/docs/erd.md)**: Entity Relationship Diagram (ERD) Mermaid lengkap, pengelompokan Reference Table vs Distributed Table, dan aturan Kunci Komposit Citus.
3. 🧩 **[docs/strategi_fragmentasi.md](file:///c:/Users/mathe/OneDrive/Documents/Kuliah%20Tugas%20Sem7/SBDT/E-Comerce/docs/strategi_fragmentasi.md)**: Justifikasi pemilihan kolom distribusi `warehouse_id`, mekanisme Shard Colocation, dan eliminasi *network shuffle join*.
4. ⚖️ **[docs/analisis_cap.md](file:///c:/Users/mathe/OneDrive/Documents/Kuliah%20Tugas%20Sem7/SBDT/E-Comerce/docs/analisis_cap.md)**: Analisis komprehensif Teorema CAP & PACELC (Stok/Checkout = CP vs Katalog Produk = AP).
5. 🔍 **[docs/evaluasi_dan_limitasi.md](file:///c:/Users/mathe/OneDrive/Documents/Kuliah%20Tugas%20Sem7/SBDT/E-Comerce/docs/evaluasi_dan_limitasi.md)**: Analisis objektif kelebihan, kekurangan, trade-off, dan batasan teknis Citus di Docker.

---

## 📁 Struktur Direktori Proyek

```
marketplace/
├── frontend/             # Next.js 16 (App Router) + Tailwind CSS + Lucide + Recharts
│   ├── src/app/          # Halaman: Storefront, Detail, Cart, Checkout, Orders, Gudang, Admin, Owner
│   ├── src/components/   # Navbar, Footer, ProductCard, WarehouseStockBadge, RoleSwitcherBar
│   ├── src/context/      # AuthContext (RBAC) & CartContext
│   └── Dockerfile        # Multi-stage build (Standalone output)
├── backend/              # Node.js + Express REST API (RBAC & Connection Pooling)
│   ├── src/config/       # Pool Coordinator & Replica dengan auto-failover
│   ├── src/controllers/  # Auth, Products, Cart, Orders (Atomik Checkout), Warehouse, Admin, Owner
│   ├── src/middlewares/  # JWT Auth, RBAC Role Check, Zod Validator, Error Handler
│   ├── src/routes/       # Modular API Route Endpoints
│   └── Dockerfile        # Multi-stage build Node.js
├── nginx/
│   └── nginx.conf        # Upstream Round-Robin Load Balancer & Reverse Proxy
├── db/                   # Inisialisasi Database Terdistribusi
│   ├── 00_hba.sh         # Konfigurasi akses streaming replication
│   ├── 01_schema.sql     # DDL skema tabel utama & composite primary keys
│   ├── 02_distribute.sql # Registrasi worker, pembuatan reference tables, & sharding colocation
│   └── 03_seed.sql       # Seed data akun 4 role, gudang regional, puluhan furnitur, & inventory
├── demo/                 # Skrip demonstrasi 5 skenario SBDT
│   ├── demo_1_shard_distribution.js / .sh
│   ├── demo_2_cross_shard_query.js / .sh
│   ├── demo_3_race_condition.js / .sh
│   ├── demo_4_failover.js / .sh
│   └── demo_5_add_worker_rebalance.js / .sh
├── docs/                 # Dokumentasi akademik lengkap
│   ├── arsitektur.md
│   ├── erd.md
│   ├── strategi_fragmentasi.md
│   ├── analisis_cap.md
│   └── evaluasi_dan_limitasi.md
├── docker-compose.yml    # Orkestrasi 9 services kontainer
├── .env.example          # Template konfigurasi environment
└── README.md             # Panduan eksekutif sistem
```
