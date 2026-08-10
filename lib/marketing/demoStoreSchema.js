/**
 * Structured data schemas for demo store showcase pages
 */

import { getSiteUrl } from './site-url';
import { CLIENT_DEMO_STORES } from './demoStores';

/**
 * Generate ItemList schema for the demo stores landing page
 */
export function getDemoStoreListSchema() {
  const site = getSiteUrl();
  
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'TENVO Demo Storefronts',
    description: 'Live demo stores showcasing TENVO platform across different industries',
    url: `${site}/demo-stores`,
    numberOfItems: CLIENT_DEMO_STORES.length,
    itemListElement: CLIENT_DEMO_STORES.map((store, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'WebSite',
        '@id': `https://${store.domain}`,
        name: store.name,
        url: `https://${store.domain}`,
        description: store.description || `${store.name} - Powered by TENVO`,
        provider: {
          '@type': 'SoftwareApplication',
          name: 'TENVO',
          url: site,
        },
        about: {
          '@type': 'Thing',
          name: store.label || store.vertical,
        },
      },
    })),
  };
}

/**
 * Generate individual demo store schema
 */
export function getIndividualDemoStoreSchema(store) {
  const site = getSiteUrl();
  
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: store.name,
    url: `https://${store.domain}`,
    description: store.description || `${store.name} - Demo storefront powered by TENVO`,
    image: store.heroImage,
    provider: {
      '@type': 'SoftwareApplication',
      name: 'TENVO',
      url: site,
      applicationCategory: 'BusinessApplication',
    },
    isPartOf: {
      '@type': 'ItemList',
      name: 'TENVO Demo Storefronts',
      url: `${site}/demo-stores`,
    },
    about: {
      '@type': 'Thing',
      name: store.label || store.vertical,
      description: `Business operations platform for ${store.label || store.vertical}`,
    },
  };
}

/**
 * Generate CollectionPage schema for demo stores showcase
 */
export function getDemoStoresCollectionSchema() {
  const site = getSiteUrl();
  
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'TENVO Demo Stores - Live Examples Across Industries',
    description: 'Explore live demo storefronts showcasing TENVO across retail, restaurants, automotive, healthcare, fashion, and more',
    url: `${site}/demo-stores`,
    inLanguage: 'en',
    isPartOf: {
      '@type': 'WebSite',
      name: 'TENVO',
      url: site,
    },
    about: {
      '@type': 'SoftwareApplication',
      name: 'TENVO',
      applicationCategory: 'BusinessApplication',
    },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: CLIENT_DEMO_STORES.length,
    },
  };
}
