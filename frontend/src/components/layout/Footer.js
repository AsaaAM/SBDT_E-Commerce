'use client';

import React from 'react';
import { Database, Server, Cpu, CheckCircle } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#4a2e16] text-[#e8ded5] pt-12 pb-8 border-t border-[#6b4321] text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-[#6b4321]/60">
          {/* Kolom 1: Profil Proyek SBDT */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="bg-[#995F2F] text-white font-black px-2 py-0.5 rounded text-xs border border-[#b8753d]">
                SBDT
              </div>
              <span className="font-bold text-white text-sm">NORDIC LIVING</span>
            </div>
            <p className="text-[#d5c3b3] text-xs leading-relaxed">
              Platform marketplace furnitur bergaya Skandinavia yang dirancang khusus untuk memenuhi kriteria mata kuliah <strong>Sistem Basis Data Terdistribusi (SBDT)</strong>.
            </p>
          </div>

          {/* Kolom 2: Arsitektur Citus Terdistribusi */}
          <div className="space-y-2">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Database className="w-4 h-4 text-amber-300" />
              <span>Arsitektur Citus Data</span>
            </h4>
            <ul className="space-y-1.5 text-[#d5c3b3]">
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
              <Server className="w-4 h-4 text-amber-300" />
              <span>Fragmentasi & Sharding</span>
            </h4>
            <ul className="space-y-1.5 text-[#d5c3b3]">
              <li>
                <span className="font-medium text-white">Shard Key:</span> <code className="bg-[#3b230f] text-amber-300 px-1 py-0.5 rounded">warehouse_id</code>
              </li>
              <li>
                <span className="font-medium text-white">Colocation:</span> orders, inventory, order_items, shipments
              </li>
              <li>
                <span className="font-medium text-white">Reference Tables:</span> products, categories, warehouses, promos, users
              </li>
              <li>
                <span className="font-medium text-white">Isolasi Transaksi:</span> SELECT FOR UPDATE atomik
              </li>
            </ul>
          </div>

          {/* Kolom 4: Multi-Instance & Load Balancer */}
          <div className="space-y-2">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-amber-300" />
              <span>Infrastruktur Layanan</span>
            </h4>
            <ul className="space-y-1.5 text-[#d5c3b3]">
              <li>Nginx Reverse Proxy & Load Balancer</li>
              <li>2 Instance Backend Node.js / Express</li>
              <li>Frontend Next.js (App Router)</li>
              <li>Docker Compose Satu Perintah</li>
            </ul>
          </div>
        </div>

        {/* Baris Bawah */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[#c4b09f] text-[11px]">
          <div>
            &copy; 2026 NORDIC LIVING. Proyek Mata Kuliah Sistem Basis Data Terdistribusi (SBDT).
          </div>
          <div className="flex gap-4">
            <span className="text-[#d5c3b3]">Status: Citus Active (Cluster Sharded)</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
