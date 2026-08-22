import { buildMarketingMetadata } from '@/lib/marketing/seo';
import { DemoStoresShowcase } from '@/components/marketing/DemoStoresShowcase';
import MarketingLayout from '@/components/marketing/layout/MarketingLayout';
import { getDemoStoreListSchema } from '@/lib/marketing/demoStoreSchema';

export const metadata = buildMarketingMetadata({
  title: 'Live Demo Stores - See TENVO in Action Across Industries',
  description:
    'Explore 28+ live demo storefronts powered by TENVO across retail, restaurants, auto parts, pharmacy, fitness, and more. See how TENVO works for your industry with real product catalogs and working checkout.',
  path: '/demo-stores',
  keywords: [
    'tenvo demo',
    'live demo storefronts',
    'ecommerce platform demo',
    'pos system demo',
    'business software demo',
    'retail storefront examples',
    'restaurant website demo',
    'pharmacy store demo',
    'auto parts website demo',
    'online store examples pakistan',
  ],
  ogTitle: 'Live Demo Stores - TENVO Platform in Action',
});

export default function DemoStoresPage() {
  const schema = getDemoStoreListSchema();

  return (
    <MarketingLayout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
        <DemoStoresShowcase />
      </div>
    </MarketingLayout>
  );
}
