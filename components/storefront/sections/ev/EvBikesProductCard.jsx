'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Zap } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import { cn } from '@/lib/utils';
import { normalizeProductImageUrls } from '@/lib/utils/productImages';
import { SmartProductImage } from '@/components/storefront/SmartProductImage';

export function EvBikesProductCard({
  product,
  businessDomain,
  currency = 'PKR',
}) {
  const extractedUrls = normalizeProductImageUrls(product);
  const images = extractedUrls.length > 0
    ? extractedUrls
    : ['https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=1200&q=80&auto=format&fit=crop'];

  const [currentIdx, setCurrentIdx] = useState(0);

  const prevImage = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIdx((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const nextImage = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIdx((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const productHref = `/store/${businessDomain}/products/${product.slug || product.id}`;

  return (
    <div className="group relative flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-xl hover:border-red-500/50 transition-all duration-300">
      
      {/* Top Media Container with Image Slider */}
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-slate-50/80 flex items-center justify-center p-3 border border-slate-100">
        
        {/* EV Product Image */}
        <SmartProductImage
          src={images[currentIdx]}
          alt={product.name || 'Electric Motorcycle'}
          fallbackSrc="https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=1200&q=80&auto=format&fit=crop"
          className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
        />

        {/* Carousel Prev & Next Controls */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={prevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-slate-800 border border-slate-200 shadow-md hover:bg-slate-900 hover:text-white hover:scale-110 transition active:scale-95"
              aria-label="Previous Image"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={nextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-slate-800 border border-slate-200 shadow-md hover:bg-slate-900 hover:text-white hover:scale-110 transition active:scale-95"
              aria-label="Next Image"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            {/* Pagination Dots */}
            <div className="absolute bottom-2.5 left-0 right-0 flex justify-center gap-1.5">
              {images.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setCurrentIdx(idx);
                  }}
                  className={cn(
                    'h-2 rounded-full transition-all duration-300',
                    idx === currentIdx
                      ? 'w-5 bg-red-600 shadow-sm'
                      : 'w-2 bg-slate-300 hover:bg-slate-400'
                  )}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Product Information */}
      <div className="mt-5 space-y-2 text-left">
        <Link href={productHref} className="block group-hover:text-red-600 transition-colors">
          <h3 className="text-lg sm:text-xl font-extrabold uppercase tracking-tight text-slate-900 line-clamp-1">
            {product.name}
          </h3>
        </Link>

        <div className="flex items-baseline gap-2.5">
          <span className="text-xl font-extrabold text-red-600 tabular-nums">
            {formatCurrency(product.price, currency)}
          </span>
          {product.compare_price && Number(product.compare_price) > Number(product.price) && (
            <span className="text-xs font-medium text-slate-400 line-through tabular-nums">
              {formatCurrency(product.compare_price, currency)}
            </span>
          )}
        </div>

        {/* Check Details CTA Link */}
        <div className="pt-2">
          <Link
            href={productHref}
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-900 hover:text-red-600 transition"
          >
            Check Details »
          </Link>
        </div>
      </div>
    </div>
  );
}
