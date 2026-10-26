-- ==============================================================================
-- SISTEM BASIS DATA TERDISTRIBUSI (SBDT) - MARKETPLACE FURNITUR (GAYA IKEA)
-- SEED DATA AWAL: PENGGUNA, GUDANG, KATEGORI, PRODUK, INVENTORY, & TRANSAKSI
-- ==============================================================================

-- 1. PENGGUNA (users) DENGAN BCRYPT HASH ASLI (cost factor 10)
-- User/Pembeli 1: buyer@ikea-sbdt.local / User123!
-- User/Pembeli 2: budi@ikea-sbdt.local / User123! (Untuk simulasi race condition)
-- Orang Gudang: gudang@ikea-sbdt.local / Gudang123!
-- Admin: admin@ikea-sbdt.local / Admin123!
-- Owner: owner@ikea-sbdt.local / Owner123!
INSERT INTO users (id, name, email, password_hash, role, phone, address) VALUES
(1, 'Siti Pembeli', 'buyer@ikea-sbdt.local', '$2b$10$OiN8wGMFYqgQKgYm3penmuk2JWCjj/XHIkj80L18IwX1MBXEHuRM.', 'user', '081234567890', 'Jl. Merdeka Barat No. 45, Jakarta Selatan'),
(2, 'Budi Pembeli Dua', 'budi@ikea-sbdt.local', '$2b$10$OiN8wGMFYqgQKgYm3penmuk2JWCjj/XHIkj80L18IwX1MBXEHuRM.', 'user', '081234567891', 'Jl. Diponegoro No. 12, Surabaya'),
(3, 'Ahmad Staf Gudang', 'gudang@ikea-sbdt.local', '$2b$10$IOSFzxyiCBWNVWAZFpB90.ddALWZBpWpprvhvjjMPM5Ea/p2PGgmO', 'warehouse', '082198765432', 'Mess Operasional Gudang Hub 1'),
(4, 'Dewi Administrator', 'admin@ikea-sbdt.local', '$2b$10$DqgvFFrisxuInNauQ.kxoeXSIC8XeUytyrQHGIAqGrn8Tyh.2uUMi', 'admin', '081377889900', 'Kantor Pusat IKEA SBDT Tower Lt. 15, Jakarta'),
(5, 'Hendra Fransiscus (Owner)', 'owner@ikea-sbdt.local', '$2b$10$SxceRCHmku2BLSBQFWFKhOPw5C27/E4AuNgYO4uBDp0fCuvFn25hm', 'owner', '081122334455', 'Penthouse Graha Niaga, Jakarta')
ON CONFLICT (id) DO NOTHING;

SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));

-- 2. GUDANG REGIONAL (warehouses)
INSERT INTO warehouses (id, code, name, region, city, address, phone, is_active) VALUES
(1, 'WH-JKT', 'Hub Distribusi Barat (Jakarta)', 'DKI Jakarta & Banten', 'Tangerang', 'Kawasan Industri Intercon Park Blok C-12, BSD', '021-5551234', TRUE),
(2, 'WH-SBY', 'Hub Distribusi Timur (Surabaya)', 'Jawa Timur', 'Sidoarjo', 'Kawasan Industri Rungkut Megah No. 88, Waru', '031-8987654', TRUE),
(3, 'WH-MDN', 'Hub Distribusi Sumatera (Medan)', 'Sumatera Utara', 'Medan', 'Kawasan Industri Medan (KIM) III Blok B-05', '061-6678901', TRUE)
ON CONFLICT (id) DO NOTHING;

SELECT setval('warehouses_id_seq', (SELECT MAX(id) FROM warehouses));

-- 3. KATEGORI (categories)
INSERT INTO categories (id, name, slug, description, icon, image_url) VALUES
(1, 'Ruang Tamu', 'ruang-tamu', 'Sofa, meja kopi, dan perabot santai berdesain modern minimalis.', 'Sofa', 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80'),
(2, 'Kamar Tidur', 'kamar-tidur', 'Rangka tempat tidur, kasur ergonomis, dan lemari pakaian luas.', 'Bed', 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80'),
(3, 'Ruang Makan', 'ruang-makan', 'Meja makan kayu solid dan kursi makan berestetika Skandinavia.', 'Utensils', 'https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=800&q=80'),
(4, 'Ruang Kerja', 'ruang-kerja', 'Meja kerja adjustable, kursi ergonomis, dan rak dokumen.', 'Briefcase', 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=800&q=80'),
(5, 'Penyimpanan & Rak', 'penyimpanan', 'Rak buku modular, lemari laci, dan unit penyimpanan multifungsi.', 'Archive', 'https://images.unsplash.com/photo-1594026112284-02bb6f3352fe?auto=format&fit=crop&w=800&q=80'),
(6, 'Lampu & Dekorasi', 'lampu-dekorasi', 'Pencahayaan hangat, karpet Nordic, dan cermin hias estetik.', 'Lamp', 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80')
ON CONFLICT (id) DO NOTHING;

SELECT setval('categories_id_seq', (SELECT MAX(id) FROM categories));

-- 4. PRODUK FURNITUR (products)
INSERT INTO products (id, category_id, sku, name, slug, description, price, dimensions, weight_kg, material, color, image_url) VALUES
-- Ruang Tamu
(1, 1, 'SOF-KIVIK-01', 'Sofa 3 Dudukan KIVIK Nordic', 'sofa-3-dudukan-kivik-nordic', 'Sofa empuk dengan bantalan memory foam dan sarung kain ramah lingkungan yang dapat dicuci.', 4899000.00, '228 x 95 x 83 cm', 65.5, 'Kayu Solid & Busa Memory Foam', 'Abu-abu Arang', 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80'),
(2, 1, 'TBL-LACK-02', 'Meja Kopi Kayu Solid LACK Oak', 'meja-kopi-kayu-solid-lack-oak', 'Meja kopi bergaya Skandinavia dengan rak bawah untuk penyimpanan majalah dan remote.', 899000.00, '90 x 55 x 45 cm', 11.2, 'Particleboard & Kayu Ek Solid', 'Natural Oak', 'https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?auto=format&fit=crop&w=800&q=80'),
(3, 1, 'ARM-POANG-03', 'Kursi Santai Armchair POÄNG Leather', 'kursi-santai-armchair-poang-leather', 'Kursi santai legendaris dengan rangka kayu lentur yang menopang leher dan punggung secara optimal. Stok Terbatas!', 2499000.00, '68 x 82 x 100 cm', 9.8, 'Kayu Birch Veneer & Kulit Sintetis', 'Hitam Elegan', 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80'),
(4, 1, 'TVB-BESTA-04', 'Bufet TV Minimalis BESTÅ Walnut', 'bufet-tv-minimalis-besta-walnut', 'Unit penyimpanan TV modern dengan manajemen kabel rahasia dan pintu dorong soft-close.', 3150000.00, '180 x 42 x 64 cm', 38.0, 'Engineered Wood & Veneer Walnut', 'Cokelat Kayu Walnut', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80'),

-- Kamar Tidur
(5, 2, 'BED-MALM-05', 'Rangka Tempat Tidur King MALM Scandi', 'rangka-tempat-tidur-king-malm-scandi', 'Rangka tempat tidur tinggi dengan 4 laci penyimpanan tersembunyi beroda di bagian bawah.', 5499000.00, '209 x 196 x 100 cm', 78.0, 'Kayu Solid & Pelapis Melamin', 'Putih Salju', 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80'),
(6, 2, 'MAT-VALEVAG-06', 'Kasur Pegas Pocket VALEVÅG Plush', 'kasur-pegas-pocket-valevag-plush', 'Kasur pegas pocket berinsulasi tinggi yang meredam getaran saat pasangan bergerak di malam hari.', 3799000.00, '180 x 200 x 24 cm', 34.0, 'Pocket Spring & Busa Lateks Alami', 'Putih Krem', 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=800&q=80'),
(7, 2, 'WAD-PAX-07', 'Lemari Pakaian 3 Pintu Kaca PAX Modular', 'lemari-pakaian-3-pintu-kaca-pax-modular', 'Sistem lemari pakaian modular lengkap dengan rak pakaian gantung, laci perhiasan, dan cermin.', 7899000.00, '150 x 60 x 236 cm', 95.0, 'Kaca Tempered & High-Density Fiberboard', 'Abu-abu Matte', 'https://images.unsplash.com/photo-1616046229478-9901c5536a45?auto=format&fit=crop&w=800&q=80'),
(8, 2, 'NIT-KNAR-08', 'Meja Samping Ranjang KNARREVIK Besi', 'meja-samping-ranjang-knarrevik-besi', 'Meja nakas minimalis berbahan baja kokoh dengan profil ramping dan modern.', 249000.00, '37 x 28 x 45 cm', 3.5, 'Baja Powder Coated', 'Hitam Doff', 'https://images.unsplash.com/photo-1532372320572-cda25653a26d?auto=format&fit=crop&w=800&q=80'),

-- Ruang Makan
(9, 3, 'DIN-EKED-09', 'Meja Makan Kayu Jati Extendable EKEDALEN', 'meja-makan-kayu-jati-extendable-ekedalen', 'Meja makan pintar yang dapat dipanjangkan dari kapasitas 4 orang menjadi 8 orang dengan mudah.', 4299000.00, '120/180 x 80 x 75 cm', 42.0, 'Kayu Solid & Ash Veneer', 'Cokelat Kayu Alami', 'https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=800&q=80'),
(10, 3, 'CHR-INGOLF-10', 'Kursi Makan Klasik INGOLF Set (2 Kursi)', 'kursi-makan-klasik-ingolf-set-2-kursi', 'Kursi kayu solid dengan sandaran silang tradisional yang kokoh dan nyaman.', 1299000.00, '43 x 52 x 91 cm', 12.0, 'Kayu Pinus Solid', 'Putih Bersih', 'https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=800&q=80'),
(11, 3, 'BAR-NORD-11', 'Meja Bar & 2 Kursi NORDVIKEN High', 'meja-bar-2-kursi-nordviken-high', 'Set meja makan bar tinggi cocok untuk dapur apartemen berkonsep open-space.', 3450000.00, '140 x 80 x 105 cm', 36.0, 'Kayu Solid', 'Hitam Arang', 'https://images.unsplash.com/photo-1577140917170-285929fb55b7?auto=format&fit=crop&w=800&q=80'),

-- Ruang Kerja
(12, 4, 'DSK-BEKANT-12', 'Meja Kerja Ergonomis Standing BEKANT', 'meja-kerja-ergonomis-standing-bekant', 'Meja kerja adjustable bermotor elektrik untuk transisi posisi kerja duduk dan berdiri.', 5999000.00, '160 x 80 x 65-125 cm', 45.0, 'Rangka Baja & Meja Linoleum', 'Hitam & Oak', 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=800&q=80'),
(13, 4, 'CHR-MARKUS-13', 'Kursi Kantor Ergonomis MARKUS Mesh', 'kursi-kantor-ergonomis-markus-mesh', 'Kursi kerja bersertifikasi ergonomis dengan sandaran jaring berventilasi dan penyangga lumbar.', 2799000.00, '62 x 60 x 140 cm', 21.0, 'Baja, Plastik Poliamida & Kain Mesh', 'Abu-abu Gelap', 'https://images.unsplash.com/photo-1580481077195-c3a821a78e48?auto=format&fit=crop&w=800&q=80'),
(14, 4, 'DRA-ALEX-14', 'Unit Laci Dokumen Beroda ALEX 5 Laci', 'unit-laci-dokumen-beroda-alex-5-laci', 'Unit laci penyimpanan file kantor dengan roda senyap dan rel laci halus.', 1399000.00, '36 x 58 x 70 cm', 18.0, 'Fibreboard & Cat Akrilik', 'Biru Nordik', 'https://images.unsplash.com/photo-1595515106969-1ce29566ff1c?auto=format&fit=crop&w=800&q=80'),

-- Penyimpanan & Rak
(15, 5, 'SHF-BILLY-15', 'Rak Buku Modular BILLY 5 Tingkat', 'rak-buku-modular-billy-5-tingkat', 'Rak buku paling populer di dunia dengan ambalan yang dapat disesuaikan ketinggiannya.', 1199000.00, '80 x 28 x 202 cm', 32.5, 'Particleboard & Oak Veneer', 'Natural Oak', 'https://images.unsplash.com/photo-1594026112284-02bb6f3352fe?auto=format&fit=crop&w=800&q=80'),
(16, 5, 'SHF-KALLAX-16', 'Unit Rak Kotak KALLAX 4x4 Kubus', 'unit-rak-kotak-kallax-4x4-kubus', 'Rak sekat serbaguna yang dapat digunakan sebagai pembatas ruangan atau lemari display.', 1899000.00, '147 x 39 x 147 cm', 41.0, 'Honeycomb Paper Filling & Fibreboard', 'Putih Glossy', 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?auto=format&fit=crop&w=800&q=80'),
(17, 5, 'CAB-HEMNES-17', 'Lemari Laci Kamar HEMNES 6 Laci Kayu Solid', 'lemari-laci-kamar-hemnes-6-laci-kayu-solid', 'Lemari laci klasik bergaya Swedia dari kayu pinus lestari solid.', 3699000.00, '108 x 50 x 131 cm', 49.0, 'Kayu Pinus Solid', 'Putih Antik', 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=800&q=80'),

-- Lampu & Dekorasi
(18, 6, 'LMP-HEKTAR-18', 'Lampu Lantai Industri HEKTAR Baja Gelap', 'lampu-lantai-industri-hektar-baja-gelap', 'Lampu lantai dengan kap lampu terinspirasi pabrik industri tua, memberikan fokus cahaya dramatis.', 899000.00, '181 cm (Tinggi)', 7.2, 'Baja & Epoxy Coating', 'Abu-abu Tua Metalik', 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80'),
(19, 6, 'RUG-VINDUM-19', 'Karpet Wol Nordic Tebal VINDUM 170x230', 'karpet-wol-nordic-tebal-vindum-170x230', 'Karpet berbulu tebal dengan kombinasi benang tenun lembut motif kontemporer.', 1999000.00, '170 x 230 cm', 14.5, '100% Polipropilena', 'Multicolor Halus', 'https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=800&q=80'),
(20, 6, 'MIR-NISSE-20', 'Cermin Gantung Dinding Datar NISSEDAL 65x150', 'cermin-gantung-dinding-datar-nissedal-65x150', 'Cermin berbingkai minimalis yang dapat digantung horizontal maupun vertikal.', 699000.00, '65 x 150 cm', 8.5, 'Kaca & Foil Dinding', 'Hitam Grafis', 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80')
ON CONFLICT (id) DO NOTHING;

SELECT setval('products_id_seq', (SELECT MAX(id) FROM products));

-- 5. KODE PROMO (promos)
INSERT INTO promos (id, code, title, discount_percent, max_discount, min_purchase, start_date, end_date, is_active) VALUES
(1, 'IKEASBDT10', 'Diskon Spesial Mahasiswa SBDT 10%', 10, 500000.00, 1000000.00, '2026-01-01', '2026-12-31', TRUE),
(2, 'FURNITURHEMAT', 'Promo Gajian Hemat 15%', 15, 1000000.00, 2500000.00, '2026-01-01', '2026-12-31', TRUE),
(3, 'BEBASKIRIM', 'Subsidi Ongkos Kirim Gudang 20%', 20, 300000.00, 500000.00, '2026-01-01', '2026-12-31', TRUE)
ON CONFLICT (id) DO NOTHING;

SELECT setval('promos_id_seq', (SELECT MAX(id) FROM promos));

-- 6. INVENTORY PER GUDANG (inventory)
-- CATATAN KHUSUS UNTUK DEMO RACE CONDITION:
-- Produk 3 (ARM-POANG-03) di Warehouse 1 (Jakarta) sengaja diset HANYA TERSISA 1 UNIT!
INSERT INTO inventory (product_id, warehouse_id, qty, safety_stock) VALUES
-- Gudang 1: Jakarta (Hub Barat)
(1, 1, 15, 3),
(2, 1, 25, 5),
(3, 1, 1, 1),   -- << STOK KRITIS = 1 UNIT UNTUK DEMO RACE CONDITION!
(4, 1, 10, 2),
(5, 1, 8, 2),
(6, 1, 20, 4),
(7, 1, 6, 2),
(8, 1, 40, 10),
(9, 1, 12, 3),
(10, 1, 30, 5),
(11, 1, 7, 2),
(12, 1, 14, 3),
(13, 1, 18, 4),
(14, 1, 22, 5),
(15, 1, 35, 6),
(16, 1, 28, 5),
(17, 1, 9, 2),
(18, 1, 30, 5),
(19, 1, 16, 3),
(20, 1, 45, 8),

-- Gudang 2: Surabaya (Hub Timur)
(1, 2, 12, 3),
(2, 2, 18, 4),
(3, 2, 5, 2),
(4, 2, 8, 2),
(5, 2, 10, 2),
(6, 2, 15, 3),
(7, 2, 4, 1),
(8, 2, 35, 8),
(9, 2, 9, 2),
(10, 2, 24, 4),
(11, 2, 6, 2),
(12, 2, 11, 2),
(13, 2, 16, 3),
(14, 2, 19, 4),
(15, 2, 25, 5),
(16, 2, 20, 4),
(17, 2, 7, 2),
(18, 2, 22, 4),
(19, 2, 14, 3),
(20, 2, 38, 6),

-- Gudang 3: Medan (Hub Sumatera)
(1, 3, 6, 2),
(2, 3, 10, 2),
(3, 3, 3, 1),
(4, 3, 5, 1),
(5, 3, 4, 1),
(6, 3, 8, 2),
(7, 3, 2, 1),
(8, 3, 20, 5),
(9, 3, 5, 1),
(10, 3, 15, 3),
(11, 3, 3, 1),
(12, 3, 7, 2),
(13, 3, 10, 2),
(14, 3, 12, 3),
(15, 3, 18, 4),
(16, 3, 12, 3),
(17, 3, 4, 1),
(18, 3, 15, 3),
(19, 3, 8, 2),
(20, 3, 25, 4)
ON CONFLICT (product_id, warehouse_id) DO UPDATE SET qty = EXCLUDED.qty;

-- 7. MUTASI STOK AWAL (stock_movements)
INSERT INTO stock_movements (warehouse_id, product_id, movement_type, reference_type, reference_id, change_qty, final_qty, notes, created_by)
SELECT warehouse_id, product_id, 'IN', 'INITIAL_STOCK', 'INIT-2026', qty, qty, 'Saldo stok inisialisasi awal sistem', 3
FROM inventory;

-- 8. DATA DUMMY PESANAN MASA LALU (Untuk Mengisi Grafik Owner Dashboard Lintas Shard)
-- Pesanan 1 di Gudang 1 (Jakarta)
INSERT INTO orders (id, warehouse_id, user_id, order_number, status, subtotal, discount, total, shipping_address, shipping_city, recipient_name, recipient_phone, created_at)
VALUES (1, 1, 1, 'ORD-20261001-001', 'selesai', 5798000.00, 500000.00, 5298000.00, 'Jl. M.H. Thamrin No. 1, Jakarta Pusat', 'Jakarta', 'Siti Pembeli', '081234567890', NOW() - INTERVAL '5 days');

INSERT INTO order_items (warehouse_id, order_id, product_id, qty, unit_price, total_price)
VALUES (1, 1, 1, 1, 4899000.00, 4899000.00),
       (1, 1, 2, 1, 899000.00, 899000.00);

INSERT INTO payments (warehouse_id, order_id, payment_method, payment_status, amount, transaction_ref, va_number, paid_at)
VALUES (1, 1, 'BCA Virtual Account', 'success', 5298000.00, 'TRX-BCA-981273', '88081234567890', NOW() - INTERVAL '5 days');

INSERT INTO shipments (warehouse_id, order_id, tracking_number, courier, status, dispatched_at, delivered_at)
VALUES (1, 1, 'JNE-TRK-7712391', 'JNE Trucking (JTR)', 'terkirim', NOW() - INTERVAL '4 days', NOW() - INTERVAL '2 days');

-- Pesanan 2 di Gudang 2 (Surabaya)
INSERT INTO orders (id, warehouse_id, user_id, order_number, status, subtotal, discount, total, shipping_address, shipping_city, recipient_name, recipient_phone, created_at)
VALUES (2, 2, 2, 'ORD-20261002-002', 'dikirim', 5598000.00, 0.00, 5598000.00, 'Jl. Basuki Rahmat No. 70, Surabaya', 'Surabaya', 'Budi Pembeli Dua', '081234567891', NOW() - INTERVAL '2 days');

INSERT INTO order_items (warehouse_id, order_id, product_id, qty, unit_price, total_price)
VALUES (2, 2, 9, 1, 4299000.00, 4299000.00),
       (2, 2, 10, 1, 1299000.00, 1299000.00);

INSERT INTO payments (warehouse_id, order_id, payment_method, payment_status, amount, transaction_ref, va_number, paid_at)
VALUES (2, 2, 'Mandiri Virtual Account', 'success', 5598000.00, 'TRX-MND-441290', '890081234567891', NOW() - INTERVAL '2 days');

INSERT INTO shipments (warehouse_id, order_id, tracking_number, courier, status, dispatched_at)
VALUES (2, 2, 'SICEPAT-CARGO-10992', 'SiCepat Cargo', 'dalam_perjalanan', NOW() - INTERVAL '1 day');

-- Pesanan 3 di Gudang 1 (Jakarta) - Status Menunggu Diproses
INSERT INTO orders (id, warehouse_id, user_id, order_number, status, subtotal, discount, total, shipping_address, shipping_city, recipient_name, recipient_phone, created_at)
VALUES (3, 1, 1, 'ORD-20261003-003', 'diproses', 3799000.00, 0.00, 3799000.00, 'Jl. Fatmawati Raya No. 19, Jakarta Selatan', 'Jakarta', 'Siti Pembeli', '081234567890', NOW() - INTERVAL '12 hours');

INSERT INTO order_items (warehouse_id, order_id, product_id, qty, unit_price, total_price)
VALUES (1, 3, 6, 1, 3799000.00, 3799000.00);

INSERT INTO payments (warehouse_id, order_id, payment_method, payment_status, amount, transaction_ref, va_number, paid_at)
VALUES (1, 3, 'BNI Virtual Account', 'success', 3799000.00, 'TRX-BNI-992011', '98801234567890', NOW() - INTERVAL '12 hours');

INSERT INTO shipments (warehouse_id, order_id, tracking_number, courier, status)
VALUES (1, 3, 'JNE-TRK-8829102', 'JNE Trucking (JTR)', 'siap_dikirim');

-- Update sequence nilai id terakhir untuk SELURUH tabel sistem
SELECT setval('users_id_seq', (SELECT COALESCE(MAX(id), 1) FROM users));
SELECT setval('warehouses_id_seq', (SELECT COALESCE(MAX(id), 1) FROM warehouses));
SELECT setval('categories_id_seq', (SELECT COALESCE(MAX(id), 1) FROM categories));
SELECT setval('products_id_seq', (SELECT COALESCE(MAX(id), 1) FROM products));
SELECT setval('promos_id_seq', (SELECT COALESCE(MAX(id), 1) FROM promos));
SELECT setval('orders_id_seq', (SELECT COALESCE(MAX(id), 1) FROM orders));
SELECT setval('order_items_id_seq', (SELECT COALESCE(MAX(id), 1) FROM order_items));
SELECT setval('payments_id_seq', (SELECT COALESCE(MAX(id), 1) FROM payments));
SELECT setval('shipments_id_seq', (SELECT COALESCE(MAX(id), 1) FROM shipments));
SELECT setval('stock_movements_id_seq', (SELECT COALESCE(MAX(id), 1) FROM stock_movements));
SELECT setval('carts_id_seq', (SELECT COALESCE(MAX(id), 1) FROM carts));
SELECT setval('cart_items_id_seq', (SELECT COALESCE(MAX(id), 1) FROM cart_items));

