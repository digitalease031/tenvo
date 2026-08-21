import { isWholesaleDomain, isWholesaleEnterpriseNavKey } from '../lib/utils/wholesaleDomain.js';
import { getNavItemAccess, getRequiredPlan } from '../lib/rbac/permissions.js';
import { FEATURE_MIN_PLAN } from '../lib/config/plans.js';

let passed = 0;
let failed = 0;

function assert(condition, description) {
    if (condition) {
        console.log(`✓ ${description}`);
        passed++;
    } else {
        console.error(`✗ FAIL: ${description}`);
        failed++;
    }
}

console.log('=== Wholesale & Plan Gating Verification ===\n');

// Test 1: Domain Detection
assert(isWholesaleDomain('textile-wholesale') === true, 'textile-wholesale is identified as wholesale domain');
assert(isWholesaleDomain('wholesale-distribution') === true, 'wholesale-distribution is identified as wholesale domain');
assert(isWholesaleDomain('lubricant-distribution') === true, 'lubricant-distribution is identified as wholesale domain');
assert(isWholesaleDomain('b2b-wholesale') === true, 'b2b-wholesale is identified as wholesale domain');
assert(isWholesaleDomain('garments') === false, 'garments is NOT a wholesale domain');
assert(isWholesaleDomain('supermarket') === false, 'supermarket is NOT a wholesale domain');

// Test 2: Nav Key Detection
assert(isWholesaleEnterpriseNavKey('campaigns', 'textile-wholesale') === true, 'campaigns requires Enterprise for textile-wholesale');
assert(isWholesaleEnterpriseNavKey('reports', 'textile-wholesale') === true, 'reports requires Enterprise for textile-wholesale');
assert(isWholesaleEnterpriseNavKey('orders', 'textile-wholesale') === true, 'orders requires Enterprise for textile-wholesale');
assert(isWholesaleEnterpriseNavKey('inquiries', 'textile-wholesale') === true, 'inquiries requires Enterprise for textile-wholesale');
assert(isWholesaleEnterpriseNavKey('store-settings', 'textile-wholesale') === true, 'store-settings requires Enterprise for textile-wholesale');
assert(isWholesaleEnterpriseNavKey('invoices', 'textile-wholesale') === false, 'invoices does NOT require Enterprise for textile-wholesale');

// Test 3: RBAC & Gating Access - Wholesale Starter/Business vs Enterprise
const wholesaleBusinessAccess = getNavItemAccess('campaigns', 'owner', 'business', null, null, null, 'textile-wholesale');
assert(wholesaleBusinessAccess.locked === true && wholesaleBusinessAccess.requiredPlan === 'enterprise', 'Wholesale Campaigns is locked on Business plan requiring Enterprise');

const wholesaleReportsAccess = getNavItemAccess('reports', 'owner', 'business', null, null, null, 'textile-wholesale');
assert(wholesaleReportsAccess.locked === true && wholesaleReportsAccess.requiredPlan === 'enterprise', 'Wholesale Reports is locked on Business plan requiring Enterprise');

const wholesaleOrdersAccess = getNavItemAccess('orders', 'owner', 'business', null, null, null, 'textile-wholesale');
assert(wholesaleOrdersAccess.locked === true && wholesaleOrdersAccess.requiredPlan === 'enterprise', 'Wholesale Storefront Orders is locked on Business plan requiring Enterprise');

const wholesaleEnterpriseAccess = getNavItemAccess('campaigns', 'owner', 'enterprise', null, null, null, 'textile-wholesale');
assert(wholesaleEnterpriseAccess.locked === false, 'Wholesale Campaigns is UNLOCKED on Enterprise plan');

// Test 4: Loyalty & CRM Enterprise Gating Tests
assert(FEATURE_MIN_PLAN['loyalty_programs'] === 'enterprise', 'FEATURE_MIN_PLAN.loyalty_programs requires Enterprise tier');
assert(FEATURE_MIN_PLAN['membership_management'] === 'enterprise', 'FEATURE_MIN_PLAN.membership_management requires Enterprise tier');
assert(FEATURE_MIN_PLAN['promotions_crm'] === 'enterprise', 'FEATURE_MIN_PLAN.promotions_crm requires Enterprise tier');

const loyaltyBusinessAccess = getNavItemAccess('loyalty', 'owner', 'business', null, null, null, 'supermarket');
assert(loyaltyBusinessAccess.locked === true && loyaltyBusinessAccess.requiredPlan === 'enterprise', 'Loyalty tab is locked on Business plan requiring Enterprise');

const loyaltyEnterpriseAccess = getNavItemAccess('loyalty', 'owner', 'enterprise', null, null, null, 'supermarket');
assert(loyaltyEnterpriseAccess.locked === false, 'Loyalty tab is UNLOCKED on Enterprise plan');

// Test 5: getRequiredPlan helper
assert(getRequiredPlan('campaigns', 'textile-wholesale') === 'enterprise', 'getRequiredPlan returns enterprise for wholesale campaigns');
assert(getRequiredPlan('reports', 'textile-wholesale') === 'enterprise', 'getRequiredPlan returns enterprise for wholesale reports');
assert(getRequiredPlan('loyalty', 'supermarket') === 'enterprise', 'getRequiredPlan returns enterprise for loyalty');

console.log(`\n=== Verification Summary: ${passed} passed, ${failed} failed ===`);
if (failed > 0) {
    process.exit(1);
}
