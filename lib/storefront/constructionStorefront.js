/**
 * Construction Contractor Storefront
 * Portfolio-style company website — not a retail shop.
 * Shows projects, services, certifications, and RFQ form.
 * No cart, checkout, or Add-to-Cart — construction is B2B tender/contact driven.
 */

import { resolveDomainKey } from '@/lib/config/domainKeyAliases';
import {
  CONSTRUCTION_HERO_SLIDES,
  CONSTRUCTION_TRUST_STATS,
  CONSTRUCTION_PROJECT_CATEGORIES,
  CONSTRUCTION_SERVICES,
  CONSTRUCTION_CERTIFICATIONS,
  CONSTRUCTION_ACCENT_COLOR,
  CONSTRUCTION_QUICK_LINKS,
  CONSTRUCTION_SECTOR_CARDS,
  CONSTRUCTION_WHY_TABS,
  CONSTRUCTION_INSIGHTS,
  CONSTRUCTION_DELIVERY_METHODS,
  CONSTRUCTION_SPEED_STRATEGIES,
  LOCAL_CONSTRUCTION_IMAGES,
} from './constructionArchiveMap';

// Re-export archive data for components
export {
  CONSTRUCTION_HERO_SLIDES,
  CONSTRUCTION_TRUST_STATS,
  CONSTRUCTION_PROJECT_CATEGORIES,
  CONSTRUCTION_SERVICES,
  CONSTRUCTION_CERTIFICATIONS,
  CONSTRUCTION_ACCENT_COLOR,
  CONSTRUCTION_QUICK_LINKS,
  CONSTRUCTION_SECTOR_CARDS,
  CONSTRUCTION_WHY_TABS,
  CONSTRUCTION_INSIGHTS,
  CONSTRUCTION_DELIVERY_METHODS,
  CONSTRUCTION_SPEED_STRATEGIES,
  LOCAL_CONSTRUCTION_IMAGES,
};

// ── Domain Detection ──────────────────────────────────────────────────────────

export const CONSTRUCTION_CANONICALS = new Set([
  'construction-contractor',
]);

/**
 * @param {string | null | undefined} domainKey
 */
export function isConstructionStore(domainKey) {
  if (!domainKey) return false;
  return CONSTRUCTION_CANONICALS.has(resolveDomainKey(String(domainKey)));
}

// ── Config Resolver ───────────────────────────────────────────────────────────

/**
 * Resolve storefront config for construction domain.
 * @param {Record<string, unknown> | null | undefined} settings
 * @param {string} businessName
 */
export function getConstructionStorefrontConfig(settings, businessName = 'Construction Co.') {
  const s = settings?.storefront?.construction || {};
  return {
    heroTitle:         s.heroTitle         || businessName,
    heroTagline:       s.heroTagline       || 'Building the Future — PEC Registered Contractor',
    heroSubtitle:      s.heroSubtitle      || 'General construction, civil engineering, BOQ-based PEC/PPRA projects',
    profile:           s.profile           || 'default',
    accentColor:       s.accentColor       || '#a71930',
    showTrustStrip:    s.showTrustStrip    !== false,
    showProjects:      s.showProjects      !== false,
    showServices:      s.showServices      !== false,
    showCertifications: s.showCertifications !== false,
    showRFQForm:       s.showRFQForm       !== false,
    heroVideoUrl:      s.heroVideoUrl      || null,
    heroPosterUrl:     s.heroPosterUrl     || null,
  };
}

// ── RFQ Form Subjects ────────────────────────────────────────────────────────

export const CONSTRUCTION_RFQ_SUBJECTS = [
  'Building Construction',
  'Roads & Highways',
  'Bridges & Structures',
  'Irrigation & Dams',
  'Sewerage & Water Supply',
  'MEP & Electrical',
  'Industrial Facility',
  'Pharmaceutical / cGMP',
  'BOQ Estimation Request',
  'Other / General Inquiry',
];

// ── Registration Media Defaults ───────────────────────────────────────────────

export const CONSTRUCTION_REGISTRATION_METADATA = {
  description:
    'PEC registered general contractor for public and private sector construction — buildings, highways, bridges, dams, and EPC projects. BOQ-based billing, IPC running bills, and PPRA/PEC compliant procurement.',
  keywords:
    'construction contractor, PEC registered, civil engineering, BOQ, IPC, running bill, PPRA, NHA, CWD, general contractor Pakistan',
  announcement:
    'PEC Registered · BOQ & IPC Management · Public & Private Sector Projects',
  accentColor: '#a71930',
  businessHours: 'Mon – Sat, 8:00 AM – 6:00 PM',
  cover_image_url: '/tenvo-img/construction/construction-1.jpg',
  logo_url: null,
};

/**
 * Build default construction storefront seed settings for registration.
 * @param {string} businessName
 */
export function buildDefaultConstructionStorefrontSettings(businessName) {
  return {
    announcement: CONSTRUCTION_REGISTRATION_METADATA.announcement,
    brand: {
      primaryColor: CONSTRUCTION_REGISTRATION_METADATA.accentColor,
    },
    businessHours: CONSTRUCTION_REGISTRATION_METADATA.businessHours,
    freeShippingThreshold: 0,
    returnPolicyDays: 0,
    storefront: {
      construction: {
        heroTitle: businessName,
        heroTagline: 'PEC Registered General Contractor',
        heroSubtitle: CONSTRUCTION_REGISTRATION_METADATA.description,
        showTrustStrip: true,
        showProjects: true,
        showServices: true,
        showCertifications: true,
        showRFQForm: true,
      },
    },
  };
}

/**
 * @returns {{ logo_url?: string, cover_image_url?: string }}
 */
export function getDefaultConstructionBusinessMedia() {
  return {
    cover_image_url: CONSTRUCTION_REGISTRATION_METADATA.cover_image_url,
  };
}
