'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Filter, SlidersHorizontal, RotateCcw, Search } from 'lucide-react';
import { fetchApi } from '@/lib/api';
import ProductCard from '@/components/common/ProductCard';

function CatalogContent() {
  const searchParams = useSearchParams();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [pagination, setPagination] = useState({ total_items: 0, total_pages: 1, current_page: 1 });
  const [loading, setLoading] = useState(true);

  // Filter States
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [selectedWarehouse, setSelectedWarehouse] = useState(searchParams.get('warehouse_id') || '');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sort, setSort] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);

  // Load Metadata (Categories & Warehouses)
  useEffect(() => {
    async function loadMetadata() {
      try {
        const [catRes, whRes] = await Promise.all([
          fetchApi('/products/categories'),
          fetchApi('/products/warehouses'),
        ]);
        if (catRes.success) setCategories(catRes.data);
        if (whRes.success) setWarehouses(whRes.data);
      } catch (err) {
        console.error('Error fetching metadata:', err);
      }
    }
    loadMetadata();
  }, []);

  // Update query when URL search param changes
  useEffect(() => {
    const q = searchParams.get('q');
    const cat = searchParams.get('category');
    if (q !== null) setQuery(q);
    if (cat !== null) setSelectedCategory(cat);
  }, [searchParams]);

  // Fetch Products based on filters
  useEffect(() => {
    async function loadProducts() {
      try {
        setLoading(true);
        const queryParams = new URLSearchParams();
        if (query) queryParams.set('q', query);
        if (selectedCategory) queryParams.set('category', selectedCategory);
        if (selectedWarehouse) queryParams.set('warehouse_id', selectedWarehouse);
        if (minPrice) queryParams.set('min_price', minPrice);
        if (maxPrice) queryParams.set('max_price', maxPrice);
        if (sort) queryParams.set('sort', sort);
        queryParams.set('page', currentPage.toString());
        queryParams.set('limit', '9');

        const res = await fetchApi(`/products?${queryParams.toString()}`);
        if (res.success && res.data) {
          setProducts(res.data.items);
          setPagination(res.data.pagination);
        }
      } catch (err) {
        console.error('Error loading products:', err);
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, [query, selectedCategory, selectedWarehouse, minPrice, maxPrice, sort, currentPage]);

  const handleResetFilters = () => {
    setQuery('');
    setSelectedCategory('');
    setSelectedWarehouse('');
    setMinPrice('');
    setMaxPrice('');
    setSort('newest');
    setCurrentPage(1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Katalog Furnitur Skandinavia
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Menampilkan data produk dari tabel referensi dengan status stok realtime dari kluster worker Citus.
          </p>
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <SlidersHorizontal className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-medium text-slate-600">Urutkan:</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
          >
            <option value="newest">Terbaru</option>
            <option value="price_asc">Harga: Rendah ke Tinggi</option>
            <option value="price_desc">Harga: Tinggi ke Rendah</option>
            <option value="name_asc">Nama (A-Z)</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* SIDEBAR FILTER */}
        <aside className="space-y-6 bg-white p-5 rounded-xl border border-slate-200 shadow-xs h-fit">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <span className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
              <Filter className="w-4 h-4 text-blue-700" />
              <span>Filter Produk</span>
            </span>
            <button
              onClick={handleResetFilters}
              className="text-[11px] text-blue-700 hover:text-blue-900 font-medium flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>

          {/* Pencarian Keyword */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700">Pencarian</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Nama atau SKU..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg py-1.5 pl-3 pr-8 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Filter Gudang Regional (Shard Worker Citus) */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700">Gudang Regional (Shard)</label>
            <select
              value={selectedWarehouse}
              onChange={(e) => setSelectedWarehouse(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            >
              <option value="">Semua Gudang</option>
              {warehouses.map((wh) => (
                <option key={wh.id} value={wh.id}>
                  {wh.name} ({wh.city})
                </option>
              ))}
            </select>
          </div>

          {/* Filter Kategori */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700">Kategori Ruangan</label>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              <label className="flex items-center gap-2 text-xs text-slate-600 hover:text-slate-900 cursor-pointer">
                <input
                  type="radio"
                  name="category"
                  checked={selectedCategory === ''}
                  onChange={() => setSelectedCategory('')}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span>Semua Kategori</span>
              </label>
              {categories.map((cat) => (
                <label
                  key={cat.id}
                  className="flex items-center gap-2 text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="category"
                    checked={selectedCategory === cat.slug}
                    onChange={() => setSelectedCategory(cat.slug)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span>{cat.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Filter Rentang Harga */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700">Rentang Harga (Rp)</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                placeholder="Min"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-lg p-1.5 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
              <input
                type="number"
                placeholder="Maks"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-lg p-1.5 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
          </div>
        </aside>

        {/* PRODUK GRID & PAGINATION */}
        <main className="lg:col-span-3 space-y-6">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="bg-white rounded-xl h-80 animate-pulse border border-slate-200"></div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center border border-slate-200 space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800">
                Tidak ada produk yang cocok dengan filter
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Coba ubah kata kunci pencarian, pilih semua gudang, atau reset filter untuk menampilkan semua furnitur.
              </p>
              <button
                onClick={handleResetFilters}
                className="mt-2 bg-[#0058a3] text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-[#003e73] transition"
              >
                Reset Semua Filter
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((prod) => (
                <ProductCard key={prod.id} product={prod} />
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {pagination.total_pages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-6">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-700 disabled:opacity-40"
              >
                Sebelumnya
              </button>

              <span className="text-xs font-medium text-slate-600 px-2">
                Halaman {currentPage} dari {pagination.total_pages}
              </span>

              <button
                onClick={() => setCurrentPage((p) => Math.min(pagination.total_pages, p + 1))}
                disabled={currentPage === pagination.total_pages}
                className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-700 disabled:opacity-40"
              >
                Selanjutnya
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function CatalogPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">Memuat katalog...</div>}>
      <CatalogContent />
    </Suspense>
  );
}
