'use client';

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  DollarSign,
  Package,
  Boxes,
  Warehouse,
  BarChart3,
  Award,
  ShieldAlert,
  AlertTriangle,
  UserPlus,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { fetchApi, formatRupiah } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

const COLORS = ['#0058a3', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

export default function OwnerDashboardPage() {
  const { user, isOwner } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modal State Tambah Admin
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminForm, setAdminForm] = useState({ name: '', email: '', password: '', phone: '', address: '' });
  const [adminList, setAdminList] = useState([]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const [res, adminRes] = await Promise.all([
        fetchApi('/owner/analytics'),
        fetchApi('/owner/admins'),
      ]);
      if (res.success) setData(res.data);
      if (adminRes.success) setAdminList(adminRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && isOwner) {
      loadAnalytics();
    }
  }, [user, isOwner]);

  if (!user || !isOwner) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Akses Khusus Owner</h2>
        <p className="text-xs text-slate-500">
          Halaman analitik eksekutif ini dilindungi RBAC khusus untuk Owner. Gunakan bilah Mode Demo di atas dan pilih <strong>Owner</strong>.
        </p>
      </div>
    );
  }

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    try {
      await fetchApi('/owner/admins', {
        method: 'POST',
        body: JSON.stringify(adminForm),
      });
      setShowAdminModal(false);
      setAdminForm({ name: '', email: '', password: '', phone: '', address: '' });
      loadAnalytics();
    } catch (err) {
      alert(err.message || 'Gagal menambahkan admin');
    }
  };

  if (loading || !data) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="w-10 h-10 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-xs text-slate-500">Mengeksekusi agregasi analitik lintas shard Citus...</p>
      </div>
    );
  }

  const { kpi, sales_trend, warehouse_performance, top_products, warehouse_stock_distribution } = data;

  // Format data pie chart stok
  const pieData = (warehouse_stock_distribution || []).map((w) => ({
    name: w.city || w.name,
    value: parseFloat(w.total_value),
    qty: parseInt(w.total_qty, 10),
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Role: Business Owner & Executive
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Laporan Kinerja Bisnis & Analitik Terdistribusi
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Visualisasi agregasi multi-shard SQL Citus secara realtime: omzet penjualan, perbandingan performa hub, dan valuasi aset.
          </p>
        </div>

        <button
          onClick={() => setShowAdminModal(true)}
          className="bg-amber-600 hover:bg-amber-700 text-white px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition self-start sm:self-auto shadow-xs"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Kelola / Tambah Admin</span>
        </button>
      </div>

      {/* 1. EXECUTIVE KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border-2 border-emerald-500/30 shadow-xs space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold text-emerald-800">Total Pendapatan Cair (Duit Cair)</span>
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {formatRupiah(kpi.total_revenue)}
          </div>
          <span className="text-[11px] text-emerald-700 font-bold block">
            ✓ Status TERKIRIM (Tervalidasi Admin)
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Dana Mengendap / Escrow</span>
            <div className="p-2 bg-amber-50 text-amber-700 rounded-lg">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-800">
            {formatRupiah(kpi.pending_escrow || 0)}
          </div>
          <span className="text-[11px] text-slate-500 font-medium block">
            Dalam proses kirim / menunggu validasi resi
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Rata-rata Nilai Pesanan Cair</span>
            <div className="p-2 bg-purple-50 text-purple-700 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {formatRupiah(kpi.average_order_value)}
          </div>
          <span className="text-[11px] text-slate-500 font-medium block">
            {kpi.total_orders} Pesanan Terkirim
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Valuasi Aset Stok Fisik</span>
            <div className="p-2 bg-blue-50 text-blue-700 rounded-lg">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {formatRupiah(kpi.total_stock_valuation)}
          </div>
          <span className="text-[11px] text-slate-500 font-medium block">
            Total {kpi.total_physical_stock} unit di 3 gudang
          </span>
        </div>
      </div>

      {/* Banner Arus Kas */}
      <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-black bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full uppercase">
            Aturan Sistem
          </span>
          <span>
            <strong>Duit Cair (Realized Revenue):</strong> Seluruh grafik omset dan performa regional di bawah ini murni mengagregasi pesanan dengan status <strong>TERKIRIM</strong> yang telah diverifikasi nomor resinya oleh Administrator.
          </span>
        </div>
      </div>

      {/* 2. RECHARTS: GRAFIK TREN PENJUALAN & PERFORMA GUDANG */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Grafik 1: Tren Penjualan Harian */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-blue-700" />
              <span>Tren Omzet Penjualan Cair (Agregasi Harian Citus)</span>
            </h3>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded">
              Duit Cair Terkirim
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sales_trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0058a3" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#0058a3" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" tickFormatter={(v) => `Rp${v/1000000}M`} />
                <Tooltip
                  formatter={(val) => [formatRupiah(val), 'Omzet']}
                  labelFormatter={(lbl) => `Tanggal: ${lbl}`}
                  contentStyle={{ fontSize: '11px', borderRadius: '8px' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#0058a3" fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Grafik 2: Performa & Omzet Antar Gudang Regional */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
              <Warehouse className="w-4 h-4 text-emerald-700" />
              <span>Perbandingan Omzet Antar Gudang Regional (Shard)</span>
            </h3>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded">
              Colocated Data
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={warehouse_performance} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="city" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" tickFormatter={(v) => `Rp${v/1000000}M`} />
                <Tooltip
                  formatter={(val) => [formatRupiah(val), 'Omzet Terpenuhi']}
                  contentStyle={{ fontSize: '11px', borderRadius: '8px' }}
                />
                <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 3. RECHARTS: PIE CHART STOK GUDANG & TABEL PRODUK TERLARIS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Pie Chart: Distribusi Valuasi Stok */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
            <Boxes className="w-4 h-4 text-amber-700" />
            <span>Porsi Valuasi Stok per Hub</span>
          </h3>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val) => [formatRupiah(val), 'Nilai Stok']}
                  contentStyle={{ fontSize: '11px', borderRadius: '8px' }}
                />
                <Legend iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tabel Produk Terlaris (Top Selling Furniture) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-purple-700" />
              <span>Produk Furnitur Terlaris (Leaderboard Penjualan)</span>
            </h3>
            <span className="text-[10px] text-slate-400">Join Order Items & Products</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Produk</th>
                  <th className="py-2.5 px-3">Kategori</th>
                  <th className="py-2.5 px-3 text-right">Terjual</th>
                  <th className="py-2.5 px-3 text-right">Total Nilai</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {top_products.map((p, idx) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[11px] text-slate-400 w-4">#{idx + 1}</span>
                        <img src={p.image_url} alt={p.name} className="w-8 h-8 rounded object-cover bg-slate-100 shrink-0" />
                        <span className="font-semibold text-slate-900 truncate max-w-xs">{p.name}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">{p.category_name}</td>
                    <td className="py-2.5 px-3 text-right font-black text-slate-900">
                      {p.total_sold} unit
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-emerald-700">
                      {formatRupiah(p.total_revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 4. DAFTAR ADMINISTRATOR & OWNER */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="font-bold text-sm text-slate-900">
          Akun Administrator Sistem Terdaftar
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {adminList.map((adm) => (
            <div key={adm.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-900">{adm.name}</span>
                <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                  adm.role === 'owner' ? 'bg-amber-100 text-amber-800' : 'bg-purple-100 text-purple-800'
                }`}>
                  {adm.role}
                </span>
              </div>
              <span className="text-slate-500 block truncate">{adm.email}</span>
              <span className="text-[10px] text-slate-400 block">{adm.phone || '-'}</span>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL TAMBAH ADMIN */}
      {showAdminModal && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 border border-slate-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">Tambah Akun Administrator Baru</h3>
              <button
                onClick={() => setShowAdminModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAdmin} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Nama Administrator</label>
                <input
                  type="text"
                  required
                  value={adminForm.name}
                  onChange={(e) => setAdminForm({ ...adminForm, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Email</label>
                <input
                  type="email"
                  required
                  value={adminForm.email}
                  onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Password</label>
                <input
                  type="password"
                  required
                  value={adminForm.password}
                  onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAdminModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 font-semibold text-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold"
                >
                  Simpan Admin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
