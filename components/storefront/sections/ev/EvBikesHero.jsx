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

export function EvBikesHero({ preset, accent = '#991b1b', storeName = 'Tenvo EV', businessDomain = '' }) {
  const slides = preset?.slides || [
    {
      title: 'METRO T9 SPORT LITHIUM',
      subtitle: 'LiFePO4 Lithium Battery · 2000+ Charge Cycles · 120 km Range · 55 km/h Top Speed',
      image: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=1600&q=80&auto=format&fit=crop',
      badge: '🔥 Metro EV Top-Seller',
    },
    {
      title: 'METRO MIKU SUPER DUAL LITHIUM',
      subtitle: 'Floating Frame Double Lithium Motorcycle · 3000W Bosch Motor · 100 km/h Speed',
      image: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=1600&q=80&auto=format&fit=crop',
      badge: '⚡ 3000W Flagship Motorcycle',
    },
    {
      title: 'REVOO A12 LFP SMART SCOOTER',
      subtitle: 'Lithium Iron Phosphate · 73.6V 30Ah · 100 km Range · 45 km/h Speed',
      image: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=1600&q=80&auto=format&fit=crop',
      badge: '👑 REVOO A-Series',
    },
    {
      title: 'METRO THRILL PRO LITHIUM',
      subtitle: '2200W Peak Hill Climb Torque · 6PR Tubeless Tyres · 125 km Max Range',
      image: 'https://images.unsplash.com/photo-1558980664-769d59546b3d?w=1600&q=80&auto=format&fit=crop',
      badge: '🏆 Metro Thrill Series',
    },
  ];

  const [index, setIndex] = useState(0);
  const [isTestRideOpen, setIsTestRideOpen] = useState(false);
  const count = slides.length || 1;

  const next = useCallback(() => setIndex((i) => (i + 1) % count), [count]);
  const prev = useCallback(() => setIndex((i) => (i - 1 + count) % count), [count]);

  useEffect(() => {
    if (count <= 1) return undefined;
    const id = setInterval(next, 4000);
    return () => clearInterval(id);
  }, [count, next]);

  const activeSlide = slides[index] || slides[0];
  const baseHref = `/store/${businessDomain}`;

  const shortcuts = preset?.shortcuts || [
    { id: 'motorcycles', label: 'EV Motorcycles', slug: 'electric-motorcycles', icon: Zap },
    { id: 'scooters', label: 'Smart Scooters', slug: 'urban-ev-scooters', icon: Bike },
    { id: 'commuters', label: 'Long-Range', slug: 'long-range-commuters', icon: Gauge },
    { id: 'chargers', label: 'Batteries & Chargers', slug: 'batteries-chargers', icon: BatteryCharging },
  ];

  return (
    <section className="relative w-full overflow-hidden bg-slate-50 text-slate-900 h-[min(100svh,840px)] min-h-[640px] sm:min-h-[700px] lg:min-h-[760px] flex flex-col justify-between border-b border-slate-200">
      {/* Background Slides with smooth transition & clean light overlays */}
      <div className="absolute inset-0">
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
            {/* Clean light overlay for high readability */}
            <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px]" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-50 via-slate-50/90 to-transparent" />
          </div>
        ))}
      </div>

      {/* Top Banner Accent */}
      <div className="relative z-10 w-full px-4 pt-6 sm:px-6 lg:px-12">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/90 p-3.5 shadow-sm backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-50 text-red-600 border border-red-200">
              <Zap className="h-4 w-4 fill-red-600" />
            </span>
            <div>
              <p className="text-xs font-extrabold text-slate-900 tracking-wider uppercase">
                Tenvo Electric Mobility Suite
              </p>
              <p className="text-[11px] text-slate-500 font-semibold">
                Official Metro EV, Vlektra & REVOO Partner
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-5 text-xs text-slate-600 font-semibold">
            <span className="flex items-center gap-1.5 text-slate-900">
              <ShieldCheck className="h-4 w-4 text-red-600" />
              3-Year Lithium Warranty
            </span>
            <span className="flex items-center gap-1.5 text-slate-900">
              <Gauge className="h-4 w-4 text-red-600" />
              PKR 0.8 / km Fuel Cost
            </span>
            <span className="flex items-center gap-1.5 text-slate-900">
              <Clock className="h-4 w-4 text-red-600" />
              3-4h Fast Charge
            </span>
          </div>
        </div>
      </div>

      {/* Main Hero Showcase Content */}
      <div className="relative z-10 w-full px-4 py-8 sm:py-12 sm:px-6 lg:px-12">
        <div className="max-w-3xl space-y-5">
          {/* Active Slide Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 py-1.5 text-xs font-bold tracking-widest text-red-700 uppercase backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-red-600" />
            {activeSlide.badge || '⚡ Zero Emissions · Instant Torque'}
          </div>

          {/* Reserved height title block to prevent slide height shifts */}
          <div className="min-h-[130px] sm:min-h-[160px] lg:min-h-[180px] flex flex-col justify-center space-y-2">
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-slate-900 leading-tight">
              {activeSlide.title}
            </h1>

            <p className="text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed font-medium line-clamp-2">
              {activeSlide.subtitle}
            </p>
          </div>

          {/* Floating Spec Badges Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 max-w-2xl">
            <div className="rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-sm backdrop-blur-md">
              <p className="text-[10px] uppercase font-bold text-slate-500">Max Range</p>
              <p className="text-sm font-extrabold text-slate-900 flex items-center gap-1 mt-0.5">
                <Gauge className="h-4 w-4 text-red-600" /> 100 - 125 km
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-sm backdrop-blur-md">
              <p className="text-[10px] uppercase font-bold text-slate-500">Top Speed</p>
              <p className="text-sm font-extrabold text-slate-900 flex items-center gap-1 mt-0.5">
                <Zap className="h-4 w-4 text-red-600" /> 55 - 100 km/h
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-sm backdrop-blur-md">
              <p className="text-[10px] uppercase font-bold text-slate-500">Battery Type</p>
              <p className="text-sm font-extrabold text-slate-900 flex items-center gap-1 mt-0.5">
                <BatteryCharging className="h-4 w-4 text-red-600" /> 72V LiFePO4
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-sm backdrop-blur-md">
              <p className="text-[10px] uppercase font-bold text-slate-500">Fast Charge</p>
              <p className="text-sm font-extrabold text-slate-900 flex items-center gap-1 mt-0.5">
                <Clock className="h-4 w-4 text-red-600" /> 3-4 Hours
              </p>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-4 pt-4">
            <button
              type="button"
              onClick={() => setIsTestRideOpen(true)}
              className="inline-flex items-center gap-2 rounded-2xl bg-red-600 px-7 py-4 text-sm font-bold text-white shadow-lg hover:bg-red-700 transition transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <Calendar className="h-4 w-4 text-white" />
              Book Free Test Ride
              <ArrowRight className="h-4 w-4" />
            </button>

            <Link
              href={`${baseHref}/products`}
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-7 py-4 text-sm font-bold text-white shadow-sm hover:bg-slate-800 transition"
            >
              <Bike className="h-4 w-4 text-white" />
              Browse EV Lineup
            </Link>
          </div>
        </div>
      </div>

      {/* Carousel Controls & Category Shortcuts Strip */}
      <div className="relative z-10 w-full px-4 pb-6 sm:px-6 lg:px-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-t border-slate-200 pt-4">
          {/* Slide Navigation Dots & Arrows */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={prev}
              className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-100 hover:text-slate-900 transition"
              aria-label="Previous slide"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              {slides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIndex(i)}
                  className={cn(
                    'h-2.5 rounded-full transition-all duration-300',
                    i === index ? 'w-8 bg-red-600' : 'w-2.5 bg-slate-300 hover:bg-slate-400'
                  )}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={next}
              className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-100 hover:text-slate-900 transition"
              aria-label="Next slide"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          {/* Quick Category Shortcuts */}
          <div className="flex flex-wrap items-center gap-2.5 overflow-x-auto max-w-full pb-1">
            {shortcuts.map((sc) => {
              const IconComp = sc.icon || Zap;
              return (
                <Link
                  key={sc.id}
                  href={`${baseHref}/products?category=${sc.slug}`}
                  className="group flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/90 px-4 py-2.5 text-xs font-bold text-slate-800 shadow-sm backdrop-blur-md hover:border-slate-300 hover:bg-white hover:text-slate-900 transition"
                >
                  <IconComp className="h-4 w-4 text-red-600 group-hover:scale-110 transition-transform" />
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
