# Entity Relationship Diagram (ERD) & Skema Terdistribusi

Dokumen ini memuat diagram hubungan antar-entitas (ERD) lengkap dalam format Mermaid, klasifikasi tabel berdasarkan model distribusi Citus, serta aturan kunci komposit pada basis data terdistribusi.

---

## 1. Diagram ERD (Mermaid)

```mermaid
erDiagram
    %% =========================================================================
    %% REFERENCE TABLES (Direplikasi 100% ke Coordinator dan Seluruh Worker)
    %% =========================================================================
    categories ||--o{ products : "memiliki"
    categories {
        int id PK "SERIAL"
        varchar name "Nama Kategori"
        varchar slug UK "Slug URL"
        text description
        text image_url
    }

    products ||--o{ inventory : "disimpan di"
    products ||--o{ order_items : "dibeli dalam"
    products ||--o{ stock_movements : "dimutasi"
    products {
        int id PK "SERIAL"
        int category_id FK "Referensi Kategori"
        varchar sku UK "Kode SKU Furnitur"
        varchar name "Nama Furnitur"
        numeric price "Harga Jual"
        varchar dimensions "Dimensi PxLxT"
        numeric weight_kg "Berat Produk"
        varchar material "Bahan Pembuat"
        text image_url
        boolean is_active
    }

    warehouses ||--o{ inventory : "menyimpan"
    warehouses ||--o{ orders : "memenuhi"
    warehouses ||--o{ stock_movements : "mencatat mutasi"
    warehouses {
        int id PK "SERIAL"
        varchar code UK "Kode Hub (WH-JKT)"
        varchar name "Nama Hub Regional"
        varchar city "Kota Lokasi"
        varchar region "Wilayah Layanan"
        boolean is_active
    }

    users ||--o{ orders : "membuat"
    users ||--o{ carts : "memiliki"
    users {
        int id PK "SERIAL"
        varchar name "Nama Lengkap"
        varchar email UK "Email Pengguna"
        varchar password_hash "Bcrypt Hash"
        varchar role "user | warehouse | admin | owner"
        varchar phone
        text address
    }

    promos {
        int id PK "SERIAL"
        varchar code UK "Kode Kupon"
        varchar title "Judul Promo"
        int discount_percent "Persentase 1-100%"
        numeric max_discount "Maksimal Potongan"
        numeric min_purchase "Minimal Belanja"
        date start_date
        date end_date
    }

    %% =========================================================================
    %% DISTRIBUTED TABLES (Sharded by warehouse_id & Colocated with orders)
    %% =========================================================================
    inventory {
        int product_id PK,FK "ID Produk"
        int warehouse_id PK,FK "Shard Key: ID Gudang"
        int qty "Stok Fisik Tersedia"
        int safety_stock "Batas Stok Kritis"
        timestamp updated_at
    }

    orders ||--|{ order_items : "berisi item"
    orders ||--|| payments : "dibayar via"
    orders ||--|| shipments : "dikirim via"
    orders {
        bigint id PK "BIGSERIAL"
        int warehouse_id PK,FK "Shard Key: ID Gudang"
        int user_id FK "Pembeli"
        varchar order_number "Nomor Pesanan Unik"
        varchar status "menunggu | dibayar | diproses | dikemas | dikirim | selesai"
        numeric subtotal
        numeric discount
        numeric total "Total Pembayaran"
        text shipping_address
        varchar shipping_city
        varchar recipient_name
        varchar recipient_phone
        timestamp created_at
    }

    order_items {
        bigint id PK "BIGSERIAL"
        int warehouse_id PK "Shard Key: ID Gudang"
        bigint order_id FK "ID Pesanan"
        int product_id FK "ID Produk"
        int qty "Jumlah Dibeli"
        numeric unit_price "Harga Satuan"
        numeric total_price "Total Harga Item"
    }

    payments {
        bigint id PK "BIGSERIAL"
        int warehouse_id PK "Shard Key: ID Gudang"
        bigint order_id FK "ID Pesanan"
        varchar payment_method "QRIS | BCA VA | Mandiri VA"
        varchar payment_status "pending | success | failed"
        numeric amount "Jumlah Dibayar"
        varchar transaction_ref "ID Transaksi Gateway"
        timestamp paid_at
    }

    shipments {
        bigint id PK "BIGSERIAL"
        int warehouse_id PK "Shard Key: ID Gudang"
        bigint order_id FK "ID Pesanan"
        varchar tracking_number "Nomor Resi Pengiriman"
        varchar courier "Ekspedisi Logistik"
        varchar status "siap_dikirim | dalam_perjalanan | terkirim"
        timestamp dispatched_at
        timestamp delivered_at
    }

    stock_movements {
        bigint id PK "BIGSERIAL"
        int warehouse_id PK,FK "Shard Key: ID Gudang"
        int product_id FK "ID Produk"
        varchar movement_type "IN | OUT | ADJUSTMENT | CHECKOUT"
        varchar reference_id "Nomor Pesanan / Mutasi"
        int change_qty "Perubahan Stok (+/-)"
        int final_qty "Sisa Stok Setelah Mutasi"
        text notes "Alasan Mutasi"
        int created_by FK "Staf Pencatat"
        timestamp created_at
    }

    %% =========================================================================
    %% COORDINATOR SESSION TABLES
    %% =========================================================================
    carts ||--o{ cart_items : "berisi"
    carts {
        int id PK "SERIAL"
        int user_id UK,FK "ID Pengguna"
        timestamp updated_at
    }

    cart_items {
        int id PK "SERIAL"
        int cart_id FK "ID Keranjang"
        int product_id FK "ID Produk"
        int qty "Jumlah"
    }
```

---

## 2. Klasifikasi Model Tabel Citus

| Kategori Tabel | Nama Tabel | Mekanisme Distribusi | Alasan Pemilihan |
|---|---|---|---|
| **Reference Tables** | `categories`, `products`, `warehouses`, `promos`, `users` | Direplikasi penuh ke semua node (Coordinator + seluruh Worker) | Ukuran data relatif moderat, read-heavy, dan sering di-JOIN dengan tabel transaksi. Menyediakan join lokal instan tanpa network hop. |
| **Distributed Tables (Colocated)** | `orders`, `order_items`, `inventory`, `payments`, `shipments`, `stock_movements` | Sharded secara horizontal dengan kolom distribusi `warehouse_id` (Colocation Group ID: 2) | Data bervolume tinggi dan berbasis regional. Menempatkan pesanan, item, pembayaran, dan stok dalam shard yang sama pada worker terkait. |
| **Coordinator Tables** | `carts`, `cart_items` | Tabel standar PostgreSQL di Coordinator | Menyimpan state keranjang sementara sesi aktif pembeli sebelum gudang pengirim ditentukan saat checkout. |

---

## 3. Aturan Kunci Komposit (Composite Primary Key) Citus

Dalam arsitektur basis data terdistribusi Citus Data:
> **"Primary key dan Unique Constraint pada tabel terdistribusi WAJIB menyertakan kolom distribusi (shard key)."**

### Contoh Penerapan:
- Pada tabel `orders`, Primary Key didefinisikan sebagai:
  ```sql
  PRIMARY KEY (id, warehouse_id)
  ```
- Pada relasi `order_items`:
  ```sql
  PRIMARY KEY (id, warehouse_id),
  FOREIGN KEY (order_id, warehouse_id) REFERENCES orders(id, warehouse_id) ON DELETE CASCADE
  ```
- Pada relasi `inventory`:
  ```sql
  PRIMARY KEY (product_id, warehouse_id)
  ```

Hal ini diperlukan karena setiap worker memvalidasi constraint integritas data secara independen pada shard lokal miliknya tanpa harus melakukan sinkronisasi inter-node yang lambat.
