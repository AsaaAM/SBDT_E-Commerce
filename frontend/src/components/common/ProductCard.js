'use client';

import React from 'react';
import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import { formatRupiah } from '@/lib/api';
import { useCart } from '@/context/CartContext';
import WarehouseStockBadge from './WarehouseStockBadge';

export default function ProductCard({ product }) {
  const { addToCart } = useCart();

  const totalStock = parseInt(product.total_stock, 10);
  const isOutOfStock = totalStock <= 0;

  return (
    <div className="group bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between">
      <div>
        {/* Gambar Produk */}
        <Link href={`/product/${product.id}`} className="block relative aspect-4/3 overflow-hidden bg-slate-100">
          <img
            src={product.image_url || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80'}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          {product.category_name && (
            <span className="absolute top-2.5 left-2.5 bg-white/90 backdrop-blur-xs text-slate-800 text-[11px] font-semibold px-2 py-0.5 rounded shadow-xs">
              {product.category_name}
            </span>
          )}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center">
              <span className="bg-red-600 text-white font-bold text-xs px-3 py-1 rounded">
                Stok Habis
              </span>
            </div>
          )}
        </Link>

        {/* Konten & Informasi */}
        <div className="p-4">
          <span className="text-[11px] font-mono text-slate-400 block mb-1">
            SKU: {product.sku}
          </span>
          <Link href={`/product/${product.id}`}>
            <h3 className="font-semibold text-slate-900 text-sm hover:text-blue-700 line-clamp-2 transition mb-1">
              {product.name}
            </h3>
          </Link>
          <div className="text-base font-bold text-slate-900 mb-2">
            {formatRupiah(product.price)}
          </div>

          {/* Ketersediaan Stok Terdistribusi */}
          <div className="pt-2 border-t border-slate-100">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block">
              Stok Gudang Citus Shard:
            </span>
            <WarehouseStockBadge warehouseStock={product.warehouse_stock} />
          </div>
        </div>
      </div>

      {/* Tombol Tambah ke Keranjang */}
      <div className="p-4 pt-0">
        <button
          onClick={() => addToCart(product, 1)}
          disabled={isOutOfStock}
          className={`w-full py-2 px-3 rounded-lg font-medium text-xs flex items-center justify-center gap-1.5 transition ${
            isOutOfStock
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
              : 'bg-[#995F2F] text-white hover:bg-[#854f24] font-semibold active:scale-98 shadow-xs'
          }`}
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          <span>{isOutOfStock ? 'Stok Habis' : 'Tambah ke Keranjang'}</span>
        </button>
      </div>
    </div>
  );
}
