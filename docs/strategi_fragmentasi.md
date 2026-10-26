# Strategi Fragmentasi & Colocation Shard
## Sistem Basis Data Terdistribusi (SBDT)

Dokumen ini menguraikan landasan teoritis dan teknis dalam perancangan skema fragmentasi data, pemilihan kolom distribusi, dan mekanisme kolokasi shard pada marketplace furnitur Citus PostgreSQL.

---

## 1. Mengapa Fragmentasi Horizontal (Horizontal Sharding)?

Dalam bisnis ritel furnitur seperti IKEA, volume data transaksi (pesanan, item pesanan, dan catatan pergerakan stok) bertumbuh secara eksponensial seiring bertambahnya transaksi harian.

Jika disimpan dalam database monolitik tunggal (*single instance*):
1. **Bottleneck I/O Disk & Memori:** Tabel transaksi yang mencapai puluhan juta baris akan melebihi kapasitas buffer pool RAM, menyebabkan waktu baca/tulis membengkak.
2. **Keterbatasan Skalabilitas Vertikal:** Menambah CPU dan RAM server tunggal memiliki batas fisik (*diminishing returns*) dan biaya yang eksorbitan.
3. **Resiko Single Point of Failure (SPOF):** Jika server database tunggal mengalami crash, seluruh operasional di semua wilayah lumpuh.

Dengan **Fragmentasi Horizontal**, data dipecah menjadi partisi logis (*shards*) yang didistribusikan ke sejumlah node pekerja (*worker nodes*), memungkinkan penskalaan kapasitas penyimpanan dan throughput query secara linier (*scale-out*).

---

## 2. Alasan Pemilihan Kolom Distribusi (`warehouse_id`)

Pemilihan kolom distribusi (*distribution key / shard key*) adalah keputusan arsitektur paling fundamental dalam sistem Citus. Kami memilih kolom `warehouse_id` dengan pertimbangan:

### A. Keselarasan Domain Bisnis Ritel (Natural Business Boundary)
- Barang furnitur berukuran besar tidak disimpan di awan maya, melainkan secara fisik di gudang regional (misalnya Hub Jakarta, Hub Surabaya, Hub Medan).
- Ketika pembeli melakukan pemesanan, pemenuhan pesanan (*order fulfillment*), pengemasan, dan pemotongan stok selalu terikat pada satu gudang fisik tertentu.
- Mutasi stok barang masuk (*stock-in*), pengeluaran (*stock-out*), dan pelacakan ekspedisi semuanya berakar pada entitas gudang.

### B. Memaksimalkan Query Locality (Kemandirian Transaksi)
Sebagian besar query operasional sistem menyertakan `warehouse_id` dalam klausa `WHERE`:
```sql
-- Pengecekan stok gudang saat checkout
SELECT qty FROM inventory WHERE product_id = 3 AND warehouse_id = 1 FOR UPDATE;

-- Antrean pesanan staf gudang
SELECT * FROM orders WHERE warehouse_id = 1 AND status = 'diproses';
```
Dengan menyertakan `warehouse_id`, Coordinator langsung merutekan query ke worker yang tepat secara spesifik (*single-shard routing*), tanpa perlu membroadcast query ke seluruh kluster (*scatter-gather*).

---

## 3. Konsep & Manfaat Shard Colocation

Dalam Citus, **Colocation** memastikan bahwa shard dari tabel-tabel terdistribusi yang berbeda namun memiliki nilai shard key yang sama ditempatkan pada **worker node fisik yang persis sama**.

### Tabel-Tabel yang Di-colocate:
```sql
SELECT create_distributed_table('inventory', 'warehouse_id');
SELECT create_distributed_table('orders', 'warehouse_id', colocate_with => 'inventory');
SELECT create_distributed_table('order_items', 'warehouse_id', colocate_with => 'orders');
SELECT create_distributed_table('payments', 'warehouse_id', colocate_with => 'orders');
SELECT create_distributed_table('shipments', 'warehouse_id', colocate_with => 'orders');
SELECT create_distributed_table('stock_movements', 'warehouse_id', colocate_with => 'orders');
```

Semua tabel di atas memiliki `colocation_id = 2` pada Citus metadata.

### Dampak Performa Colocation:
1. **Join Lokal Tanpa Network Hop (Eliminasi Shuffle Joins):**
   Ketika melakukan JOIN antara `orders` dan `order_items` berdasarkan `order_id` dan `warehouse_id`, query dieksekusi 100% di dalam proses PostgreSQL lokal pada worker node tersebut. Tidak ada baris data yang perlu dikirim melalui kabel jaringan antar-worker.
2. **Transaksi ACID Lokal Terisolasi:**
   Saat endpoint checkout memotong stok di `inventory`, membuat baris di `orders`, `order_items`, `payments`, dan `stock_movements`, seluruh operasi modifikasi data terjadi pada worker lokal yang sama. Hal ini meminimalkan overhead protokol Two-Phase Commit (2PC) dan latensi jaringan.

---

## 4. Strategi Reference Tables (Replikasi Penuh)

Tidak semua tabel cocok difragmentasi. Tabel `categories`, `products`, `warehouses`, `promos`, dan `users` dijadikan **Reference Tables**:
```sql
SELECT create_reference_table('products');
SELECT create_reference_table('categories');
SELECT create_reference_table('warehouses');
SELECT create_reference_table('promos');
SELECT create_reference_table('users');
```

### Karakteristik Reference Tables:
- **Replikasi 100%:** Tabel referensi disimpan lengkap di Coordinator dan direplikasi otomatis ke setiap worker node (`citus_worker1`, `citus_worker2`, `citus_worker3`).
- **Read-Heavy & Relatif Statis:** Perubahan katalog produk atau kategori jarang terjadi dibandingkan transaksi pesanan.
- **Join Global:** Setiap worker dapat melakukan JOIN lokal antara shard tabel transaksinya (misalnya `order_items`) dengan data produk atau kategori tanpa perlu meminta data ke Coordinator.
