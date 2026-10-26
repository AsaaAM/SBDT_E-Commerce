'use client';

import React, { useState, useEffect } from 'react';
import {
  Warehouse,
  Boxes,
  ClipboardList,
  ArrowDownUp,
  History,
  CheckCircle,
  Truck,
  Package,
  PlusCircle,
  AlertTriangle,
} from 'lucide-react';
import { fetchApi, formatRupiah } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function WarehouseDashboardPage() {
  const { user, isWarehouse, isAdmin, isOwner } = useAuth();

  const [activeTab, setActiveTab] = useState('stock'); // 'stock', 'orders', 'movements'
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [stockList, setStockList] = useState([]);
  const [orderList, setOrderList] = useState([]);
  const [movements, setMovements] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State Mutasi Stok (Existing item)
  const [showMutationModal, setShowMutationModal] = useState(false);
  const [mutationProduct, setMutationProduct] = useState(null);
  const [mutationType, setMutationType] = useState('IN');
  const [mutationQty, setMutationQty] = useState(10);
  const [mutationNotes, setMutationNotes] = useState('');
  const [mutationLoading, setMutationLoading] = useState(false);
  const [mutationSuccess, setMutationSuccess] = useState('');

  // Modal State Input Stok Masuk Baru per Lokasi Gudang (Tangerang, Sidoarjo, Medan)
  const [showInputStockModal, setShowInputStockModal] = useState(false);
  const [inputWhId, setInputWhId] = useState('1'); // 1: Tangerang, 2: Sidoarjo, 3: Medan
  const [inputProductId, setInputProductId] = useState('');
  const [inputQty, setInputQty] = useState(25);
  const [inputNotes, setInputNotes] = useState('Penerimaan Stok Masuk dari Pabrik/Supplier');
  const [inputStockLoading, setInputStockLoading] = useState(false);
  const [inputStockSuccess, setInputStockSuccess] = useState('');

  // 1. Fetch Warehouses & Products
  useEffect(() => {
    async function loadInitial() {
      try {
        const [whRes, prodRes] = await Promise.all([
          fetchApi('/products/warehouses'),
          fetchApi('/products?limit=100'),
        ]);
        if (whRes.success) setWarehouses(whRes.data);
        if (prodRes.success) {
          const prods = prodRes.data.items || prodRes.data || [];
          setAllProducts(prods);
          if (prods.length > 0 && !inputProductId) {
            setInputProductId(prods[0].id.toString());
          }
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadInitial();
  }, []);

  // 2. Fetch Data Sesuai Tab Aktif
  const loadTabData = async () => {
    try {
      setLoading(true);
      const whParam = selectedWarehouse ? `?warehouse_id=${selectedWarehouse}` : '';

      if (activeTab === 'stock') {
        const res = await fetchApi(`/warehouse/stock${whParam}`);
        if (res.success) setStockList(res.data);
      } else if (activeTab === 'orders') {
        const res = await fetchApi(`/warehouse/orders${whParam}`);
        if (res.success) setOrderList(res.data);
      } else if (activeTab === 'movements') {
        const res = await fetchApi(`/warehouse/movements${whParam}`);
        if (res.success) setMovements(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && (isWarehouse || isAdmin || isOwner)) {
      loadTabData();
    }
  }, [activeTab, selectedWarehouse, user]);

  if (!user || (!isWarehouse && !isAdmin && !isOwner)) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Akses Khusus Staf Gudang</h2>
        <p className="text-xs text-slate-500">
          Halaman ini dilindungi RBAC. Gunakan bilah Mode Demo di atas dan pilih <strong>Staf Gudang</strong> untuk mengakses.
        </p>
      </div>
    );
  }

  const handleUpdateStatus = async (orderId, warehouseId, newStatus) => {
    try {
      const res = await fetchApi(`/warehouse/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ warehouse_id: warehouseId, status: newStatus }),
      });
      if (res.success) {
        loadTabData();
      }
    } catch (err) {
      alert(err.message || 'Gagal mengubah status');
    }
  };

  const handleExecuteMutation = async (e) => {
    e.preventDefault();
    setMutationLoading(true);
    setMutationSuccess('');
    try {
      const res = await fetchApi('/warehouse/stock-mutation', {
        method: 'POST',
        body: JSON.stringify({
          warehouse_id: mutationProduct.warehouse_id,
          product_id: mutationProduct.product_id,
          type: mutationType,
          qty: parseInt(mutationQty, 10),
          notes: mutationNotes,
        }),
      });
      if (res.success) {
        setMutationSuccess('Mutasi stok berhasil dicatat ke shard Citus!');
        setTimeout(() => {
          setShowMutationModal(false);
          setMutationSuccess('');
          loadTabData();
        }, 1200);
      }
    } catch (err) {
      alert(err.message || 'Gagal mutasi stok');
    } finally {
      setMutationLoading(false);
    }
  };

  const handleExecuteInputStock = async (e) => {
    e.preventDefault();
    if (!inputProductId) {
      alert('Silakan pilih produk terlebih dahulu');
      return;
    }
    setInputStockLoading(true);
    setInputStockSuccess('');
    try {
      const res = await fetchApi('/warehouse/input-stock', {
        method: 'POST',
        body: JSON.stringify({
          warehouse_id: parseInt(inputWhId, 10),
          product_id: parseInt(inputProductId, 10),
          qty: parseInt(inputQty, 10),
          notes: inputNotes || 'Input barang masuk fisik gudang',
        }),
      });
      if (res.success) {
        setInputStockSuccess(
          `✓ Berhasil! +${res.data.change_qty} unit ditambahkan ke ${res.data.warehouse_name}. Total stok saat ini: ${res.data.final_qty} unit.`
        );
        setTimeout(() => {
          setShowInputStockModal(false);
          setInputStockSuccess('');
          loadTabData();
        }, 1500);
      }
    } catch (err) {
      alert(err.message || 'Gagal input barang masuk gudang');
    } finally {
      setInputStockLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header Dashboard */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Role: Orang Gudang (Warehouse)
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Dashboard Operasional & Shard Stok Gudang
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Kelola persediaan fisik, input barang masuk per regional hub (Tangerang, Sidoarjo, Medan), dan pantau pesanan.
          </p>
        </div>

        {/* Action Button & Filter Warehouse Selector */}
        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={() => {
              setInputStockSuccess('');
              setShowInputStockModal(true);
            }}
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-3.5 py-2 rounded-lg flex items-center gap-1.5 shadow-xs transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Input Barang Masuk Gudang</span>
          </button>

          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1">
            <Warehouse className="w-4 h-4 text-emerald-700" />
            <select
              value={selectedWarehouse}
              onChange={(e) => setSelectedWarehouse(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-hidden"
            >
              <option value="">Semua Gudang (Lintas Shard)</option>
              {warehouses.map((wh) => (
                <option key={wh.id} value={wh.id}>
                  {wh.name} ({wh.city})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 3 REGIONAL HUB CARDS (Tangerang, Sidoarjo, Medan) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
            <Warehouse className="w-3.5 h-3.5 text-emerald-700" />
            <span>Letak 3 Gudang Regional (Colocated Citus Shards)</span>
          </h2>
          <span className="text-[11px] text-slate-400">Pilih hub untuk langsung input barang masuk</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              id: '1',
              name: 'Gudang Tangerang (Hub Barat)',
              city: 'Tangerang / BSD',
              code: 'WH-JKT',
              address: 'Jl. Boulevard BSD, Tangerang, Banten',
              badge: 'Shard Jabodetabek',
              color: 'border-blue-200 bg-blue-50/50 hover:border-blue-400',
              accent: 'text-blue-700',
              btnBg: 'bg-blue-600 hover:bg-blue-700',
            },
            {
              id: '2',
              name: 'Gudang Sidoarjo (Hub Timur)',
              city: 'Sidoarjo / Waru',
              code: 'WH-SBY',
              address: 'Kawasan Industri Waru, Sidoarjo, Jatim',
              badge: 'Shard Jatim & Timur',
              color: 'border-emerald-200 bg-emerald-50/50 hover:border-emerald-400',
              accent: 'text-emerald-700',
              btnBg: 'bg-emerald-600 hover:bg-emerald-700',
            },
            {
              id: '3',
              name: 'Gudang Medan (Hub Sumatera)',
              city: 'Medan / KIM',
              code: 'WH-MDN',
              address: 'Kawasan Industri Medan (KIM), Sumatera Utara',
              badge: 'Shard Sumatera',
              color: 'border-purple-200 bg-purple-50/50 hover:border-purple-400',
              accent: 'text-purple-700',
              btnBg: 'bg-purple-600 hover:bg-purple-700',
            },
          ].map((hub) => {
            const countItems = stockList.filter(
              (item) => item.warehouse_id === parseInt(hub.id, 10)
            ).length;
            const totalQty = stockList
              .filter((item) => item.warehouse_id === parseInt(hub.id, 10))
              .reduce((sum, item) => sum + parseInt(item.qty || 0, 10), 0);

            return (
              <div
                key={hub.id}
                className={`p-4 rounded-xl border transition shadow-xs flex flex-col justify-between ${hub.color}`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-700">
                      {hub.code} (ID: {hub.id})
                    </span>
                    <span className="text-[10px] font-bold text-slate-500">
                      {hub.badge}
                    </span>
                  </div>
                  <h3 className="text-sm font-extrabold text-slate-900 mt-1">{hub.name}</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">{hub.address}</p>

                  <div className="mt-3 py-2 px-3 bg-white/80 rounded-lg border border-slate-200/60 flex items-center justify-between text-xs">
                    <span className="text-slate-600">Stok Terdata:</span>
                    <span className="font-extrabold text-slate-900">
                      {totalQty > 0 ? `${totalQty} unit (${countItems} SKU)` : 'Sinkronisasi Shard...'}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center gap-2">
                  <button
                    onClick={() => {
                      setInputWhId(hub.id);
                      setInputStockSuccess('');
                      setShowInputStockModal(true);
                    }}
                    className={`w-full py-2 px-3 rounded-lg text-white font-bold text-[11px] flex items-center justify-center gap-1.5 shadow-xs transition ${hub.btnBg}`}
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>+ Input Barang ke {hub.city.split(' ')[0]}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200 gap-6 text-xs font-bold">
        <button
          onClick={() => setActiveTab('stock')}
          className={`pb-3 flex items-center gap-1.5 transition ${
            activeTab === 'stock'
              ? 'border-b-2 border-emerald-600 text-emerald-700'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>Katalog Stok Gudang</span>
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 flex items-center gap-1.5 transition ${
            activeTab === 'orders'
              ? 'border-b-2 border-emerald-600 text-emerald-700'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          <span>Antrean Pesanan Masuk</span>
        </button>

        <button
          onClick={() => setActiveTab('movements')}
          className={`pb-3 flex items-center gap-1.5 transition ${
            activeTab === 'movements'
              ? 'border-b-2 border-emerald-600 text-emerald-700'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Audit Log Mutasi Stok</span>
        </button>
      </div>

      {/* KONTEN TAB 1: STOK GUDANG */}
      {activeTab === 'stock' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center text-xs">
            <span className="font-bold text-slate-700">Daftar Inventaris Terfragmentasi ({stockList.length} Baris Shard)</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Gudang</th>
                  <th className="py-3 px-4">Produk & SKU</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4 text-right">Stok Fisik</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Aksi Mutasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stockList.map((item) => {
                  const qty = parseInt(item.qty, 10);
                  const isLow = qty <= parseInt(item.safety_stock, 10);

                  return (
                    <tr key={`${item.warehouse_id}-${item.product_id}`} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {item.warehouse_name}
                        <span className="block text-[10px] text-slate-400 font-mono">
                          ID Shard: {item.warehouse_id}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{item.product_name}</div>
                        <span className="font-mono text-[10px] text-slate-400">SKU: {item.sku}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{item.category_name}</td>
                      <td className="py-3 px-4 text-right font-black text-sm">
                        {qty} unit
                      </td>
                      <td className="py-3 px-4 text-center">
                        {qty === 0 ? (
                          <span className="bg-red-100 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            Habis
                          </span>
                        ) : isLow ? (
                          <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            Kritis ({qty})
                          </span>
                        ) : (
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            Aman
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => {
                            setMutationProduct(item);
                            setMutationType('IN');
                            setMutationQty(10);
                            setMutationNotes('');
                            setShowMutationModal(true);
                          }}
                          className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold px-2.5 py-1 rounded-md text-[11px] inline-flex items-center gap-1 border border-emerald-200 transition"
                        >
                          <ArrowDownUp className="w-3 h-3" />
                          <span>Mutasi Stok</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* KONTEN TAB 2: ANTREAN PESANAN GUDANG */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-700">
            Daftar Pesanan yang Dialokasikan ke Gudang ({orderList.length} Pesanan)
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">No. Pesanan</th>
                  <th className="py-3 px-4">Gudang Shard</th>
                  <th className="py-3 px-4">Penerima & Kota</th>
                  <th className="py-3 px-4">Total & Item</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Aksi Status Pesanan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orderList.map((ord) => (
                  <tr key={`${ord.warehouse_id}-${ord.id}`} className="hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-slate-900 block">{ord.order_number}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(ord.created_at).toLocaleDateString('id-ID')}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-blue-700">
                      {ord.warehouse_name}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-slate-800 block">{ord.recipient_name}</span>
                      <span className="text-[11px] text-slate-500">{ord.shipping_city}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 block">{formatRupiah(ord.total)}</span>
                      <span className="text-[10px] text-slate-500">{ord.total_items} jenis barang</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="capitalize font-bold text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                        {ord.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {ord.status === 'dibayar' && (
                          <button
                            onClick={() => handleUpdateStatus(ord.id, ord.warehouse_id, 'diproses')}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-2 py-1 rounded text-[11px]"
                          >
                            Proses
                          </button>
                        )}
                        {ord.status === 'diproses' && (
                          <button
                            onClick={() => handleUpdateStatus(ord.id, ord.warehouse_id, 'dikemas')}
                            className="bg-amber-600 hover:bg-amber-700 text-white font-semibold px-2 py-1 rounded text-[11px]"
                          >
                            Kemas
                          </button>
                        )}
                        {ord.status === 'dikemas' && (
                          <button
                            onClick={() => handleUpdateStatus(ord.id, ord.warehouse_id, 'dikirim')}
                            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-2 py-1 rounded text-[11px]"
                          >
                            Kirimkan
                          </button>
                        )}
                        {ord.status === 'dikirim' && (
                          <button
                            onClick={() => handleUpdateStatus(ord.id, ord.warehouse_id, 'selesai')}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-2 py-1 rounded text-[11px]"
                          >
                            Selesai
                          </button>
                        )}
                        {ord.status === 'selesai' && (
                          <span className="text-emerald-600 text-[11px] font-bold flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Terkirim</span>
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* KONTEN TAB 3: AUDIT MUTASI STOK */}
      {activeTab === 'movements' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-700">
            Riwayat Pencatatan Mutasi (Tabel Terdistribusi stock_movements)
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Waktu</th>
                  <th className="py-3 px-4">Gudang Shard</th>
                  <th className="py-3 px-4">Produk & SKU</th>
                  <th className="py-3 px-4">Tipe & Ref</th>
                  <th className="py-3 px-4 text-right">Perubahan</th>
                  <th className="py-3 px-4 text-right">Sisa Stok</th>
                  <th className="py-3 px-4">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {movements.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 text-slate-500">
                      {new Date(m.created_at).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-blue-700">
                      {m.warehouse_name}
                    </td>
                    <td className="py-2.5 px-4 font-sans">
                      <span className="font-semibold text-slate-900 block">{m.product_name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{m.product_sku}</span>
                    </td>
                    <td className="py-2.5 px-4">
                      <span className={`px-1.5 py-0.5 rounded font-bold text-[10px] ${
                        m.movement_type === 'IN' ? 'bg-emerald-100 text-emerald-800' :
                        m.movement_type === 'OUT' || m.movement_type === 'CHECKOUT' ? 'bg-red-100 text-red-800' :
                        'bg-slate-100 text-slate-800'
                      }`}>
                        {m.movement_type}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">{m.reference_id}</span>
                    </td>
                    <td className={`py-2.5 px-4 text-right font-bold ${m.change_qty > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {m.change_qty > 0 ? `+${m.change_qty}` : m.change_qty}
                    </td>
                    <td className="py-2.5 px-4 text-right font-black text-slate-900">
                      {m.final_qty}
                    </td>
                    <td className="py-2.5 px-4 font-sans text-slate-600 max-w-xs truncate">
                      {m.notes}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL MUTASI STOK */}
      {showMutationModal && mutationProduct && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 border border-slate-200">
            <div className="flex justify-between items-start pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Input Mutasi Stok Fisik</h3>
                <p className="text-xs text-slate-500">
                  {mutationProduct.product_name} di {mutationProduct.warehouse_name}
                </p>
              </div>
              <button
                onClick={() => setShowMutationModal(false)}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            {mutationSuccess ? (
              <div className="p-4 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-xl text-center flex items-center justify-center gap-2">
                <CheckCircle className="w-5 h-5" />
                <span>{mutationSuccess}</span>
              </div>
            ) : (
              <form onSubmit={handleExecuteMutation} className="space-y-4 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl flex justify-between text-slate-700 font-medium">
                  <span>Stok Fisik Saat Ini:</span>
                  <span className="font-black text-slate-900">{mutationProduct.qty} unit</span>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Jenis Mutasi</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { key: 'IN', label: 'Barang Masuk' },
                      { key: 'OUT', label: 'Barang Keluar' },
                      { key: 'ADJUSTMENT', label: 'Penyesuaian' },
                    ].map((t) => (
                      <button
                        key={t.key}
                        type="button"
                        onClick={() => setMutationType(t.key)}
                        className={`py-2 rounded-lg font-bold text-[11px] border transition ${
                          mutationType === t.key
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">
                    {mutationType === 'ADJUSTMENT' ? 'Nilai Stok Baru' : 'Jumlah Perubahan (Qty)'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={mutationQty}
                    onChange={(e) => setMutationQty(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Keterangan / Alasan Mutasi</label>
                  <input
                    type="text"
                    required
                    placeholder="Penerimaan kontainer pabrik / retur / stok opname"
                    value={mutationNotes}
                    onChange={(e) => setMutationNotes(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowMutationModal(false)}
                    className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 font-semibold"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={mutationLoading}
                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 shadow-xs"
                  >
                    {mutationLoading ? 'Memproses...' : 'Simpan Mutasi'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL INPUT BARANG MASUK KE GUDANG SESUAI LOKASI (TANGERANG, SIDOARJO, MEDAN) */}
      {showInputStockModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-start pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  Distributed Stock Entry
                </span>
                <h3 className="font-extrabold text-base text-slate-900 mt-1">
                  Input Barang Masuk ke Gudang Fisik
                </h3>
                <p className="text-xs text-slate-500">
                  Pilih lokasi gudang (Tangerang, Sidoarjo, Medan), barang akan disimpan ke Shard Citus yang sesuai.
                </p>
              </div>
              <button
                onClick={() => setShowInputStockModal(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold p-1 rounded-md"
              >
                ✕
              </button>
            </div>

            {inputStockSuccess ? (
              <div className="p-4 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-xl text-center flex items-center justify-center gap-2 border border-emerald-200">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <span>{inputStockSuccess}</span>
              </div>
            ) : (
              <form onSubmit={handleExecuteInputStock} className="space-y-4 text-xs">
                {/* 1. Pilih Lokasi Gudang */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Warehouse className="w-3.5 h-3.5 text-emerald-600" />
                    <span>1. Pilih Letak / Lokasi Gudang Tujuan</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: '1', city: 'Tangerang', code: 'WH-JKT', label: 'Banten / BSD' },
                      { id: '2', city: 'Sidoarjo', code: 'WH-SBY', label: 'Jawa Timur' },
                      { id: '3', city: 'Medan', code: 'WH-MDN', label: 'Sumatera Utara' },
                    ].map((hub) => (
                      <button
                        key={hub.id}
                        type="button"
                        onClick={() => setInputWhId(hub.id)}
                        className={`p-2.5 rounded-xl text-left border transition ${
                          inputWhId === hub.id
                            ? 'bg-emerald-50 border-emerald-600 text-emerald-950 ring-2 ring-emerald-500/20'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span className="block font-black text-xs text-slate-900">{hub.city}</span>
                        <span className="font-mono text-[9px] text-slate-500 block">{hub.code}</span>
                        <span className="text-[10px] text-slate-500 font-medium block mt-0.5">{hub.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Pilih Produk */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-emerald-600" />
                    <span>2. Pilih Produk Furnitur</span>
                  </label>
                  <select
                    value={inputProductId}
                    onChange={(e) => setInputProductId(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  >
                    <option value="" disabled>-- Pilih Produk dari Katalog --</option>
                    {allProducts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (SKU: {p.sku}) - {formatRupiah(p.price)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. Jumlah Qty & Catatan */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-800">3. Jumlah Masuk (Qty)</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={inputQty}
                      onChange={(e) => setInputQty(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-800">No. Surat Jalan / Ref</label>
                    <input
                      type="text"
                      placeholder="SJ-2026-X"
                      value={inputNotes}
                      onChange={(e) => setInputNotes(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="p-3 bg-amber-50/70 border border-amber-200/60 rounded-xl text-[11px] text-amber-900 leading-relaxed">
                  <strong>ℹ️ Transparansi Citus Distributed:</strong> Penambahan stok ini akan langsung mengunci baris stok pada Shard Gudang yang dipilih (<code>warehouse_id: {inputWhId}</code>) dan mencatat jejak audit ke tabel <code>stock_movements</code>.
                </div>

                <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowInputStockModal(false)}
                    className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={inputStockLoading}
                    className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 shadow-xs transition"
                  >
                    {inputStockLoading ? 'Menyimpan ke Shard...' : 'Simpan Barang Masuk'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
