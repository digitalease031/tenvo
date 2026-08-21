'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Zap, BatteryCharging, Gauge, ShieldCheck, ArrowRight,
  Sparkles, RefreshCw, ChevronDown
} from 'lucide-react';
import { TestRideModal } from './TestRideModal';
import { EvBikesProductCard } from './EvBikesProductCard';
import { EvBikesPaveBanner } from './EvBikesPaveBanner';
import { EvBikesFeaturedCarousel } from './EvBikesFeaturedCarousel';
import { EvBikesCompareSection } from './EvBikesCompareSection';
import { EvBikesSavingsCalculator } from './EvBikesSavingsCalculator';

export function EvBikesHomeSections({
  products = [],
  businessDomain = '',
  currency = 'PKR',
  storeName = 'Tenvo EV',
}) {
  const [isTestRideOpen, setIsTestRideOpen] = useState(false);
  const [activeBrandFilter, setActiveBrandFilter] = useState('all');
  const [selectedVehicleForModal, setSelectedVehicleForModal] = useState(null);
  const [displayCount, setDisplayCount] = useState(9); // Initial 3 rows x 3 columns = 9 cards

  // Filter products by brand, series tab, or PAVE eligibility
  const filteredProducts = activeBrandFilter === 'all'
    ? products
    : activeBrandFilter === 'pave'
      ? products.filter((p) => p.domain_data?.pave_eligible || String(p.brand || '').toLowerCase().includes('metro') || String(p.name || '').toLowerCase().includes('metro'))
      : products.filter((p) => {
          const brand = String(p.brand || p.domain_data?.brand || '').toLowerCase();
          const cat = String(p.category || p.domain_data?.series || '').toLowerCase();
          return brand.includes(activeBrandFilter) || cat.includes(activeBrandFilter);
        });

  const handleBookTestRide = (product = null) => {
    setSelectedVehicleForModal(product);
    setIsTestRideOpen(true);
  };

  return (
    <div className="w-full space-y-16 py-8 bg-slate-50 text-slate-900 selection:bg-red-600 selection:text-white">
      
      {/* Brand & Series Selection Filter Tabs (Full Width) */}
      <section className="w-full px-4 sm:px-6 lg:px-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Zap className="h-4 w-4 text-red-600 fill-red-600" />
              Explore EV Series & Showroom Brands
            </h3>
            <p className="text-xs text-slate-500">Filter electric bikes and scooters by product series or authorized brand</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'all', label: 'All Tenvo Models' },
              { id: 'pave', label: 'PAVE Scheme' },
              { id: 't series', label: 'T Series' },
              { id: 'a series', label: 'A Series' },
              { id: 'y series', label: 'Y Series' },
              { id: 'thrill', label: 'Thrill Pro' },
              { id: 'metrix', label: 'Metrix Series' },
              { id: 'miku', label: 'Miku Flagship' },
              { id: 'retro', label: 'Retro Café' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveBrandFilter(tab.id);
                  setDisplayCount(9);
                }}
                className={`rounded-2xl px-4 py-2 text-xs font-bold transition-all ${
                  activeBrandFilter === tab.id
                    ? 'bg-slate-900 text-white border border-slate-900 shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 border border-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products AND Special Offers Modern Big Cards Section (Full Width Auto-Scrolling) */}
      <EvBikesFeaturedCarousel
        products={products}
        businessDomain={businessDomain}
        currency={currency}
        onBookTestRide={handleBookTestRide}
      />

      {/* EV Lineup Catalog Grid (Full Width 3 Cards Per Row - Initial 3 Rows / 9 Cards) */}
      <section className="w-full px-4 sm:px-6 lg:px-12">
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3.5 py-1 text-xs font-bold text-red-700 border border-red-200">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              Authorized EV Showroom Lineup
            </span>
            <h2 className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900">
              Electric Bikes & Smart Scooters
            </h2>
            <p className="mt-1 text-sm text-slate-500 font-medium">
              High-performance electric motorcycles with lithium & graphene battery warranty and instant torque.
            </p>
          </div>
          <Link
            href={`/store/${businessDomain}/products`}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-900 hover:text-red-600 transition"
          >
            View All Catalog Products <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* 3 Same-Size Cards per Row Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {filteredProducts.slice(0, displayCount).map((product) => (
            <EvBikesProductCard
              key={product.id || product.sku}
              product={product}
              businessDomain={businessDomain}
              currency={currency}
            />
          ))}
        </div>

        {/* View More EV Models Option */}
        {filteredProducts.length > displayCount && (
          <div className="mt-10 flex justify-center">
            <button
              type="button"
              onClick={() => setDisplayCount((prev) => prev + 6)}
              className="inline-flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-white px-8 py-3.5 text-xs font-bold text-slate-900 shadow-sm transition-all duration-300 hover:bg-slate-900 hover:text-white hover:scale-105 active:scale-95"
            >
              View More EV Models ({filteredProducts.length - displayCount} More Available)
              <ChevronDown className="h-4 w-4 text-red-600 animate-bounce" />
            </button>
          </div>
        )}
      </section>

      {/* Compare EV Models Section */}
      <EvBikesCompareSection
        products={products}
        businessDomain={businessDomain}
        currency={currency}
        storeName={storeName}
        onBookTestRide={handleBookTestRide}
      />

      {/* 2-Step Petrol vs EV Fuel Savings Calculator */}
      <EvBikesSavingsCalculator
        products={products}
        currency={currency}
        storeName={storeName}
        onBookTestRide={handleBookTestRide}
      />

      {/* EV Technology & Ownership Pillars (Full Width) */}
      <section className="w-full px-4 sm:px-6 lg:px-12">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Why Switch to Electric Mobility?
          </h2>
          <p className="text-sm text-slate-500 font-medium">
            Designed for urban roads with zero emissions, instant torque, and complete peace of mind.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md hover:border-red-500/50 transition">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600 mb-4 border border-red-200">
              <Zap className="h-6 w-6" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900">Instant Electric Torque</h3>
            <p className="mt-1.5 text-xs text-slate-500 leading-relaxed font-medium">
              0 to 50 km/h acceleration in just 3.5 seconds with zero lag and smooth gearless drive.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md hover:border-red-500/50 transition">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600 mb-4 border border-red-200">
              <BatteryCharging className="h-6 w-6" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900">Lithium & NCF BMS Tech</h3>
            <p className="mt-1.5 text-xs text-slate-500 leading-relaxed font-medium">
              Advanced Smart BMS with over-temperature and short-circuit protection for 1000+ charge cycles.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md hover:border-red-500/50 transition">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600 mb-4 border border-red-200">
              <RefreshCw className="h-6 w-6" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900">Near-Zero Maintenance</h3>
            <p className="mt-1.5 text-xs text-slate-500 leading-relaxed font-medium">
              No engine oil changes, spark plugs, drive belts, or air filters. Save thousands on routine maintenance.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md hover:border-red-500/50 transition">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600 mb-4 border border-red-200">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900">Nationwide Warranty</h3>
            <p className="mt-1.5 text-xs text-slate-500 leading-relaxed font-medium">
              Up to 24–36 months warranty on battery pack and motor with official spare parts support.
            </p>
          </div>
        </div>
      </section>

      {/* PAVE Scheme Government Subsidy Banner (Placed directly above footer) */}
      <EvBikesPaveBanner
        businessDomain={businessDomain}
        onSelectPaveFilter={() => setActiveBrandFilter('pave')}
      />

      {/* Test Ride Modal */}
      <TestRideModal
        isOpen={isTestRideOpen}
        onClose={() => setIsTestRideOpen(false)}
        storeName={storeName}
        vehicle={selectedVehicleForModal}
      />
    </div>
  );
}
