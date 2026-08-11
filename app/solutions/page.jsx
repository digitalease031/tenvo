import { buildMarketingMetadata } from '@/lib/marketing/seo';
import MarketingLayout from '@/components/marketing/layout/MarketingLayout';
import Link from 'next/link';
import { listDomainPackages } from '@/lib/config/domainPackages';
import { ArrowRight, Store, TrendingUp, Shield, Zap } from 'lucide-react';
import { MARKETING_CONTAINER } from '@/lib/utils/marketingLayout';
import { cn } from '@/lib/utils';

export const metadata = buildMarketingMetadata({
  title: 'Solutions by Industry - TENVO Business Software',
  description:
    'Discover TENVO solutions tailored for your industry. Restaurant POS, pharmacy management, auto parts inventory, retail software, and more. Pakistan-first business operations platform.',
  path: '/solutions',
  keywords: [
    'business software by industry',
    'restaurant pos pakistan',
    'pharmacy software',
    'retail management system',
    'industry-specific erp',
    'vertical business software',
    'pakistan business solutions',
  ],
});

export default function SolutionsPage() {
  const packages = listDomainPackages();

  return (
    <MarketingLayout transparentNav={false}>
      <main className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white"
        {/* Hero Section */}
        <section className={cn(MARKETING_CONTAINER, "py-16 lg:py-24")}>
          <div className="mx-auto max-w-4xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-4 py-1.5 text-sm font-semibold text-teal-700 mb-6">
              <Store className="h-4 w-4" />
              <span>Industry-Specific Solutions</span>
            </div>

            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl mb-6">
              Built for Your Industry
            </h1>

            <p className="text-xl text-gray-600 leading-relaxed mb-8">
              TENVO adapts to your business needs with industry-specific features, workflows, 
              and best practices. From restaurants to retail, auto parts to pharmacies - we've 
              got you covered.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-lg bg-teal-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg hover:bg-teal-700 transition-all duration-200 hover:scale-105"
              >
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                href="/demo-stores"
                className="inline-flex items-center justify-center rounded-lg bg-white px-8 py-3.5 text-base font-semibold text-teal-700 shadow-md hover:bg-gray-50 transition-all border border-gray-200"
              >
                View Live Demos
              </Link>
            </div>
          </div>
        </section>

        {/* Benefits Grid */}
        <section className={cn(MARKETING_CONTAINER, "py-12")}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
              <div className="rounded-lg bg-teal-50 p-3 w-fit mb-4">
                <TrendingUp className="h-6 w-6 text-teal-600" />
              </div>
              <h3 className="font-semibold text-lg text-gray-900 mb-2">
                Industry Best Practices
              </h3>
              <p className="text-gray-600 text-sm">
                Pre-configured workflows, reports, and features tailored to your vertical
              </p>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
              <div className="rounded-lg bg-blue-50 p-3 w-fit mb-4">
                <Shield className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-lg text-gray-900 mb-2">
                Compliance Ready
              </h3>
              <p className="text-gray-600 text-sm">
                FBR tax compliance, prescription tracking, and industry-specific regulations built-in
              </p>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
              <div className="rounded-lg bg-purple-50 p-3 w-fit mb-4">
                <Zap className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-lg text-gray-900 mb-2">
                Quick Setup
              </h3>
              <p className="text-gray-600 text-sm">
                Start with pre-loaded categories, units, and templates specific to your business
              </p>
            </div>
          </div>
        </section>

        {/* Industry Solutions Grid */}
        <section className={cn(MARKETING_CONTAINER, "py-16")}>
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Choose Your Industry
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {packages.map((pkg) => (
              <Link
                key={pkg.slug}
                href={pkg.marketingPath || `/solutions/${pkg.slug}`}
                className="group block rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-xl hover:border-teal-300 hover:scale-[1.02]"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900 group-hover:text-teal-700 transition-colors mb-1">
                      {pkg.displayName}
                    </h3>
                    <p className="text-sm text-gray-500">{pkg.description}</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-teal-600 group-hover:translate-x-1 transition-all flex-shrink-0" />
                </div>

                {pkg.features && pkg.features.length > 0 && (
                  <ul className="space-y-2">
                    {pkg.features.slice(0, 3).map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="h-1.5 w-1.5 rounded-full bg-teal-500 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <span className="inline-flex items-center gap-2 text-sm font-medium text-teal-600 group-hover:text-teal-700">
                    Learn more
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className={cn(MARKETING_CONTAINER, "py-16")}>
          <div className="rounded-3xl bg-gradient-to-r from-teal-600 to-cyan-600 p-12 text-center shadow-2xl max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to Transform Your Business?
            </h2>
            <p className="text-xl text-teal-50 mb-8 max-w-2xl mx-auto">
              Join thousands of businesses using TENVO to streamline operations, 
              increase sales, and grow profitably.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-lg bg-white px-8 py-3.5 text-base font-semibold text-teal-700 shadow-lg hover:bg-gray-50 transition-all"
              >
                Start Free Trial - No Credit Card Required
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center rounded-lg border-2 border-white px-8 py-3.5 text-base font-semibold text-white hover:bg-white/10 transition-all"
              >
                Talk to Sales
              </Link>
            </div>
          </div>
        </section>
      </main>
    </MarketingLayout>
  );
}
