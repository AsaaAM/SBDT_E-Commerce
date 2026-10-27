'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ShoppingCart,
  ChevronRight,
  Warehouse,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Truck,
  ShieldAlert,
} from 'lucide-react';
import { fetchApi, formatRupiah } from '@/lib/api';
import { useCart } from '@/context/CartContext';

export default function ProductDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadProduct() {
      try {
        setLoading(true);
        const res = await fetchApi(`/products/${id}`);
        if (res.success && res.data) {
          setProduct(res.data);
        } else {
          setError('Produk tidak ditemukan');
        }
      } catch (err) {
        setError(err.message || 'Gagal memuat produk');
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-sm text-slate-500">Memuat detail produk dari Citus Reference Table...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">{error || 'Produk tidak ditemukan'}</h2>
        <Link
          href="/catalog"
          className="inline-flex items-center gap-1.5 bg-[#0058a3] text-white px-4 py-2 rounded-lg text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Katalog</span>
        </Link>
      </div>
    );
  }

  const totalStock = parseInt(product.total_stock, 10);
  const isOutOfStock = totalStock <= 0;
  const isCriticalStock = totalStock === 1;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-slate-500">
        <Link href="/" className="hover:text-blue-700">Beranda</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href="/catalog" className="hover:text-blue-700">Katalog</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        {product.category_name && (
          <>
            <Link href={`/catalog?category=${product.category_slug}`} className="hover:text-blue-700">
              {product.category_name}
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
          </>
        )}
        <span className="text-slate-800 font-medium truncate max-w-xs">{product.name}</span>
      </nav>

      {/* Main Product Showcase */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 bg-white p-6 sm:p-10 rounded-2xl border border-slate-200 shadow-xs">
        {/* Kolom Kiri: Visual Produk */}
        <div className="space-y-4">
          <div className="aspect-4/3 rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Banner Spesial untuk Demo Race Condition */}
          {isCriticalStock && (
            <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900">
                <span className="font-bold block">Perhatian Khusus Uji SBDT:</span>
                Item ini sengaja diset hanya memiliki <strong>1 unit stok fisik tersisa</strong>. Digunakan untuk skenario demonstrasi <em>Race Condition</em> (2 checkout simultan secara bersamaan).
              </div>
            </div>
          )}
        </div>

        {/* Kolom Kanan: Detail & Pembelian */}
        <div className="space-y-6">
          <div className="space-y-1">
            <span className="text-xs font-mono text-slate-400">SKU: {product.sku}</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
              {product.name}
            </h1>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 pt-2">
              {formatRupiah(product.price)}
            </div>
          </div>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            {product.description}
          </p>

          {/* Spesifikasi Teknis */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">Dimensi</span>
              <span className="font-semibold text-slate-800">{product.dimensions || '-'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Berat</span>
              <span className="font-semibold text-slate-800">{product.weight_kg ? `${product.weight_kg} kg` : '-'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Material</span>
              <span className="font-semibold text-slate-800">{product.material || '-'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Warna</span>
              <span className="font-semibold text-slate-800">{product.color || '-'}</span>
            </div>
          </div>

          {/* Tabel Status Stok per Gudang Regional (Citus Shards) */}
          <div className="space-y-2 pt-2">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Warehouse className="w-4 h-4 text-blue-700" />
              <span>Ketersediaan Stok per Shard Gudang:</span>
            </h3>

            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-3">Gudang Regional</th>
                    <th className="py-2 px-3">Kota / Wilayah</th>
                    <th className="py-2 px-3 text-right">Stok Fisik</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(product.warehouse_stock || []).map((wh) => (
                    <tr key={wh.warehouse_id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-medium text-slate-800">
                        {wh.warehouse_name}
                      </td>
                      <td className="py-2 px-3 text-slate-500">
                        {wh.city}
                      </td>
                      <td className="py-2 px-3 text-right">
                        {wh.qty > 0 ? (
                          <span className="inline-flex items-center gap-1 font-bold text-emerald-600">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{wh.qty} unit</span>
                          </span>
                        ) : (
                          <span className="font-semibold text-red-500">Habis</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Aksi Tambah ke Keranjang */}
          <div className="pt-4 border-t border-slate-200 flex items-center gap-4">
            <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden bg-slate-50">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                disabled={isOutOfStock}
                className="px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-200 transition disabled:opacity-30"
              >
                -
              </button>
              <span className="px-4 py-2 text-xs font-bold text-slate-900 min-w-[36px] text-center">
                {qty}
              </span>
              <button
                onClick={() => setQty((q) => Math.min(totalStock, q + 1))}
                disabled={isOutOfStock || qty >= totalStock}
                className="px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-200 transition disabled:opacity-30"
              >
                +
              </button>
            </div>

            <button
              onClick={() => addToCart(product, qty)}
              disabled={isOutOfStock}
              className={`flex-1 py-3 px-6 rounded-lg font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition ${
                isOutOfStock
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-[#995F2F] text-white hover:bg-[#854f24] shadow-md active:scale-98'
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              <span>{isOutOfStock ? 'Stok Habis di Semua Gudang' : 'Tambah ke Keranjang Belanja'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
