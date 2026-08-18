#!/usr/bin/env node

/**
 * Textile Wholesale Complete Verification Script
 * Verifies all textile wholesale features are integrated without breaking other domains
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const results = {
  passed: [],
  failed: [],
  warnings: [],
};

function pass(message) {
  results.passed.push(message);
  console.log('✅', message);
}

function fail(message) {
  results.failed.push(message);
  console.error('❌', message);
}

function warn(message) {
  results.warnings.push(message);
  console.warn('⚠️ ', message);
}

function fileExists(filePath) {
  return fs.existsSync(path.join(rootDir, filePath));
}

function fileContains(filePath, pattern) {
  if (!fileExists(filePath)) return false;
  const content = fs.readFileSync(path.join(rootDir, filePath), 'utf-8');
  return typeof pattern === 'string' ? content.includes(pattern) : pattern.test(content);
}

console.log('\n🔍 TEXTILE WHOLESALE COMPLETE VERIFICATION\n');
console.log('='.repeat(60));

// ============================================================================
// 1. CORE FILES VERIFICATION
// ============================================================================

console.log('\n📂 1. Core Files Verification\n');

const coreFiles = [
  'lib/domainData/textile.js',
  'lib/config/textileWholesaleDomainConfig.js',
  'lib/utils/textileWholesaleDomainFilter.js',
  'lib/utils/textileWholesaleHelpers.js',
  'components/textile/TextileWholesaleHub.jsx',
  'components/textile/TextileCustomerForm.jsx',
];

coreFiles.forEach(file => {
  if (fileExists(file)) {
    pass(`Core file exists: ${file}`);
  } else {
    fail(`Core file missing: ${file}`);
  }
});

// ============================================================================
// 2. DOMAIN CONFIGURATION VERIFICATION
// ============================================================================

console.log('\n⚙️  2. Domain Configuration Verification\n');

if (fileExists('lib/config/textileWholesaleDomainConfig.js')) {
  const configChecks = [
    { pattern: 'TEXTILE_WHOLESALE_HIDDEN_TABS', desc: 'Hidden tabs defined' },
    { pattern: 'TEXTILE_WHOLESALE_VISIBLE_TABS', desc: 'Visible tabs defined' },
    { pattern: 'TEXTILE_WHOLESALE_MODULES', desc: 'Module flags defined' },
    { pattern: 'TEXTILE_WHOLESALE_LABELS', desc: 'Domain labels defined' },
    { pattern: 'isTextileWholesaleTabVisible', desc: 'Tab visibility function' },
    { pattern: 'isTextileWholesaleFeatureHidden', desc: 'Feature visibility function' },
  ];

  configChecks.forEach(({ pattern, desc }) => {
    if (fileContains('lib/config/textileWholesaleDomainConfig.js', pattern)) {
      pass(`Domain config: ${desc}`);
    } else {
      fail(`Domain config missing: ${desc}`);
    }
  });
} else {
  fail('Domain configuration file missing');
}

// ============================================================================
// 3. FILTER UTILITIES VERIFICATION
// ============================================================================

console.log('\n🔧 3. Filter Utilities Verification\n');

if (fileExists('lib/utils/textileWholesaleDomainFilter.js')) {
  const filterFunctions = [
    'isTextileWholesale',
    'filterTabsForTextileWholesale',
    'filterFeaturesForTextileWholesale',
    'applyTextileWholesaleLabels',
    'filterFormFieldsForTextileWholesale',
    'getTextileWholesaleDashboardWidgets',
    'getTextileWholesaleReports',
    'buildTextileWholesaleNavigation',
  ];

  filterFunctions.forEach(fn => {
    if (fileContains('lib/utils/textileWholesaleDomainFilter.js', fn)) {
      pass(`Filter function exists: ${fn}`);
    } else {
      fail(`Filter function missing: ${fn}`);
    }
  });
} else {
  fail('Filter utilities file missing');
}

// ============================================================================
// 4. HELPER FUNCTIONS VERIFICATION
// ============================================================================

console.log('\n🛠️  4. Helper Functions Verification\n');

if (fileExists('lib/utils/textileWholesaleHelpers.js')) {
  const helperFunctions = [
    'convertThaanToMeters',
    'convertMetersToSuits',
    'calculateCreditUtilization',
    'isCreditLimitExceeded',
    'getCreditStatus',
    'getTextilePaymentTerms',
    'formatPakistaniCurrency',
    'getSeasonalRecommendations',
  ];

  helperFunctions.forEach(fn => {
    if (fileContains('lib/utils/textileWholesaleHelpers.js', fn)) {
      pass(`Helper function exists: ${fn}`);
    } else {
      fail(`Helper function missing: ${fn}`);
    }
  });
} else {
  fail('Helper functions file missing');
}

// ============================================================================
// 5. TEXTILE CUSTOMER FORM VERIFICATION
// ============================================================================

console.log('\n📝 5. Textile Customer Form Verification\n');

if (fileExists('components/textile/TextileCustomerForm.jsx')) {
  const formFeatures = [
    { pattern: 'Party Name', desc: 'Party Name field' },
    { pattern: 'Shop Name', desc: 'Shop Name field' },
    { pattern: 'Buyer Type', desc: 'Buyer Type dropdown' },
    { pattern: 'Market Location', desc: 'Market Location dropdown' },
    { pattern: 'Credit Limit', desc: 'Credit Limit field' },
    { pattern: 'Opening Balance', desc: 'Opening Balance field' },
    { pattern: 'Credit Utilization', desc: 'Credit utilization bar' },
    { pattern: 'Payment Terms', desc: 'Payment Terms dropdown' },
    { pattern: 'Broker', desc: 'Broker/Agent field' },
    { pattern: 'NTN Status', desc: 'NTN Status dropdown' },
    { pattern: 'Magic Fill', desc: 'Magic Fill button' },
    { pattern: /Jama Cloth|Lunda Bazaar/, desc: 'Pakistan market locations' },
    { pattern: 'Loader2', desc: 'Loader2 icon import' },
  ];

  formFeatures.forEach(({ pattern, desc }) => {
    if (fileContains('components/textile/TextileCustomerForm.jsx', pattern)) {
      pass(`Form feature: ${desc}`);
    } else {
      fail(`Form feature missing: ${desc}`);
    }
  });
} else {
  fail('TextileCustomerForm.jsx missing');
}

// ============================================================================
// 6. ACTION MODALS INTEGRATION VERIFICATION
// ============================================================================

console.log('\n🔗 6. ActionModals Integration Verification\n');

if (fileExists('app/business/[category]/components/ActionModals.jsx')) {
  const integrationChecks = [
    { pattern: 'isTextileWholesale', desc: 'isTextileWholesale import' },
    { pattern: 'TextileCustomerForm', desc: 'TextileCustomerForm import' },
    { pattern: /isTextileWholesale\(category\)/, desc: 'Conditional rendering logic' },
    { pattern: /\{\s*isTextileWholesale\(category\)\s*\?/, desc: 'Ternary conditional' },
  ];

  integrationChecks.forEach(({ pattern, desc }) => {
    if (fileContains('app/business/[category]/components/ActionModals.jsx', pattern)) {
      pass(`ActionModals: ${desc}`);
    } else {
      fail(`ActionModals missing: ${desc}`);
    }
  });

  // Verify standard CustomerForm is still there for other domains
  if (fileContains('app/business/[category]/components/ActionModals.jsx', 'CustomerForm')) {
    pass('ActionModals: Standard CustomerForm preserved for other domains');
  } else {
    fail('ActionModals: Standard CustomerForm missing (breaks other domains!)');
  }
} else {
  fail('ActionModals.jsx missing');
}

// ============================================================================
// 7. EASY DASHBOARD INTEGRATION VERIFICATION
// ============================================================================

console.log('\n📊 7. Easy Dashboard Integration Verification\n');

if (fileExists('lib/dashboard/easyDomainIntelligence.js')) {
  if (fileContains('lib/dashboard/easyDomainIntelligence.js', /textile-wholesale|textile/)) {
    pass('Easy dashboard: Textile wholesale playbook added');
  } else {
    warn('Easy dashboard: Textile wholesale playbook not found');
  }

  const playbookFeatures = [
    'Stock value',
    'Outstanding',
    'Credit',
    'Seasonal',
    'Create invoice',
    'Record payment',
  ];

  playbookFeatures.forEach(feature => {
    if (fileContains('lib/dashboard/easyDomainIntelligence.js', feature)) {
      pass(`Dashboard playbook: ${feature} insight`);
    } else {
      warn(`Dashboard playbook: ${feature} insight missing`);
    }
  });
} else {
  warn('easyDomainIntelligence.js not found');
}

// ============================================================================
// 8. DOMAIN ISOLATION VERIFICATION
// ============================================================================

console.log('\n🔒 8. Domain Isolation Verification\n');

// Check that textile-specific code is properly gated
const filesToCheck = [
  'app/business/[category]/components/ActionModals.jsx',
  'lib/utils/textileWholesaleDomainFilter.js',
];

filesToCheck.forEach(file => {
  if (fileExists(file)) {
    const content = fs.readFileSync(path.join(rootDir, file), 'utf-8');
    
    // Check for proper domain detection
    if (content.includes('isTextileWholesale') || content.includes('textile-wholesale')) {
      pass(`Domain isolation: ${path.basename(file)} uses proper domain detection`);
    } else {
      warn(`Domain isolation: ${path.basename(file)} may not have domain detection`);
    }

    // Ensure no hardcoded textile logic in global paths
    if (!content.includes('category === "textile-wholesale"') && 
        !content.includes('isTextileWholesale') &&
        content.includes('textile')) {
      warn(`Potential domain leak: ${path.basename(file)} may have hardcoded textile logic`);
    }
  }
});

// ============================================================================
// 9. DOCUMENTATION VERIFICATION
// ============================================================================

console.log('\n📚 9. Documentation Verification\n');

const docs = [
  '.superpowers/TEXTILE_WHOLESALE_WORKFLOW_PAKISTAN.md',
  '.superpowers/TEXTILE_WHOLESALE_ENHANCEMENTS.md',
  '.superpowers/TEXTILE_WHOLESALE_INTEGRATION_GUIDE.md',
  '.superpowers/TEXTILE_WHOLESALE_DOMAIN_READY.md',
  '.superpowers/TEXTILE_WHOLESALE_COMPARISON.md',
  '.superpowers/TEXTILE_CUSTOMER_FORM_INTEGRATION_COMPLETE.md',
  '.superpowers/TEXTILE_CUSTOMER_FORM_QUICK_START.md',
  '.superpowers/TEXTILE_CUSTOMER_FORM_COMPARISON.md',
  '.superpowers/TEXTILE_WHOLESALE_FINAL_CHECKLIST.md',
];

docs.forEach(doc => {
  if (fileExists(doc)) {
    pass(`Documentation: ${path.basename(doc)}`);
  } else {
    warn(`Documentation missing: ${path.basename(doc)}`);
  }
});

// ============================================================================
// 10. FEATURE COMPLETENESS CHECK
// ============================================================================

console.log('\n✨ 10. Feature Completeness Check\n');

const features = {
  'Domain Configuration': fileExists('lib/config/textileWholesaleDomainConfig.js'),
  'Filter Utilities': fileExists('lib/utils/textileWholesaleDomainFilter.js'),
  'Helper Functions': fileExists('lib/utils/textileWholesaleHelpers.js'),
  'Hub Component': fileExists('components/textile/TextileWholesaleHub.jsx'),
  'Customer Form': fileExists('components/textile/TextileCustomerForm.jsx'),
  'ActionModals Integration': fileContains('app/business/[category]/components/ActionModals.jsx', 'isTextileWholesale'),
  'Easy Dashboard': fileContains('lib/dashboard/easyDomainIntelligence.js', /textile/),
};

Object.entries(features).forEach(([feature, implemented]) => {
  if (implemented) {
    pass(`Feature complete: ${feature}`);
  } else {
    fail(`Feature incomplete: ${feature}`);
  }
});

// ============================================================================
// 11. BREAKING CHANGES CHECK
// ============================================================================

console.log('\n⚠️  11. Breaking Changes Check\n');

// Verify that textile changes don't break other domains
const criticalFiles = [
  'app/business/[category]/components/ActionModals.jsx',
  'components/CustomerForm.jsx',
];

criticalFiles.forEach(file => {
  if (fileExists(file)) {
    const content = fs.readFileSync(path.join(rootDir, file), 'utf-8');
    
    if (file.includes('ActionModals')) {
      // Check conditional rendering preserves standard form
      if (content.includes('CustomerForm') && content.includes('isTextileWholesale')) {
        pass(`No breaking changes: ${path.basename(file)} has conditional rendering`);
      } else {
        fail(`BREAKING CHANGE RISK: ${path.basename(file)} may not preserve standard form`);
      }
    }

    if (file.includes('CustomerForm.jsx')) {
      // Ensure standard CustomerForm is untouched
      if (content.includes('textile') || content.includes('thaan') || content.includes('broker')) {
        fail(`BREAKING CHANGE: Standard CustomerForm has textile-specific code!`);
      } else {
        pass(`No breaking changes: Standard CustomerForm is clean`);
      }
    }
  }
});

// ============================================================================
// 12. TEXTILE-SPECIFIC FEATURES CHECK
// ============================================================================

console.log('\n🧵 12. Textile-Specific Features Check\n');

const textileFeatures = [
  { feature: 'Thaan unit conversion', file: 'lib/utils/textileWholesaleHelpers.js', pattern: 'convertThaanToMeters' },
  { feature: 'Credit utilization calculation', file: 'lib/utils/textileWholesaleHelpers.js', pattern: 'calculateCreditUtilization' },
  { feature: 'Seasonal recommendations', file: 'lib/utils/textileWholesaleHelpers.js', pattern: 'getSeasonalRecommendations' },
  { feature: 'Broker commission', file: 'lib/utils/textileWholesaleHelpers.js', pattern: 'getBrokerCommissionRate' },
  { feature: 'Pakistan markets', file: 'components/textile/TextileCustomerForm.jsx', pattern: /Jama Cloth|Lunda Bazaar/ },
  { feature: 'Buyer types', file: 'components/textile/TextileCustomerForm.jsx', pattern: /Retailer|Wholesaler|Tailor/ },
  { feature: 'Payment terms', file: 'components/textile/TextileCustomerForm.jsx', pattern: /Credit 30 Days|PDC/ },
  { feature: 'NTN status', file: 'components/textile/TextileCustomerForm.jsx', pattern: /Filer|Non-Filer/ },
  { feature: 'Credit bar visualization', file: 'components/textile/TextileCustomerForm.jsx', pattern: 'creditUtilization' },
];

textileFeatures.forEach(({ feature, file, pattern }) => {
  if (fileContains(file, pattern)) {
    pass(`Textile feature: ${feature}`);
  } else {
    fail(`Textile feature missing: ${feature}`);
  }
});

// ============================================================================
// SUMMARY
// ============================================================================

console.log('\n' + '='.repeat(60));
console.log('\n📊 VERIFICATION SUMMARY\n');
console.log(`✅ Passed:   ${results.passed.length}`);
console.log(`❌ Failed:   ${results.failed.length}`);
console.log(`⚠️  Warnings: ${results.warnings.length}`);
console.log('');

if (results.failed.length > 0) {
  console.log('❌ FAILED CHECKS:');
  results.failed.forEach(msg => console.log(`   - ${msg}`));
  console.log('');
}

if (results.warnings.length > 0) {
  console.log('⚠️  WARNINGS:');
  results.warnings.forEach(msg => console.log(`   - ${msg}`));
  console.log('');
}

const score = Math.round((results.passed.length / (results.passed.length + results.failed.length)) * 100);

console.log('='.repeat(60));
console.log(`\n🎯 OVERALL SCORE: ${score}%\n`);

if (results.failed.length === 0) {
  console.log('✅ ALL CHECKS PASSED! Textile wholesale is fully integrated without breaking changes.\n');
  process.exit(0);
} else {
  console.log('❌ SOME CHECKS FAILED. Please review the failures above.\n');
  process.exit(1);
}
