import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { fetchBusinessByDomain } from '@/lib/storefront/fetchBusinessByDomain';
import { guardStorefrontBusiness } from '@/lib/storefront/guardStorefrontBusiness';
import { fetchStorefrontProductsOnClient } from '@/lib/actions/storefront/products';
import { resolveStoreContact } from '@/lib/storefront/businessContact';
import { InstallmentPageClient } from '@/components/storefront/InstallmentPageClient';

export async function generateMetadata({ params }) {
  const { businessDomain } = await params;
  const result = await fetchBusinessByDomain(businessDomain);
  if (!result.success) return { title: 'Installment Plan Calculator' };
  return {
    title: `Installment Plan Calculator | ${result.business.business_name}`,
    description: `Calculate your monthly payments and apply for easy installment plans with ${result.business.business_name}.`,
  };
}

export default async function InstallmentsPage({ params }) {
  const { businessDomain } = await params;
  const bizResult = guardStorefrontBusiness(await fetchBusinessByDomain(businessDomain));
  if (!bizResult) return null;

  const { business, settings } = bizResult;
  const contact = resolveStoreContact({ business, settings });

  let products = [];
  try {
    const productsRes = await fetchStorefrontProductsOnClient(business.id, { limit: 50 });
    if (productsRes.success) {
      products = productsRes.products || [];
    }
  } catch (err) {
    console.warn('[installments/page] failed to fetch products:', err?.message || err);
  }

  return (
    <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center text-neutral-400">Loading installment calculator…</div>}>
      <InstallmentPageClient
        business={business}
        settings={settings}
        products={products}
        contact={contact}
      />
    </Suspense>
  );
}
