# Arsitektur Sistem Basis Data Terdistribusi (SBDT)
## Marketplace Furnitur Nordik (Gaya IKEA)

Dokumen ini menjelaskan topologi sistem, protokol komunikasi antar-komponen, prinsip transparansi lokasi, dan alur pemrosesan data pada platform marketplace furnitur terdistribusi berbasis **Citus PostgreSQL**.

---

## 1. Diagram Topologi Arsitektur Sistem

```
                                  ┌───────────────────────────────┐
                                  │         KLIEN BROWSER         │
                                  │ (User, Gudang, Admin, Owner)  │
                                  └───────────────┬───────────────┘
                                                  │ HTTP :80 / :8080
                                  ┌───────────────▼───────────────┐
                                  │      NGINX REVERSE PROXY      │
                                  │  (Load Balancer Round-Robin)  │
                                  └───────┬───────────────┬───────┘
                     /api/*               │               │  /*
             ┌────────────────────────────┘               └────────────────────────────┐
             │                                                                         │
      ┌──────▼──────────────────┐                                               ┌──────▼──────────────────┐
      │       BACKEND 1         │                                               │        FRONTEND         │
      │   (Node.js / Express)   │                                               │ (Next.js 16 App Router) │
      │   Port Internal 5000    │                                               │   Port Internal 3000    │
      └──────┬──────────────────┘                                               └─────────────────────────┘
             │              ┌──────────────────────────┐                               │
             │              │        BACKEND 2         │                               │
             │              │   (Node.js / Express)    │                               │
             │              │   Port Internal 5000     │                               │
             │              └─────────────┬────────────┘                               │
             │                            │                                            │
             └──────────────┬─────────────┘                                            │
                            │ Connection Pool (Transparansi Lokasi Penuh)              │
                            │ Port 5432 (Writes, Transaksi, Default Read)              │
                            ▼                                                          ▼
             ┌────────────────────────────────────────┐                 ┌─────────────────────────────┐
             │           CITUS COORDINATOR            │                 │        CITUS REPLICA        │
             │     (PostgreSQL Master + Metadata)     │════════════════>│ (Physical Streaming Standby)│
             │   - Menyimpan pg_dist_* metadata       │ Physical WAL    │ - Read-Only queries         │
             │   - Distributed Query Planner          │ Streaming       │ - Failover target baca      │
             │   - 2PC Transaction Coordinator        │                 └─────────────────────────────┘
             └──────────────┬──────────────────┬──────┘
                            │                  │
               Citus Shard  │                  │ Citus Shard
               Distribution │                  │ Distribution
                            │                  │
             ┌──────────────▼─────┐      ┌─────▼──────────────┐
             │   CITUS WORKER 1   │      │   CITUS WORKER 2   │
             │ (Data Shard Node)  │      │ (Data Shard Node)  │
             │ Shards: WH-JKT (1) │      │ Shards: WH-SBY (2) │
             │ Shards: WH-MDN (3) │      │ Shards: WH-MDN (3) │
             │ + Reference Tables │      │ + Reference Tables │
             └────────────────────┘      └────────────────────┘
```

---

## 2. Transparansi Lokasi (Location Transparency)

Prinsip **Transparansi Lokasi** adalah salah satu pilar terpenting dalam Sistem Basis Data Terdistribusi (SBDT). Prinsip ini menjamin bahwa aplikasi klien atau backend **tidak perlu mengetahui di node worker mana atau pada shard ID apa suatu data fisik tersimpan**.

### Implementasi pada Proyek:
1. **Single Entry Point Database:**
   Semua koneksi backend (`backend1` dan `backend2`) hanya dikonfigurasikan mengarah ke `citus_coordinator:5432`. Backend tidak membuka soket langsung ke `citus_worker1` maupun `citus_worker2`.
2. **Abstraksi Query SQL Standar:**
   Backend mengeksekusi perintah SQL standar seperti:
   ```sql
   SELECT * FROM orders WHERE warehouse_id = 1;
   ```
   Backend tidak perlu mengetahui bahwa query tersebut sebenarnya diterjemahkan oleh Coordinator menjadi pencarian pada shard lokal `orders_102045` di dalam kontainer `citus_worker1`.
3. **Penyembunyian Topologi Fisik:**
   Penambahan worker baru (`citus_worker3`) atau pemindahan shard melalui rebalancing tidak memerlukan perubahan baris kode apa pun di sisi backend maupun frontend.

---

## 3. Komponen Infrastruktur

### A. Nginx Reverse Proxy & Load Balancer
- Berfungsi sebagai gerbang masuk tunggal (port 80 dan 8080).
- Melakukan *layer-7 round-robin load balancing* ke dua instance backend (`backend1:5000` dan `backend2:5000`).
- Menyuntikkan header respon `X-Upstream-Backend` yang mengembalikan IP upstream yang melayani request untuk verifikasi audit.

### B. Backend Multi-Instance (Node.js + Express)
- Stateless REST API dengan otentikasi JWT dan middleware RBAC (Role-Based Access Control).
- Memiliki dua connection pool:
  - `primaryPool`: terhubung ke Coordinator untuk semua transaksi tulis dan checkout.
  - `replicaPool`: terhubung ke Streaming Replica untuk beban baca katalog dengan mekanisme *graceful failover* ke Coordinator jika replica offline.

### C. Citus Coordinator
- Menyimpan tabel metadata kluster (`pg_dist_node`, `pg_dist_partition`, `pg_dist_shard`, `pg_dist_placement`).
- Melakukan parsing query SQL, optimalisasi rencana eksekusi terdistribusi, dan menyebarkan operasi ke worker terkait.
- Bertindak sebagai Transaction Manager untuk protokol Two-Phase Commit (2PC).

### D. Citus Workers (citus_worker1 & citus_worker2)
- Node komputasi dan penyimpanan data fisik.
- Menyimpan pecahan tabel (shards) terdistribusi dan salinan penuh dari semua *reference tables*.
- Mengeksekusi filter, sorting, dan agregasi parsial secara independen dan paralel (*pushdown computation*).

### E. Citus Replica (Streaming Replication)
- Menjalankan replikasi fisik streaming PostgreSQL (`pg_basebackup -R` dan WAL streaming).
- Menerima koneksi baca saja (*read-only*), memvalidasi kepatuhan arsitektur *primary-replica*.
