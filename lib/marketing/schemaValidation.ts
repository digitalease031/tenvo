/**
 * Schema.org validation utilities
 * Helps ensure structured data is valid before deployment
 */

import type { JsonLdObject } from './structured-data';

export type ValidationResult = {
  valid: boolean;
  errors: string[];
  warnings: string[];
};

/** Validate required schema.org properties */
export function validateSchema(schema: JsonLdObject, type: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check @context
  if (!schema['@context']) {
    errors.push('Missing @context property');
  } else if (schema['@context'] !== 'https://schema.org') {
    warnings.push('@context should be "https://schema.org"');
  }

  // Check @type
  if (!schema['@type']) {
    errors.push('Missing @type property');
  } else if (schema['@type'] !== type) {
    errors.push(`Expected @type "${type}", got "${schema['@type']}"`);
  }

  // Type-specific validations
  switch (type) {
    case 'Organization':
      validateOrganization(schema, errors, warnings);
      break;
    case 'Product':
      validateProduct(schema, errors, warnings);
      break;
    case 'FAQPage':
      validateFAQPage(schema, errors, warnings);
      break;
    case 'Article':
      validateArticle(schema, errors, warnings);
      break;
    case 'WebSite':
      validateWebSite(schema, errors, warnings);
      break;
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

function validateOrganization(schema: JsonLdObject, errors: string[], warnings: string[]): void {
  if (!schema.name) errors.push('Organization: Missing required "name"');
  if (!schema.url) errors.push('Organization: Missing required "url"');
  
  if (!schema.logo) {
    warnings.push('Organization: Missing recommended "logo"');
  }
  
  if (!schema.contactPoint) {
    warnings.push('Organization: Missing recommended "contactPoint"');
  }
}

function validateProduct(schema: JsonLdObject, errors: string[], warnings: string[]): void {
  if (!schema.name) errors.push('Product: Missing required "name"');
  
  if (!schema.offers) {
    warnings.push('Product: Missing recommended "offers"');
  }
  
  if (!schema.description) {
    warnings.push('Product: Missing recommended "description"');
  }
  
  if (!schema.brand) {
    warnings.push('Product: Missing recommended "brand"');
  }
}

function validateFAQPage(schema: JsonLdObject, errors: string[], warnings: string[]): void {
  if (!schema.mainEntity) {
    errors.push('FAQPage: Missing required "mainEntity"');
    return;
  }
  
  const mainEntity = schema.mainEntity as Array<Record<string, unknown>>;
  if (!Array.isArray(mainEntity) || mainEntity.length === 0) {
    errors.push('FAQPage: "mainEntity" must be a non-empty array');
    return;
  }
  
  mainEntity.forEach((item, index) => {
    if (item['@type'] !== 'Question') {
      errors.push(`FAQPage: mainEntity[${index}] must be of type "Question"`);
    }
    if (!item.name) {
      errors.push(`FAQPage: mainEntity[${index}] missing "name"`);
    }
    if (!item.acceptedAnswer) {
      errors.push(`FAQPage: mainEntity[${index}] missing "acceptedAnswer"`);
    }
  });
}

function validateArticle(schema: JsonLdObject, errors: string[], warnings: string[]): void {
  if (!schema.headline) errors.push('Article: Missing required "headline"');
  if (!schema.datePublished) errors.push('Article: Missing required "datePublished"');
  
  if (!schema.author) {
    warnings.push('Article: Missing recommended "author"');
  }
  
  if (!schema.publisher) {
    warnings.push('Article: Missing recommended "publisher"');
  }
  
  if (!schema.image) {
    warnings.push('Article: Missing recommended "image"');
  }
}

function validateWebSite(schema: JsonLdObject, errors: string[], warnings: string[]): void {
  if (!schema.name) errors.push('WebSite: Missing required "name"');
  if (!schema.url) errors.push('WebSite: Missing required "url"');
  
  if (!schema.potentialAction) {
    warnings.push('WebSite: Missing recommended "potentialAction" (SearchAction)');
  }
}

/** Test schema markup in browser console */
export function getSchemaTestScript(schema: JsonLdObject): string {
  return `
// Copy and paste this into browser console to test schema
const schema = ${JSON.stringify(schema, null, 2)};

// Google's Structured Data Testing Tool
console.log('Test with Google:', 'https://search.google.com/test/rich-results');
console.log('Test with Schema.org:', 'https://validator.schema.org/');

// Copy JSON to clipboard
copy(JSON.stringify(schema));
console.log('✅ Schema JSON copied to clipboard. Paste it into the testing tools above.');
  `.trim();
}

/** Generate test URLs for schema validation */
export function getValidationUrls(pageUrl: string): {
  google: string;
  schemaOrg: string;
  facebook: string;
  twitter: string;
} {
  const encoded = encodeURIComponent(pageUrl);
  
  return {
    google: `https://search.google.com/test/rich-results?url=${encoded}`,
    schemaOrg: `https://validator.schema.org/#url=${encoded}`,
    facebook: `https://developers.facebook.com/tools/debug/?q=${encoded}`,
    twitter: `https://cards-dev.twitter.com/validator?url=${encoded}`,
  };
}

/** Common schema validation errors and fixes */
export const COMMON_VALIDATION_ISSUES = [
  {
    error: 'Missing required property',
    fix: 'Add the required property to the schema object',
    severity: 'error',
  },
  {
    error: 'Invalid date format',
    fix: 'Use ISO 8601 format: YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss',
    severity: 'error',
  },
  {
    error: 'Invalid URL',
    fix: 'Ensure URLs are absolute (include https://) and properly encoded',
    severity: 'error',
  },
  {
    error: 'Missing recommended property',
    fix: 'Add recommended properties to improve rich results eligibility',
    severity: 'warning',
  },
  {
    error: 'Incorrect @type',
    fix: 'Use the correct schema type from schema.org documentation',
    severity: 'error',
  },
  {
    error: 'Nested object missing properties',
    fix: 'Ensure nested objects (like offers, author) have required properties',
    severity: 'error',
  },
] as const;

/** Schema markup best practices checklist */
export const SCHEMA_BEST_PRACTICES = [
  'Use specific schema types (not just Thing)',
  'Include all recommended properties, not just required ones',
  'Use absolute URLs (with https://)',
  'Use proper date formats (ISO 8601)',
  'Include structured data on all relevant pages',
  'Test schema with Google Rich Results Test',
  'Validate with Schema.org validator',
  'Keep schema up to date with content changes',
  'Don\'t include content not visible on the page',
  'Use multiple schema types when appropriate',
  'Include images with proper dimensions',
  'Add alt text to all images',
] as const;
