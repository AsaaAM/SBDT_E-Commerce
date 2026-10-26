# Analisis Teorema CAP & PACELC
## Sistem Basis Data Terdistribusi (SBDT)

Dokumen ini membedah trade-off arsitektural sistem marketplace furnitur terdistribusi berdasarkan **Teorema CAP** (*Consistency, Availability, Partition Tolerance*) oleh Eric Brewer dan model lanjutan **PACELC** oleh Daniel Abadi.

---

## 1. Landasan Teorema CAP

Teorema CAP menyatakan bahwa dalam sistem basis data terdistribusi yang mengalami partisi jaringan (*network partition*), sistem hanya dapat menjamin salah satu dari dua pilihan:
- **Consistency (C):** Setiap operasi baca menerima data tulis terbaru atau menghasilkan error.
- **Availability (A):** Setiap request yang tidak gagal selalu menerima respon non-error, tanpa jaminan bahwa data tersebut adalah yang paling mutakhir.
- **Partition Tolerance (P):** Sistem tetap dapat beroperasi meskipun terjadi kehilangan paket data atau penundaan jaringan antar-node.

Karena partisi jaringan dalam infrastruktur terdistribusi (Docker/Cloud/Datacenter) tidak dapat dihindari secara mutlak, arsitektur harus memilih antara **CP** atau **AP**.

---

## 2. Pendekatan Hybrid: CP vs AP Berdasarkan Sub-Sistem

Dalam sistem e-commerce furnitur berskala enterprise, menerapkan satu aturan absolut untuk seluruh sistem adalah pendekatan yang keliru. Sistem ini menerapkan pendekatan **Hybrid / Poliglot Konsistensi**:

```
                               Teorema CAP
                                    ▲
                                   / \
                                  /   \
                                 /     \
                       (CP)     /       \     (AP)
                 Sub-Sistem    /_________\  Sub-Sistem
             Stok & Checkout                Katalog & Pencarian
```

### A. Sub-Sistem Stok & Checkout: Memilih **CP (Consistency + Partition Tolerance)**
- **Domain:** `inventory`, `orders`, `order_items`, `payments`, `stock_movements`.
- **Rasional:** Dalam bisnis furnitur fisik, stok barang berukuran besar (misalnya Sofa KIVIK atau Lemari PAX) memiliki batas kuantitas fisik di gudang. Menjual barang yang tidak ada (*overselling*) menimbulkan pembatalan sepihak, denda regulasi, dan kekecewaan pelanggan.
- **Implementasi:**
  - Menggunakan row-level locking atomik:
    ```sql
    SELECT qty FROM inventory WHERE product_id = $1 AND warehouse_id = $2 FOR UPDATE;
    ```
  - Transaksi Two-Phase Commit (2PC): Jika terjadi partisi jaringan ke worker terkait atau stok habis, transaksi langsung di-**ROLLBACK** dan dikembalikan sebagai error HTTP 400 (`INSUFFICIENT_STOCK`).
  - Sistem mengorbankan Availability (A) demi menjaga Konsistensi Mutlak (C): lebih baik transaksi ditolak daripada menghasilkan stok negatif (-1).

### B. Sub-Sistem Katalog & Referensi: Memilih **AP (Availability + Partition Tolerance)**
- **Domain:** `products`, `categories`, `promos`, `warehouses`.
- **Rasional:** Pengunjung marketplace yang sedang melihat-lihat foto produk, membaca dimensi meja, atau mengecek daftar kategori harus selalu dilayani dengan cepat (*high availability* dan *low latency*). Sedikit keterlambatan sinkronisasi data deskripsi produk (eventual consistency) tidak merugikan bisnis secara fatal.
- **Implementasi:**
  - Menggunakan **Reference Tables** yang direplikasi ke seluruh worker dan node **Streaming Replica**.
  - Query baca diarahkan ke `replicaPool` (Citus Replica). Jika kontainer replica mati, koneksi secara otomatis dialihkan (*failover*) ke Coordinator primary tanpa menampilkan layar error kepada pembeli.

---

## 3. Analisis Berdasarkan Teorema PACELC

Teorema PACELC memperluas CAP dengan mempertimbangkan perilaku sistem ketika kondisi jaringan **normal (tidak terjadi partisi)**:
> **Jika Partition (P)**: Pilih antara **Availability (A)** atau **Consistency (C)**.  
> **Else (E)**: Pilih antara **Latency (L)** atau **Consistency (C)**.

| Sub-Sistem | Klasifikasi PACELC | Karakteristik Perilaku |
|---|---|---|
| **Inventory & Checkout Transaksi** | **PC / EC** | - Saat partisi (P): Menolak transaksi demi menjamin **Consistency (C)**.<br>- Saat normal (E): Memprioritaskan **Consistency (C)** daripada Latency (L). Sistem rela menunggu penguncian baris selesai demi memastikan integritas stok. |
| **Katalog Produk & Kategori** | **PA / EL** | - Saat partisi (P): Tetap melayani pembacaan data dari replika lokal demi **Availability (A)**.<br>- Saat normal (E): Memprioritaskan **Latency (L)** rendah dengan membaca dari read-replica terdekat. |

---

## 4. Ringkasan Evaluasi Teori
Dengan memisahkan model konsistensi antara data transaksional (CP) dan data katalog (AP), sistem berhasil meraih keseimbangan optimal antara **keandalan finansial bisnis** dan **kecepatan pengalaman pengguna**.
