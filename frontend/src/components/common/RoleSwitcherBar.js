'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Shield, UserCheck, Warehouse, Sliders, LineChart, LogOut, X, ChevronDown } from 'lucide-react';

export default function RoleSwitcherBar() {
  const { user, switchRole, logout, loading, DEMO_ACCOUNTS } = useAuth();
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) {
    return (
      <div className="bg-slate-900/90 text-slate-300 text-[11px] py-1 px-4 flex justify-end">
        <button
          onClick={() => setIsVisible(true)}
          className="flex items-center gap-1.5 text-amber-400 hover:text-amber-300 font-medium transition"
          title="Buka bilah pintasan role untuk demonstrasi ke dosen"
        >
          <Shield className="w-3 h-3" />
          <span>Tampilkan Pintasan Demo Dosen</span>
          <ChevronDown className="w-3 h-3" />
        </button>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 text-slate-200 text-xs py-2 px-4 border-b border-slate-800 transition-all">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 font-semibold text-amber-400">
            <Shield className="w-3.5 h-3.5" />
            <span>Pintasan Demo SBDT:</span>
          </span>
          <span className="text-slate-400 hidden sm:inline">
            Klik tombol untuk login instan antar-aktor saat presentasi:
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => switchRole('user')}
            disabled={loading}
            className={`px-2.5 py-1 rounded font-medium flex items-center gap-1 transition ${
              user?.role === 'user'
                ? 'bg-blue-600 text-white font-bold ring-1 ring-blue-400'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <UserCheck className="w-3 h-3" />
            Pembeli (User)
          </button>

          <button
            onClick={() => switchRole('warehouse')}
            disabled={loading}
            className={`px-2.5 py-1 rounded font-medium flex items-center gap-1 transition ${
              user?.role === 'warehouse'
                ? 'bg-emerald-600 text-white font-bold ring-1 ring-emerald-400'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Warehouse className="w-3 h-3" />
            Staf Gudang
          </button>

          <button
            onClick={() => switchRole('admin')}
            disabled={loading}
            className={`px-2.5 py-1 rounded font-medium flex items-center gap-1 transition ${
              user?.role === 'admin'
                ? 'bg-purple-600 text-white font-bold ring-1 ring-purple-400'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Sliders className="w-3 h-3" />
            Admin
          </button>

          <button
            onClick={() => switchRole('owner')}
            disabled={loading}
            className={`px-2.5 py-1 rounded font-medium flex items-center gap-1 transition ${
              user?.role === 'owner'
                ? 'bg-amber-600 text-white font-bold ring-1 ring-amber-400'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <LineChart className="w-3 h-3" />
            Owner (Grafik)
          </button>

          {user && (
            <button
              onClick={logout}
              title="Logout"
              className="p-1 rounded bg-red-950 text-red-300 hover:bg-red-900 ml-1 transition"
            >
              <LogOut className="w-3 h-3" />
            </button>
          )}

          <button
            onClick={() => setIsVisible(false)}
            title="Sembunyikan bilah demo ini"
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 ml-1 transition flex items-center gap-1 text-[11px]"
          >
            <X className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Sembunyikan</span>
          </button>
        </div>
      </div>
    </div>
  );
}
