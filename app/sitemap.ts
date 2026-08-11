import type { MetadataRoute } from 'next';
import { caseStudies } from '@/lib/marketing/case-studies';
import { MARKETING_SITEMAP_ROUTES } from '@/lib/marketing/seo';
import { getSiteUrl } from '@/lib/marketing/site-url';
import { listDomainPackages } from '@/lib/config/domainPackages';

/**
 * Main sitemap for www.tenvo.store
 * Optimized for search engines and client acquisition
 * 
 * IMPORTANT: Only includes URLs within tenvo.store domain.
 * Demo stores are on separate domains and should have their own sitemaps.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl();
  const lastModified = new Date();

  // Core marketing pages (highest priority)
  const marketing = MARKETING_SITEMAP_ROUTES.map(({ path, priority, changeFrequency }) => ({
    url: `${base}${path}`,
    lastModified,
    changeFrequency,
    priority,
  }));

  // Demo stores showcase page (high priority for traffic)
  const demoStoresLanding = {
    url: `${base}/demo-stores`,
    lastModified,
    changeFrequency: 'weekly' as const,
    priority: 0.85,
  };

  // Industry solution pages (high conversion potential)
  const industryPlanPages = listDomainPackages().map((pkg) => ({
    url: `${base}${pkg.marketingPath || `/solutions/${pkg.slug}`}`,
    lastModified,
    changeFrequency: 'weekly' as const, // Changed to weekly for better freshness signal
    priority: 0.8, // Increased priority - these drive conversions
  }));

  // Case studies (social proof pages)
  const caseStudyPages = caseStudies.map((cs) => ({
    url: `${base}/case-studies/${cs.slug}`,
    lastModified: cs.publishedDate ? new Date(cs.publishedDate) : lastModified,
    changeFrequency: 'monthly' as const,
    priority: 0.7, // Increased priority - builds trust
  }));

  // High-value pages that should be indexed quickly
  const highValuePages = [
    {
      url: `${base}/register`,
      lastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.95, // Very high - direct conversion page
    },
    {
      url: `${base}/pricing`,
      lastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.95, // Very high - pricing drives decisions
    },
    {
      url: `${base}/contact`,
      lastModified,
      changeFrequency: 'monthly' as const,
      priority: 0.9, // High - leads to conversions
    },
    {
      url: `${base}/demo`,
      lastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.9, // High - product demonstration
    },
  ];

  return [
    ...marketing,
    ...highValuePages,
    demoStoresLanding,
    ...industryPlanPages,
    ...caseStudyPages,
  ];
}
