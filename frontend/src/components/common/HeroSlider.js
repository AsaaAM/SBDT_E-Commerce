'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Produk diskon untuk Slide 1 (Persis seperti di gambar 1)
const DISCOUNT_PRODUCTS = [
  {
    name: 'OSTBIT',
    desc: 'Baki, bambu, 20x28 cm',
    originalPrice: 'Rp99.900',
    discountPrice: 'Rp74.900',
    image: 'https://images.unsplash.com/photo-1590736969955-71cc94801759?auto=format&fit=crop&w=400&q=80',
    href: '/catalog?q=OSTBIT',
  },
  {
    name: 'NISSAFORS',
    desc: 'Troli, hitam, 50.5x30x83 cm',
    originalPrice: 'Rp599.000',
    discountPrice: 'Rp449.000',
    image: 'https://images.unsplash.com/photo-1594026112284-02bb6f3352fe?auto=format&fit=crop&w=400&q=80',
    href: '/catalog?q=NISSAFORS',
  },
  {
    name: 'KNAGGLIG',
    desc: 'Kotak, kayu pinus, 23x31x15 cm',
    originalPrice: 'Rp149.000',
    discountPrice: 'Rp99.900',
    image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=400&q=80',
    href: '/catalog?q=KNAGGLIG',
  },
  {
    name: 'BRIMNES',
    desc: 'Lemari 3 laci, putih/kaca frosted, 78x95 cm',
    originalPrice: 'Rp2.499.000',
    discountPrice: 'Rp1.799.000',
    image: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=400&q=80',
    href: '/catalog?q=BRIMNES',
  },
  {
    name: 'VISSLÅÅN',
    desc: 'Kotak dengan penutup, set isi 5, abu-abu',
    originalPrice: 'Rp199.000',
    discountPrice: 'Rp149.000',
    image: 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=400&q=80',
    href: '/catalog?q=VISSLÅÅN',
  },
  {
    name: 'ÖRNVRÅK',
    desc: 'Jam dengan hygro-/thermometer, putih, 8x3 cm',
    originalPrice: 'Rp79.900',
    discountPrice: 'Rp69.900',
    image: 'https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?auto=format&fit=crop&w=400&q=80',
    href: '/catalog?q=ÖRNVRÅK',
  },
];

export default function HeroSlider() {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const totalSlides = 3;

  const nextSlide = useCallback(() => {
    setCurrent((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const prevSlide = useCallback(() => {
    setCurrent((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      nextSlide();
    }, 6000);

    return () => clearInterval(interval);
  }, [isPaused, nextSlide]);

  return (
    <section
      className="relative w-full bg-white overflow-hidden select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      aria-label="IKEA Beranda Banner"
    >
      {/* Container Slides */}
      <div
        className="flex transition-transform duration-700 ease-out"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {/* ============================================================== */}
        {/* SLIDE 1: TAMPILAN GAMBAR 1 - Penawaran Terbatas + Grid 6 Produk */}
        {/* ============================================================== */}
        <div className="w-full shrink-0 min-h-[480px] lg:min-h-[540px] flex flex-col lg:flex-row bg-white relative">
          {/* Kolom Kiri: Foto Ruangan + Card Merah Promo Terbatas */}
          <div className="lg:w-1/2 relative min-h-[360px] lg:min-h-full bg-slate-100 overflow-hidden flex items-end">
            <img
              src="https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=80"
              alt="JÄTTESTA Living Room Furniture"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent lg:hidden" />

            {/* Badge Card Penawaran Terbatas Merah (Kiri Atas) */}
            <div className="absolute top-8 left-8 sm:left-12 z-10 bg-[#e00722] text-white px-4 py-2 rounded-xs shadow-md">
              <span className="block font-black text-xs sm:text-sm tracking-wide">Penawaran terbatas</span>
              <span className="block text-[11px] sm:text-xs font-semibold">15 Okt – 1 Nov 2026</span>
            </div>

            {/* Detail Produk Utama (JÄTTESTA Meja TV) */}
            <div className="relative z-10 p-8 sm:p-12 text-white">
              <h3 className="text-xl sm:text-2xl font-black tracking-tight drop-shadow-md">
                JÄTTESTA
              </h3>
              <p className="text-xs sm:text-sm text-slate-100 max-w-xs drop-shadow-sm leading-snug">
                Meja tv, putih/bambu warna muda, 160x40x49 cm
              </p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="line-through text-xs text-red-200">Rp2.999.000</span>
                <span className="text-2xl sm:text-3xl font-black text-[#e00722] bg-white/95 px-2 py-0.5 rounded-xs">
                  Rp1.999.000
                </span>
              </div>
              <div className="mt-4">
                <Link
                  href="/catalog?q=JATTESTA"
                  className="inline-block bg-black hover:bg-slate-800 text-white font-bold text-xs sm:text-sm px-6 py-2.5 rounded-full transition shadow-md"
                >
                  Belanja sekarang
                </Link>
              </div>
            </div>
          </div>

          {/* Kolom Kanan: Grid 6 Produk Diskon (Persis Gambar 1) */}
          <div className="lg:w-1/2 p-4 sm:p-8 lg:p-10 flex flex-col justify-center bg-white relative">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
              {DISCOUNT_PRODUCTS.map((item, idx) => (
                <Link
                  key={idx}
                  href={item.href}
                  className="group flex flex-col items-start text-left space-y-1 hover:opacity-90 transition"
                >
                  <div className="w-full aspect-square bg-[#fbfbfb] rounded-sm overflow-hidden flex items-center justify-center p-2 mb-1 border border-slate-100 group-hover:border-slate-300 transition">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition duration-300"
                    />
                  </div>
                  <h4 className="font-black text-xs sm:text-sm text-slate-900 group-hover:underline uppercase tracking-tight">
                    {item.name}
                  </h4>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 line-clamp-2 leading-tight">
                    {item.desc}
                  </p>
                  <div className="pt-1">
                    <span className="line-through text-[10px] text-red-500 font-medium block">
                      {item.originalPrice}
                    </span>
                    <span className="text-sm sm:text-base font-black text-[#e00722] tracking-tight">
                      {item.discountPrice}
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            {/* Copyright Watermark */}
            <span className="absolute right-2 bottom-8 text-[9px] text-slate-400 rotate-90 origin-bottom-right hidden lg:block">
              © NORDIC LIVING SBDT 2026
            </span>
          </div>
        </div>

        {/* ============================================================== */}
        {/* SLIDE 2: TAMPILAN GAMBAR 2 - Promo Nordic Family (Potongan 15% Seri BILLY) */}
        {/* ============================================================== */}
        <div className="w-full shrink-0 min-h-[480px] lg:min-h-[540px] relative flex items-center bg-stone-100">
          <img
            src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1920&q=80"
            alt="Nordic Family Billy Room"
            className="absolute inset-0 w-full h-full object-cover object-center"
          />

          <div className="max-w-7xl mx-auto w-full px-4 sm:px-8 lg:px-12 py-10 relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Kartu Promo Coklat Nordic (#995F2F) */}
            <div className="relative bg-[#995F2F] text-white p-6 sm:p-8 rounded-3xl max-w-sm w-full shadow-2xl border-r-8 border-stone-200">
              <div className="inline-block bg-white text-[#995F2F] font-bold text-[11px] px-3 py-1 rounded-sm shadow-xs uppercase tracking-wider mb-4">
                Penawaran Nordic Living <br />
                <span className="text-[9px] text-stone-600 font-semibold lowercase">15 Okt 2026 – 3 Jan 2027</span>
              </div>

              <h3 className="text-base sm:text-lg font-bold leading-tight">
                Potongan harga
              </h3>
              <div className="text-5xl sm:text-6xl font-black text-white leading-none my-1 tracking-tight">
                15<span className="text-3xl sm:text-4xl font-extrabold">%</span>
              </div>
              <p className="text-xs sm:text-sm text-stone-100 font-medium">
                untuk seri rak penyimpanan <strong className="text-white font-black">BILLY</strong>
              </p>

              <div className="mt-6">
                <Link
                  href="/catalog?q=BILLY"
                  className="inline-block bg-black hover:bg-stone-900 text-white font-bold text-xs sm:text-sm px-6 py-3 rounded-full transition shadow-md"
                >
                  Belanja sekarang
                </Link>
                <p className="text-[10px] text-stone-200 mt-2">*Ketersediaan stok realtime Citus</p>
              </div>
            </div>

            {/* Detail Seri BILLY di Samping Lemari */}
            <div className="bg-white/80 backdrop-blur-xs p-4 sm:p-6 rounded-2xl max-w-xs shadow-lg hidden md:block">
              <h4 className="text-xl font-black text-slate-900 tracking-tight">BILLY</h4>
              <p className="text-xs text-slate-600">Rak penyimpanan</p>
              <p className="text-xs text-slate-500 mt-2">Mulai dari:</p>
              <p className="text-xl font-black text-slate-900 leading-tight">Rp799.000</p>
            </div>
          </div>

          <span className="absolute right-2 bottom-8 text-[9px] text-slate-400 rotate-90 origin-bottom-right hidden lg:block">
            © NORDIC LIVING SBDT 2026
          </span>
        </div>

        {/* ============================================================== */}
        {/* SLIDE 3: TAMPILAN GAMBAR 3 - Lifestyle Banner "Family first" */}
        {/* ============================================================== */}
        <div className="w-full shrink-0 min-h-[480px] lg:min-h-[540px] relative flex items-center bg-stone-900">
          <img
            src="https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=1920&q=80"
            alt="Family first Nordic Family"
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-black/40" />

          <div className="max-w-7xl mx-auto w-full px-4 sm:px-8 lg:px-12 py-12 relative z-10">
            <div className="max-w-lg space-y-4 text-white">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight drop-shadow-md">
                Family first
              </h2>
              <p className="text-xl sm:text-2xl lg:text-3xl font-light text-slate-100 leading-snug drop-shadow-sm">
                Gabung <strong className="font-black text-white">Nordic Family</strong> dan dapatkan kejutan spesial.
              </p>
              <div className="pt-4">
                <Link
                  href="/catalog?promo=nordic-family"
                  className="inline-block bg-white hover:bg-slate-100 text-slate-950 font-bold text-xs sm:text-sm px-6 py-3 rounded-full transition shadow-lg"
                >
                  Lihat selengkapnya
                </Link>
              </div>
            </div>
          </div>

          <span className="absolute right-2 bottom-8 text-[9px] text-slate-300 rotate-90 origin-bottom-right hidden lg:block">
            © NORDIC LIVING SBDT 2026
          </span>
        </div>
      </div>

      {/* ============================================================== */}
      {/* TOMBOL NAVIGASI BULAT HITAM (Persis seperti di gambar kiri & kanan) */}
      {/* ============================================================== */}
      <button
        type="button"
        onClick={prevSlide}
        aria-label="Slide sebelumnya"
        className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center transition shadow-lg active:scale-95"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <button
        type="button"
        onClick={nextSlide}
        aria-label="Slide berikutnya"
        className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center transition shadow-lg active:scale-95"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* ============================================================== */}
      {/* INDIKATOR TITIK (Dots Pagination di Tengah Bawah) */}
      {/* ============================================================== */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
        {Array.from({ length: totalSlides }).map((_, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setCurrent(idx)}
            aria-label={`Ke slide ${idx + 1}`}
            className={`transition-all duration-300 rounded-full ${
              current === idx
                ? 'w-6 h-2 bg-slate-900 rounded-full'
                : 'w-2 h-2 bg-slate-400 hover:bg-slate-600 rounded-full'
            }`}
          />
        ))}
      </div>
    </section>
  );
}
