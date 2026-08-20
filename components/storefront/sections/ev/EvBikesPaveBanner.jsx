'use client';

import Link from 'next/link';
import { ShieldCheck, ArrowRight } from 'lucide-react';
import { SmartProductImage } from '@/components/storefront/SmartProductImage';

export function EvBikesPaveBanner({ businessDomain, onSelectPaveFilter }) {
  return (
    <section className="w-full px-4 sm:px-6 lg:px-12 my-6">
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 p-8 sm:p-12 shadow-xl transition-all text-white">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 items-center gap-8 relative z-10">
          
          {/* Left Content */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-400/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-amber-300">
              <ShieldCheck className="h-4 w-4 text-amber-300" />
              Government of Pakistan
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
              PAVE Scheme Models.
            </h2>

            <p className="text-sm sm:text-base font-medium text-slate-300 leading-relaxed max-w-xl">
              Six Metro & Jolta electric bike models are featured in the official PAVE lineup. Confirm your latest eligibility on the official government portal, then visit any authorized showroom to claim your EV subsidy.
            </p>

            {/* Action CTAs */}
            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <a
                href="https://pave.gov.pk"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-2xl bg-red-600 px-7 py-4 text-sm font-bold text-white shadow-md hover:bg-red-700 transition-transform active:scale-95"
              >
                Open PAVE portal
              </a>

              <button
                type="button"
                onClick={onSelectPaveFilter}
                className="inline-flex items-center justify-center rounded-2xl bg-white px-7 py-4 text-sm font-bold text-slate-900 shadow-md hover:bg-slate-100 transition-transform active:scale-95"
              >
                See PAVE bikes
              </button>
            </div>
          </div>

          {/* Right Image Display with Background Typography Watermark */}
          <div className="lg:col-span-5 relative flex items-center justify-center min-h-[220px]">
            {/* Background 100% SE Watermark */}
            <span className="absolute text-7xl sm:text-9xl font-black tracking-tighter text-red-900/20 select-none pointer-events-none uppercase">
              100% SE
            </span>

            {/* High-res EV Cutout Image */}
            <SmartProductImage
              src="https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=1200&q=80&auto=format&fit=crop"
              alt="PAVE Scheme Electric Bike"
              fallbackSrc="https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=1200&q=80&auto=format&fit=crop"
              className="relative z-10 max-h-64 sm:max-h-72 w-auto object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-500"
            />
          </div>

        </div>
      </div>
    </section>
  );
}
