'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Zap, ArrowRight, BatteryCharging, Gauge, Clock, ShieldCheck,
  ChevronLeft, ChevronRight, Calendar, Sparkles, Bike, Cpu
} from 'lucide-react';
import { SmartProductImage } from '@/components/storefront/SmartProductImage';
import { TestRideModal } from './TestRideModal';
import { cn } from '@/lib/utils';

export function EvBikesHero({ preset, accent = '#10b981', storeName = 'Tenvo EV', businessDomain = '' }) {
  const slides = preset?.slides || [
    {
      title: 'Vlektra Retro EV Motorcycle',
      subtitle: 'Café Racer Style · 72V Lithium-Ion · 100 km Range · 90 km/h Top Speed',
      image: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=1600&q=82&auto=format&fit=crop',
      badge: 'Vlektra Café Racer',
    },
    {
      title: 'Metro Metrix NCF Smart Scooter',
      subtitle: 'Bosch Motor · Keyless Start · Reverse Gear · 105 km Range',
      image: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=1600&q=82&auto=format&fit=crop',
      badge: 'Metro Smart EV',
    },
    {
      title: 'Ramza Liberty Ultra E-Bike',
      subtitle: 'Azure Controller · Golden Labeled Battery · 95 km Range · Zero Emissions',
      image: 'https://images.unsplash.com/photo-1571188654248-7a89213915f7?w=1600&q=82&auto=format&fit=crop',
      badge: 'Ramza Aima EV',
    },
  ];

  const [index, setIndex] = useState(0);
  const [isTestRideOpen, setIsTestRideOpen] = useState(false);
  const count = slides.length || 1;

  const next = useCallback(() => setIndex((i) => (i + 1) % count), [count]);
  const prev = useCallback(() => setIndex((i) => (i - 1 + count) % count), [count]);

  useEffect(() => {
    if (count <= 1) return undefined;
    const id = setInterval(next, 7000);
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
    <section className="relative overflow-hidden bg-neutral-950 text-white min-h-[640px] lg:min-h-[720px] flex flex-col justify-between border-b border-emerald-900/30">
      {/* Background Slides with Ken Burns transition & Cyber-Green gradient overlays */}
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
            {/* Multi-layered Gradients for Deep Contrast & Cyber Glow */}
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/70 to-neutral-950/40" />
            <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-950/80 to-transparent" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(16,185,129,0.15),transparent_60%)]" />
          </div>
        ))}
      </div>

      {/* Cyber Grid Texture */}
      <div className="pointer-events-none absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#10b981_1px,transparent_1px),linear-gradient(to_bottom,#10b981_1px,transparent_1px)] bg-[size:4rem_4rem]" aria-hidden />

      {/* Top Banner Accent */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-500/20 bg-neutral-900/80 p-3.5 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
              <Zap className="h-4 w-4 fill-emerald-400 animate-pulse" />
            </span>
            <div>
              <p className="text-xs font-bold text-white tracking-wide uppercase">
                Tenvo Electric Mobility Suite
              </p>
              <p className="text-[11px] text-emerald-400 font-medium">
                Official Vlektra, Metro EV & Ramza Aima Partner
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-xs text-neutral-300 font-medium">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              3-Year Lithium Warranty
            </span>
            <span className="flex items-center gap-1.5">
              <Gauge className="h-3.5 w-3.5 text-emerald-400" />
              PKR 0.8 / km Fuel Cost
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-emerald-400" />
              3-4h Fast Charge
            </span>
          </div>
        </div>
      </div>

      {/* Main Hero Showcase Content */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="max-w-2xl space-y-6">
          {/* Active Slide Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-bold tracking-wider text-emerald-400 uppercase backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5" />
            {activeSlide.badge || '⚡ Zero Emissions · Instant Torque'}
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-white leading-tight">
            {activeSlide.title}
          </h1>

          <p className="text-base sm:text-lg text-neutral-300 max-w-xl leading-relaxed">
            {activeSlide.subtitle}
          </p>

          {/* Floating Spec Badges Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 max-w-xl">
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/90 p-2.5 backdrop-blur-md">
              <p className="text-[10px] uppercase font-bold text-neutral-400">Max Range</p>
              <p className="text-sm font-bold text-emerald-400 flex items-center gap-1">
                <Gauge className="h-3.5 w-3.5" /> 100 - 120 km
              </p>
            </div>
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/90 p-2.5 backdrop-blur-md">
              <p className="text-[10px] uppercase font-bold text-neutral-400">Top Speed</p>
              <p className="text-sm font-bold text-emerald-400 flex items-center gap-1">
                <Zap className="h-3.5 w-3.5" /> 90 - 110 km/h
              </p>
            </div>
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/90 p-2.5 backdrop-blur-md">
              <p className="text-[10px] uppercase font-bold text-neutral-400">Battery Type</p>
              <p className="text-sm font-bold text-emerald-400 flex items-center gap-1">
                <BatteryCharging className="h-3.5 w-3.5" /> 72V Lithium
              </p>
            </div>
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/90 p-2.5 backdrop-blur-md">
              <p className="text-[10px] uppercase font-bold text-neutral-400">Fast Charge</p>
              <p className="text-sm font-bold text-emerald-400 flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> 3-4 Hours
              </p>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-4 pt-4">
            <button
              type="button"
              onClick={() => setIsTestRideOpen(true)}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-4 text-sm font-bold text-neutral-950 shadow-xl shadow-emerald-500/25 hover:from-emerald-400 hover:to-teal-400 transition transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <Calendar className="h-4 w-4" />
              Book Free Test Ride
              <ArrowRight className="h-4 w-4" />
            </button>

            <Link
              href={`${baseHref}/products`}
              className="inline-flex items-center gap-2 rounded-2xl border border-neutral-700 bg-neutral-900/90 px-6 py-4 text-sm font-bold text-white backdrop-blur-md hover:border-emerald-500 hover:bg-neutral-800 transition"
            >
              <Bike className="h-4 w-4 text-emerald-400" />
              Browse EV Lineup
            </Link>
          </div>
        </div>
      </div>

      {/* Carousel Controls & Category Shortcuts Strip */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-6 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-t border-neutral-800/80 pt-4">
          {/* Slide Navigation Dots & Arrows */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={prev}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-800 bg-neutral-900/90 text-neutral-300 hover:border-emerald-500 hover:text-white transition"
              aria-label="Previous slide"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-1.5">
              {slides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIndex(i)}
                  className={cn(
                    'h-2 rounded-full transition-all duration-300',
                    i === index ? 'w-8 bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'w-2 bg-neutral-700 hover:bg-neutral-500'
                  )}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={next}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-800 bg-neutral-900/90 text-neutral-300 hover:border-emerald-500 hover:text-white transition"
              aria-label="Next slide"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Quick Category Shortcuts */}
          <div className="flex flex-wrap items-center gap-2 overflow-x-auto max-w-full pb-1">
            {shortcuts.map((sc) => {
              const IconComp = sc.icon || Zap;
              return (
                <Link
                  key={sc.id}
                  href={`${baseHref}/products?category=${sc.slug}`}
                  className="group flex items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900/80 px-3.5 py-2 text-xs font-semibold text-neutral-200 backdrop-blur-md hover:border-emerald-500 hover:bg-neutral-800 hover:text-emerald-400 transition"
                >
                  <IconComp className="h-3.5 w-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
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
