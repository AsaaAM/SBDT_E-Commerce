'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  ShoppingCart,
  User,
  Package,
  Warehouse,
  ShieldCheck,
  BarChart3,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import RoleSwitcherBar from '../common/RoleSwitcherBar';

export default function Navbar() {
  const router = useRouter();
  const { user, logout, isWarehouse, isAdmin, isOwner } = useAuth();
  const { cart, toastMessage } = useCart();
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/catalog?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push('/catalog');
    }
  };

  return (
    <header className="sticky top-0 z-50 shadow-md">
      {/* 1. Bar Demo Switcher Role */}
      <RoleSwitcherBar />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="bg-emerald-600 text-white text-xs font-semibold py-1.5 px-4 text-center transition-all animate-fade-in shadow-inner">
          {toastMessage}
        </div>
      )}

      {/* 2. Main Navbar IKEA Blue */}
      <nav className="bg-[#0058a3] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <div className="bg-[#ffdb00] text-[#0058a3] font-black px-2.5 py-1 rounded tracking-tighter text-lg leading-none shadow-xs">
                SBDT
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold tracking-tight text-white text-sm sm:text-base leading-none">
                  NORDIC LIVING
                </span>
                <span className="text-[10px] text-blue-200 tracking-wider">
                  Citus Distributed Edition
                </span>
              </div>
            </Link>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="flex-1 max-w-lg hidden md:block">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Cari sofa, tempat tidur, rak buku, atau SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white text-slate-900 rounded-full py-2 pl-4 pr-10 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-[#ffdb00]"
                />
                <button
                  type="submit"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-[#0058a3] text-white p-1.5 rounded-full hover:bg-[#003e73] transition"
                >
                  <Search className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>

            {/* Navigation Links Desktop */}
            <div className="hidden lg:flex items-center gap-4 text-xs font-medium">
              <Link href="/" className="text-white hover:text-[#ffdb00] transition">
                Beranda
              </Link>
              <Link href="/catalog" className="text-white hover:text-[#ffdb00] transition">
                Katalog Furnitur
              </Link>

              {user && (
                <Link href="/orders" className="flex items-center gap-1 text-white hover:text-[#ffdb00] transition">
                  <Package className="w-3.5 h-3.5" />
                  <span>Pesanan Saya</span>
                </Link>
              )}

              {/* Role-Specific Dashboard Badges */}
              {(isWarehouse || isAdmin || isOwner) && (
                <Link
                  href="/warehouse"
                  className="bg-emerald-700 hover:bg-emerald-800 text-white px-2.5 py-1 rounded flex items-center gap-1 transition"
                >
                  <Warehouse className="w-3.5 h-3.5" />
                  <span>Dashboard Gudang</span>
                </Link>
              )}

              {(isAdmin || isOwner) && (
                <Link
                  href="/admin"
                  className="bg-purple-700 hover:bg-purple-800 text-white px-2.5 py-1 rounded flex items-center gap-1 transition"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Admin Panel</span>
                </Link>
              )}

              {isOwner && (
                <Link
                  href="/owner"
                  className="bg-amber-600 hover:bg-amber-700 text-white px-2.5 py-1 rounded flex items-center gap-1 transition"
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>Owner Analytics</span>
                </Link>
              )}
            </div>

            {/* Actions: Cart & User */}
            <div className="flex items-center gap-3">
              {/* Keranjang Belanja */}
              <Link
                href="/cart"
                className="relative bg-white/10 hover:bg-white/20 p-2 rounded-full text-white transition flex items-center justify-center"
                title="Keranjang Belanja"
              >
                <ShoppingCart className="w-5 h-5" />
                {cart.total_items > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#ffdb00] text-slate-950 font-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center shadow-xs">
                    {cart.total_items}
                  </span>
                )}
              </Link>

              {/* Profil / User */}
              {user ? (
                <div className="flex items-center gap-2 pl-2 border-l border-blue-400/40">
                  <div className="flex flex-col text-right hidden sm:block">
                    <span className="text-xs font-semibold text-white leading-tight">
                      {user.name}
                    </span>
                    <span className="text-[10px] text-[#ffdb00] uppercase font-bold tracking-wider leading-none">
                      {user.role}
                    </span>
                  </div>
                  <button
                    onClick={logout}
                    title="Keluar"
                    className="p-1.5 rounded-full bg-blue-800 hover:bg-blue-900 text-blue-200 hover:text-white transition"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="bg-[#ffdb00] text-slate-900 hover:bg-[#e5c500] font-bold text-xs px-3.5 py-2 rounded-full transition flex items-center gap-1"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Masuk</span>
                </Link>
              )}

              {/* Mobile Hamburger Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 text-white hover:text-[#ffdb00]"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Search Input */}
          <div className="pb-3 md:hidden">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Cari produk furnitur..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white text-slate-900 rounded-full py-1.5 pl-4 pr-10 text-xs focus:outline-hidden"
                />
                <button
                  type="submit"
                  className="absolute right-1 top-1/2 -translate-y-1/2 bg-[#0058a3] text-white p-1 rounded-full"
                >
                  <Search className="w-3 h-3" />
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-[#004885] px-4 py-3 space-y-2 border-t border-blue-800 text-xs font-medium">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-1.5 text-white hover:text-[#ffdb00]"
            >
              Beranda
            </Link>
            <Link
              href="/catalog"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-1.5 text-white hover:text-[#ffdb00]"
            >
              Katalog Furnitur
            </Link>
            {user && (
              <Link
                href="/orders"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-1.5 text-white hover:text-[#ffdb00]"
              >
                Pesanan Saya
              </Link>
            )}
            {(isWarehouse || isAdmin || isOwner) && (
              <Link
                href="/warehouse"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-1.5 text-emerald-300 font-bold"
              >
                Dashboard Gudang
              </Link>
            )}
            {(isAdmin || isOwner) && (
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-1.5 text-purple-300 font-bold"
              >
                Admin Panel
              </Link>
            )}
            {isOwner && (
              <Link
                href="/owner"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-1.5 text-amber-300 font-bold"
              >
                Owner Analytics (Grafik)
              </Link>
            )}
          </div>
        )}
      </nav>
    </header>
  );
}
