/**
 * Content marketing utilities for blog posts, guides, and resources
 * Supports SEO-driven content strategy
 */

export type BlogCategory = 
  | 'guides'
  | 'tutorials'
  | 'industry-insights'
  | 'product-updates'
  | 'case-studies'
  | 'best-practices';

export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  category: BlogCategory;
  keywords: string[];
  author: string;
  publishDate: string;
  modifiedDate?: string;
  readingTime: number; // minutes
  featuredImage?: string;
  excerpt: string;
};

/** Priority blog topics for SEO (ranked by search volume and competition) */
export const PRIORITY_BLOG_TOPICS: ReadonlyArray<{
  title: string;
  category: BlogCategory;
  primaryKeyword: string;
  secondaryKeywords: string[];
  targetAudience: string;
  searchVolume: 'high' | 'medium' | 'low';
  competition: 'high' | 'medium' | 'low';
  priority: number; // 1-10, higher is more important
}> = [
  {
    title: 'How to Choose POS Software for Your Pakistan Business',
    category: 'guides',
    primaryKeyword: 'pos software pakistan',
    secondaryKeywords: ['best pos system', 'pos software comparison', 'restaurant pos'],
    targetAudience: 'Small business owners researching POS systems',
    searchVolume: 'high',
    competition: 'medium',
    priority: 10,
  },
  {
    title: 'FBR Compliance Guide for Small Businesses in 2026',
    category: 'guides',
    primaryKeyword: 'fbr compliance',
    secondaryKeywords: ['fbr gst', 'fbr invoicing', 'fbr tax compliance'],
    targetAudience: 'Pakistan businesses needing tax compliance',
    searchVolume: 'high',
    competition: 'low',
    priority: 9,
  },
  {
    title: 'Inventory Management Best Practices for Retail Stores',
    category: 'best-practices',
    primaryKeyword: 'inventory management best practices',
    secondaryKeywords: ['stock control', 'inventory optimization', 'retail inventory'],
    targetAudience: 'Retail store managers',
    searchVolume: 'high',
    competition: 'high',
    priority: 8,
  },
  {
    title: 'Restaurant POS vs Traditional Billing: What\'s Better?',
    category: 'industry-insights',
    primaryKeyword: 'restaurant pos',
    secondaryKeywords: ['restaurant billing', 'pos vs manual billing', 'restaurant software'],
    targetAudience: 'Restaurant owners',
    searchVolume: 'medium',
    competition: 'medium',
    priority: 8,
  },
  {
    title: 'Excel to Cloud: When to Upgrade Your Business Software',
    category: 'guides',
    primaryKeyword: 'excel to erp',
    secondaryKeywords: ['business software upgrade', 'cloud erp', 'stop using excel'],
    targetAudience: 'Businesses using spreadsheets',
    searchVolume: 'medium',
    competition: 'low',
    priority: 7,
  },
  {
    title: 'Multi-Warehouse Inventory Management: Complete Guide',
    category: 'tutorials',
    primaryKeyword: 'multi warehouse inventory',
    secondaryKeywords: ['warehouse management', 'inventory across locations', 'stock transfer'],
    targetAudience: 'Businesses with multiple locations',
    searchVolume: 'medium',
    competition: 'medium',
    priority: 7,
  },
  {
    title: 'Pharmacy Inventory Management: Best Practices & Software',
    category: 'industry-insights',
    primaryKeyword: 'pharmacy inventory management',
    secondaryKeywords: ['pharmacy software', 'medicine stock control', 'pharmacy billing'],
    targetAudience: 'Pharmacy owners',
    searchVolume: 'medium',
    competition: 'low',
    priority: 6,
  },
  {
    title: 'Auto Parts Inventory System: Features & Benefits',
    category: 'industry-insights',
    primaryKeyword: 'auto parts inventory software',
    secondaryKeywords: ['spare parts management', 'automotive inventory', 'parts catalog software'],
    targetAudience: 'Auto parts dealers',
    searchVolume: 'low',
    competition: 'low',
    priority: 6,
  },
  {
    title: 'Barcode Scanning for Inventory: Implementation Guide',
    category: 'tutorials',
    primaryKeyword: 'barcode inventory system',
    secondaryKeywords: ['barcode scanning', 'inventory tracking', 'barcode software'],
    targetAudience: 'Businesses wanting to implement barcodes',
    searchVolume: 'medium',
    competition: 'medium',
    priority: 5,
  },
  {
    title: 'Online Store vs Marketplace: Which is Right for You?',
    category: 'guides',
    primaryKeyword: 'online store builder',
    secondaryKeywords: ['ecommerce platform', 'branded storefront', 'online selling'],
    targetAudience: 'Businesses moving online',
    searchVolume: 'high',
    competition: 'high',
    priority: 5,
  },
];

/** Downloadable resources for lead generation */
export const LEAD_MAGNETS: ReadonlyArray<{
  title: string;
  description: string;
  fileName: string;
  format: 'pdf' | 'xlsx' | 'docx';
  targetKeyword: string;
  gated: boolean; // requires email?
}> = [
  {
    title: 'Inventory Management Checklist',
    description: 'Complete checklist for managing stock effectively across retail, wholesale, and distribution businesses',
    fileName: 'tenvo-inventory-management-checklist.pdf',
    format: 'pdf',
    targetKeyword: 'inventory checklist',
    gated: true,
  },
  {
    title: 'FBR Tax Compliance Calendar 2026',
    description: 'Important dates, deadlines, and requirements for FBR tax compliance in Pakistan',
    fileName: 'tenvo-fbr-compliance-calendar-2026.pdf',
    format: 'pdf',
    targetKeyword: 'fbr compliance',
    gated: false,
  },
  {
    title: 'POS System Buyer\'s Guide',
    description: 'Framework for evaluating and selecting the right POS system for your business',
    fileName: 'tenvo-pos-buyers-guide.pdf',
    format: 'pdf',
    targetKeyword: 'pos system comparison',
    gated: true,
  },
  {
    title: 'Restaurant Operations Playbook',
    description: 'Best practices for managing restaurant operations: inventory, orders, staff, and customer experience',
    fileName: 'tenvo-restaurant-operations-playbook.pdf',
    format: 'pdf',
    targetKeyword: 'restaurant management',
    gated: true,
  },
  {
    title: 'Retail Pricing Calculator Template',
    description: 'Excel template for calculating retail prices with margin, markup, and profitability analysis',
    fileName: 'tenvo-retail-pricing-calculator.xlsx',
    format: 'xlsx',
    targetKeyword: 'retail pricing',
    gated: false,
  },
];

/** Content calendar template for planning */
export type ContentCalendarEntry = {
  week: number;
  month: number;
  year: number;
  contentType: 'blog' | 'video' | 'social' | 'email' | 'resource';
  topic: string;
  targetKeyword?: string;
  status: 'planned' | 'in-progress' | 'review' | 'published';
  assignee?: string;
  publishDate?: string;
};

/** Calculate reading time for blog content */
export function calculateReadingTime(wordCount: number): number {
  const WORDS_PER_MINUTE = 200;
  return Math.ceil(wordCount / WORDS_PER_MINUTE);
}

/** Generate blog post excerpt from content */
export function generateExcerpt(content: string, maxLength: number = 160): string {
  // Remove markdown, HTML, and extra whitespace
  const plainText = content
    .replace(/#{1,6}\s+/g, '') // Remove headers
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Remove links, keep text
    .replace(/<[^>]+>/g, '') // Remove HTML
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();

  if (plainText.length <= maxLength) {
    return plainText;
  }

  // Truncate at word boundary
  const truncated = plainText.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  return lastSpace > 0 ? truncated.substring(0, lastSpace) + '...' : truncated + '...';
}

/** SEO content quality checklist */
export type ContentQualityCheck = {
  criterion: string;
  passed: boolean;
  recommendation?: string;
};

export function checkContentQuality(post: {
  title: string;
  description: string;
  content: string;
  keywords: string[];
}): ContentQualityCheck[] {
  const checks: ContentQualityCheck[] = [];
  const wordCount = post.content.split(/\s+/).length;
  const primaryKeyword = post.keywords[0];

  // Title length (50-60 chars optimal)
  checks.push({
    criterion: 'Title length',
    passed: post.title.length >= 50 && post.title.length <= 60,
    recommendation: post.title.length < 50 
      ? 'Title is too short. Aim for 50-60 characters.'
      : post.title.length > 60
      ? 'Title is too long. Aim for 50-60 characters.'
      : undefined,
  });

  // Meta description length (150-160 chars optimal)
  checks.push({
    criterion: 'Meta description length',
    passed: post.description.length >= 150 && post.description.length <= 160,
    recommendation: post.description.length < 150
      ? 'Description is too short. Aim for 150-160 characters.'
      : post.description.length > 160
      ? 'Description is too long. Aim for 150-160 characters.'
      : undefined,
  });

  // Content length (minimum 1000 words)
  checks.push({
    criterion: 'Content length',
    passed: wordCount >= 1000,
    recommendation: wordCount < 1000
      ? `Content is too short (${wordCount} words). Aim for at least 1,000 words for better SEO.`
      : undefined,
  });

  // Keyword in title
  checks.push({
    criterion: 'Primary keyword in title',
    passed: post.title.toLowerCase().includes(primaryKeyword.toLowerCase()),
    recommendation: !post.title.toLowerCase().includes(primaryKeyword.toLowerCase())
      ? `Include primary keyword "${primaryKeyword}" in the title.`
      : undefined,
  });

  // Keyword in description
  checks.push({
    criterion: 'Primary keyword in description',
    passed: post.description.toLowerCase().includes(primaryKeyword.toLowerCase()),
    recommendation: !post.description.toLowerCase().includes(primaryKeyword.toLowerCase())
      ? `Include primary keyword "${primaryKeyword}" in the meta description.`
      : undefined,
  });

  // Keyword density (1-2% optimal)
  const keywordOccurrences = (post.content.toLowerCase().match(new RegExp(primaryKeyword.toLowerCase(), 'g')) || []).length;
  const keywordDensity = (keywordOccurrences / wordCount) * 100;
  checks.push({
    criterion: 'Keyword density',
    passed: keywordDensity >= 1 && keywordDensity <= 2,
    recommendation: keywordDensity < 1
      ? `Keyword density is low (${keywordDensity.toFixed(2)}%). Use keyword more naturally.`
      : keywordDensity > 2
      ? `Keyword density is high (${keywordDensity.toFixed(2)}%). Reduce keyword usage to avoid stuffing.`
      : undefined,
  });

  return checks;
}
