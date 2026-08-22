-- CreateTable
CREATE TABLE IF NOT EXISTS "installment_plans" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
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
    "start_date" DATE NOT NULL,
    "status" VARCHAR(30) NOT NULL DEFAULT 'active',
    "notes" TEXT,
    "schedule_data" JSONB DEFAULT '[]',
    "domain_data" JSONB DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "installment_plans_pkey" PRIMARY KEY ("id")
);

-- CreateIndexes
CREATE INDEX IF NOT EXISTS "idx_installment_plan_business" ON "installment_plans"("business_id");
CREATE INDEX IF NOT EXISTS "idx_installment_plan_status" ON "installment_plans"("business_id", "status");
CREATE INDEX IF NOT EXISTS "idx_installment_plan_customer" ON "installment_plans"("business_id", "customer_name");
CREATE INDEX IF NOT EXISTS "idx_installment_plan_domain_data" ON "installment_plans" USING GIN ("domain_data");

-- Foreign Keys
ALTER TABLE "installment_plans" ADD CONSTRAINT "installment_plans_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "installment_plans" ADD CONSTRAINT "installment_plans_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
ALTER TABLE "installment_plans" ADD CONSTRAINT "installment_plans_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
