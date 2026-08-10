import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/marketing/site-url';

/**
 * Sitemap index for better organization and crawl efficiency.
 * Split into multiple sitemaps when site grows large.
 */
export default function sitemapIndex(): MetadataRoute.Sitemap {
  const base = getSiteUrl();
  const lastModified = new Date();

  return [
    {
      url: `${base}/sitemap.xml`,
      lastModified,
    },
    // Future: Add separate sitemaps for blogs, help articles, etc.
    // {
    //   url: `${base}/sitemap-blog.xml`,
    //   lastModified,
    // },
  ];
}
