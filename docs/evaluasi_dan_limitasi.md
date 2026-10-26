# Evaluasi Desain, Kelebihan, & Keterbatasan Teknis
## Sistem Basis Data Terdistribusi (SBDT)

Dokumen ini memuat evaluasi akademis yang jujur dan transparan mengenai kelebihan, kekurangan, trade-off, dan batasan operasional dari arsitektur Citus PostgreSQL yang dibangun.

---

## 1. Kelebihan Desain Sistem (Strengths)

1. **Efisiensi Join Maksimal Berkat Shard Colocation:**
   Dengan menetapkan `warehouse_id` sebagai kunci distribusi dan menggabungkan tabel `orders`, `order_items`, `inventory`, `payments`, `shipments`, dan `stock_movements` dalam satu grup kolokasi (`colocation_id = 2`), seluruh query join transaksi dieksekusi secara lokal pada memori worker. Hal ini mengeliminasi transfer data besar antar-server (*shuffle join*).
2. **Pushdown Computation pada Agregasi Lintas Shard:**
   Seperti yang terbukti pada Demo 2, query laporan omzet dihitung secara paralel oleh masing-masing worker node (*Distributed Subplan*), sehingga Coordinator hanya menerima data rangkuman kecil untuk digabungkan (*Final Aggregate Merge*).
3. **Pemisahan Beban Baca & Tulis (Read/Write Separation):**
   Adanya kontainer `citus_replica` yang menerima *physical streaming replication* memungkinkan query pembacaan katalog produk dialihkan dari Coordinator, menjaga kapasitas Coordinator tetap optimal untuk menangani transaksi checkout.
4. **Pencegahan Concurrency Anomaly (Zero Negative Stock):**
   Penggunaan penguncian eksplisit `SELECT ... FOR UPDATE` dalam transaksi ACID menjamin tidak adanya anomali *dirty read*, *non-repeatable read*, atau *lost update*, bahkan ketika ribuan pengguna berebut 1 unit sisa stok terakhir secara simultan.
5. **Transparansi Lokasi Penuh Bagi Klien & Developer:**
   Aplikasi backend dan frontend berinteraksi dengan basis data layaknya database PostgreSQL tunggal standar, menyederhanakan arsitektur kode tanpa perlu logika *manual routing* di tingkat aplikasi.

---

## 2. Keterbatasan & Trade-Off Arsitektural (Limitations)

### A. Coordinator Sebagai Single Point of Scalability Bottleneck
Meskipun worker nodes dapat ditambah secara horizontal hingga puluhan node (*scale-out*), seluruh parsing query SQL, perencanaan eksekusi terdistribusi (*distributed query planner*), dan koneksi awal klien tetap melewati satu node **Citus Coordinator**. Pada beban kerja dengan ratusan ribu koneksi konkuren, Coordinator dapat menjadi titik jenuh CPU dan memori.
- *Mitigasi di Lingkungan Produksi Enterprise:* Menggunakan fitur *Citus Distributed Query Execution with Connection Pooling (PgBouncer)* atau arsitektur *Coordinator Standby with Patroni Failover*.

### B. Restriksi Kunci Komposit (Composite Primary Key Rule)
Citus mengharuskan setiap Primary Key dan Unique Constraint pada tabel terdistribusi menyertakan kolom partisi (`warehouse_id`).
- *Konsekuensi Desain:* Kolom `id` pada tabel `orders` tidak dapat menjadi Primary Key tunggal secara independen, melainkan harus berupa `PRIMARY KEY (id, warehouse_id)`. Ini membutuhkan disiplin tinggi dalam penyusunan DDL dan foreign key.

### C. Batasan Foreign Key Lintas Shard (Cross-Shard Constraints)
Citus tidak mendukung Foreign Key antar tabel terdistribusi jika keduanya memiliki kolom distribusi yang berbeda.
- *Solusi yang Diterapkan:* Relasi global seperti pengguna (`users`), produk (`products`), dan kategori (`categories`) diwajibkan menjadi **Reference Tables** agar integritas referensial foreign key tetap diakui oleh Citus.

### D. Overhead Jaringan Protokol Two-Phase Commit (2PC)
Jika sebuah transaksi memodifikasi data pada lebih dari satu worker (misalnya transfer stok antar-gudang dari Gudang 1 ke Gudang 2), Citus harus mengoordinasikan fase *Prepare* dan *Commit* ke beberapa mesin melalui jaringan. Hal ini meningkatkan latensi penyelesaian transaksi dibandingkan database monolitik lokal.

### E. Prasyarat Replikasi Logikal untuk Shard Rebalancing
Seperti yang diidentifikasi pada pengujian Demo 5, proses pemindahan shard online Citus 12 (`citus_rebalance_start`) memanfaatkan mekanisme *logical decoding* PostgreSQL yang mensyaratkan `wal_level = logical` serta alokasi `max_wal_senders` dan `max_replication_slots` pada seluruh node. Tanpa konfigurasi ini, rebalancing otomatis akan tertahan (*blocked*).

---

## 3. Catatan Kejujuran Teknis Pengujian di Lingkungan Docker
- **Streaming Replication Coordinator:** Berhasil dijalankan penuh menggunakan `pg_basebackup -R` dan WAL streaming fisik. Read query berhasil melayani permintaan dan menolak penulisan secara tegas (*read-only database*).
- **Failover Backend & Replica:** Berhasil diuji 100% tanpa kegagalan layanan klien.
- **Failover Worker:** Dalam konfigurasi Docker Compose mandiri tanpa manajer HA eksternal (seperti Patroni), mematikan worker secara paksa akan menyebabkan query yang mengakses shard di worker tersebut gagal (*I/O error*) hingga worker dinyalakan kembali. Di industri riil, setiap worker dipasangkan dengan replica standby lokal untuk *zero-loss worker failover*.
