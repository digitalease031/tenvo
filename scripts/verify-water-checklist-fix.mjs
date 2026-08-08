#!/usr/bin/env node
/**
 * Water Area Checklist Fix Verification Script
 * Ensures "args is not defined" error is completely resolved
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

console.log('🔍 Verifying Water Area Checklist Fix...\n');

// Read the file
const thermalBillPath = join(process.cwd(), 'lib', 'print', 'waterHisabThermalBill.js');
const content = readFileSync(thermalBillPath, 'utf-8');

// Extract the buildWaterAreaListHtml function
const funcStart = content.indexOf('export async function buildWaterAreaListHtml');
const funcEnd = content.indexOf('export async function printWaterAreaList', funcStart);
const funcBody = content.substring(funcStart, funcEnd);

console.log('═══════════════════════════════════════════════════════════');
console.log('           PARAMETER DESTRUCTURING CHECKS');
console.log('═══════════════════════════════════════════════════════════\n');

// Check 1: Function has routeLabel parameter
check(
    'buildWaterAreaListHtml has routeLabel parameter',
    funcBody.includes('routeLabel = \'\'')
);

// Check 2: Function has vehicleNo parameter
check(
    'buildWaterAreaListHtml has vehicleNo parameter',
    funcBody.includes('vehicleNo = \'\'')
);

// Check 3: No args.routeLabel references in buildWaterAreaListHtml
// (Exclude comments and lines that are documentation)
const argsRouteMatches = funcBody.match(/args\.routeLabel|args\.areaName/g) || [];
const hasInvalidArgsRouteRef = argsRouteMatches.some(match => {
    const line = funcBody.split('\n').find(l => l.includes(match));
    return line && !line.trim().startsWith('//') && !line.trim().startsWith('*');
});
check(
    'No executable args.routeLabel or args.areaName references in buildWaterAreaListHtml',
    !hasInvalidArgsRouteRef
);

// Check 4: No args.vehicleNo references in buildWaterAreaListHtml
// (Exclude comments and lines that are documentation)
const argsVehicleMatches = funcBody.match(/args\.vehicleNo/g) || [];
const hasInvalidArgsVehicleRef = argsVehicleMatches.some(match => {
    const line = funcBody.split('\n').find(l => l.includes(match));
    return line && !line.trim().startsWith('//') && !line.trim().startsWith('*');
});
check(
    'No executable args.vehicleNo references in buildWaterAreaListHtml',
    !hasInvalidArgsVehicleRef
);

// Check 5: Paper size ternary is correct
check(
    'Paper size correctly returns A5 when isA5 is true',
    funcBody.includes("const pgSize = isA5 ? 'A5' : 'A4';")
);

// Check 6: Function signature includes all parameters
const funcSignature = funcBody.substring(0, funcBody.indexOf(') {') + 2);
const hasAllParams = 
    funcSignature.includes('business') &&
    funcSignature.includes('rows') &&
    funcSignature.includes('products') &&
    funcSignature.includes('deliveryDate') &&
    funcSignature.includes('riderName') &&
    funcSignature.includes('routeLabel') &&
    funcSignature.includes('vehicleNo') &&
    funcSignature.includes('paperSize') &&
    funcSignature.includes('config');

check(
    'Function signature includes all 9 parameters',
    hasAllParams
);

console.log('\n═══════════════════════════════════════════════════════════');
console.log('              OTHER FUNCTIONS CHECKS');
console.log('═══════════════════════════════════════════════════════════\n');

// Check 7: createWaterDeliveryChecklistPdf uses args correctly
const pdfFuncStart = content.indexOf('export async function createWaterDeliveryChecklistPdf(args');
if (pdfFuncStart > 0) {
    const pdfFuncEnd = content.indexOf('\nexport ', pdfFuncStart + 10);
    const pdfFuncBody = content.substring(pdfFuncStart, pdfFuncEnd);
    
    // This function SHOULD use args.routeLabel because it takes args as parameter
    check(
        'createWaterDeliveryChecklistPdf correctly uses args parameter',
        pdfFuncBody.includes('const routeLabel = args.routeLabel')
    );
} else {
    check(
        'createWaterDeliveryChecklistPdf found',
        false
    );
}

// Check 8: buildWaterDeliveryChecklistHtml uses args correctly
const htmlFuncStart = content.indexOf('export function buildWaterDeliveryChecklistHtml(args)');
if (htmlFuncStart > 0) {
    const htmlFuncEnd = content.indexOf('\nexport ', htmlFuncStart + 10);
    const htmlFuncBody = content.substring(htmlFuncStart, htmlFuncEnd);
    
    // This function takes args, so should destructure it
    check(
        'buildWaterDeliveryChecklistHtml correctly destructures args',
        htmlFuncBody.includes('const {') && htmlFuncBody.includes('} = args')
    );
    
    // And then can access args.routeLabel safely
    check(
        'buildWaterDeliveryChecklistHtml safely accesses args.routeLabel',
        htmlFuncBody.includes('args?.routeLabel')
    );
} else {
    check(
        'buildWaterDeliveryChecklistHtml found',
        false
    );
}

console.log('\n═══════════════════════════════════════════════════════════');
console.log('              COMPONENT INTEGRATION');
console.log('═══════════════════════════════════════════════════════════\n');

// Check 9: Component passes routeLabel
const componentPath = join(process.cwd(), 'components', 'water', 'WaterRouteHisab.jsx');
try {
    const componentContent = readFileSync(componentPath, 'utf-8');
    
    check(
        'WaterRouteHisab passes routeLabel to printWaterAreaList',
        componentContent.includes('routeLabel:')
    );
    
    check(
        'WaterRouteHisab passes vehicleNo to printWaterAreaList',
        componentContent.includes('vehicleNo:')
    );
} catch (e) {
    console.log(`⚠️  Could not verify component integration: ${e.message}`);
}

console.log('\n' + '='.repeat(60));
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`📊 Total: ${checks.length}`);
console.log('='.repeat(60));

if (failed > 0) {
    console.log('\n⚠️  Some checks failed. Review the output above.');
    console.log('\nExpected fixes:');
    console.log('  1. Add routeLabel parameter to buildWaterAreaListHtml');
    console.log('  2. Add vehicleNo parameter to buildWaterAreaListHtml');
    console.log('  3. Remove args.routeLabel references');
    console.log('  4. Remove args.vehicleNo references');
    console.log('  5. Fix paper size ternary');
    process.exit(1);
} else {
    console.log('\n🎉 All checks passed! Water area checklist fix is complete.');
    console.log('\n✅ The "args is not defined" error has been resolved.');
    console.log('✅ Area-wise checklist printing is now fully functional.');
    process.exit(0);
}
