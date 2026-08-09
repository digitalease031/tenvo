#!/usr/bin/env node
/**
 * Diagnostic script to check zara-water business and identify why 19L columns are missing
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkZaraWater() {
  try {
    console.log('🔍 Checking zara-water business...\n');

    // Find business by domain or name
    const business = await prisma.businesses.findFirst({
      where: {
        OR: [
          { business_domain: 'zara-water' },
          { business_name: { contains: 'zara', mode: 'insensitive' } }
        ],
        category: 'water-delivery'
      },
      select: {
        id: true,
        business_name: true,
        business_domain: true,
        category: true,
        settings: true,
        created_at: true
      }
    });

    if (!business) {
      console.log('❌ Business "zara-water" not found\n');
      console.log('Searching for any water-delivery businesses...\n');
      
      const waterBusinesses = await prisma.businesses.findMany({
        where: { category: 'water-delivery' },
        select: { 
          id: true, 
          business_name: true, 
          business_domain: true, 
          created_at: true 
        },
        take: 10,
        orderBy: { created_at: 'desc' }
      });
      
      console.log(`Found ${waterBusinesses.length} water-delivery businesses:\n`);
      waterBusinesses.forEach(b => {
        const date = b.created_at.toISOString().split('T')[0];
        console.log(`  - ${b.business_name} (${b.business_domain}) - Created: ${date}`);
      });
      
      if (waterBusinesses.length > 0) {
        console.log('\n💡 Tip: Run this script with one of the domains above');
      }
      
      return;
    }

    console.log('✅ Found business:', business.business_name);
    console.log('   Domain:', business.business_domain);
    console.log('   ID:', business.id);
    console.log('   Created:', business.created_at.toISOString());
    
    // Check settings
    console.log('\n📋 SETTINGS CHECK');
    console.log('=' .repeat(60));
    
    const enabledSizeIds = business.settings?.waterHisab?.enabledSizeIds;
    const enabledColumns = business.settings?.waterHisab?.enabledColumns;
    
    if (!enabledSizeIds) {
      console.log('⚠️  waterHisab.enabledSizeIds: NOT SET');
      console.log('   → Should default to ["19l"]');
    } else {
      console.log('✅ waterHisab.enabledSizeIds:', JSON.stringify(enabledSizeIds));
      if (!enabledSizeIds.includes('19l')) {
        console.log('   ❌ PROBLEM: "19l" is NOT in enabledSizeIds!');
      }
    }
    
    if (!enabledColumns) {
      console.log('⚠️  waterHisab.enabledColumns: NOT SET');
      console.log('   → Should default to ["delivered", "received"]');
    } else {
      console.log('✅ waterHisab.enabledColumns:', JSON.stringify(enabledColumns));
    }

    // Check products
    console.log('\n📦 PRODUCTS CHECK');
    console.log('=' .repeat(60));
    
    const products = await prisma.products.findMany({
      where: {
        business_id: business.id,
        is_deleted: false
      },
      select: {
        id: true,
        name: true,
        category: true,
        sku: true,
        unit: true,
        price: true,
        is_active: true,
        stock: true
      },
      orderBy: { name: 'asc' }
    });

    console.log(`Total active products: ${products.length}\n`);

    // Check for 19L products
    const products19L = products.filter(p => {
      const blob = `${p.name} ${p.category || ''}`;
      return /19\s*l/i.test(blob);
    });

    if (products19L.length === 0) {
      console.log('❌ NO 19L PRODUCTS FOUND');
      console.log('   ROOT CAUSE: Products were not seeded during registration\n');
      
      if (products.length === 0) {
        console.log('   → Business has NO products at all');
      } else {
        console.log(`   → Business has ${products.length} products, but none match "19L"`);
        console.log('\n   All products in inventory:');
        products.forEach((p, i) => {
          if (i < 10) {
            const status = p.is_active ? '✅' : '❌';
            console.log(`   ${status} ${p.name} (${p.category || 'No category'})`);
          }
        });
        if (products.length > 10) {
          console.log(`   ... and ${products.length - 10} more`);
        }
      }
      
      console.log('\n💡 SOLUTION: Add 19L products to inventory:');
      console.log('   1. Name: "19L Mineral Water (Refill)"');
      console.log('      Category: "19L Dispenser"');
      console.log('      Unit: bottle, Price: 150');
      console.log('   2. Name: "19L New Bottle + First Fill"');
      console.log('      Category: "19L Dispenser"');
      console.log('      Unit: bottle, Price: 950');
      
    } else {
      console.log(`✅ Found ${products19L.length} x 19L products:\n`);
      
      products19L.forEach(p => {
        const activeStatus = p.is_active ? '✅ ACTIVE' : '❌ INACTIVE';
        const stockStatus = p.stock > 0 ? `Stock: ${p.stock}` : '⚠️  No stock';
        
        console.log(`${activeStatus} ${p.name}`);
        console.log(`   Category: ${p.category || 'None'}`);
        console.log(`   SKU: ${p.sku || 'None'} | Unit: ${p.unit || 'pcs'}`);
        console.log(`   Price: ${p.price} | ${stockStatus}`);
        console.log('');
      });
    }

    // Test size group matching for all products
    if (products.length > 0) {
      console.log('\n🧪 SIZE GROUP MATCHING TEST');
      console.log('=' .repeat(60));
      
      const testProducts = products.slice(0, 8);
      
      testProducts.forEach(p => {
        const blob = `${p.name} ${p.category || ''}`;
        const matches19L = /19\s*l/i.test(blob);
        const matches12L = /12\s*l/i.test(blob);
        const matches5L = /5\s*l\b/i.test(blob);
        
        let sizeGroup = 'unknown';
        if (matches19L) sizeGroup = '19l';
        else if (matches12L) sizeGroup = '12l';
        else if (matches5L) sizeGroup = '5l';
        
        const icon = matches19L ? '✅' : '❌';
        const nameShort = p.name.slice(0, 42).padEnd(42);
        console.log(`${icon} ${nameShort} → ${sizeGroup}`);
      });
      
      if (products.length > 8) {
        console.log(`... (${products.length - 8} more products not shown)`);
      }
    }

    // Summary
    console.log('\n📊 DIAGNOSIS SUMMARY');
    console.log('=' .repeat(60));
    
    const issues = [];
    const fixes = [];
    
    if (products19L.length === 0) {
      issues.push('❌ No 19L products exist in inventory');
      fixes.push('Add 19L products manually or re-run registration seed');
    } else {
      const inactiveProducts = products19L.filter(p => !p.is_active);
      if (inactiveProducts.length > 0) {
        issues.push(`❌ ${inactiveProducts.length} x 19L products are inactive`);
        fixes.push('Reactivate products in Inventory → Products');
      }
    }
    
    if (enabledSizeIds && !enabledSizeIds.includes('19l')) {
      issues.push('❌ Settings excludes "19l" from enabled sizes');
      fixes.push('Go to Water Hisab → Settings → Check "19L" checkbox');
    }
    
    if (issues.length === 0) {
      console.log('✅ NO ISSUES FOUND');
      console.log('   All checks passed - 19L columns should be visible\n');
      console.log('   If columns still missing, try:');
      console.log('   1. Refresh the Water Hisab page');
      console.log('   2. Check browser console for errors');
      console.log('   3. Verify network request returns products array');
    } else {
      console.log('Issues found:');
      issues.forEach(issue => console.log(`  ${issue}`));
      console.log('\nRecommended fixes:');
      fixes.forEach((fix, i) => console.log(`  ${i + 1}. ${fix}`));
    }

    console.log('');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

checkZaraWater();
