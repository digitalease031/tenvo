/**
 * Open Graph image configuration for social media sharing
 * Ensures proper preview cards on Facebook, LinkedIn, Twitter, etc.
 */

import { getSiteUrl } from './site-url';

export type OgImageConfig = {
  url: string;
  width: number;
  height: number;
  alt: string;
  type?: string;
};

/** Standard OG image dimensions (1.91:1 ratio) */
export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;

/** Get default Open Graph image configuration */
export function getDefaultOgImage(alt?: string): OgImageConfig {
  const site = getSiteUrl();
  return {
    url: `${site}/industrial_hero_image.png`,
    width: OG_IMAGE_WIDTH,
    height: OG_IMAGE_HEIGHT,
    alt: alt || 'TENVO - Business Operations Platform',
    type: 'image/png',
  };
}

/** Generate OG image for demo store */
export function getDemoStoreOgImage(storeName: string, heroImage?: string): OgImageConfig {
  const site = getSiteUrl();
  return {
    url: heroImage || `${site}/industrial_hero_image.png`,
    width: OG_IMAGE_WIDTH,
    height: OG_IMAGE_HEIGHT,
    alt: `${storeName} - Demo Store powered by TENVO`,
    type: 'image/png',
  };
}

/** Generate OG image for solution/industry page */
export function getIndustryOgImage(industry: string, imagePath?: string): OgImageConfig {
  const site = getSiteUrl();
  return {
    url: imagePath || `${site}/industrial_hero_image.png`,
    width: OG_IMAGE_WIDTH,
    height: OG_IMAGE_HEIGHT,
    alt: `TENVO for ${industry} - Complete Business Management Solution`,
    type: 'image/png',
  };
}

/** Generate OG image for blog post */
export function getBlogPostOgImage(title: string, imagePath?: string): OgImageConfig {
  const site = getSiteUrl();
  return {
    url: imagePath || `${site}/industrial_hero_image.png`,
    width: OG_IMAGE_WIDTH,
    height: OG_IMAGE_HEIGHT,
    alt: title,
    type: 'image/png',
  };
}

/**
 * Validate OG image meets requirements
 * - Minimum 200x200px (Facebook requirement)
 * - Recommended 1200x630px (1.91:1 ratio)
 * - Maximum 8MB file size
 */
export function validateOgImage(image: OgImageConfig): {
  valid: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];

  if (image.width < 200 || image.height < 200) {
    warnings.push('Image dimensions below minimum 200x200px');
  }

  if (image.width !== OG_IMAGE_WIDTH || image.height !== OG_IMAGE_HEIGHT) {
    warnings.push(
      `Non-standard dimensions (${image.width}x${image.height}). Recommended: ${OG_IMAGE_WIDTH}x${OG_IMAGE_HEIGHT}`
    );
  }

  const aspectRatio = image.width / image.height;
  const idealRatio = OG_IMAGE_WIDTH / OG_IMAGE_HEIGHT;
  if (Math.abs(aspectRatio - idealRatio) > 0.1) {
    warnings.push(
      `Aspect ratio ${aspectRatio.toFixed(2)}:1 differs from recommended 1.91:1`
    );
  }

  return {
    valid: warnings.length === 0,
    warnings,
  };
}
