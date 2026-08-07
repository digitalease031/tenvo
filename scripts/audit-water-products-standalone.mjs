#!/usr/bin/env node
/**
 * Standalone Water Product Audit & Cleanup Tool
 * (No dependencies on server-only app modules)
 * 
 * Usage:
 *   node scripts/audit-water-products-standalone.mjs [business-id]
 *   node scripts/audit-water-products-standalone.mjs --all
 *   node scripts/audit-water-products-standalone.mjs [business-id] --delete
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const WATER_PRODUCT_TYPES = {
  REFILL: {
    keywords: ['refill', 'rfl', 'exchange'],
    priority: 1,
    description: 'Exchange/Refill (customer returns empty)',
  },
  NEW_BOTTLE: {
    keywords: ['bottle', 'new', 'dispenser', 'gallon', 'can'],
    priority: 2,
    description: 'New Bottle (includes bottle deposit)',
  },
  CASE: {
    keywords: ['case', 'pack', 'box', 'crate'],
    priority: 3,
    description: 'Case/Pack (bulk orders)',
  },
  VAGUE: {
    keywords: ['pcs', 'set', 'kit', 'unit'],
    priority: 999,
    description: 'Vague/Unclear - should be deleted',
  },
};

function isWaterDeliveryStore(category) {
  const normalized = String(category || '').toLowerCase().trim();
  return normalized === 'water-delivery' || normalized === 'water' || normalized === 'waterdelivery';
}

function normalizeProductName(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/\b(tenvo|fresh|pure|mineral|water|company)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractSize(name) {
  const match = String(name || '').match(/(\d+(?:\.\d+)?)\s*(l|ml|litre|liter)/i);
  if (!match) return null;
  const value = parseFloat(match[1]);
  const unit = match[2].toLowerCase();
  if (unit === 'ml') return value / 1000;
  return value;
}

function classifyProductType(product) {
  const text = `${product.name || ''} ${product.category || ''}`.toLowerCase();
  
  for (const [type, config] of Object.entries(WATER_PRODUCT_TYPES)) {
    if (config.keywords.some((kw) => text.includes(kw))) {
      return { type, ...config };
    }
  }
  
  return { type: 'UNKNOWN', priority: 999, description: 'Unknown type' };
}

function areDuplicates(p1, p2) {
  const size1 = extractSize(p1.name);
  const size2 = extractSize(p2.name);
  
  if (size1 !== size2 || !size1) return false;
  
  const type1 = classifyProductType(p1);
  const type2 = classifyProductType(p2);
  
  if (type1.type !== type2.type) return false;
  
  const norm1 = normalizeProductName(p1.name);
  const norm2 = normalizeProductName(p2.name);
  
  if (norm1 === norm2) return true;
  
  const words1 = norm1.split(/\s+/);
  const words2 = norm2.split(/\s+/);
  const commonWords = words1.filter((w) => words2.includes(w));
  
  const similarity = commonWords.length / Math.max(words1.length, words2.length);
  return similarity >= 0.8;
}

function scoreProduct(product) {
  const classification = classifyProductType(product);
  let score = classification.priority * 1000;
  
  const stock = Number(product.stock) || 0;
  if (stock > 0) score -= 500;
  
  const price = Number(product.price) || 0;
  if (price > 0) score -= 200;
  
  const nameLen = String(product.name || '').length;
  score += nameLen;
  
  if (product.sku) score -= 100;
  
  return score;
}

async function auditBusiness(businessId) {
  const business = await prisma.businesses.findFirst({
    where: { id: businessId },
    select: {
      id: true,
      business_name: true,
      category: true,
      domain: true,
    },
  });
  
  if (!business) {
    console.error(`❌ Business ${businessId} not found`);
    return null;
  }
  
  if (!isWaterDeliveryStore(business.category)) {
    console.log(`⏭️  ${business.business_name} (${business.category}) - Not a water delivery store`);
    return null;
  }
  
  const products = await prisma.products.findMany({
    where: {
      business_id: businessId,
      is_deleted: false,
      is_active: true,
    },
    orderBy: { name: 'asc' },
  });
  
  if (!products.length) {
    console.log(`⏭️  ${business.business_name} - No active products`);
    return null;
  }
  
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🏢 ${business.business_name} (@${business.domain || business.id})`);
  console.log(`   Category: ${business.category}`);
  console.log(`   Products: ${products.length} active`);
  console.log(`${'='.repeat(80)}\n`);
  
  const bySize = new Map();
  for (const p of products) {
    const size = extractSize(p.name);
    const key = size ? `${size}L` : 'OTHER';
    if (!bySize.has(key)) bySize.set(key, []);
    bySize.get(key).push(p);
  }
  
  const recommendations = {
    keep: [],
    delete: [],
    review: [],
  };
  
  for (const [sizeKey, sizeProducts] of bySize.entries()) {
    console.log(`\n📦 ${sizeKey} Products (${sizeProducts.length}):`);
    console.log(`${'─'.repeat(80)}`);
    
    const classified = sizeProducts.map((p) => ({
      product: p,
      classification: classifyProductType(p),
      score: scoreProduct(p),
      normalized: normalizeProductName(p.name),
    }));
    
    const checked = new Set();
    const duplicateGroups = [];
    
    for (let i = 0; i < classified.length; i++) {
      if (checked.has(i)) continue;
      
      const group = [classified[i]];
      checked.add(i);
      
      for (let j = i + 1; j < classified.length; j++) {
        if (checked.has(j)) continue;
        
        if (areDuplicates(classified[i].product, classified[j].product)) {
          group.push(classified[j]);
          checked.add(j);
        }
      }
      
      if (group.length > 1) {
        duplicateGroups.push(group);
      }
    }
    
    for (const item of classified) {
      const p = item.product;
      const cls = item.classification;
      const icon = cls.priority === 1 ? '🔵' : cls.priority === 2 ? '🟢' : cls.priority === 3 ? '🟡' : '🔴';
      
      console.log(`${icon} ${p.name}`);
      console.log(`   ID: ${p.id}`);
      console.log(`   Type: ${cls.type} - ${cls.description}`);
      console.log(`   Price: ${p.price || 0}, Stock: ${p.stock || 0}, SKU: ${p.sku || 'none'}`);
      console.log(`   Score: ${item.score} (lower = better)`);
    }
    
    if (duplicateGroups.length > 0) {
      console.log(`\n⚠️  Found ${duplicateGroups.length} duplicate group(s):\n`);
      
      for (const group of duplicateGroups) {
        group.sort((a, b) => a.score - b.score);
        
        const keepItem = group[0];
        const deleteItems = group.slice(1);
        
        console.log(`   ✅ KEEP: ${keepItem.product.name} (ID: ${keepItem.product.id})`);
        console.log(`      Score: ${keepItem.score}, Type: ${keepItem.classification.type}`);
        
        for (const delItem of deleteItems) {
          console.log(`   ❌ DELETE: ${delItem.product.name} (ID: ${delItem.product.id})`);
          console.log(`      Reason: Duplicate of "${keepItem.product.name}"`);
          console.log(`      Score: ${delItem.score}`);
          recommendations.delete.push({
            product: delItem.product,
            reason: `Duplicate of "${keepItem.product.name}"`,
          });
        }
        
        recommendations.keep.push(keepItem.product);
        console.log('');
      }
    }
    
    const vague = classified.filter((item) => item.classification.type === 'VAGUE');
    if (vague.length > 0) {
      console.log(`\n⚠️  Found ${vague.length} vague/unclear product(s):\n`);
      
      for (const item of vague) {
        console.log(`   ❌ DELETE: ${item.product.name} (ID: ${item.product.id})`);
        console.log(`      Reason: Vague type (${item.classification.type}) - unclear purpose`);
        recommendations.delete.push({
          product: item.product,
          reason: 'Vague/unclear product type',
        });
      }
    }
  }
  
  console.log(`\n${'='.repeat(80)}`);
  console.log(`📊 AUDIT SUMMARY`);
  console.log(`${'='.repeat(80)}`);
  console.log(`Total Products: ${products.length}`);
  console.log(`✅ Recommended to Keep: ${products.length - recommendations.delete.length}`);
  console.log(`❌ Recommended to Delete: ${recommendations.delete.length}`);
  
  if (recommendations.delete.length > 0) {
    console.log(`\n📝 Products to Delete:`);
    for (const item of recommendations.delete) {
      console.log(`   • ${item.product.name} (${item.product.id})`);
      console.log(`     Reason: ${item.reason}`);
    }
  }
  
  return {
    business,
    products,
    recommendations,
  };
}

async function deleteProducts(businessId, productIds, dryRun = true) {
  if (dryRun) {
    console.log(`\n🔍 DRY RUN: Would delete ${productIds.length} products`);
    return;
  }
  
  console.log(`\n🗑️  Deleting ${productIds.length} products...`);
  
  const result = await prisma.products.updateMany({
    where: {
      id: { in: productIds },
      business_id: businessId,
    },
    data: {
      is_deleted: true,
      is_active: false,
    },
  });
  
  console.log(`✅ Deleted ${result.count} products`);
}

async function main() {
  const args = process.argv.slice(2);
  const businessId = args[0];
  const shouldDelete = args.includes('--delete');
  const dryRun = !shouldDelete;
  
  if (!businessId || businessId === '--help' || businessId === '-h') {
    console.log(`
Water Product Audit & Cleanup Tool (Standalone)

Usage:
  node scripts/audit-water-products-standalone.mjs <business-id>          # Audit
  node scripts/audit-water-products-standalone.mjs <business-id> --delete # Delete
  node scripts/audit-water-products-standalone.mjs --all                  # Audit all
  
Examples:
  node scripts/audit-water-products-standalone.mjs demo-water
  node scripts/audit-water-products-standalone.mjs demo-water --delete
  node scripts/audit-water-products-standalone.mjs --all
    `);
    process.exit(0);
  }
  
  if (businessId === '--all') {
    console.log('🔍 Auditing all water delivery businesses...\n');
    
    const businesses = await prisma.businesses.findMany({
      where: { is_deleted: false },
      select: { id: true, category: true },
    });
    
    const waterBusinesses = businesses.filter((b) => isWaterDeliveryStore(b.category));
    console.log(`Found ${waterBusinesses.length} water delivery businesses\n`);
    
    for (const business of waterBusinesses) {
      await auditBusiness(business.id);
    }
  } else {
    const result = await auditBusiness(businessId);
    
    if (result && result.recommendations.delete.length > 0) {
      const productIds = result.recommendations.delete.map((item) => item.product.id);
      
      console.log(`\n${'='.repeat(80)}`);
      if (dryRun) {
        console.log(`ℹ️  This was a DRY RUN. No products were deleted.`);
        console.log(`   To actually delete duplicates, run:`);
        console.log(`   node scripts/audit-water-products-standalone.mjs ${businessId} --delete`);
      } else {
        await deleteProducts(businessId, productIds, false);
      }
      console.log(`${'='.repeat(80)}`);
    }
  }
  
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('❌ Error:', err);
  process.exit(1);
});
