'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Trash2, ShoppingBag, ArrowRight, ArrowLeft, ShieldCheck } from 'lucide-react';
import { formatRupiah } from '@/lib/api';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';

export default function CartPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { cart, updateQty, removeItem, clearCart, loading } = useCart();

  if (cart.items.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Keranjang Belanja Anda Kosong</h2>
        <p className="text-xs text-slate-500">
          Temukan ragam pilihan furnitur Skandinavia minimalis di katalog kami.
        </p>
        <Link
          href="/catalog"
          className="inline-flex items-center gap-2 bg-[#ffdb00] text-slate-900 font-bold text-xs px-6 py-2.5 rounded-full hover:bg-[#e5c500] transition"
        >
          <span>Mulai Belanja</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  const handleProceedCheckout = () => {
    if (!user) {
      router.push('/login?redirect=/checkout');
    } else {
      router.push('/checkout');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {!user && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 flex items-center justify-between text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <span className="font-bold">Mode Belanja Tamu:</span>
            <span>Anda dapat memilih barang sekarang. Silakan login atau buat akun baru saat akan melakukan checkout.</span>
          </div>
          <Link
            href="/login"
            className="bg-[#0058a3] text-white px-3.5 py-1.5 rounded-lg font-bold text-xs hover:bg-[#003e73] shrink-0"
          >
            Masuk / Daftar Akun
          </Link>
        </div>
      )}

      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Keranjang Belanja ({cart.total_items} Item)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Produk dalam keranjang akan divalidasi ketersediaan stoknya secara atomik saat checkout per gudang regional.
          </p>
        </div>
        <button
          onClick={clearCart}
          className="text-xs text-red-600 hover:text-red-800 font-semibold flex items-center gap-1"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Kosongkan</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Kolom Kiri: Daftar Item */}
        <div className="lg:col-span-2 space-y-4">
          {cart.items.map((item) => (
            <div
              key={item.item_id}
              className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center gap-4 justify-between"
            >
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="w-20 h-20 rounded-lg object-cover bg-slate-100 shrink-0"
                />
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-slate-400">SKU: {item.sku}</span>
                  <Link href={`/product/${item.product_id}`} className="font-semibold text-slate-900 text-sm hover:text-blue-700 block">
                    {item.name}
                  </Link>
                  <div className="text-xs font-bold text-slate-800">
                    {formatRupiah(item.price)}
                  </div>
                </div>
              </div>

              {/* Quantity Controls & Subtotal */}
              <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50 overflow-hidden">
                  <button
                    onClick={() => updateQty(item.item_id, item.qty - 1)}
                    className="px-2.5 py-1 text-xs font-bold text-slate-600 hover:bg-slate-200"
                  >
                    -
                  </button>
                  <span className="px-3 py-1 text-xs font-bold text-slate-900">
                    {item.qty}
                  </span>
                  <button
                    onClick={() => updateQty(item.item_id, item.qty + 1)}
                    className="px-2.5 py-1 text-xs font-bold text-slate-600 hover:bg-slate-200"
                  >
                    +
                  </button>
                </div>

                <div className="text-right min-w-[100px]">
                  <span className="text-[10px] text-slate-400 block">Subtotal</span>
                  <span className="font-bold text-sm text-slate-900">
                    {formatRupiah(item.subtotal)}
                  </span>
                </div>

                <button
                  onClick={() => removeItem(item.item_id)}
                  title="Hapus item"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          <Link
            href="/catalog"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:text-blue-900 pt-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Tambah Item Lain dari Katalog</span>
          </Link>
        </div>

        {/* Kolom Kanan: Ringkasan & Checkout */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6 h-fit">
          <h2 className="font-bold text-sm text-slate-900 uppercase tracking-wider pb-3 border-b border-slate-100">
            Ringkasan Belanja
          </h2>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Total Item ({cart.total_qty} unit)</span>
              <span>{formatRupiah(cart.total_price)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Biaya Pengiriman</span>
              <span className="text-emerald-600 font-semibold">Dihitung di Checkout</span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-between items-center text-slate-900">
            <span className="font-bold text-sm">Estimasi Total</span>
            <span className="font-black text-lg text-slate-900">
              {formatRupiah(cart.total_price)}
            </span>
          </div>

          <button
            onClick={handleProceedCheckout}
            className="w-full py-3 rounded-lg bg-[#ffdb00] text-slate-900 hover:bg-[#e5c500] font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md active:scale-98 transition"
          >
            <span>Lanjut ke Checkout</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="p-3 bg-blue-50 rounded-lg text-[11px] text-blue-900 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
            <span>
              Transaksi checkout dijamin atomik oleh PostgreSQL Citus 2PC (Two-Phase Commit).
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
