import { prismaBase as prisma } from '../lib/db.js';
import { calculateInstallmentSummary, generateInstallmentSchedule } from '../lib/utils/installmentMath.js';

async function seedInstallments() {
  console.log('Seeding sample installment contracts for active businesses...');

  // Ensure table exists
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "installment_plans" (
      "id" UUID NOT NULL DEFAULT gen_random_uuid(),
      "business_id" UUID NOT NULL,
      "plan_number" VARCHAR(100) NOT NULL,
      "customer_id" UUID,
      "customer_name" VARCHAR(255) NOT NULL,
      "customer_phone" VARCHAR(100),
      "customer_cnic" VARCHAR(100),
      "customer_address" TEXT,
      "guarantor_name" VARCHAR(255),
      "guarantor_phone" VARCHAR(100),
      "guarantor_cnic" VARCHAR(100),
      "product_id" UUID,
      "item_name" VARCHAR(255) NOT NULL,
      "item_details" TEXT,
      "total_price" DECIMAL(12,2) NOT NULL DEFAULT 0,
      "down_payment_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
      "down_payment_pct" DECIMAL(5,2) NOT NULL DEFAULT 0,
      "financed_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
      "markup_rate_pct" DECIMAL(5,2) NOT NULL DEFAULT 0,
      "markup_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
      "total_payable" DECIMAL(12,2) NOT NULL DEFAULT 0,
      "frequency" VARCHAR(30) NOT NULL DEFAULT 'monthly',
      "tenure_months" INTEGER NOT NULL DEFAULT 12,
      "number_of_installments" INTEGER NOT NULL DEFAULT 12,
      "installment_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
      "start_date" DATE NOT NULL DEFAULT CURRENT_DATE,
      "status" VARCHAR(30) NOT NULL DEFAULT 'active',
      "notes" TEXT,
      "schedule_data" JSONB DEFAULT '[]',
      "domain_data" JSONB DEFAULT '{}',
      "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "installment_plans_pkey" PRIMARY KEY ("id")
    );
    CREATE INDEX IF NOT EXISTS "idx_installment_plan_business" ON "installment_plans"("business_id");
    CREATE INDEX IF NOT EXISTS "idx_installment_plan_status" ON "installment_plans"("business_id", "status");
  `);

  const businesses = await prisma.businesses.findMany({
    take: 20,
    select: { id: true, business_name: true, domain: true, category: true }
  });

  if (!businesses.length) {
    console.log('No businesses found.');
    process.exit(0);
  }

  const sampleContracts = [
    {
      customerName: 'Muhammad Tariq Khan',
      customerPhone: '+923001112233',
      customerCnic: '42101-9876543-1',
      customerAddress: 'House 14-B, Block 2, PECHS, Karachi',
      guarantorName: 'Shahid Mehmood',
      guarantorPhone: '+923214455667',
      guarantorCnic: '42101-1122334-5',
      itemName: 'BMW 520i M Sport 2019',
      itemDetails: 'Black Sapphire Metallic / Black Dakota Leather / 42,000 km',
      totalPrice: 14200000,
      downPaymentPct: 20,
      markupRatePct: 18,
      tenureMonths: 12,
      frequency: 'monthly',
      startDate: '2026-01-15',
      paidInstallmentsCount: 3,
    },
    {
      customerName: 'Zainab Ahmed',
      customerPhone: '+923335557788',
      customerCnic: '35202-4455667-8',
      customerAddress: 'Gulberg III, Main Boulevard, Lahore',
      guarantorName: 'Kamran Ali',
      guarantorPhone: '+923008889900',
      guarantorCnic: '35202-9988776-1',
      itemName: 'Toyota Fortuner Legender 2.8 2023',
      itemDetails: 'Super White II / Chamois Leather Interior / 18,500 km',
      totalPrice: 18500000,
      downPaymentPct: 25,
      markupRatePct: 16,
      tenureMonths: 24,
      frequency: 'monthly',
      startDate: '2025-11-01',
      paidInstallmentsCount: 8,
    },
    {
      customerName: 'Usman Ghani',
      customerPhone: '+923129990011',
      customerCnic: '61101-1234567-3',
      customerAddress: 'Sector F-7/2, Street 19, Islamabad',
      guarantorName: 'Bilal Hussain',
      guarantorPhone: '+923342223344',
      guarantorCnic: '61101-7654321-9',
      itemName: 'Honda Civic RS 1.5 Turbo 2022',
      itemDetails: 'Meteoroid Gray Metallic / Red Stitched Sport Seats / 28,000 km',
      totalPrice: 9200000,
      downPaymentPct: 20,
      markupRatePct: 15,
      tenureMonths: 36,
      frequency: 'monthly',
      startDate: '2025-06-10',
      paidInstallmentsCount: 14,
    }
  ];

  for (const b of businesses) {
    // Check if plans already exist
    const count = await prisma.installment_plans.count({
      where: { business_id: b.id }
    });

    if (count > 0) {
      console.log(`Business ${b.business_name || b.domain} already has ${count} installment plans.`);
      continue;
    }

    console.log(`Seeding sample installment contracts for ${b.business_name || b.domain} (${b.id})...`);

    let planIdx = 1;
    for (const c of sampleContracts) {
      const summary = calculateInstallmentSummary({
        totalPrice: c.totalPrice,
        downPaymentPct: c.downPaymentPct,
        markupRatePct: c.markupRatePct,
        tenureMonths: c.tenureMonths,
        frequency: c.frequency,
      });

      const schedule = generateInstallmentSchedule({
        startDate: new Date(c.startDate),
        numberOfInstallments: summary.numberOfInstallments,
        installmentAmount: summary.installmentAmount,
        totalFinancedPayable: summary.totalFinancedPayable,
        frequency: summary.frequency,
      });

      // Mark first N installments as paid
      for (let i = 0; i < c.paidInstallmentsCount && i < schedule.length; i++) {
        schedule[i].status = 'paid';
        schedule[i].paid_amount = schedule[i].amount;
        schedule[i].paid_date = schedule[i].due_date;
        schedule[i].payment_method = 'Bank Transfer / Online';
        schedule[i].notes = 'Verified receipt via online banking ledger';
      }

      const planNumber = `INST-${new Date().getFullYear()}-${String(planIdx++).padStart(4, '0')}`;

      await prisma.installment_plans.create({
        data: {
          business_id: b.id,
          plan_number: planNumber,
          customer_name: c.customerName,
          customer_phone: c.customerPhone,
          customer_cnic: c.customerCnic,
          customer_address: c.customerAddress,
          guarantor_name: c.guarantorName,
          guarantor_phone: c.guarantorPhone,
          guarantor_cnic: c.guarantorCnic,
          item_name: c.itemName,
          item_details: c.itemDetails,
          total_price: summary.totalPrice,
          down_payment_amount: summary.downPaymentAmount,
          down_payment_pct: summary.downPaymentPct,
          financed_amount: summary.financedAmount,
          markup_rate_pct: summary.markupRatePct,
          markup_amount: summary.markupAmount,
          total_payable: summary.totalContractPayable,
          frequency: summary.frequency,
          tenure_months: summary.tenureMonths,
          number_of_installments: summary.numberOfInstallments,
          installment_amount: summary.installmentAmount,
          start_date: new Date(c.startDate),
          status: 'active',
          schedule_data: schedule,
        }
      });
    }
    console.log(`Successfully seeded sample installment plans for ${b.business_name || b.domain}!`);
  }

  process.exit(0);
}

seedInstallments().catch((err) => {
  console.error('Failed to seed sample installments:', err);
  process.exit(1);
});
