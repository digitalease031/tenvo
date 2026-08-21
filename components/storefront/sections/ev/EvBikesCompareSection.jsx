'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { SmartProductImage } from '@/components/storefront/SmartProductImage';
import { formatCurrency } from '@/lib/currency';
import { getEvComparisonSpecs } from '@/lib/storefront/evBikesStorefront';
import { resolveStorefrontProductBrowseHref } from '@/lib/storefront/storefrontPurchasability';
import { Calendar, ChevronDown, ExternalLink } from 'lucide-react';

export function EvBikesCompareSection({
  products = [],
  businessDomain = '',
  currency = 'PKR',
  storeName = 'Tenvo EV',
  onBookTestRide,
}) {
  // Filter products that belong to EV vehicles
  const evVehicles = useMemo(() => {
    if (!products || !products.length) return [];
    return products.filter((p) => {
      const cat = String(p.category || p.category_name || '').toLowerCase();
      return !cat.includes('charger') && !cat.includes('accessories') && !cat.includes('spares');
    });
  }, [products]);

  const fallbackList = evVehicles.length >= 2 ? evVehicles : products;

  // Selected vehicle IDs
  const [model1Id, setModel1Id] = useState(() => fallbackList[0]?.id || '');
  const [model2Id, setModel2Id] = useState(() => fallbackList[1]?.id || fallbackList[0]?.id || '');

  const model1 = fallbackList.find((p) => String(p.id) === String(model1Id)) || fallbackList[0];
  const model2 = fallbackList.find((p) => String(p.id) === String(model2Id)) || fallbackList[1] || fallbackList[0];

  const model1Specs = model1 ? getEvComparisonSpecs(model1) : [];
  const model2Specs = model2 ? getEvComparisonSpecs(model2) : [];

  return (
    <section className="w-full px-4 sm:px-6 lg:px-12 py-10 bg-slate-100/70 border-y border-slate-200">
      <div className="text-center max-w-3xl mx-auto mb-8 space-y-2">
        <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Compare {storeName} E-Vehicles
        </h2>
        <p className="text-sm sm:text-base text-slate-500 font-medium">
          Explore {storeName} E-Vehicles side-by-side. Compare features, specifications, and battery performance.
        </p>
      </div>

      {/* Model Selection Dropdowns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-5xl mx-auto mb-8">
        <div className="relative">
          <label htmlFor="ev-compare-model1" className="sr-only">
            Select Model 1
          </label>
          <select
            id="ev-compare-model1"
            value={model1?.id || ''}
            onChange={(e) => setModel1Id(e.target.value)}
            className="w-full appearance-none rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-bold text-slate-900 shadow-sm focus:border-red-600 focus:outline-none pr-10 cursor-pointer"
          >
            {fallbackList.map((item) => (
              <option key={`m1-${item.id}`} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3.5 top-4 h-4 w-4 text-slate-400" />
        </div>

        <div className="relative">
          <label htmlFor="ev-compare-model2" className="sr-only">
            Select Model 2
          </label>
          <select
            id="ev-compare-model2"
            value={model2?.id || ''}
            onChange={(e) => setModel2Id(e.target.value)}
            className="w-full appearance-none rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-bold text-slate-900 shadow-sm focus:border-red-600 focus:outline-none pr-10 cursor-pointer"
          >
            {fallbackList.map((item) => (
              <option key={`m2-${item.id}`} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3.5 top-4 h-4 w-4 text-slate-400" />
        </div>
      </div>

      {/* Side-by-Side Comparison Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
        {[
          { model: model1, specs: model1Specs },
          { model: model2, specs: model2Specs },
        ].map(({ model, specs }, cardIndex) => {
          if (!model) return null;
          const href = resolveStorefrontProductBrowseHref(model, businessDomain);

          return (
            <div
              key={`compare-card-${cardIndex}-${model.id}`}
              className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 flex flex-col justify-between shadow-sm hover:shadow-xl hover:border-red-500/50 transition duration-300"
            >
              <div className="space-y-6">
                {/* Vehicle Image */}
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-slate-50 p-3 border border-slate-100">
                  {model.image_url || model.images?.[0] ? (
                    <SmartProductImage
                      src={model.image_url || model.images[0]}
                      alt={model.name}
                      fill
                      className="object-contain"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-slate-400 font-medium">
                      {model.name}
                    </div>
                  )}
                </div>

                {/* Model Title & Price */}
                <div className="text-center space-y-1">
                  <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 uppercase tracking-tight">
                    {model.name}
                  </h3>
                  <p className="text-xl sm:text-2xl font-black text-red-600 tracking-tight">
                    {formatCurrency(model.price, currency)}
                  </p>
                </div>

                {/* Outer Specification Box */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
                  <dl className="divide-y divide-slate-200 text-xs sm:text-sm">
                    {specs.map((row) => (
                      <div key={row.label} className="grid grid-cols-12 py-2 text-slate-700 font-medium">
                        <dt className="col-span-6 font-semibold text-slate-500">{row.label}</dt>
                        <dd className="col-span-6 text-slate-900 font-extrabold text-right">{row.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-6">
                <Link
                  href={href}
                  className="flex items-center justify-center gap-1.5 rounded-2xl bg-red-600 px-4 py-3.5 text-xs sm:text-sm font-bold uppercase text-white shadow-sm hover:bg-red-700 transition active:scale-95 text-center"
                >
                  Check Details <ExternalLink className="h-3.5 w-3.5 text-white" />
                </Link>

                <button
                  type="button"
                  onClick={() => onBookTestRide?.(model)}
                  className="flex items-center justify-center gap-1.5 rounded-2xl bg-slate-900 px-4 py-3.5 text-xs sm:text-sm font-bold uppercase text-white shadow-sm hover:bg-slate-800 transition active:scale-95"
                >
                  <Calendar className="h-3.5 w-3.5 text-amber-400" />
                  Test Ride
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
