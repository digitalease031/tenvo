import type { MetadataRoute } from 'next';
import { CLIENT_DEMO_STORES } from '@/lib/marketing/demoStores';

/**
 * Separate sitemap for demo store URLs
 * These are external domains, so they should be in their own sitemap
 * This sitemap can be referenced but won't be submitted to GSC for tenvo.store
 */
export default function demosSitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return CLIENT_DEMO_STORES.map((store) => ({
    url: `https://${store.domain}`,
    lastModified,
    changeFrequency: 'monthly' as const,
    priority: 0.8, // High priority - these are live demos
  }));
}
