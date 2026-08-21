'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Zap, ArrowRight, BatteryCharging, Gauge, Clock, ShieldCheck,
  ChevronLeft, ChevronRight, Calendar, Sparkles, Bike
} from 'lucide-react';
import { SmartProductImage } from '@/components/storefront/SmartProductImage';
import { TestRideModal } from './TestRideModal';
import { cn } from '@/lib/utils';

export function EvBikesHero({ preset, accent = '#dc2626', storeName = 'Tenvo EV', businessDomain = '' }) {
  const slides = preset?.slides || [
    {
      title: 'TENVO T9 SPORT LITHIUM',
      subtitle: 'LiFePO4 Lithium Battery · 2000+ Charge Cycles · 120 km Range · 55 km/h Top Speed',
      image: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=1600&q=80&auto=format&fit=crop',
      badge: '🔥 TENVO EV Top-Seller',
    },
    {
      title: 'TENVO MIKU SUPER DUAL LITHIUM',
      subtitle: 'Floating Frame Double Lithium Motorcycle · 3000W Electric Motor · 100 km/h Speed',
      image: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=1600&q=80&auto=format&fit=crop',
      badge: '⚡ 3000W Flagship Motorcycle',
    },
    {
      title: 'TENVO A12 LFP SMART SCOOTER',
      subtitle: 'Lithium Iron Phosphate · 73.6V 30Ah · 100 km Range · 45 km/h Speed',
      image: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=1600&q=80&auto=format&fit=crop',
      badge: '👑 TENVO A-Series',
    },
    {
      title: 'TENVO THRILL PRO LITHIUM',
      subtitle: '2200W Peak Hill Climb Torque · 6PR Tubeless Tyres · 125 km Max Range',
      image: 'https://images.unsplash.com/photo-1558980664-769d59546b3d?w=1600&q=80&auto=format&fit=crop',
      badge: '🏆 TENVO Thrill Series',
    },
  ];

  const [index, setIndex] = useState(0);
  const [isTestRideOpen, setIsTestRideOpen] = useState(false);
  const count = slides.length || 1;

  const next = useCallback(() => setIndex((i) => (i + 1) % count), [count]);
  const prev = useCallback(() => setIndex((i) => (i - 1 + count) % count), [count]);

  useEffect(() => {
    if (count <= 1) return undefined;
    const id = setInterval(next, 5000);
    return () => clearInterval(id);
  }, [count, next]);

  const activeSlide = slides[index] || slides[0];
  const baseHref = `/store/${businessDomain}`;

  const shortcuts = preset?.shortcuts || [
    { id: 'motorcycles', label: 'EV Motorcycles', slug: 'electric-motorcycles', icon: Zap },
    { id: 'scooters', label: 'Smart Scooters', slug: 'urban-ev-scooters', icon: Bike },
    { id: 'pave', label: 'PAVE Scheme', slug: 'pave', icon: Sparkles },
    { id: 'commuters', label: 'Long-Range', slug: 'long-range-commuters', icon: Gauge },
    { id: 'chargers', label: 'Batteries & Chargers', slug: 'batteries-chargers', icon: BatteryCharging },
  ];

  return (
    <section className="relative w-full overflow-hidden bg-slate-900 text-white min-h-[580px] sm:min-h-[660px] lg:min-h-[720px] flex flex-col justify-between border-b border-slate-800 shadow-md">
      {/* Background Slides with clear vehicle imagery & dark gradient side vignette */}
      <div className="absolute inset-0 z-0">
        {slides.map((s, i) => (
          <div
            key={`${s.image}-${i}`}
            className={cn(
              'absolute inset-0 transition-opacity duration-1000 ease-in-out',
              i === index ? 'opacity-100 z-0' : 'opacity-0 z-0'
            )}
          >
            <SmartProductImage
              src={s.image}
              alt={s.title || 'EV Bike'}
              fill
              className="object-cover object-center scale-105 transition-transform duration-10000"
              priority={i === 0}
            />
            {/* Dark vignette overlays ensuring high text contrast on left while keeping right/center vehicle visible */}
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/70 to-slate-950/20 sm:from-slate-950/90 sm:via-slate-950/50 sm:to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-transparent to-slate-950/50" />
          </div>
        ))}
      </div>

      {/* Top Banner Accent Bar */}
      <div className="relative z-10 w-full px-4 pt-4 sm:pt-6 sm:px-6 lg:px-12">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/90 p-3 sm:p-3.5 shadow-md backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-xl bg-red-600/20 text-red-500 border border-red-500/30">
              <Zap className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-red-500" />
            </span>
            <div>
              <p className="text-[11px] sm:text-xs font-extrabold text-white tracking-wider uppercase">
                Tenvo Electric Mobility Suite
              </p>
              <p className="text-[10px] sm:text-[11px] text-slate-300 font-semibold">
                Official TENVO EV Flagship Storefront
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-5 text-xs text-slate-300 font-semibold">
            <span className="flex items-center gap-1.5 text-white">
              <ShieldCheck className="h-4 w-4 text-red-500" />
              3-Year Lithium Warranty
            </span>
            <span className="flex items-center gap-1.5 text-white">
              <Gauge className="h-4 w-4 text-red-500" />
              PKR 0.8 / km Fuel Cost
            </span>
            <span className="flex items-center gap-1.5 text-white">
              <Clock className="h-4 w-4 text-red-500" />
              3-4h Fast Charge
            </span>
          </div>
        </div>
      </div>

      {/* Main Hero Showcase Content */}
      <div className="relative z-10 w-full px-4 py-6 sm:py-10 sm:px-6 lg:px-12">
        <div className="max-w-3xl space-y-4 sm:space-y-6">
          {/* Active Slide Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-red-500/40 bg-red-600/90 px-3.5 py-1 sm:px-4 sm:py-1.5 text-[11px] sm:text-xs font-bold tracking-widest text-white uppercase backdrop-blur-md shadow-md">
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            {activeSlide.badge || '⚡ Zero Emissions · Instant Torque'}
          </div>

          {/* Reserved height title block to prevent slide height jumps */}
          <div className="min-h-[100px] sm:min-h-[140px] lg:min-h-[160px] flex flex-col justify-center space-y-1.5 sm:space-y-2">
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight drop-shadow-md">
              {activeSlide.title}
            </h1>

            <p className="text-xs sm:text-base text-slate-200 max-w-2xl leading-relaxed font-medium line-clamp-2 drop-shadow">
              {activeSlide.subtitle}
            </p>
          </div>

          {/* Floating Spec Badges Grid (Responsive 2x2 on mobile, 4x1 on desktop) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 pt-1 max-w-2xl">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-2.5 sm:p-3 shadow-md backdrop-blur-md">
              <p className="text-[10px] uppercase font-bold text-slate-400">Max Range</p>
              <p className="text-xs sm:text-sm font-extrabold text-white flex items-center gap-1 mt-0.5">
                <Gauge className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-500" /> 100 - 125 km
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-2.5 sm:p-3 shadow-md backdrop-blur-md">
              <p className="text-[10px] uppercase font-bold text-slate-400">Top Speed</p>
              <p className="text-xs sm:text-sm font-extrabold text-white flex items-center gap-1 mt-0.5">
                <Zap className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-500" /> 55 - 100 km/h
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-2.5 sm:p-3 shadow-md backdrop-blur-md">
              <p className="text-[10px] uppercase font-bold text-slate-400">Battery Type</p>
              <p className="text-xs sm:text-sm font-extrabold text-white flex items-center gap-1 mt-0.5">
                <BatteryCharging className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-500" /> 72V LiFePO4
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-2.5 sm:p-3 shadow-md backdrop-blur-md">
              <p className="text-[10px] uppercase font-bold text-slate-400">Fast Charge</p>
              <p className="text-xs sm:text-sm font-extrabold text-white flex items-center gap-1 mt-0.5">
                <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-500" /> 3-4 Hours
              </p>
            </div>
          </div>

          {/* Action CTAs (Full Width Stack on Mobile, Inline on Desktop) */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsTestRideOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-6 py-3.5 text-xs sm:text-sm font-bold text-white shadow-lg hover:bg-red-700 transition transform active:scale-95"
            >
              <Calendar className="h-4 w-4 text-white" />
              Book Free Test Ride
              <ArrowRight className="h-4 w-4" />
            </button>

            <Link
              href={`${baseHref}/products`}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3.5 text-xs sm:text-sm font-bold text-slate-900 shadow-sm hover:bg-slate-100 transition active:scale-95"
            >
              <Bike className="h-4 w-4 text-slate-900" />
              Browse EV Lineup
            </Link>
          </div>
        </div>
      </div>

      {/* Carousel Controls & Category Shortcuts Strip */}
      <div className="relative z-10 w-full px-4 pb-4 sm:pb-6 sm:px-6 lg:px-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4 border-t border-slate-800 pt-3 sm:pt-4">
          {/* Slide Navigation Dots & Arrows */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={prev}
                className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/90 text-slate-300 hover:border-slate-700 hover:text-white transition"
                aria-label="Previous slide"
              >
                <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
              <button
                type="button"
                onClick={next}
                className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/90 text-slate-300 hover:border-slate-700 hover:text-white transition"
                aria-label="Next slide"
              >
                <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              {slides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIndex(i)}
                  className={cn(
                    'h-2 rounded-full transition-all duration-300',
                    i === index ? 'w-7 bg-red-600' : 'w-2 bg-slate-700 hover:bg-slate-500'
                  )}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Quick Category Shortcuts (Touch-Friendly Horizontal Scroll) */}
          <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-1 no-scrollbar w-full md:w-auto">
            {shortcuts.map((sc) => {
              const IconComp = sc.icon || Zap;
              return (
                <Link
                  key={sc.id}
                  href={`${baseHref}/products?category=${sc.slug}`}
                  className="group flex shrink-0 items-center gap-1.5 rounded-2xl border border-slate-800 bg-slate-900/90 px-3.5 py-2 text-xs font-bold text-slate-200 backdrop-blur-md hover:border-slate-700 hover:bg-slate-800 hover:text-white transition"
                >
                  <IconComp className="h-3.5 w-3.5 text-red-500 group-hover:scale-110 transition-transform" />
                  <span>{sc.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Test Ride Modal */}
      <TestRideModal
        isOpen={isTestRideOpen}
        onClose={() => setIsTestRideOpen(false)}
        storeName={storeName}
        accent={accent}
      />
    </section>
  );
}

