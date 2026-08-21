'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ChevronLeft, ChevronRight, Zap, BatteryCharging, Gauge, ShieldCheck,
  Tag, Sparkles, ArrowRight, Flame, Percent
} from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import { cn } from '@/lib/utils';
import { normalizeProductImageUrls } from '@/lib/utils/productImages';
import { SmartProductImage } from '@/components/storefront/SmartProductImage';

export function EvBikesFeaturedCarousel({
  products = [],
  businessDomain = '',
  currency = 'PKR',
  onBookTestRide,
}) {
  const scrollRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const [activeTab, setActiveTab] = useState('featured'); // 'featured' | 'offers'

  // Filter products into Featured and Special Offers
  const featuredProducts = products.filter(
    (p) => p.is_featured || Number(p.compare_price) > Number(p.price)
  );

  const specialOffers = products.filter(
    (p) => Number(p.compare_price) > Number(p.price) || p.domain_data?.pave_eligible
  );

  const activeList = activeTab === 'offers'
    ? (specialOffers.length > 0 ? specialOffers : products)
    : (featuredProducts.length > 0 ? featuredProducts : products);

  // Auto-scrolling horizontal logic (scrolls every 3.5 seconds)
  const scrollNext = useCallback(() => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    const scrollAmount = container.clientWidth * 0.75;
    
    if (container.scrollLeft + container.clientWidth >= container.scrollWidth - 10) {
      container.scrollTo({ left: 0, behavior: 'smooth' });
    } else {
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  }, []);

  const scrollPrev = useCallback(() => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    const scrollAmount = container.clientWidth * 0.75;
    
    if (container.scrollLeft <= 10) {
      container.scrollTo({ left: container.scrollWidth, behavior: 'smooth' });
    } else {
      container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    if (isHovered || activeList.length <= 1) return undefined;
    const interval = setInterval(scrollNext, 3500);
    return () => clearInterval(interval);
  }, [isHovered, activeList.length, scrollNext]);

  return (
    <section className="w-full px-4 sm:px-6 lg:px-12 py-10 bg-slate-100/70 border-y border-slate-200">
      
      {/* Section Header with Tabs & Navigation Controls */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-red-700 border border-red-200">
              <Flame className="h-3.5 w-3.5 fill-red-600 text-red-600" />
              Special Offers & Featured EV Showcase
            </span>
          </div>

          <h2 className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
            Featured Models & Promotional Deals
          </h2>

          <p className="mt-1 text-xs sm:text-sm text-slate-500 max-w-xl font-medium">
            Explore flagship electric motorcycles and discounted promotional packages with auto-scrolling showcase.
          </p>
        </div>

        {/* Tab Selection & Arrows */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 rounded-2xl bg-slate-200/80 p-1.5 border border-slate-300">
            <button
              type="button"
              onClick={() => setActiveTab('featured')}
              className={cn(
                'rounded-xl px-4 py-2 text-xs font-bold transition-all',
                activeTab === 'featured'
                  ? 'bg-slate-900 text-white shadow border border-slate-900'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              Featured Models
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('offers')}
              className={cn(
                'rounded-xl px-4 py-2 text-xs font-bold transition-all flex items-center gap-1.5',
                activeTab === 'offers'
                  ? 'bg-red-600 text-white shadow border border-red-600'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              <Percent className="h-3.5 w-3.5 text-white" />
              Special Offers
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={scrollPrev}
              className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-800 shadow-sm hover:bg-slate-900 hover:text-white transition active:scale-95"
              aria-label="Scroll left"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <button
              type="button"
              onClick={scrollNext}
              className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-800 shadow-sm hover:bg-slate-900 hover:text-white transition active:scale-95"
              aria-label="Scroll right"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Auto-Scrolling Horizontal Track with MODERN BIG CARDS */}
      <div
        ref={scrollRef}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="flex gap-6 overflow-x-auto scrollbar-none scroll-smooth pb-6 pt-2"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {activeList.map((product) => {
          const discount = product.compare_price && Number(product.compare_price) > Number(product.price)
            ? Math.round(((Number(product.compare_price) - Number(product.price)) / Number(product.compare_price)) * 100)
            : 0;

          const savingsAmount = product.compare_price && Number(product.compare_price) > Number(product.price)
            ? Number(product.compare_price) - Number(product.price)
            : 0;

          const productHref = `/store/${businessDomain}/products/${product.slug || product.id}`;
          const extractedUrls = normalizeProductImageUrls(product);
          const images = extractedUrls.length > 0
            ? extractedUrls
            : ['https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=1200&q=80&auto=format&fit=crop'];

          return (
            <div
              key={product.id || product.sku}
              style={{ scrollSnapAlign: 'start' }}
              className="group relative flex min-w-[320px] sm:min-w-[380px] lg:min-w-[420px] max-w-[440px] flex-col justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-xl hover:border-red-500/50 transition-all duration-300 hover:-translate-y-1.5"
            >
              {/* Card Header Badges */}
              <div className="flex items-center justify-between gap-2 mb-4">
                {discount > 0 ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-700 border border-red-200 shadow-sm uppercase tracking-wide">
                    <Tag className="h-3 w-3 text-red-600" />
                    SAVE {formatCurrency(savingsAmount, currency)} ({discount}% OFF)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-800 border border-slate-200 uppercase tracking-wide">
                    <Sparkles className="h-3 w-3 text-amber-500" />
                    Featured Model
                  </span>
                )}

                {product.domain_data?.pave_eligible && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-900 border border-amber-200">
                    PAVE Govt Subsidy
                  </span>
                )}
              </div>

              {/* High-Res Product Image Container */}
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-slate-50/90 p-4 flex items-center justify-center border border-slate-100">
                <SmartProductImage
                  src={images[0]}
                  alt={product.name || 'EV Bike'}
                  fallbackSrc="https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=1200&q=80&auto=format&fit=crop"
                  className="h-full w-full object-contain transition-transform duration-700 group-hover:scale-105"
                />
              </div>

              {/* Spec Pills Strip */}
              <div className="my-4 grid grid-cols-3 gap-2 text-center rounded-2xl bg-slate-100/90 p-3 border border-slate-200">
                <div>
                  <p className="text-[10px] font-extrabold text-slate-500 uppercase">Max Range</p>
                  <p className="text-xs font-extrabold text-slate-900 flex items-center justify-center gap-1 mt-0.5">
                    <Gauge className="h-3 w-3 text-red-600" />
                    {product.domain_data?.range_km || '100+ km'}
                  </p>
                </div>

                <div className="border-x border-slate-200 px-1">
                  <p className="text-[10px] font-extrabold text-slate-500 uppercase">Battery</p>
                  <p className="text-xs font-extrabold text-slate-900 flex items-center justify-center gap-1 mt-0.5 truncate">
                    <BatteryCharging className="h-3 w-3 text-red-600" />
                    {product.domain_data?.battery_type || 'LiFePO4'}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] font-extrabold text-slate-500 uppercase">Top Speed</p>
                  <p className="text-xs font-extrabold text-slate-900 flex items-center justify-center gap-1 mt-0.5">
                    <Zap className="h-3 w-3 text-red-600" />
                    {product.domain_data?.top_speed_kmh || '50 km/h'}
                  </p>
                </div>
              </div>

              {/* Product Info & Pricing */}
              <div className="space-y-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                    {product.brand || 'Tenvo EV'} · {product.category || 'Electric Bikes'}
                  </p>
                  <Link href={productHref} className="block group-hover:text-red-600 transition-colors">
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight line-clamp-1 mt-0.5">
                      {product.name}
                    </h3>
                  </Link>
                </div>

                <div className="flex items-baseline gap-3">
                  <span className="text-2xl font-black text-red-600 tabular-nums">
                    {formatCurrency(product.price, currency)}
                  </span>
                  {product.compare_price && Number(product.compare_price) > Number(product.price) && (
                    <span className="text-sm font-semibold text-slate-400 line-through tabular-nums">
                      {formatCurrency(product.compare_price, currency)}
                    </span>
                  )}
                </div>

                {/* Card Action Buttons */}
                <div className="flex items-center gap-2 pt-2">
                  <Link
                    href={productHref}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-2xl bg-slate-900 px-4 py-3 text-xs font-bold text-white shadow-sm hover:bg-slate-800 transition active:scale-95"
                  >
                    Check Details »
                  </Link>

                  <button
                    type="button"
                    onClick={() => onBookTestRide(product)}
                    className="inline-flex items-center justify-center gap-1.5 rounded-2xl bg-red-600 px-4 py-3 text-xs font-bold text-white shadow-sm hover:bg-red-700 transition active:scale-95"
                  >
                    Apply Installment
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
