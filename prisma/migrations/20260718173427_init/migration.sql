-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "role" AS ENUM ('admin', 'dispatcher', 'driver', 'carrier');

-- CreateEnum
CREATE TYPE "entry_mode" AS ENUM ('digital', 'manual_logged');

-- CreateEnum
CREATE TYPE "pay_type" AS ENUM ('flat_rate', 'cost_plus');

-- CreateEnum
CREATE TYPE "return_load_type" AS ENUM ('paid', 'empty_reposition', 'none');

-- CreateEnum
CREATE TYPE "checklist_item_state" AS ENUM ('present', 'missing', 'damaged');

-- CreateEnum
CREATE TYPE "checklist_stage" AS ENUM ('pickup', 'delivery');

-- CreateEnum
CREATE TYPE "claim_type" AS ENUM ('damage', 'missing_part', 'delay', 'other');

-- CreateEnum
CREATE TYPE "claim_status" AS ENUM ('open', 'under_review', 'settled', 'rejected');

-- CreateEnum
CREATE TYPE "cost_bearer" AS ENUM ('carrier', 'insurance', 'company', 'client');

-- CreateEnum
CREATE TYPE "payment_method" AS ENUM ('cash', 'bank_transfer', 'cheque', 'online', 'other');

-- CreateEnum
CREATE TYPE "trip_delivery_status" AS ENUM ('pending', 'in_transit', 'delivered');

-- CreateEnum
CREATE TYPE "rate_agreement_status" AS ENUM ('active', 'inactive', 'expired');

-- CreateEnum
CREATE TYPE "trip_expense_type" AS ENUM ('diesel', 'toll', 'extra_delivery', 'other');

-- CreateEnum
CREATE TYPE "clearing_charge_type" AS ENUM ('noc_processing', 'port_clearance', 'documentation', 'misc');

-- CreateEnum
CREATE TYPE "vendor_type" AS ENUM ('tyre_shop', 'repair_shop', 'oil_filter_supplier', 'other');

-- CreateEnum
CREATE TYPE "invoice_status" AS ENUM ('draft', 'sent', 'partially_paid', 'paid', 'overdue', 'cancelled');

-- CreateEnum
CREATE TYPE "payable_status" AS ENUM ('open', 'partially_paid', 'paid');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "role" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "driver_id" UUID,
    "carrier_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" UUID,
    "updated_by" UUID,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" UUID NOT NULL,
    "company_name" TEXT NOT NULL,
    "billing_contact_name" TEXT,
    "billing_contact_phone" TEXT,
    "billing_contact_email" TEXT,
    "operations_contact_name" TEXT,
    "operations_contact_phone" TEXT,
    "operations_contact_email" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" UUID,
    "updated_by" UUID,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_plant_locations" (
    "id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" UUID,
    "updated_by" UUID,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "customer_plant_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_delivery_points" (
    "id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "dealer_name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" UUID,
    "updated_by" UUID,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "customer_delivery_points_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_rate_agreements" (
    "id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "origin_city" TEXT NOT NULL,
    "destination_city" TEXT NOT NULL,
    "vehicle_category" TEXT NOT NULL,
    "rate_per_vehicle" DECIMAL(14,2) NOT NULL,
    "valid_from" TIMESTAMP(3) NOT NULL,
    "valid_to" TIMESTAMP(3) NOT NULL,
    "fuel_surcharge_clause" TEXT,
    "status" "rate_agreement_status" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" UUID,
    "updated_by" UUID,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "client_rate_agreements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "booking_date" TIMESTAMP(3) NOT NULL,
    "origin_city" TEXT NOT NULL,
    "destination_city" TEXT NOT NULL,
    "requested_pickup_date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" UUID,
    "updated_by" UUID,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "carriers" (
    "id" UUID NOT NULL,
    "company_name" TEXT NOT NULL,
    "contact_name" TEXT,
    "contact_phone" TEXT,
    "contact_email" TEXT,
    "pay_type" "pay_type" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" UUID,
    "updated_by" UUID,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "carriers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drivers" (
    "id" UUID NOT NULL,
    "carrier_id" UUID,
    "name" TEXT NOT NULL,
    "license_number" TEXT NOT NULL,
    "phone" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" UUID,
    "updated_by" UUID,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "drivers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trips" (
    "id" UUID NOT NULL,
    "bilty_number" TEXT NOT NULL,
    "entry_mode" "entry_mode" NOT NULL,
    "booking_id" UUID,
    "trip_date" TIMESTAMP(3) NOT NULL,
    "destination" TEXT NOT NULL,
    "consigner_customer_id" UUID NOT NULL,
    "consignee_name" TEXT NOT NULL,
    "consignee_address" TEXT NOT NULL,
    "carrier_id" UUID NOT NULL,
    "driver_id" UUID NOT NULL,
    "booking_time" TIMESTAMP(3) NOT NULL,
    "return_load_type" "return_load_type" NOT NULL,
    "freight_amount" DECIMAL(14,2) NOT NULL,
    "suggested_freight_amount" DECIMAL(14,2),
    "freight_overridden" BOOLEAN NOT NULL DEFAULT false,
    "delivery_status" "trip_delivery_status" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" UUID,
    "updated_by" UUID,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "trips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "freight_override_logs" (
    "id" UUID NOT NULL,
    "trip_id" UUID NOT NULL,
    "previous_amount" DECIMAL(14,2),
    "new_amount" DECIMAL(14,2) NOT NULL,
    "overridden_by" UUID NOT NULL,
    "overridden_at" TIMESTAMP(3) NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "freight_override_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cargo_vehicles" (
    "id" UUID NOT NULL,
    "trip_id" UUID NOT NULL,
    "make" TEXT NOT NULL,
    "vehicle_type" TEXT NOT NULL,
    "chassis_number" TEXT NOT NULL,
    "engine_number" TEXT NOT NULL,
    "condition" TEXT,
    "colour" TEXT,
    "model" TEXT,
    "registration_number" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" UUID,
    "updated_by" UUID,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "cargo_vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checklist_item_definitions" (
    "id" UUID NOT NULL,
    "item_number" INTEGER NOT NULL,
    "label_en" TEXT NOT NULL,
    "label_ur" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" UUID,
    "updated_by" UUID,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "checklist_item_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_condition_checklists" (
    "id" UUID NOT NULL,
    "cargo_vehicle_id" UUID NOT NULL,
    "trip_id" UUID NOT NULL,
    "carrier_id" UUID,
    "driver_id" UUID,
    "stage" "checklist_stage" NOT NULL,
    "recorded_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" UUID,
    "updated_by" UUID,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "vehicle_condition_checklists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checklist_item_results" (
    "id" UUID NOT NULL,
    "checklist_id" UUID NOT NULL,
    "item_definition_id" UUID NOT NULL,
    "state" "checklist_item_state" NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" UUID,
    "updated_by" UUID,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "checklist_item_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trip_expenses" (
    "id" UUID NOT NULL,
    "trip_id" UUID NOT NULL,
    "carrier_id" UUID,
    "driver_id" UUID,
    "expense_type" "trip_expense_type" NOT NULL,
    "diesel_quantity_liters" DECIMAL(10,2),
    "price_per_unit" DECIMAL(14,2),
    "amount" DECIMAL(14,2) NOT NULL,
    "odometer_reading" INTEGER,
    "location" TEXT,
    "expense_date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" UUID,
    "updated_by" UUID,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "trip_expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clearing_agents" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "contact_name" TEXT,
    "contact_phone" TEXT,
    "city" TEXT,
    "port" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" UUID,
    "updated_by" UUID,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "clearing_agents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clearing_agent_charges" (
    "id" UUID NOT NULL,
    "clearing_agent_id" UUID NOT NULL,
    "trip_id" UUID,
    "charge_type" "clearing_charge_type" NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "reference_number" TEXT,
    "charge_date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" UUID,
    "updated_by" UUID,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "clearing_agent_charges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendors" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "vendor_type" "vendor_type" NOT NULL,
    "contact_name" TEXT,
    "contact_phone" TEXT,
    "city" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" UUID,
    "updated_by" UUID,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "vendors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_transactions" (
    "id" UUID NOT NULL,
    "vendor_id" UUID NOT NULL,
    "trip_id" UUID,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "transaction_date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" UUID,
    "updated_by" UUID,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "vendor_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" UUID NOT NULL,
    "trip_id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "invoice_number" TEXT NOT NULL,
    "invoice_date" TIMESTAMP(3) NOT NULL,
    "freight_amount" DECIMAL(14,2) NOT NULL,
    "tax_or_deduction_amount" DECIMAL(14,2),
    "total_amount" DECIMAL(14,2) NOT NULL,
    "is_auto_generated" BOOLEAN NOT NULL DEFAULT false,
    "status" "invoice_status" NOT NULL DEFAULT 'draft',
    "edited_by" UUID,
    "edited_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" UUID,
    "updated_by" UUID,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incoming_payments" (
    "id" UUID NOT NULL,
    "invoice_id" UUID NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "payment_date" TIMESTAMP(3) NOT NULL,
    "method" "payment_method" NOT NULL,
    "reference_number" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" UUID,
    "updated_by" UUID,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "incoming_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "carrier_payables" (
    "id" UUID NOT NULL,
    "trip_id" UUID NOT NULL,
    "carrier_id" UUID NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "status" "payable_status" NOT NULL DEFAULT 'open',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" UUID,
    "updated_by" UUID,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "carrier_payables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_payables" (
    "id" UUID NOT NULL,
    "trip_id" UUID,
    "vendor_transaction_id" UUID,
    "clearing_agent_charge_id" UUID,
    "amount" DECIMAL(14,2) NOT NULL,
    "status" "payable_status" NOT NULL DEFAULT 'open',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" UUID,
    "updated_by" UUID,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "vendor_payables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outgoing_payments" (
    "id" UUID NOT NULL,
    "carrier_payable_id" UUID,
    "vendor_payable_id" UUID,
    "amount" DECIMAL(14,2) NOT NULL,
    "payment_date" TIMESTAMP(3) NOT NULL,
    "method" "payment_method" NOT NULL,
    "reference_number" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" UUID,
    "updated_by" UUID,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "outgoing_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "claims" (
    "id" UUID NOT NULL,
    "trip_id" UUID NOT NULL,
    "cargo_vehicle_id" UUID NOT NULL,
    "claim_type" "claim_type" NOT NULL,
    "description" TEXT NOT NULL,
    "reported_by" UUID NOT NULL,
    "claim_date" TIMESTAMP(3) NOT NULL,
    "status" "claim_status" NOT NULL DEFAULT 'open',
    "claim_amount" DECIMAL(14,2),
    "cost_bearer" "cost_bearer",
    "resolution_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" UUID,
    "updated_by" UUID,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "claims_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "claim_checklist_items" (
    "id" UUID NOT NULL,
    "claim_id" UUID NOT NULL,
    "item_definition_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "claim_checklist_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trip_media" (
    "id" UUID NOT NULL,
    "trip_id" UUID NOT NULL,
    "stage" "checklist_stage" NOT NULL,
    "reference_text" TEXT NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" UUID,
    "updated_by" UUID,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "trip_media_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "client_rate_agreements_customer_id_origin_city_destination__idx" ON "client_rate_agreements"("customer_id", "origin_city", "destination_city", "vehicle_category");

-- CreateIndex
CREATE INDEX "trips_bilty_number_idx" ON "trips"("bilty_number");

-- CreateIndex
CREATE INDEX "trips_carrier_id_idx" ON "trips"("carrier_id");

-- CreateIndex
CREATE INDEX "trips_driver_id_idx" ON "trips"("driver_id");

-- CreateIndex
CREATE INDEX "cargo_vehicles_trip_id_idx" ON "cargo_vehicles"("trip_id");

-- CreateIndex
CREATE UNIQUE INDEX "checklist_item_definitions_item_number_key" ON "checklist_item_definitions"("item_number");

-- CreateIndex
CREATE INDEX "vehicle_condition_checklists_trip_id_idx" ON "vehicle_condition_checklists"("trip_id");

-- CreateIndex
CREATE INDEX "vehicle_condition_checklists_carrier_id_idx" ON "vehicle_condition_checklists"("carrier_id");

-- CreateIndex
CREATE INDEX "vehicle_condition_checklists_driver_id_idx" ON "vehicle_condition_checklists"("driver_id");

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_condition_checklists_cargo_vehicle_id_stage_key" ON "vehicle_condition_checklists"("cargo_vehicle_id", "stage");

-- CreateIndex
CREATE UNIQUE INDEX "checklist_item_results_checklist_id_item_definition_id_key" ON "checklist_item_results"("checklist_id", "item_definition_id");

-- CreateIndex
CREATE INDEX "trip_expenses_trip_id_idx" ON "trip_expenses"("trip_id");

-- CreateIndex
CREATE INDEX "trip_expenses_carrier_id_idx" ON "trip_expenses"("carrier_id");

-- CreateIndex
CREATE INDEX "trip_expenses_driver_id_idx" ON "trip_expenses"("driver_id");

-- CreateIndex
CREATE INDEX "clearing_agent_charges_trip_id_idx" ON "clearing_agent_charges"("trip_id");

-- CreateIndex
CREATE INDEX "vendor_transactions_trip_id_idx" ON "vendor_transactions"("trip_id");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_invoice_number_key" ON "invoices"("invoice_number");

-- CreateIndex
CREATE INDEX "invoices_trip_id_idx" ON "invoices"("trip_id");

-- CreateIndex
CREATE INDEX "invoices_customer_id_idx" ON "invoices"("customer_id");

-- CreateIndex
CREATE INDEX "incoming_payments_invoice_id_idx" ON "incoming_payments"("invoice_id");

-- CreateIndex
CREATE INDEX "carrier_payables_trip_id_idx" ON "carrier_payables"("trip_id");

-- CreateIndex
CREATE INDEX "carrier_payables_carrier_id_idx" ON "carrier_payables"("carrier_id");

-- CreateIndex
CREATE INDEX "vendor_payables_trip_id_idx" ON "vendor_payables"("trip_id");

-- CreateIndex
CREATE INDEX "claims_trip_id_idx" ON "claims"("trip_id");

-- CreateIndex
CREATE INDEX "claims_cargo_vehicle_id_idx" ON "claims"("cargo_vehicle_id");

-- CreateIndex
CREATE UNIQUE INDEX "claim_checklist_items_claim_id_item_definition_id_key" ON "claim_checklist_items"("claim_id", "item_definition_id");

-- CreateIndex
CREATE INDEX "trip_media_trip_id_idx" ON "trip_media"("trip_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "drivers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_carrier_id_fkey" FOREIGN KEY ("carrier_id") REFERENCES "carriers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_plant_locations" ADD CONSTRAINT "customer_plant_locations_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_delivery_points" ADD CONSTRAINT "customer_delivery_points_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_rate_agreements" ADD CONSTRAINT "client_rate_agreements_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drivers" ADD CONSTRAINT "drivers_carrier_id_fkey" FOREIGN KEY ("carrier_id") REFERENCES "carriers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_consigner_customer_id_fkey" FOREIGN KEY ("consigner_customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_carrier_id_fkey" FOREIGN KEY ("carrier_id") REFERENCES "carriers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "drivers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "freight_override_logs" ADD CONSTRAINT "freight_override_logs_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cargo_vehicles" ADD CONSTRAINT "cargo_vehicles_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_condition_checklists" ADD CONSTRAINT "vehicle_condition_checklists_cargo_vehicle_id_fkey" FOREIGN KEY ("cargo_vehicle_id") REFERENCES "cargo_vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_condition_checklists" ADD CONSTRAINT "vehicle_condition_checklists_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_condition_checklists" ADD CONSTRAINT "vehicle_condition_checklists_carrier_id_fkey" FOREIGN KEY ("carrier_id") REFERENCES "carriers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_condition_checklists" ADD CONSTRAINT "vehicle_condition_checklists_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "drivers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_item_results" ADD CONSTRAINT "checklist_item_results_checklist_id_fkey" FOREIGN KEY ("checklist_id") REFERENCES "vehicle_condition_checklists"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_item_results" ADD CONSTRAINT "checklist_item_results_item_definition_id_fkey" FOREIGN KEY ("item_definition_id") REFERENCES "checklist_item_definitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_expenses" ADD CONSTRAINT "trip_expenses_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_expenses" ADD CONSTRAINT "trip_expenses_carrier_id_fkey" FOREIGN KEY ("carrier_id") REFERENCES "carriers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_expenses" ADD CONSTRAINT "trip_expenses_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "drivers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clearing_agent_charges" ADD CONSTRAINT "clearing_agent_charges_clearing_agent_id_fkey" FOREIGN KEY ("clearing_agent_id") REFERENCES "clearing_agents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clearing_agent_charges" ADD CONSTRAINT "clearing_agent_charges_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_transactions" ADD CONSTRAINT "vendor_transactions_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_transactions" ADD CONSTRAINT "vendor_transactions_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incoming_payments" ADD CONSTRAINT "incoming_payments_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carrier_payables" ADD CONSTRAINT "carrier_payables_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carrier_payables" ADD CONSTRAINT "carrier_payables_carrier_id_fkey" FOREIGN KEY ("carrier_id") REFERENCES "carriers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_payables" ADD CONSTRAINT "vendor_payables_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_payables" ADD CONSTRAINT "vendor_payables_vendor_transaction_id_fkey" FOREIGN KEY ("vendor_transaction_id") REFERENCES "vendor_transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_payables" ADD CONSTRAINT "vendor_payables_clearing_agent_charge_id_fkey" FOREIGN KEY ("clearing_agent_charge_id") REFERENCES "clearing_agent_charges"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outgoing_payments" ADD CONSTRAINT "outgoing_payments_carrier_payable_id_fkey" FOREIGN KEY ("carrier_payable_id") REFERENCES "carrier_payables"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outgoing_payments" ADD CONSTRAINT "outgoing_payments_vendor_payable_id_fkey" FOREIGN KEY ("vendor_payable_id") REFERENCES "vendor_payables"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "claims" ADD CONSTRAINT "claims_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "claims" ADD CONSTRAINT "claims_cargo_vehicle_id_fkey" FOREIGN KEY ("cargo_vehicle_id") REFERENCES "cargo_vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "claim_checklist_items" ADD CONSTRAINT "claim_checklist_items_claim_id_fkey" FOREIGN KEY ("claim_id") REFERENCES "claims"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "claim_checklist_items" ADD CONSTRAINT "claim_checklist_items_item_definition_id_fkey" FOREIGN KEY ("item_definition_id") REFERENCES "checklist_item_definitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_media" ADD CONSTRAINT "trip_media_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
