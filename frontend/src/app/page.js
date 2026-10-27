'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles, Shield, Database, Truck, RefreshCw } from 'lucide-react';
import { fetchApi } from '@/lib/api';
import ProductCard from '@/components/common/ProductCard';
import HeroSlider from '@/components/common/HeroSlider';

export default function HomePage() {
  const [categories, setCategories] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHomeData() {
      try {
        setLoading(true);
        const [catRes, prodRes] = await Promise.all([
          fetchApi('/products/categories'),
          fetchApi('/products?limit=8&sort=newest'),
        ]);

        if (catRes.success) setCategories(catRes.data);
        if (prodRes.success) setFeaturedProducts(prodRes.data.items);
      } catch (err) {
        console.error('Error loading home data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadHomeData();
  }, []);

  return (
    <div className="space-y-12 pb-16">
      {/* 1. HERO SLIDER DENGAN CAROUSEL GAMBAR & IKLAN INTERAKTIF (Auto 5 detik) */}
      <HeroSlider />

      {/* 2. HIGHLIGHT FITUR DATABASE TERDISTRIBUSI (SBDT) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              Fondasi Sistem Basis Data Terdistribusi
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm mt-1">
              Setiap transaksi, mutasi stok, dan pembacaan katalog berjalan di atas kluster Citus berkinerja tinggi.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
              <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                <Database className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900">Fragmentasi Shard</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Tabel pesanan, inventory, dan mutasi terfragmentasi horizontal berdasarkan <code className="text-blue-700 font-semibold">warehouse_id</code>.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
              <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
                <RefreshCw className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900">Reference Tables</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Katalog produk, kategori, dan gudang direplikasi 100% ke semua node untuk join lokal secepat kilat.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900">Isolasi Transaksi</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Pencegahan race condition dengan row-level lock <code className="text-emerald-700 font-semibold">FOR UPDATE</code> menjamin stok tidak pernah negatif.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
              <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                <Truck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900">Colocation Shard</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Tabel berelasi ditempatkan pada worker yang sama, mengeliminasi biaya transfer data lintas jaringan.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. KATEGORI FURNITUR */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              Kategori Furnitur
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Temukan furnitur berdasarkan zona ruangan Anda
            </p>
          </div>
          <Link
            href="/catalog"
            className="text-xs font-semibold text-blue-700 hover:text-blue-900 flex items-center gap-1"
          >
            <span>Semua Produk</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/catalog?category=${cat.slug}`}
              className="group block bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs hover:border-blue-400 hover:shadow-md transition text-center p-3"
            >
              <div className="aspect-square rounded-lg overflow-hidden mb-2 bg-slate-100">
                <img
                  src={cat.image_url}
                  alt={cat.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />
              </div>
              <h3 className="font-bold text-xs text-slate-800 group-hover:text-blue-700">
                {cat.name}
              </h3>
              <span className="text-[10px] text-slate-400">
                {cat.product_count} Produk
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* 4. PRODUK PILIHAN UNGGULAN */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              Produk Pilihan Terbaru
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Ketersediaan stok termutakhir dari 3 gudang regional Citus
            </p>
          </div>
          <Link
            href="/catalog"
            className="text-xs font-semibold text-blue-700 hover:text-blue-900 flex items-center gap-1"
          >
            <span>Lihat Semua ({featuredProducts.length}+)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="bg-white rounded-xl h-80 animate-pulse border border-slate-200 p-4"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {featuredProducts.map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
