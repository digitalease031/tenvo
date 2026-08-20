'use client';

import { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';
import { useStorefront } from '@/lib/context/StorefrontContext';
import { getStoreAccentColor } from '@/lib/config/storefrontDomains';
import { isEvBikesStore } from '@/lib/storefront/evBikesStorefront';
import { cn } from '@/lib/utils';
import {
  STOREFRONT_BACK_TO_TOP_BOTTOM,
  STOREFRONT_FLOAT_RIGHT,
  STOREFRONT_CHAT_Z,
} from '@/lib/utils/mobileLayout';

export function BackToTop() {
  const [visible, setVisible] = useState(false);
  const { settings, business } = useStorefront();
  const accent = getStoreAccentColor(settings, business?.category);
  const isEvStore = isEvBikesStore(business?.category);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className={cn(
        'fixed flex h-11 w-11 items-center justify-center rounded-full shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95',
        STOREFRONT_FLOAT_RIGHT,
        STOREFRONT_BACK_TO_TOP_BOTTOM,
        STOREFRONT_CHAT_Z,
        isEvStore
          ? 'bg-red-600 hover:bg-red-700 text-white border border-red-500 shadow-lg'
          : 'text-white'
      )}
      style={isEvStore ? {} : { backgroundColor: accent }}
      aria-label="Back to top"
    >
      <ArrowUp className="w-5 h-5 font-bold" />
    </button>
  );
}
