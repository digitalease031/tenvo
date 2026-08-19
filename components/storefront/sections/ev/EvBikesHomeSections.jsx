'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Zap, BatteryCharging, Gauge, ShieldCheck, ArrowRight,
  TrendingDown, CheckCircle2, MapPin, Phone, Sparkles, RefreshCw
} from 'lucide-react';
import { ProductGrid } from '@/components/storefront/ProductGrid';
import { formatCurrency } from '@/lib/currency';
import { TestRideModal } from './TestRideModal';

export function EvBikesHomeSections({
  products = [],
  businessDomain = '',
  currency = 'PKR',
  storeName = 'Tenvo EV',
}) {
  const [dailyKm, setDailyKm] = useState(30);
  const [isTestRideOpen, setIsTestRideOpen] = useState(false);
  const [activeBrandFilter, setActiveBrandFilter] = useState('all');

  // Calculate annual savings
  const petrolPrice = 280; // PKR per liter
  const petrolBikeAvgKm = 40; // km per liter
  const dailyPetrolCost = (dailyKm / petrolBikeAvgKm) * petrolPrice;
  const monthlyPetrolCost = dailyPetrolCost * 30;

  const evCostPerKm = 0.8; // PKR per km
  const dailyEvCost = dailyKm * evCostPerKm;
  const monthlyEvCost = dailyEvCost * 30;

  const monthlySavings = Math.round(monthlyPetrolCost - monthlyEvCost);
  const annualSavings = monthlySavings * 12;

  // Filter products by brand tab if selected
  const filteredProducts = activeBrandFilter === 'all'
    ? products
    : products.filter((p) => {
        const brand = String(p.brand || p.domain_data?.brand || '').toLowerCase();
        return brand.includes(activeBrandFilter);
      });

  return (
    <div className="space-y-16 py-8">
      {/* Brand Selection Filter Tabs */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
          <div>
            <h3 className="text-base font-bold text-neutral-900 flex items-center gap-2">
              <Zap className="h-4 w-4 text-emerald-600 fill-emerald-600" />
              Explore Showroom Brands
            </h3>
            <p className="text-xs text-neutral-500">Filter electric bikes and scooters by authorized brand</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'all', label: 'All EV Models' },
              { id: 'vlektra', label: 'Vlektra EV' },
              { id: 'metro', label: 'Metro EV' },
              { id: 'ramza', label: 'Ramza Aima' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveBrandFilter(tab.id)}
                className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                  activeBrandFilter === tab.id
                    ? 'bg-neutral-900 text-white shadow'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* EV Lineup Catalog Grid */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-neutral-200 pb-4">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
              <Sparkles className="h-3.5 w-3.5" />
              Authorized EV Showroom Lineup
            </span>
            <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900">
              Electric Bikes & Smart Scooters
            </h2>
            <p className="mt-1 text-sm text-neutral-500">
              High-performance electric motorcycles with lithium battery warranty and instant torque.
            </p>
          </div>
          <Link
            href={`/store/${businessDomain}/products`}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 transition"
          >
            View All Catalog Products <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <ProductGrid
          products={filteredProducts}
          businessDomain={businessDomain}
          variant="default"
        />
      </section>

      {/* Fuel Savings Calculator Card */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-emerald-500/30 bg-neutral-950 p-6 sm:p-10 text-white shadow-2xl">
          <div className="pointer-events-none absolute right-0 top-0 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            <div className="lg:col-span-6 space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3.5 py-1 text-xs font-bold text-emerald-400 border border-emerald-500/20">
                <TrendingDown className="h-3.5 w-3.5" />
                Live Fuel Cost Calculator
              </div>
              <h3 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                Calculate How Much You Save with EV
              </h3>
              <p className="text-sm text-neutral-300 leading-relaxed">
                Replace expensive petrol with clean electricity. EV running cost is only PKR 0.8 per km compared to PKR 7.0 per km on petrol motorbikes.
              </p>

              {/* Slider Input */}
              <div className="space-y-2 pt-2">
                <div className="flex justify-between text-sm font-semibold">
                  <span className="text-neutral-400">Daily Commute Distance:</span>
                  <span className="text-emerald-400 font-bold">{dailyKm} km / day</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="5"
                  value={dailyKm}
                  onChange={(e) => setDailyKm(Number(e.target.value))}
                  className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="rounded-2xl bg-neutral-900/90 border border-neutral-800 p-4">
                  <p className="text-xs text-neutral-400 font-medium">Monthly Petrol Cost</p>
                  <p className="text-lg font-bold text-red-400 line-through mt-0.5">
                    {formatCurrency(monthlyPetrolCost, currency)}
                  </p>
                </div>
                <div className="rounded-2xl bg-neutral-900/90 border border-emerald-500/30 p-4">
                  <p className="text-xs text-emerald-400 font-medium">Monthly EV Charge Cost</p>
                  <p className="text-lg font-bold text-emerald-400 mt-0.5">
                    {formatCurrency(monthlyEvCost, currency)}
                  </p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="rounded-3xl border border-emerald-500/40 bg-gradient-to-b from-emerald-950/60 to-neutral-900 p-6 sm:p-8 text-center space-y-4 shadow-xl">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Estimated Annual Fuel Savings</span>
                <div className="text-4xl sm:text-5xl font-black text-white tracking-tight tabular-nums text-emerald-300">
                  {formatCurrency(annualSavings, currency)}
                </div>
                <p className="text-xs text-neutral-300">
                  Save up to <span className="font-bold text-emerald-400">{formatCurrency(monthlySavings, currency)}</span> every single month on your daily commuting route!
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setIsTestRideOpen(true)}
                    className="w-full rounded-2xl bg-emerald-500 px-6 py-3.5 text-sm font-bold text-neutral-950 shadow-lg hover:bg-emerald-400 transition"
                  >
                    Book a Test Ride & Start Saving
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* EV Technology & Ownership Pillars */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900">
            Why Switch to Electric Mobility?
          </h2>
          <p className="text-sm text-neutral-500">
            Designed for urban Pakistani roads with zero emissions, instant torque, and complete peace of mind.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm hover:border-emerald-500 hover:shadow-md transition">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 mb-4">
              <Zap className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-neutral-900">Instant Electric Torque</h3>
            <p className="mt-1.5 text-xs text-neutral-500 leading-relaxed">
              0 to 50 km/h acceleration in just 3.5 seconds with zero lag and smooth gearless drive.
            </p>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm hover:border-emerald-500 hover:shadow-md transition">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 mb-4">
              <BatteryCharging className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-neutral-900">Lithium-Ion BMS Tech</h3>
            <p className="mt-1.5 text-xs text-neutral-500 leading-relaxed">
              Advanced Smart BMS with over-temperature and short-circuit protection for 2000+ charge cycles.
            </p>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm hover:border-emerald-500 hover:shadow-md transition">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 mb-4">
              <RefreshCw className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-neutral-900">Near-Zero Maintenance</h3>
            <p className="mt-1.5 text-xs text-neutral-500 leading-relaxed">
              No engine oil changes, spark plugs, drive belts, or air filters. Save thousands on routine maintenance.
            </p>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm hover:border-emerald-500 hover:shadow-md transition">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 mb-4">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-neutral-900">Nationwide Warranty</h3>
            <p className="mt-1.5 text-xs text-neutral-500 leading-relaxed">
              Up to 3-year warranty on lithium battery pack and motor with official spare parts support.
            </p>
          </div>
        </div>
      </section>

      {/* Showroom Contact & Test Ride Banner */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-neutral-900 p-8 sm:p-12 text-white flex flex-col md:flex-row items-center justify-between gap-6 border border-neutral-800">
          <div className="space-y-2 text-center md:text-left">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wide">Visit Showroom Today</span>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
              Ready to Experience the Future of Riding?
            </h3>
            <p className="text-xs sm:text-sm text-neutral-400 max-w-md">
              Visit our authorized showrooms in Lahore, Karachi, and Islamabad to test ride Vlektra, Metro EV, and Ramza models.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setIsTestRideOpen(true)}
              className="rounded-2xl bg-emerald-500 px-6 py-3.5 text-sm font-bold text-neutral-950 hover:bg-emerald-400 transition"
            >
              Book Test Ride Now
            </button>
          </div>
        </div>
      </section>

      {/* Test Ride Modal */}
      <TestRideModal
        isOpen={isTestRideOpen}
        onClose={() => setIsTestRideOpen(false)}
        storeName={storeName}
      />
    </div>
  );
}
