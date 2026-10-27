'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const PROMO_SLIDES = [
  {
    id: 1,
    tag: 'Family first',
    title: 'Gabung Nordic Family dan dapatkan kejutan spesial.',
    description: 'Nikmati penawaran eksklusif anggota, diskon khusus furnitur ruang keluarga, serta gratis kopi setiap kunjungan.',
    buttonText: 'Lihat selengkapnya',
    buttonLink: '/catalog?promo=nordic-family',
    imageUrl: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=1920&q=80',
    overlayColor: 'from-black/85 via-black/50 to-transparent',
    textColor: 'text-white',
    badgeBg: 'bg-white/20 text-white',
    buttonStyle: 'bg-white text-slate-900 hover:bg-slate-100',
    copyright: '© Nordic Living Citus 2026',
  },
  {
    id: 2,
    tag: 'Promo Terbatas',
    title: 'Pesta Ruang Tamu Skandinavia: Diskon hingga 35%',
    description: 'Transformasi ruang keluarga dengan sofa modular, meja kopi minimalis, dan rak display kayu oak alami.',
    buttonText: 'Jelajahi Promo',
    buttonLink: '/catalog?category=ruang-tamu',
    imageUrl: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1920&q=80',
    overlayColor: 'from-slate-950/85 via-slate-900/50 to-transparent',
    textColor: 'text-white',
    badgeBg: 'bg-[#ffdb00] text-slate-950 font-bold',
    buttonStyle: 'bg-[#ffdb00] text-slate-950 hover:bg-[#e5c500] font-bold',
    copyright: '© Nordic Living Citus 2026',
  },
  {
    id: 3,
    tag: 'Inspirasi Kamar Tidur',
    title: 'Tidur Lebih Nyenyak dengan Kasur & Rangka Minimalis',
    description: 'Desain ergonomis dipadukan dengan material ramah lingkungan untuk kenyamanan istirahat maksimal keluarga Anda.',
    buttonText: 'Beli Sekarang',
    buttonLink: '/catalog?category=kamar-tidur',
    imageUrl: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1920&q=80',
    overlayColor: 'from-black/80 via-black/45 to-transparent',
    textColor: 'text-white',
    badgeBg: 'bg-blue-600/80 text-white',
    buttonStyle: 'bg-white text-slate-900 hover:bg-slate-100 font-semibold',
    copyright: '© Nordic Living Citus 2026',
  },
  {
    id: 4,
    tag: 'Ruang Kerja Produktif',
    title: 'Meja Kerja Ergonomis & Kursi Fleksibel Modern',
    description: 'Ciptakan sudut kerja yang tenang dan tertata rapi di rumah dengan sistem manajemen kabel tersembunyi.',
    buttonText: 'Lihat Koleksi Kerja',
    buttonLink: '/catalog?category=ruang-kerja',
    imageUrl: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=1920&q=80',
    overlayColor: 'from-stone-950/85 via-stone-900/40 to-transparent',
    textColor: 'text-white',
    badgeBg: 'bg-amber-400 text-slate-950 font-bold',
    buttonStyle: 'bg-white text-slate-900 hover:bg-slate-100 font-semibold',
    copyright: '© Nordic Living Citus 2026',
  },
];

export default function PromoCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const totalSlides = PROMO_SLIDES.length;

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      nextSlide();
    }, 5000);

    return () => clearInterval(interval);
  }, [isPaused, nextSlide]);

  return (
    <section
      className="relative w-full overflow-hidden bg-slate-950 group select-none shadow-lg"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      aria-label="Iklan Promo dan Inspirasi"
    >
      {/* Container Slides */}
      <div
        className="flex transition-transform duration-700 ease-out h-[360px] sm:h-[420px] md:h-[480px] lg:h-[520px]"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {PROMO_SLIDES.map((slide, index) => (
          <div
            key={slide.id}
            className="relative w-full h-full shrink-0 flex items-center overflow-hidden"
          >
            {/* Background Image */}
            <img
              src={slide.imageUrl}
              alt={slide.title}
              className="absolute inset-0 w-full h-full object-cover object-center"
              loading={index === 0 ? 'eager' : 'lazy'}
            />

            {/* Gradient Overlay for IKEA style dark fade on text side */}
            <div
              className={`absolute inset-0 bg-gradient-to-r ${slide.overlayColor}`}
            />
            {/* Extra subtle bottom vignette */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

            {/* Slide Content Box */}
            <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 w-full">
              <div className="max-w-xl space-y-4">
                {/* Tag / Category Badge */}
                {slide.tag && (
                  <span
                    className={`inline-block text-xs uppercase tracking-wider px-3 py-1 rounded-full backdrop-blur-xs ${slide.badgeBg}`}
                  >
                    {slide.tag}
                  </span>
                )}

                {/* Main Headline */}
                <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white leading-tight sm:leading-snug tracking-tight drop-shadow-sm">
                  {slide.title}
                </h2>

                {/* Subtitle / Description */}
                <p className="text-slate-200 text-xs sm:text-base leading-relaxed line-clamp-3 max-w-lg drop-shadow-xs">
                  {slide.description}
                </p>

                {/* Action CTA Button */}
                <div className="pt-2">
                  <Link
                    href={slide.buttonLink}
                    className={`inline-flex items-center justify-center text-xs sm:text-sm px-6 sm:px-7 py-3 rounded-full transition-all duration-200 shadow-md transform hover:scale-105 ${slide.buttonStyle}`}
                  >
                    {slide.buttonText}
                  </Link>
                </div>
              </div>
            </div>

            {/* Copyright watermark IKEA-style on top-right */}
            <div className="absolute top-4 right-4 sm:top-6 sm:right-8 z-10 hidden sm:block">
              <span className="text-[10px] tracking-wider text-white/50 rotate-90 origin-right inline-block uppercase">
                {slide.copyright}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Prev Navigation Button */}
      <button
        type="button"
        onClick={prevSlide}
        aria-label="Slide sebelumnya"
        className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-black/40 hover:bg-black/75 text-white flex items-center justify-center backdrop-blur-xs transition shadow-md border border-white/20 opacity-80 hover:opacity-100 group-hover:scale-105 active:scale-95"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      {/* Next Navigation Button */}
      <button
        type="button"
        onClick={nextSlide}
        aria-label="Slide berikutnya"
        className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-black/40 hover:bg-black/75 text-white flex items-center justify-center backdrop-blur-xs transition shadow-md border border-white/20 opacity-80 hover:opacity-100 group-hover:scale-105 active:scale-95"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Carousel Pagination Dots */}
      <div className="absolute bottom-4 sm:bottom-6 left-0 right-0 z-20 flex justify-center items-center gap-2">
        {PROMO_SLIDES.map((_, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setCurrentSlide(idx)}
            aria-label={`Buka slide nomor ${idx + 1}`}
            className={`transition-all duration-300 rounded-full ${
              currentSlide === idx
                ? 'w-7 sm:w-8 h-2.5 bg-white shadow-sm'
                : 'w-2.5 h-2.5 bg-white/40 hover:bg-white/70'
            }`}
          />
        ))}
      </div>
    </section>
  );
}
