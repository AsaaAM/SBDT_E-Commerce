'use client';

import React from 'react';
import { Database, Server, Cpu, CheckCircle } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-12 pb-8 border-t border-slate-800 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-slate-800">
          {/* Kolom 1: Profil Proyek SBDT */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="bg-[#ffdb00] text-[#0058a3] font-black px-2 py-0.5 rounded text-xs">
                SBDT
              </div>
              <span className="font-bold text-white text-sm">NORDIC LIVING</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              Platform marketplace furnitur bergaya Skandinavia/IKEA yang dirancang khusus untuk memenuhi kriteria mata kuliah <strong>Sistem Basis Data Terdistribusi (SBDT)</strong>.
            </p>
          </div>

          {/* Kolom 2: Arsitektur Citus Terdistribusi */}
          <div className="space-y-2">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Database className="w-4 h-4 text-blue-400" />
              <span>Arsitektur Citus Data</span>
            </h4>
            <ul className="space-y-1.5 text-slate-400">
              <li className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>1 Citus Coordinator Node</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>2 Worker Nodes (Sharding)</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>1 Physical Streaming Replica</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Transparansi Lokasi Klien</span>
              </li>
            </ul>
          </div>

          {/* Kolom 3: Strategi Fragmentasi & Replikasi */}
          <div className="space-y-2">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Server className="w-4 h-4 text-purple-400" />
              <span>Fragmentasi & Sharding</span>
            </h4>
            <ul className="space-y-1.5 text-slate-400">
              <li>
                <span className="font-medium text-slate-200">Shard Key:</span> <code className="bg-slate-800 text-amber-300 px-1 py-0.5 rounded">warehouse_id</code>
              </li>
              <li>
                <span className="font-medium text-slate-200">Colocation:</span> orders, inventory, order_items, shipments
              </li>
              <li>
                <span className="font-medium text-slate-200">Reference Tables:</span> products, categories, warehouses, promos, users
              </li>
              <li>
                <span className="font-medium text-slate-200">Isolasi Transaksi:</span> SELECT FOR UPDATE atomik
              </li>
            </ul>
          </div>

          {/* Kolom 4: Multi-Instance & Load Balancer */}
          <div className="space-y-2">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-emerald-400" />
              <span>Infrastruktur Layanan</span>
            </h4>
            <ul className="space-y-1.5 text-slate-400">
              <li>Nginx Reverse Proxy & Load Balancer</li>
              <li>2 Instance Backend Node.js / Express</li>
              <li>Frontend Next.js (App Router)</li>
              <li>Docker Compose Satu Perintah</li>
            </ul>
          </div>
        </div>

        {/* Baris Bawah */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-400 text-[11px]">
          <div>
            &copy; 2026 Nordic Living IKEA Edition. Proyek Mata Kuliah Sistem Basis Data Terdistribusi (SBDT).
          </div>
          <div className="flex gap-4">
            <span className="text-slate-400">Status: Citus Active (Cluster Sharded)</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
