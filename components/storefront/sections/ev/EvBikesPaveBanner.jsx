'use client';

import { ShieldCheck } from 'lucide-react';
import { SmartProductImage } from '@/components/storefront/SmartProductImage';

export function EvBikesPaveBanner({ onSelectPaveFilter }) {
  return (
    <section className="w-full px-4 sm:px-6 lg:px-12 my-6">
      <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200 p-8 sm:p-12 shadow-sm transition-all text-slate-900">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 items-center gap-8 relative z-10">
          
          {/* Left Content */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-amber-900">
              <ShieldCheck className="h-4 w-4 text-amber-600" />
              Government of Pakistan
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
              PAVE Scheme Models.
            </h2>

            <p className="text-sm sm:text-base font-medium text-slate-600 leading-relaxed max-w-xl">
              Six TENVO EV models are featured in the official PAVE lineup. Confirm your latest eligibility on the official government portal, then visit any authorized showroom to claim your EV subsidy.
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
                className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-7 py-4 text-sm font-bold text-white shadow-md hover:bg-slate-800 transition-transform active:scale-95"
              >
                See PAVE bikes
              </button>
            </div>
          </div>

          {/* Right Image Display with Background Typography Watermark */}
          <div className="lg:col-span-5 relative flex items-center justify-center min-h-[220px]">
            {/* Background 100% SE Watermark */}
            <span className="absolute text-7xl sm:text-9xl font-black tracking-tighter text-slate-100 select-none pointer-events-none uppercase">
              100% SE
            </span>

            {/* High-res METRO METRIX EV Cutout Image (Seamless multiply blend, no box shadow) */}
            <SmartProductImage
              src="/tenvo-img/ev-metrix-pave-banner.png"
              alt="TENVO METRIX (NCF) PAVE Scheme Electric Scooter"
              fallbackSrc="/tenvo-img/ev-metrix-pave-banner.png"
              className="relative z-10 max-h-64 sm:max-h-80 w-auto object-contain mix-blend-multiply hover:scale-105 transition-transform duration-500"
            />
          </div>

        </div>
      </div>
    </section>
  );
}
