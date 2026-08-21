import fs from 'fs';
import path from 'path';
import { generateWholesaleOilReportPDF, downloadWholesaleReportCSV } from '../lib/pdf/wholesaleOilReportPdf.js';

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

console.log('=== Wholesale & Oil Domain Reporting & PDF Verification ===\n');

// Test 1: Check component file exists
const hubFile = path.resolve(process.cwd(), 'components/reports/WholesaleOilReportingHub.jsx');
assert(fs.existsSync(hubFile), 'WholesaleOilReportingHub.jsx exists in components/reports/');

// Test 2: Check component file exports WholesaleOilReportingHub
const hubCode = fs.readFileSync(hubFile, 'utf8');
assert(hubCode.includes('export function WholesaleOilReportingHub'), 'WholesaleOilReportingHub is exported as named export');
assert(hubCode.includes('export default WholesaleOilReportingHub'), 'WholesaleOilReportingHub is exported as default export');

// Test 3: Check key feature sections in hub code
assert(hubCode.includes('timePreset'), 'Time search & preset state included');
assert(hubCode.includes('activeReportTab'), 'Sub-tab navigation included');
assert(hubCode.includes('totalVolumeCartons') || hubCode.includes('totalVolumeLiters'), 'Volume KPIs included');
assert(hubCode.includes('avgOrderValue'), 'Average order value (AOV) included');
assert(hubCode.includes('agingData'), 'Udhaar aging breakdown included');
assert(hubCode.includes('vanFleetData'), 'Van fleet & beat route performance included');
assert(hubCode.includes('principalTargets'), 'Principal volume targets & rebate tracker included');
assert(hubCode.includes('AreaChart') && hubCode.includes('BarChart') && hubCode.includes('PieChart'), 'Recharts visual charts integrated');

// Test 4: Check PDF & CSV export helper imports
assert(hubCode.includes('generateWholesaleOilReportPDF'), 'WholesaleOilReportingHub imports generateWholesaleOilReportPDF');
assert(hubCode.includes('downloadWholesaleReportCSV'), 'WholesaleOilReportingHub imports downloadWholesaleReportCSV');
assert(typeof generateWholesaleOilReportPDF === 'function', 'generateWholesaleOilReportPDF is a valid function');
assert(typeof downloadWholesaleReportCSV === 'function', 'downloadWholesaleReportCSV is a valid function');

// Test 5: Invoke generateWholesaleOilReportPDF to verify execution without error
try {
    generateWholesaleOilReportPDF({
        business: { name: 'TENVO OILS Test' },
        category: 'lubricant-distribution',
        currency: 'PKR',
        periodLabel: 'This Month',
        metrics: { currentSales: 3656400, growthPercent: 100, totalVolumeCartons: 1840, totalVolumeLiters: 29440 },
    });
    assert(true, 'generateWholesaleOilReportPDF executed cleanly without throwing hex/color errors');
} catch (err) {
    assert(false, `generateWholesaleOilReportPDF threw error: ${err.message}`);
}

// Test 6: Check DashboardTabs integration
const tabsFile = path.resolve(process.cwd(), 'app/business/[category]/components/DashboardTabs.jsx');
const tabsCode = fs.readFileSync(tabsFile, 'utf8');
assert(tabsCode.includes('WholesaleOilReportingHub'), 'DashboardTabs imports and renders WholesaleOilReportingHub');

console.log(`\n=== Verification Summary: ${passed} passed, ${failed} failed ===`);
if (failed > 0) {
    process.exit(1);
}
