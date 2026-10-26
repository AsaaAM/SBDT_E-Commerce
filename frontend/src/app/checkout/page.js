'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircle,
  Warehouse,
  CreditCard,
  Truck,
  ShieldCheck,
  AlertCircle,
  Tag,
  ArrowRight,
  PackageCheck,
} from 'lucide-react';
import { fetchApi, formatRupiah } from '@/lib/api';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';

export default function CheckoutPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { cart, fetchCart } = useCart();

  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState('1'); // Default Jakarta

  // Form Fields
  // Form Fields
  const [recipientName, setRecipientName] = useState(user?.name || 'Siti Pembeli');
  const [recipientPhone, setRecipientPhone] = useState(user?.phone || '081234567890');
  const [shippingAddress, setShippingAddress] = useState(user?.address || 'Jl. Sudirman Kav 21, Kebayoran');
  const [shippingCity, setShippingCity] = useState('Jakarta Selatan');
  const [notes, setNotes] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoError, setPromoError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('BCA Virtual Account');

  // Transaction State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [orderResult, setOrderResult] = useState(null);
  const [vaPaid, setVaPaid] = useState(false);
  const [payingVA, setPayingVA] = useState(false);
  const [copiedVA, setCopiedVA] = useState(false);
  const [copiedResi, setCopiedResi] = useState(false);

  useEffect(() => {
    async function loadWarehouses() {
      try {
        const res = await fetchApi('/products/warehouses');
        if (res.success) setWarehouses(res.data);
      } catch (err) {
        console.error('Error fetching warehouses:', err);
      }
    }
    loadWarehouses();
  }, []);

  const handleApplyPromo = async () => {
    setPromoError('');
    if (!promoCode.trim()) return;

    try {
      const res = await fetchApi('/orders/check-promo', {
        method: 'POST',
        body: {
          code: promoCode.trim().toUpperCase(),
          subtotal: cart.total_price,
        },
      });

      if (res.success && res.data) {
        setAppliedPromo(res.data);
      } else {
        setAppliedPromo(null);
        setPromoError(res.message || 'Kode promo tidak valid.');
      }
    } catch (err) {
      setAppliedPromo(null);
      setPromoError(err.message || 'Gagal memvalidasi promo.');
    }
  };

  const discountAmount = appliedPromo ? appliedPromo.discountAmount : 0;
  const finalTotal = Math.max(0, cart.total_price - discountAmount);

  const handleExecuteCheckout = async (e) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);
    setVaPaid(false);

    try {
      const payload = {
        warehouse_id: parseInt(selectedWarehouse, 10),
        items: cart.items.map((it) => ({
          product_id: it.product_id,
          qty: it.qty,
        })),
        shipping_address: shippingAddress,
        shipping_city: shippingCity,
        recipient_name: recipientName,
        recipient_phone: recipientPhone,
        notes,
        promo_code: appliedPromo ? appliedPromo.code : null,
        payment_method: paymentMethod,
      };

      const res = await fetchApi('/orders/checkout', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res.success && res.data) {
        setOrderResult(res.data);
        await fetchCart(); // Refresh cart to empty state
      }
    } catch (err) {
      setErrorMessage(
        err.data?.message || err.message || 'Transaksi checkout gagal dieksekusi.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSimulatePayVA = async () => {
    if (!orderResult) return;
    setPayingVA(true);
    try {
      const res = await fetchApi(`/orders/${orderResult.order_id}/pay`, {
        method: 'POST',
        body: JSON.stringify({ warehouse_id: orderResult.warehouse_id }),
      });
      if (res.success) {
        setVaPaid(true);
      }
    } catch (err) {
      alert(err.message || 'Gagal memproses simulasi pembayaran VA.');
    } finally {
      setPayingVA(false);
    }
  };

  const copyToClipboard = (text, type) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text);
      if (type === 'va') {
        setCopiedVA(true);
        setTimeout(() => setCopiedVA(false), 2000);
      } else {
        setCopiedResi(true);
        setTimeout(() => setCopiedResi(false), 2000);
      }
    }
  };

  // SUKSES VIEW (TRANSAKSI BERHASIL)
  if (orderResult) {
    const selectedWhObj = warehouses.find((w) => w.id === parseInt(orderResult.warehouse_id, 10));
    const hasVA = !!orderResult.payment?.va_number;

    return (
      <div className="max-w-3xl mx-auto px-4 py-12 space-y-6">
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm text-center space-y-5">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
            <CheckCircle className="w-10 h-10" />
          </div>

          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {hasVA && !vaPaid ? 'Pesanan Berhasil Dibuat (Menunggu Pembayaran VA)' : 'Transaksi Terdistribusi Berhasil!'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto mt-1">
              {hasVA && !vaPaid
                ? 'Gunakan nomor Virtual Account demo di bawah ini untuk mensimulasikan pembayaran instan.'
                : 'Pembayaran telah terverifikasi dan pesanan telah diteruskan ke gudang regional terkait.'}
            </p>
          </div>

          {/* KARTU KHUSUS VIRTUAL ACCOUNT (DEMO SBDT) */}
          {hasVA && (
            <div className={`p-5 rounded-xl border text-left space-y-3 max-w-md mx-auto transition-all ${
              vaPaid ? 'bg-emerald-50 border-emerald-300' : 'bg-amber-50 border-amber-300'
            }`}>
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs uppercase tracking-wider text-slate-800">
                  {orderResult.payment.method}
                </span>
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                  vaPaid ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white animate-pulse'
                }`}>
                  {vaPaid ? 'LUNAS (DIBAYAR)' : 'MENUNGGU PEMBAYARAN'}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 block">Nomor Virtual Account (VA):</span>
                <div className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-slate-200 mt-1">
                  <span className="font-mono font-black text-base text-blue-900 tracking-wider">
                    {orderResult.payment.va_number}
                  </span>
                  <button
                    onClick={() => copyToClipboard(orderResult.payment.va_number, 'va')}
                    className="text-[11px] font-bold text-blue-700 hover:text-blue-900 bg-blue-50 px-2.5 py-1 rounded transition"
                  >
                    {copiedVA ? 'Tersalin ✓' : 'Salin VA'}
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-slate-200/60 text-xs">
                <span className="text-slate-600">Nominal yang Harus Dibayar:</span>
                <span className="font-black text-base text-slate-900">{formatRupiah(orderResult.total)}</span>
              </div>

              {!vaPaid ? (
                <div className="pt-2">
                  <button
                    onClick={handleSimulatePayVA}
                    disabled={payingVA}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm transition flex items-center justify-center gap-1.5"
                  >
                    {payingVA ? (
                      <span>Memproses Pembayaran...</span>
                    ) : (
                      <>
                        <span>⚡ Simulasikan Bayar VA Sekarang</span>
                      </>
                    )}
                  </button>
                  <p className="text-[10px] text-slate-500 text-center mt-1">
                    *Klik tombol di atas untuk mensimulasikan sistem perbankan menerima pelunasan VA.
                  </p>
                </div>
              ) : (
                <div className="p-2.5 bg-emerald-100/70 rounded-lg text-emerald-900 text-xs font-semibold text-center flex items-center justify-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-700" />
                  <span>Pembayaran Sukses Dikonfirmasi! Status pesanan kini: DIPROSES.</span>
                </div>
              )}
            </div>
          )}

          {/* Rincian Pesanan & Resi Pengiriman */}
          <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 text-left space-y-3 text-xs max-w-md mx-auto">
            <div className="flex justify-between">
              <span className="text-slate-500">Nomor Pesanan:</span>
              <span className="font-mono font-bold text-slate-900">{orderResult.order_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Gudang Distribusi Shard:</span>
              <span className="font-bold text-blue-700">
                {selectedWhObj ? `${selectedWhObj.name} (${selectedWhObj.city})` : `Warehouse Shard #${orderResult.warehouse_id}`}
              </span>
            </div>
            <div className="flex justify-between items-center bg-blue-50/60 p-2 rounded-lg border border-blue-100">
              <div>
                <span className="text-[10px] text-blue-600 font-bold block">NOMOR RESI PENGIRIMAN:</span>
                <span className="font-mono font-bold text-slate-900 text-xs">{orderResult.shipment?.tracking_number}</span>
              </div>
              <button
                onClick={() => copyToClipboard(orderResult.shipment?.tracking_number, 'resi')}
                className="text-[10px] font-bold text-blue-700 bg-white border border-blue-200 px-2 py-1 rounded hover:bg-blue-100"
              >
                {copiedResi ? 'Tersalin ✓' : 'Salin Resi'}
              </button>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Ekspedisi Logistik:</span>
              <span className="font-semibold text-slate-800">{orderResult.shipment?.courier || 'JNE Trucking'}</span>
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-sm">
              <span className="font-bold text-slate-900">Total Transaksi:</span>
              <span className="font-black text-emerald-700">{formatRupiah(orderResult.total)}</span>
            </div>
          </div>

          {/* SBDT Educational Card */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-left text-xs space-y-1.5 text-blue-950">
            <span className="font-bold flex items-center gap-1 text-blue-800">
              <ShieldCheck className="w-4 h-4" />
              <span>Verifikasi SBDT (Citus Distributed Transaction):</span>
            </span>
            <p className="text-[11px] text-blue-900 leading-relaxed">
              Transaksi ini dieksekusi dalam satu blok <code>BEGIN ... COMMIT</code> atomik. Shard data <code>orders</code>, <code>order_items</code>, <code>inventory</code>, <code>payments</code>, dan <code>shipments</code> secara otomatis di-*colocate* pada worker node yang memegang <code>warehouse_id = {orderResult.warehouse_id}</code>.
            </p>
          </div>

          <div className="pt-4 flex flex-wrap justify-center gap-3">
            <Link
              href="/orders"
              className="bg-[#0058a3] text-white px-6 py-2.5 rounded-full text-xs font-bold hover:bg-[#003e73] transition"
            >
              Lihat Riwayat & Lacak Resi Pesanan
            </Link>
            <Link
              href="/catalog"
              className="bg-slate-100 text-slate-700 px-6 py-2.5 rounded-full text-xs font-semibold hover:bg-slate-200 transition"
            >
              Kembali ke Katalog
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Checkout & Pemenuhan Pesanan
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Pilih gudang regional pengirim untuk mengeksekusi transaksi pada shard Citus yang sesuai.
        </p>
      </div>

      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-300 rounded-xl flex items-start gap-3 text-red-900 text-xs">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block">Gagal Mengeksekusi Transaksi:</span>
            <span>{errorMessage}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleExecuteCheckout} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Kolom Kiri: Pemilihan Gudang & Alamat */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. Pilih Gudang Regional Shard */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Warehouse className="w-4 h-4 text-blue-700" />
              <h2 className="font-bold text-sm text-slate-900">
                1. Pilih Gudang Distribusi Pengirim (Shard Key)
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {warehouses.map((wh) => {
                const isSelected = selectedWarehouse === wh.id.toString();
                return (
                  <div
                    key={wh.id}
                    onClick={() => setSelectedWarehouse(wh.id.toString())}
                    className={`cursor-pointer p-4 rounded-xl border text-xs transition space-y-1 ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-500'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <span className="font-bold text-slate-900 block">{wh.name}</span>
                    <span className="text-slate-500 block">{wh.city}</span>
                    <span className="text-[10px] font-mono text-blue-700 bg-blue-100/60 px-1.5 py-0.5 rounded inline-block">
                      Kode: {wh.code}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-500 italic">
              *Pesanan akan diproses langsung oleh worker database yang menangani gudang ini.
            </p>
          </div>

          {/* 2. Informasi Pengiriman */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Truck className="w-4 h-4 text-blue-700" />
              <h2 className="font-bold text-sm text-slate-900">
                2. Alamat & Penerima Barang
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Nama Penerima</label>
                <input
                  type="text"
                  required
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Nomor Telepon</label>
                <input
                  type="text"
                  required
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-semibold text-slate-700">Alamat Lengkap</label>
                <textarea
                  required
                  rows={2}
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Kota Tujuan</label>
                <input
                  type="text"
                  required
                  value={shippingCity}
                  onChange={(e) => setShippingCity(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Catatan Pengiriman (Opsional)</label>
                <input
                  type="text"
                  placeholder="Misal: Taruh di teras / titip satpam"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* 3. Metode Pembayaran (Simulasi Instan) */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <CreditCard className="w-4 h-4 text-blue-700" />
              <h2 className="font-bold text-sm text-slate-900">
                3. Metode Pembayaran
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {[
                'BCA Virtual Account',
                'Mandiri Virtual Account',
                'BNI Virtual Account',
                'BRI Virtual Account',
                'QRIS Instant',
              ].map((method) => {
                const isSelected = paymentMethod === method;
                return (
                  <div
                    key={method}
                    onClick={() => setPaymentMethod(method)}
                    className={`cursor-pointer p-3 rounded-xl border text-xs font-semibold flex items-center justify-between transition ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50 text-blue-900 ring-2 ring-blue-500'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>{method}</span>
                    <span className={`w-2.5 h-2.5 rounded-full ${isSelected ? 'bg-blue-600' : 'bg-slate-300'}`}></span>
                  </div>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-500">
              *Pilihan Virtual Account (VA) akan menerbitkan nomor VA resmi untuk simulasi pembayaran dan pencatatan ke database sharded Citus.
            </p>
          </div>
        </div>

        {/* Kolom Kanan: Rincian Belanja & Eksekusi */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6">
            <h2 className="font-bold text-sm text-slate-900 uppercase tracking-wider pb-3 border-b border-slate-100 flex items-center justify-between">
              <span>Item Checkout ({cart.total_items})</span>
              <Link href="/cart" className="text-xs font-normal text-blue-700 hover:underline">
                Ubah
              </Link>
            </h2>

            <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
              {cart.items.map((it) => (
                <div key={it.item_id} className="flex items-center justify-between text-xs">
                  <div className="truncate pr-2">
                    <span className="font-semibold text-slate-800 block truncate">{it.name}</span>
                    <span className="text-[10px] text-slate-400">
                      {it.qty}x @ {formatRupiah(it.price)}
                    </span>
                  </div>
                  <span className="font-bold text-slate-900 shrink-0">
                    {formatRupiah(it.subtotal)}
                  </span>
                </div>
              ))}
            </div>

            {/* Kode Promo */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-blue-700" />
                <span>Punya Kode Promo?</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="IKEASBDT10"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-mono uppercase focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={handleApplyPromo}
                  className="bg-slate-800 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-slate-700"
                >
                  Terapkan
                </button>
              </div>
              {appliedPromo && (
                <p className="text-[11px] font-semibold text-emerald-600">
                  Promo {appliedPromo.code} diterapkan (-{formatRupiah(appliedPromo.discountAmount)})
                </p>
              )}
              {promoError && (
                <p className="text-[11px] font-semibold text-red-600">
                  {promoError}
                </p>
              )}
            </div>

            {/* Rincian Harga */}
            <div className="pt-3 border-t border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal Barang</span>
                <span>{formatRupiah(cart.total_price)}</span>
              </div>
              {appliedPromo && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Diskon Promo</span>
                  <span>-{formatRupiah(appliedPromo.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>Ongkos Kirim</span>
                <span className="text-emerald-600 font-semibold">Gratis (Subsidi SBDT)</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-sm">
                <span className="font-bold text-slate-900">Total Akhir:</span>
                <span className="font-black text-lg text-slate-900">{formatRupiah(finalTotal)}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || cart.items.length === 0}
              className={`w-full py-3.5 rounded-lg font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition ${
                isSubmitting
                  ? 'bg-slate-300 text-slate-600 cursor-not-allowed'
                  : 'bg-[#ffdb00] text-slate-950 hover:bg-[#e5c500] shadow-md active:scale-98'
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                  <span>Memproses Transaksi Terdistribusi...</span>
                </>
              ) : (
                <>
                  <PackageCheck className="w-4 h-4" />
                  <span>Bayar & Eksekusi Transaksi Atomik</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
