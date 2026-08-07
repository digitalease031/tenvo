#!/usr/bin/env node
/**
 * Registration Flow Verification Script
 * Checks that all critical fixes are properly implemented
 */

import { readFileSync } from 'fs';
import { join } from 'path';

const checks = [];
let passed = 0;
let failed = 0;

function check(description, condition) {
    checks.push({ description, passed: condition });
    if (condition) {
        console.log(`✅ ${description}`);
        passed++;
    } else {
        console.log(`❌ ${description}`);
        failed++;
    }
}

console.log('🔍 Verifying Registration Flow Fixes...\n');

// Read the files
const pendingApprovalPath = join(process.cwd(), 'app', 'pending-approval', 'page.jsx');
const registerPath = join(process.cwd(), 'app', 'register', 'page.js');

const pendingApproval = readFileSync(pendingApprovalPath, 'utf-8');
const register = readFileSync(registerPath, 'utf-8');

// Check 1: Pending-approval has isRedirecting state
check(
    'Pending-approval page has isRedirecting state',
    pendingApproval.includes('const [isRedirecting, setIsRedirecting] = useState(false)')
);

// Check 2: Pending-approval has error state
check(
    'Pending-approval page has error state with retry',
    pendingApproval.includes('const [error, setError] = useState(null)') &&
    pendingApproval.includes('setError({')
);

// Check 3: Pending-approval uses window.location.href with setTimeout
check(
    'Pending-approval redirects with setTimeout for approved status',
    pendingApproval.includes('setTimeout(() => {') &&
    pendingApproval.includes('window.location.href = `/business/${biz.domain}`')
);

// Check 4: Responsive grid layout
check(
    'Pending-approval has responsive grid (grid-cols-1 lg:grid-cols-2)',
    pendingApproval.includes('grid grid-cols-1 lg:grid-cols-2')
);

// Check 5: Break-words for long content
check(
    'Pending-approval uses break-words for email/category',
    pendingApproval.includes('break-all') && 
    pendingApproval.includes('break-words')
);

// Check 6: Responsive text sizing
check(
    'Pending-approval has responsive heading sizes (text-xl sm:text-2xl lg:text-[28px])',
    pendingApproval.includes('text-xl sm:text-2xl lg:text-[28px]')
);

// Check 7: Responsive spacing (gap-4 sm:gap-5)
check(
    'Pending-approval has responsive spacing',
    pendingApproval.includes('gap-4 sm:gap-5')
);

// Check 8: Responsive button sizing
check(
    'Pending-approval has responsive button heights (h-11 sm:h-12)',
    pendingApproval.includes('h-11 sm:h-12')
);

// Check 9: Register page toast with setTimeout
check(
    'Register page uses setTimeout before redirect',
    register.includes('setTimeout(() => {') &&
    register.includes("window.location.href = '/pending-approval'")
);

// Check 10: Register page toast has shorter duration
check(
    'Register page toast has 2000ms duration',
    register.includes('duration: 2000')
);

// Check 11: Register page toast has ID
check(
    'Register page toast has unique ID',
    register.includes("id: 'registration-pending'")
);

// Check 12: Register page clears all cache
check(
    'Register page clears registration form cache',
    register.includes("localStorage.removeItem('registrationData')") &&
    register.includes("localStorage.removeItem('registrationStep')")
);

// Check 13: Error retry UI exists
check(
    'Pending-approval has error retry button',
    pendingApproval.includes('<RefreshCw className="mr-2 h-4 w-4" />') &&
    pendingApproval.includes('Retry')
);

// Check 14: Loading state shows redirect message
check(
    'Pending-approval shows "Redirecting" message in loading state',
    pendingApproval.includes('Redirecting to dashboard...')
);

// Check 15: Flexible button layout on mobile
check(
    'Support buttons stack on mobile (flex-col sm:flex-row)',
    pendingApproval.includes('flex flex-col sm:flex-row')
);

console.log('\n' + '='.repeat(50));
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`📊 Total: ${checks.length}`);
console.log('='.repeat(50));

if (failed > 0) {
    console.log('\n⚠️  Some checks failed. Review the output above.');
    process.exit(1);
} else {
    console.log('\n🎉 All checks passed! Registration flow fixes are properly implemented.');
    process.exit(0);
}
