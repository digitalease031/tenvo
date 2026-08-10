import type { MetadataRoute } from 'next';
import { caseStudies } from '@/lib/marketing/case-studies';
import { MARKETING_SITEMAP_ROUTES } from '@/lib/marketing/seo';
import { getSiteUrl } from '@/lib/marketing/site-url';
import { listDomainPackages } from '@/lib/config/domainPackages';
import { CLIENT_DEMO_STORES } from '@/lib/marketing/demoStores';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl();
  const lastModified = new Date();

  const marketing = MARKETING_SITEMAP_ROUTES.map(({ path, priority, changeFrequency }) => ({
    url: `${base}${path}`,
    lastModified,
    changeFrequency,
    priority,
  }));

  const caseStudyPages = caseStudies.map((cs) => ({
    url: `${base}/case-studies/${cs.slug}`,
    lastModified: cs.publishedDate ? new Date(cs.publishedDate) : lastModified,
    changeFrequency: 'monthly' as const,
    priority: 0.65,
  }));

  const industryPlanPages = listDomainPackages().map((pkg) => ({
    url: `${base}${pkg.marketingPath || `/solutions/${pkg.slug}`}`,
    lastModified,
    changeFrequency: 'monthly' as const,
    priority: 0.75,
  }));

  // Add demo stores landing page
  const demoStoresLanding = {
    url: `${base}/demo-stores`,
    lastModified,
    changeFrequency: 'weekly' as const,
    priority: 0.85,
  };

  // Add individual demo store links (external domains)
  const demoStoreLinks = CLIENT_DEMO_STORES.map((store) => ({
    url: `https://${store.domain}`,
    lastModified,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  return [
    ...marketing,
    demoStoresLanding,
    ...industryPlanPages,
    ...caseStudyPages,
    ...demoStoreLinks,
  ];
}
