#!/usr/bin/env node
/**
 * SEO verification script for TENVO
 * Checks for missing SEO elements and provides recommendations
 */

import { existsSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

let errorCount = 0;
let warningCount = 0;
let successCount = 0;

function success(message) {
  console.log(`✅ ${message}`);
  successCount++;
}

function error(message) {
  console.error(`❌ ${message}`);
  errorCount++;
}

function warning(message) {
  console.warn(`⚠️  ${message}`);
  warningCount++;
}

function info(message) {
  console.log(`ℹ️  ${message}`);
}

console.log('🔍 TENVO SEO Verification\n');

// Check robots.txt
console.log('📋 Checking robots.txt...');
const robotsTxtPath = join(rootDir, 'public', 'robots.txt');
if (existsSync(robotsTxtPath)) {
  const content = readFileSync(robotsTxtPath, 'utf-8');
  if (content.includes('Sitemap:')) {
    success('robots.txt exists with sitemap reference');
  } else {
    warning('robots.txt exists but missing sitemap reference');
  }
  if (content.includes('GPTBot') || content.includes('ChatGPT')) {
    success('robots.txt includes AI crawler directives');
  }
} else {
  error('robots.txt not found in public/ directory');
}

// Check sitemap
console.log('\n🗺️  Checking sitemap configuration...');
const sitemapPath = join(rootDir, 'app', 'sitemap.ts');
if (existsSync(sitemapPath)) {
  success('Sitemap generator exists at app/sitemap.ts');
  const sitemapContent = readFileSync(sitemapPath, 'utf-8');
  if (sitemapContent.includes('MARKETING_SITEMAP_ROUTES')) {
    success('Sitemap includes marketing routes');
  }
  if (sitemapContent.includes('listDomainPackages')) {
    success('Sitemap includes domain package pages');
  }
  if (sitemapContent.includes('caseStudies')) {
    success('Sitemap includes case studies');
  }
} else {
  error('Sitemap generator not found');
}

// Check structured data
console.log('\n📊 Checking structured data...');
const structuredDataPath = join(rootDir, 'lib', 'marketing', 'structured-data.ts');
if (existsSync(structuredDataPath)) {
  const content = readFileSync(structuredDataPath, 'utf-8');
  
  const schemas = [
    'getOrganizationSchema',
    'getLocalBusinessSchema',
    'getWebSiteSchema',
    'getSoftwareApplicationSchema',
    'getFAQSchema',
    'getArticleSchema',
    'getProductSchema',
    'getBreadcrumbSchema',
  ];
  
  schemas.forEach(schema => {
    if (content.includes(schema)) {
      success(`${schema} is defined`);
    } else {
      warning(`${schema} is missing`);
    }
  });
  
  // Check for enhanced schemas
  const enhancedSchemas = [
    'getDemoStoreSchema',
    'getVideoObjectSchema',
    'getHowToSchema',
    'getReviewSchema',
  ];
  
  enhancedSchemas.forEach(schema => {
    if (content.includes(schema)) {
      success(`Enhanced: ${schema} is defined`);
    } else {
      info(`Optional: ${schema} could be added for better SEO`);
    }
  });
} else {
  error('structured-data.ts not found');
}

// Check SEO configuration
console.log('\n⚙️  Checking SEO configuration...');
const seoConfigPath = join(rootDir, 'lib', 'marketing', 'seo.ts');
if (existsSync(seoConfigPath)) {
  const content = readFileSync(seoConfigPath, 'utf-8');
  
  if (content.includes('DEFAULT_KEYWORDS')) {
    success('Default keywords are defined');
  }
  
  if (content.includes('INDUSTRY_KEYWORDS')) {
    success('Industry-specific keywords are defined');
  } else {
    warning('Industry-specific keywords are not defined');
  }
  
  if (content.includes('buildMarketingMetadata')) {
    success('Metadata builder function exists');
  }
  
  if (content.includes('getSeoVerification')) {
    success('SEO verification function exists');
  }
} else {
  error('seo.ts not found');
}

// Check meta tags in root layout
console.log('\n🏠 Checking root layout metadata...');
const layoutPath = join(rootDir, 'app', 'layout.tsx');
if (existsSync(layoutPath)) {
  const content = readFileSync(layoutPath, 'utf-8');
  
  if (content.includes('metadata')) {
    success('Root layout exports metadata');
  }
  
  if (content.includes('viewport')) {
    success('Viewport configuration exists');
  }
  
  if (content.includes('DefaultJsonLd')) {
    success('Default JSON-LD component is rendered');
  }
  
  if (content.includes('GoogleAnalytics')) {
    success('Google Analytics component is included');
  }
} else {
  error('Root layout.tsx not found');
}

// Check for AI discovery files
console.log('\n🤖 Checking AI discovery files...');
const llmsTxtPath = join(rootDir, 'public', 'llms.txt');
if (existsSync(llmsTxtPath)) {
  const content = readFileSync(llmsTxtPath, 'utf-8');
  if (content.includes('TENVO') && content.includes('Overview')) {
    success('llms.txt exists with proper content');
  } else {
    warning('llms.txt exists but may need more detail');
  }
} else {
  warning('llms.txt not found (optional but recommended for AI discovery)');
}

const humansTxtPath = join(rootDir, 'public', 'humans.txt');
if (existsSync(humansTxtPath)) {
  success('humans.txt exists');
} else {
  info('humans.txt not found (optional)');
}

// Check Open Graph images
console.log('\n🖼️  Checking Open Graph assets...');
const ogImagePath = join(rootDir, 'public', 'industrial_hero_image.png');
if (existsSync(ogImagePath)) {
  success('Default OG image exists');
} else {
  warning('Default OG image not found');
}

// Check environment variables
console.log('\n🔐 Checking SEO-related environment variables...');
const envVars = [
  'NEXT_PUBLIC_APP_URL',
  'NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION',
  'NEXT_PUBLIC_TWITTER_HANDLE',
  'NEXT_PUBLIC_SOCIAL_LINKEDIN',
  'NEXT_PUBLIC_GA_MEASUREMENT_ID',
];

envVars.forEach(varName => {
  if (process.env[varName]) {
    success(`${varName} is set`);
  } else {
    warning(`${varName} is not set (should be configured in production)`);
  }
});

// Check demo stores page
console.log('\n🏪 Checking demo stores showcase...');
const demoStoresPagePath = join(rootDir, 'app', 'demo-stores', 'page.jsx');
if (existsSync(demoStoresPagePath)) {
  success('Demo stores showcase page exists');
} else {
  warning('Demo stores showcase page not found - create for better SEO');
}

// Summary
console.log('\n' + '='.repeat(60));
console.log('📊 SEO Verification Summary\n');
console.log(`✅ Passed: ${successCount}`);
console.log(`⚠️  Warnings: ${warningCount}`);
console.log(`❌ Errors: ${errorCount}`);
console.log('='.repeat(60));

// Recommendations
console.log('\n💡 Recommendations:\n');
console.log('1. Set up Google Search Console and submit sitemap');
console.log('2. Configure SEO verification meta tags in production env');
console.log('3. Create industry-specific landing pages with long-tail keywords');
console.log('4. Add schema markup to pricing tiers and testimonials');
console.log('5. Create comparison pages targeting competitive keywords');
console.log('6. Submit business to directories (Google Business, Bing, etc.)');
console.log('7. Create blog content for organic traffic');
console.log('8. Generate video content and add VideoObject schema');
console.log('9. Implement breadcrumb navigation with schema');
console.log('10. Add customer reviews with Review schema\n');

if (errorCount > 0) {
  console.error('❌ SEO verification failed with errors. Please fix the issues above.\n');
  process.exit(1);
} else if (warningCount > 0) {
  console.warn('⚠️  SEO verification passed with warnings. Consider addressing them.\n');
  process.exit(0);
} else {
  console.log('✅ SEO verification passed successfully!\n');
  process.exit(0);
}
