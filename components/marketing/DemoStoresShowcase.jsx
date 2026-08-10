'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ExternalLink, Store, Filter } from 'lucide-react';
import { CLIENT_DEMO_STORES } from '@/lib/marketing/demoStores';
import { cn } from '@/lib/utils';

const INDUSTRY_FILTERS = [
  { label: 'All Industries', value: 'all' },
  { label: 'Retail & Commerce', value: 'retail' },
  { label: 'Food & Beverage', value: 'food' },
  { label: 'Automotive', value: 'automotive' },
  { label: 'Healthcare', value: 'healthcare' },
  { label: 'Fashion & Apparel', value: 'fashion' },
  { label: 'Services', value: 'services' },
  { label: 'Specialized', value: 'specialized' },
];

const CATEGORY_MAP = {
  'supermarket': 'retail',
  'grocery': 'retail',
  'electronics': 'retail',
  'milk-shop': 'retail',
  'restaurant-cafe': 'food',
  'auto-parts': 'automotive',
  'vehicle-dealership': 'automotive',
  'auto-marketplace': 'automotive',
  'tyre-shop': 'automotive',
  'pharmacy': 'healthcare',
  'garments': 'fashion',
  'boutique-fashion': 'fashion',
  'textile-wholesale': 'fashion',
  'gems-jewellery': 'fashion',
  'gym-fitness': 'services',
  'salon-spa': 'services',
  'furniture': 'specialized',
  'ceramics-tiles': 'specialized',
  'marine-parts': 'specialized',
};

export function DemoStoresShowcase() {
  const [selectedFilter, setSelectedFilter] = useState('all');

  const filteredStores = useMemo(() => {
    if (selectedFilter === 'all') return CLIENT_DEMO_STORES;
    
    return CLIENT_DEMO_STORES.filter((store) => {
      const category = CATEGORY_MAP[store.vertical] || 'specialized';
      return category === selectedFilter;
    });
  }, [selectedFilter]);

  return (
    <div className="container mx-auto px-4 py-16 lg:py-24">
      {/* Header Section */}
      <div className="mx-auto max-w-3xl text-center mb-12">
        <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-4 py-1.5 text-sm font-medium text-teal-700 mb-4">
          <Store className="h-4 w-4" />
          <span>19+ Live Demo Storefronts</span>
        </div>
        
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl mb-4">
          See TENVO in Action
        </h1>
        
        <p className="text-lg text-gray-600 leading-relaxed">
          Explore live demo stores across different industries. Each storefront is fully functional 
          with real product catalogs, working checkout, and industry-specific features. Click any 
          store to experience how TENVO powers your vertical.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-12">
        <div className="flex items-center gap-2 text-sm text-gray-500 mr-2">
          <Filter className="h-4 w-4" />
          <span className="font-medium">Filter by:</span>
        </div>
        {INDUSTRY_FILTERS.map((filter) => (
          <button
            key={filter.value}
            onClick={() => setSelectedFilter(filter.value)}
            className={cn(
              'rounded-full px-4 py-2 text-sm font-medium transition-all duration-200',
              selectedFilter === filter.value
                ? 'bg-teal-600 text-white shadow-md scale-105'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Demo Store Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStores.map((store) => (
          <DemoStoreCard key={store.domain} store={store} />
        ))}
      </div>

      {/* CTA Section */}
      <div className="mt-20 text-center">
        <div className="inline-block rounded-2xl bg-gradient-to-r from-teal-50 to-cyan-50 p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Ready to Create Your Own Store?
          </h2>
          <p className="text-gray-600 mb-6 max-w-xl">
            Start with a free trial and launch your branded storefront in minutes. 
            No credit card required.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-lg bg-teal-600 px-6 py-3 text-base font-semibold text-white shadow-lg hover:bg-teal-700 transition-colors"
            >
              Start Free Trial
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center rounded-lg bg-white px-6 py-3 text-base font-semibold text-teal-700 shadow-md hover:bg-gray-50 transition-colors border border-gray-200"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function DemoStoreCard({ store }) {
  const storeUrl = `https://${store.domain}`;
  
  return (
    <Link
      href={storeUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group block rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-xl hover:border-teal-300 hover:scale-[1.02]"
    >
      {/* Store Preview Image */}
      {store.heroImage && (
        <div className="relative mb-4 overflow-hidden rounded-lg bg-gray-100 aspect-video">
          <Image
            src={store.heroImage}
            alt={`${store.name} storefront preview`}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-110"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      )}

      {/* Store Info */}
      <div className="space-y-3">
        <div>
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-semibold text-lg text-gray-900 group-hover:text-teal-700 transition-colors">
              {store.name}
            </h3>
            <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-teal-600 transition-colors flex-shrink-0 mt-1" />
          </div>
          
          <p className="text-xs text-gray-500 font-mono mb-2">
            {store.domain}
          </p>
        </div>

        <p className="text-sm text-gray-600 line-clamp-2">
          {store.description}
        </p>

        {/* Industry Badge */}
        <div className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-3 py-1 text-xs font-medium text-teal-700">
          <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
          {store.label || store.vertical}
        </div>

        {/* Visit Button */}
        <div className="pt-2 border-t border-gray-100">
          <span className="inline-flex items-center gap-2 text-sm font-medium text-teal-600 group-hover:text-teal-700">
            <span>Visit Live Store</span>
            <ExternalLink className="h-4 w-4" />
          </span>
        </div>
      </div>
    </Link>
  );
}
