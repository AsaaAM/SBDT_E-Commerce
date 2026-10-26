'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Package, Clock, CheckCircle2, Truck, Warehouse, ArrowRight, ShieldCheck } from 'lucide-react';
import { fetchApi, formatRupiah } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedResi, setCopiedResi] = useState(null);
  const [payingOrderId, setPayingOrderId] = useState(null);

  const loadOrders = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await fetchApi('/orders');
      if (res.success && res.data) {
        setOrders(res.data);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [user]);

  const handlePayVA = async (orderId, warehouseId) => {
    setPayingOrderId(orderId);
    try {
      const res = await fetchApi(`/orders/${orderId}/pay`, {
        method: 'POST',
        body: JSON.stringify({ warehouse_id: warehouseId }),
      });
      if (res.success) {
        await loadOrders();
      }
    } catch (err) {
      alert(err.message || 'Gagal memproses pembayaran.');
    } finally {
      setPayingOrderId(null);
    }
  };

  const copyResi = (resi) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(resi);
      setCopiedResi(resi);
      setTimeout(() => setCopiedResi(null), 2000);
    }
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Silakan Masuk Terlebih Dahulu</h2>
        <p className="text-xs text-slate-500">
          Gunakan tombol Mode Demo di bilah atas untuk masuk sebagai pembeli.
        </p>
        <Link
          href="/login"
          className="inline-block bg-[#0058a3] text-white px-6 py-2.5 rounded-full font-bold text-xs hover:bg-[#003e73] transition"
        >
          Masuk ke Akun
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Riwayat Pembelian & Pelacakan Resi
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Memantau pesanan yang terfragmentasi pada kluster database terdistribusi Citus.
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((n) => (
            <div key={n} className="bg-white rounded-xl h-44 border border-slate-200 animate-pulse"></div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-slate-200 space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
            <Package className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">Belum Ada Riwayat Pesanan</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Anda belum pernah membuat pesanan furnitur. Silakan pilih furnitur di katalog untuk melakukan transaksi checkout.
          </p>
          <Link
            href="/catalog"
            className="inline-flex items-center gap-1.5 bg-[#0058a3] text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-[#003e73] transition mt-2"
          >
            <span>Mulai Belanja</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((ord) => {
            const steps = [
              { key: 'menunggu_pembayaran', label: 'Menunggu VA' },
              { key: 'diproses', label: 'Diproses Gudang' },
              { key: 'dikemas', label: 'Dikemas' },
              { key: 'dikirim', label: 'Dalam Pengiriman' },
              { key: 'terkirim', label: 'Terkirim (Duit Cair)' },
            ];

            let currentStepIdx = steps.findIndex((s) => s.key === ord.status);
            if (ord.status === 'selesai') currentStepIdx = 4;
            if (ord.status === 'dibayar') currentStepIdx = 1;

            return (
              <div
                key={`${ord.warehouse_id}-${ord.id}`}
                className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden"
              >
                {/* Header Pesanan */}
                <div className="bg-slate-50 p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex flex-wrap items-center gap-4">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Nomor Pesanan</span>
                      <span className="font-mono font-bold text-slate-900">{ord.order_number}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Waktu Transaksi</span>
                      <span className="text-slate-700">
                        {new Date(ord.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Gudang Asal (Shard)</span>
                      <span className="font-bold text-blue-700 flex items-center gap-1">
                        <Warehouse className="w-3.5 h-3.5" />
                        <span>{ord.warehouse_name} ({ord.warehouse_city})</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase border ${
                      ord.status === 'terkirim' || ord.status === 'selesai'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : ord.status === 'menunggu_pembayaran'
                        ? 'bg-amber-100 text-amber-800 border-amber-300'
                        : 'bg-blue-100 text-blue-800 border-blue-300'
                    }`}>
                      {ord.status.replace(/_/g, ' ')}
                    </span>
                    <div className="text-right">
                      <span className="text-slate-400 block text-[10px]">Total Belanja</span>
                      <span className="font-black text-sm text-slate-900">
                        {formatRupiah(ord.total)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Banner Pembayaran VA Jika Masih Menunggu Pembayaran */}
                {ord.status === 'menunggu_pembayaran' && (
                  <div className="bg-amber-50 p-4 border-b border-amber-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                    <div className="space-y-0.5 text-center sm:text-left">
                      <div className="font-bold text-amber-900 flex items-center gap-1.5 justify-center sm:justify-start">
                        <span>Menunggu Pembayaran:</span>
                        <span className="font-extrabold text-blue-900">{ord.payment_method}</span>
                      </div>
                      <div className="text-slate-600">
                        Nomor VA: <span className="font-mono font-black text-slate-900">{ord.va_number || '88081234567890'}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handlePayVA(ord.id, ord.warehouse_id)}
                      disabled={payingOrderId === ord.id}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-xs transition shrink-0"
                    >
                      {payingOrderId === ord.id ? 'Memproses...' : '⚡ Simulasikan Bayar VA Sekarang'}
                    </button>
                  </div>
                )}

                {/* Tracking Stepper */}
                <div className="p-4 sm:p-6 border-b border-slate-100">
                  <div className="grid grid-cols-5 gap-2 relative">
                    {steps.map((st, idx) => {
                      const isCompleted = currentStepIdx >= idx;
                      const isCurrent = currentStepIdx === idx;

                      return (
                        <div key={st.key} className="flex flex-col items-center text-center space-y-1.5">
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition ${
                              isCompleted
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-100 text-slate-400'
                            } ${isCurrent ? 'ring-4 ring-emerald-100' : ''}`}
                          >
                            {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                          </div>
                          <span
                            className={`text-[10px] sm:text-xs font-semibold ${
                              isCurrent ? 'text-emerald-700 font-bold' : isCompleted ? 'text-slate-800' : 'text-slate-400'
                            }`}
                          >
                            {st.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Items & Shipping Info */}
                <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Kolom 1 & 2: Items List */}
                  <div className="md:col-span-2 space-y-3">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Daftar Barang yang Dibeli ({ord.items.length} Item)
                    </h4>
                    <div className="space-y-2.5">
                      {ord.items.map((it) => (
                        <div key={it.item_id} className="flex items-center gap-3 text-xs bg-slate-50/60 p-2.5 rounded-lg border border-slate-100">
                          <img
                            src={it.product_image}
                            alt={it.product_name}
                            className="w-14 h-14 rounded-lg object-cover bg-slate-100 shrink-0 border border-slate-200"
                          />
                          <div className="flex-1 truncate">
                            <span className="font-bold text-slate-800 block truncate text-xs">
                              {it.product_name}
                            </span>
                            <span className="font-mono text-[10px] text-slate-400 block">
                              SKU: {it.product_sku || `SKU-${it.product_id}`}
                            </span>
                            <span className="text-[11px] text-slate-600 font-medium">
                              {it.qty} unit x {formatRupiah(it.unit_price)}
                            </span>
                          </div>
                          <span className="font-black text-slate-900 shrink-0 text-sm">
                            {formatRupiah(it.total_price)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Kolom 3: Pengiriman & Bukti Resi */}
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3 text-xs flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-slate-800 flex items-center gap-1.5 pb-2 border-b border-slate-200">
                        <Truck className="w-4 h-4 text-blue-700" />
                        <span>Resi & Pengiriman Logistik</span>
                      </h4>
                      <div className="space-y-2 pt-2 text-slate-600">
                        <div>
                          <span className="text-[10px] text-slate-400 block">Kurir Logistik:</span>
                          <span className="font-bold text-slate-800">{ord.courier || 'JNE Trucking (JTR)'}</span>
                        </div>
                        <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                          <span className="text-[10px] text-slate-400 block">NOMOR RESI PENGIRIMAN:</span>
                          <div className="flex items-center justify-between gap-2 mt-0.5">
                            <span className="font-mono font-black text-blue-800 text-xs truncate">
                              {ord.tracking_number}
                            </span>
                            <button
                              onClick={() => copyResi(ord.tracking_number)}
                              className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded hover:bg-blue-100 shrink-0"
                            >
                              {copiedResi === ord.tracking_number ? 'Tersalin ✓' : 'Salin Resi'}
                            </button>
                          </div>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">Alamat Penerima:</span>
                          <span className="text-slate-800 font-semibold block">{ord.recipient_name} ({ord.recipient_phone})</span>
                          <span className="text-slate-500 block text-[11px] leading-relaxed">{ord.shipping_address}, {ord.shipping_city}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200 text-[10px] text-slate-400">
                      Metode: <strong className="text-slate-700">{ord.payment_method}</strong> ({ord.payment_status})
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
