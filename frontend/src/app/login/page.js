'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Mail, User, Shield, Warehouse, Sliders, LineChart, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { login, register, switchRole } = useAuth();

  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        await register({ name, email, password, phone, address });
        router.push('/catalog');
      } else {
        const loggedIn = await login(email, password);
        if (loggedIn.role === 'warehouse') router.push('/warehouse');
        else if (loggedIn.role === 'admin') router.push('/admin');
        else if (loggedIn.role === 'owner') router.push('/owner');
        else router.push('/catalog');
      }
    } catch (err) {
      setError(err.message || 'Otentikasi gagal.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (role) => {
    setError('');
    setLoading(true);
    try {
      await switchRole(role);
      if (role === 'warehouse') router.push('/warehouse');
      else if (role === 'admin') router.push('/admin');
      else if (role === 'owner') router.push('/owner');
      else router.push('/catalog');
    } catch (err) {
      setError(err.message || 'Gagal login demo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
      <div className="text-center space-y-2">
        <div className="inline-block bg-[#ffdb00] text-[#0058a3] font-black px-3 py-1 rounded text-sm shadow-xs">
          SBDT CITUS
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Masuk ke Akun Nordic Living
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
          Pilih akses role untuk menguji transparansi RBAC dan hak akses sistem.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Kolom Kiri: Form Otentikasi */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          {/* Tab Switcher */}
          <div className="grid grid-cols-2 bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => { setIsRegister(false); setError(''); }}
              className={`py-2 rounded-lg transition ${!isRegister ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
            >
              Masuk (Login)
            </button>
            <button
              onClick={() => { setIsRegister(true); setError(''); }}
              className={`py-2 rounded-lg transition ${isRegister ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
            >
              Daftar Akun Baru
            </button>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-red-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {isRegister && (
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Nama Lengkap</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="Siti Pembeli"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg py-2 pl-3 pr-8 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                  <User className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Email Pengguna</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="buyer@ikea-sbdt.local"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg py-2 pl-3 pr-8 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-slate-700">Password</label>
                {isRegister && (
                  <span className="text-[10px] text-slate-500 font-medium">Minimal 6 karakter</span>
                )}
              </div>
              <div className="relative">
                <input
                  type="password"
                  required
                  minLength={isRegister ? 6 : 1}
                  placeholder={isRegister ? "Minimal 6 karakter (contoh: rahasia123)" : "••••••••"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg py-2 pl-3 pr-8 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {isRegister && (
              <>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Nomor Telepon</label>
                  <input
                    type="text"
                    placeholder="081234567890"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Alamat</label>
                  <input
                    type="text"
                    placeholder="Jl. Merdeka No. 12"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-[#0058a3] hover:bg-[#003e73] text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-xs"
            >
              {loading ? (
                <span>Memproses...</span>
              ) : (
                <>
                  <span>{isRegister ? 'Daftar Akun Baru' : 'Masuk Sekarang'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Kolom Kanan: 1-Click Quick Demo Tester */}
        <div className="space-y-4">
          <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-md space-y-4">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                <Shield className="w-3.5 h-3.5" />
                <span>Pengujian Cepat Dosen / Penilai</span>
              </span>
              <h2 className="text-base font-bold">1-Click Login Akun Bawaan (Seed)</h2>
              <p className="text-xs text-slate-400">
                Pilih salah satu role di bawah untuk langsung login tanpa perlu mengetik kredensial manual:
              </p>
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => handleQuickDemo('user')}
                className="w-full p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-left transition flex items-center justify-between border border-slate-700"
              >
                <div>
                  <span className="font-bold text-xs text-blue-400 block">1. Pembeli (User)</span>
                  <span className="text-[11px] text-slate-400">buyer@ikea-sbdt.local (Pass: User123!)</span>
                </div>
                <span className="text-xs text-blue-400 font-semibold flex items-center gap-1">
                  <span>Masuk</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('warehouse')}
                className="w-full p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-left transition flex items-center justify-between border border-slate-700"
              >
                <div>
                  <span className="font-bold text-xs text-emerald-400 block">2. Orang Gudang</span>
                  <span className="text-[11px] text-slate-400">gudang@ikea-sbdt.local (Pass: Gudang123!)</span>
                </div>
                <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                  <span>Masuk</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('admin')}
                className="w-full p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-left transition flex items-center justify-between border border-slate-700"
              >
                <div>
                  <span className="font-bold text-xs text-purple-400 block">3. Admin Sistem</span>
                  <span className="text-[11px] text-slate-400">admin@ikea-sbdt.local (Pass: Admin123!)</span>
                </div>
                <span className="text-xs text-purple-400 font-semibold flex items-center gap-1">
                  <span>Masuk</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('owner')}
                className="w-full p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-left transition flex items-center justify-between border border-slate-700"
              >
                <div>
                  <span className="font-bold text-xs text-amber-400 block">4. Owner (Laporan & Grafik)</span>
                  <span className="text-[11px] text-slate-400">owner@ikea-sbdt.local (Pass: Owner123!)</span>
                </div>
                <span className="text-xs text-amber-400 font-semibold flex items-center gap-1">
                  <span>Masuk</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
