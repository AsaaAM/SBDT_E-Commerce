'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  ShoppingCart,
  User,
  Heart,
  Package,
  Warehouse,
  ShieldCheck,
  BarChart3,
  LogOut,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import RoleSwitcherBar from '../common/RoleSwitcherBar';

export default function Navbar() {
  const router = useRouter();
  const { user, logout, isWarehouse, isAdmin, isOwner } = useAuth();
  const { cart, toastMessage } = useCart();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/catalog?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push('/catalog');
    }
  };

  return (
    <header className="sticky top-0 z-50 shadow-xs bg-white">
      {/* 1. Bar Demo Switcher Role */}
      <RoleSwitcherBar />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="bg-emerald-600 text-white text-xs font-semibold py-1.5 px-4 text-center transition-all animate-fade-in shadow-inner">
          {toastMessage}
        </div>
      )}

      {/* 2. Main Navbar Putih NORDIC */}
      <nav className="bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-18 gap-4 sm:gap-6">
            {/* Logo NORDIC LIVING (Coklat #995F2F & Putih) */}
            <div className="flex items-center gap-3 shrink-0">
              <Link href="/" className="flex items-center gap-2 group">
                <div className="bg-[#995F2F] hover:bg-[#854f24] px-3.5 py-1.5 rounded-md flex items-center justify-center shadow-xs transition">
                  <span className="text-white font-black text-xl tracking-tighter leading-none select-none font-sans">
                    NORDIC
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-black tracking-tight text-slate-900 leading-none">
                    LIVING
                  </span>
                  <span className="text-[9px] text-[#995F2F] font-bold tracking-wider">
                    SBDT Citus
                  </span>
                </div>
              </Link>
            </div>

            {/* Search Bar Oval */}
            <form onSubmit={handleSearch} className="flex-1 max-w-2xl hidden md:block">
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-500">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  placeholder="Cari sofa, tempat tidur, rak buku, atau SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#f6f5f3] hover:bg-[#eeebe6] text-slate-900 rounded-full py-2.5 pl-11 pr-4 text-xs sm:text-sm placeholder:text-stone-400 focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-[#995F2F] transition"
                />
              </div>
            </form>

            {/* Aksi User, Wishlist & Cart (Semua Memiliki Halaman Terintegrasi Nyata) */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Profil User */}
              {user ? (
                <div className="flex items-center gap-2 text-slate-800">
                  <Link
                    href="/orders"
                    className="flex flex-col text-right hover:opacity-80 transition hidden sm:block"
                    title="Lihat Riwayat Pesanan Saya"
                  >
                    <span className="text-xs font-bold text-slate-900 leading-tight">
                      {user.name}
                    </span>
                    <span className="text-[10px] text-[#995F2F] font-bold uppercase tracking-wider leading-none">
                      {user.role}
                    </span>
                  </Link>
                  <button
                    onClick={logout}
                    title="Keluar"
                    className="p-2 rounded-full hover:bg-stone-100 text-stone-600 hover:text-red-600 transition"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="p-2 rounded-full hover:bg-stone-100 text-stone-700 transition"
                  title="Masuk akun"
                >
                  <User className="w-5 h-5" />
                </Link>
              )}

              {/* Wishlist Link -> Menuju ke /catalog dengan filter */}
              <Link
                href="/catalog"
                className="p-2 rounded-full hover:bg-stone-100 text-stone-700 transition hidden sm:flex items-center justify-center"
                title="Produk Favorit & Rekomendasi"
              >
                <Heart className="w-5 h-5 text-stone-700 hover:text-rose-600 transition" />
              </Link>

              {/* Cart Icon -> Menuju /cart */}
              <Link
                href="/cart"
                className="relative p-2 rounded-full hover:bg-stone-100 text-stone-800 transition flex items-center justify-center"
                title="Keranjang Belanja"
              >
                <ShoppingCart className="w-5 h-5" />
                {cart.total_items > 0 && (
                  <span className="absolute top-0.5 right-0.5 bg-[#995F2F] text-white font-bold text-[10px] w-4.5 h-4.5 rounded-full flex items-center justify-center shadow-xs">
                    {cart.total_items}
                  </span>
                )}
              </Link>
            </div>
          </div>

          {/* Search bar mobile */}
          <div className="pb-3 md:hidden">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  placeholder="Cari perabot di NORDIC..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#f6f5f3] text-slate-900 rounded-full py-2 pl-10 pr-4 text-xs focus:outline-hidden focus:ring-2 focus:ring-[#995F2F]"
                />
              </div>
            </form>
          </div>
        </div>

        {/* 3. Sub-Navbar Kategori Menu (HANYA YANG PUNYA LOGIKA & INTEGRASI SEJALAN) */}
        <div className="border-t border-stone-200 hidden md:block bg-stone-50/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-start gap-7 h-10 text-xs font-semibold text-slate-800 overflow-x-auto no-scrollbar">
              <Link href="/catalog" className="hover:text-[#995F2F] transition shrink-0 font-bold">
                Semua Produk
              </Link>
              <Link href="/catalog?category=ruang-tamu" className="hover:text-[#995F2F] transition shrink-0">
                Ruang Tamu
              </Link>
              <Link href="/catalog?category=kamar-tidur" className="hover:text-[#995F2F] transition shrink-0">
                Kamar Tidur
              </Link>
              <Link href="/catalog?category=ruang-makan" className="hover:text-[#995F2F] transition shrink-0">
                Ruang Makan
              </Link>
              <Link href="/catalog?category=ruang-kerja" className="hover:text-[#995F2F] transition shrink-0">
                Ruang Kerja
              </Link>
              <Link href="/catalog?category=penyimpanan" className="hover:text-[#995F2F] transition shrink-0">
                Penyimpanan & Rak
              </Link>
              <Link href="/catalog?category=lampu-dekorasi" className="hover:text-[#995F2F] transition shrink-0">
                Lampu & Dekorasi
              </Link>

              {user && (
                <Link href="/orders" className="hover:text-[#995F2F] transition shrink-0 flex items-center gap-1 font-medium text-stone-700">
                  <Package className="w-3.5 h-3.5 text-[#995F2F]" />
                  <span>Pesanan Saya</span>
                </Link>
              )}

              {/* Role-specific Dashboard Shortcuts */}
              {(isWarehouse || isAdmin || isOwner) && (
                <Link
                  href="/warehouse"
                  className="ml-auto text-emerald-700 hover:text-emerald-800 shrink-0 flex items-center gap-1 font-bold"
                >
                  <Warehouse className="w-3.5 h-3.5" />
                  <span>Gudang</span>
                </Link>
              )}
              {(isAdmin || isOwner) && (
                <Link
                  href="/admin"
                  className="text-purple-700 hover:text-purple-800 shrink-0 flex items-center gap-1 font-bold"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Admin Panel</span>
                </Link>
              )}
              {isOwner && (
                <Link
                  href="/owner"
                  className="text-[#995F2F] hover:text-[#854f24] shrink-0 flex items-center gap-1 font-bold"
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>Analytics</span>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* 4. Strip Informasi (Aksen Coklat #995F2F) */}
        <div className="bg-[#995F2F] text-white text-xs font-medium py-1.5 px-4 shadow-inner">
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-2">
            <Sparkles className="w-3.5 h-3.5 shrink-0 text-amber-200" />
            <span>Katalog Resmi NORDIC LIVING — Sistem Basis Data Terdistribusi Citus PostgreSQL Sharding</span>
            <Link href="/catalog" className="underline hover:text-amber-100 flex items-center text-[11px] ml-1">
              <span>Jelajahi</span>
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
}
