import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  tenant_id: number;

  @Column()
  user_id: number;

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  amount: number;

  @Column({ type: 'varchar' })
  currency: 'PKR' | 'USD';

  @Column({ type: 'varchar' })
  method: 'stripe' | 'jazzcash' | 'easypaisa' | 'bank_transfer';

  @Column({ type: 'varchar' })
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';

  @Column({ nullable: true })
  transaction_id: string;

  @Column({ nullable: true })
  reference_number: string;

  @Column({ type: 'json', nullable: true })
  payment_details: Record<string, any>;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'int', default: 0 })
  retry_count: number;

  @Column({ type: 'datetime', nullable: true })
  processed_at: Date;

  @Column({ type: 'datetime', nullable: true })
  completed_at: Date;

  @Column({ type: 'datetime' })
  created_at: Date;

  @Column({ type: 'datetime' })
  updated_at: Date;

  @Column()
  created_by: string;

  @Column()
  updated_by: string;
}

@Entity('subscriptions_payment_history')
export class SubscriptionPaymentHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  tenant_id: number;

  @Column()
  subscription_id: number;

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  amount: number;

  @Column()
  billing_cycle_start: Date;

  @Column()
  billing_cycle_end: Date;

  @Column({ type: 'varchar' })
  status: 'pending' | 'paid' | 'failed' | 'partial';

  @Column({ nullable: true })
  payment_id: number;

  @Column({ type: 'int', default: 0 })
  retry_count: number;

  @Column({ type: 'datetime', nullable: true })
  paid_at: Date;

  @Column({ type: 'datetime' })
  created_at: Date;

  @Column({ type: 'datetime' })
  updated_at: Date;

  @Column()
  created_by: string;

  @Column()
  updated_by: string;
}

@Entity('payment_methods')
export class PaymentMethod {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  tenant_id: number;

  @Column()
  user_id: number;

  @Column({ type: 'varchar' })
  method_type: 'card' | 'bank' | 'mobile_money';

  @Column({ type: 'varchar' })
  provider: 'stripe' | 'jazzcash' | 'easypaisa' | 'bank';

  @Column()
  token: string;

  @Column({ nullable: true })
  last_four_digits: string;

  @Column({ nullable: true })
  card_holder_name: string;

  @Column({ nullable: true })
  expiry_month: number;

  @Column({ nullable: true })
  expiry_year: number;

  @Column({ default: false })
  is_default: boolean;

  @Column({ default: true })
  is_active: boolean;

  @Column({ type: 'datetime', nullable: true })
  last_used_at: Date;

  @Column({ type: 'datetime' })
  created_at: Date;

  @Column({ type: 'datetime' })
  updated_at: Date;

  @Column()
  created_by: string;

  @Column()
  updated_by: string;
}

@Entity('invoices_paid')
export class InvoicePaid {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  tenant_id: number;

  @Column()
  invoice_id: number;

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  amount_paid: number;

  @Column({ nullable: true })
  payment_id: number;

  @Column({ type: 'datetime' })
  paid_on: Date;

  @Column({ type: 'datetime' })
  created_at: Date;

  @Column({ type: 'datetime' })
  updated_at: Date;

  @Column()
  created_by: string;

  @Column()
  updated_by: string;
}

@Entity('payment_reconciliation')
export class PaymentReconciliation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  tenant_id: number;

  @Column({ type: 'varchar' })
  provider: 'stripe' | 'jazzcash' | 'easypaisa' | 'bank';

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  total_transactions: number;

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  total_amount: number;

  @Column({ type: 'int' })
  transaction_count: number;

  @Column({ type: 'json', nullable: true })
  discrepancies: Record<string, any>[];

  @Column({ type: 'varchar', default: 'pending' })
  status: 'pending' | 'reconciled' | 'failed';

  @Column({ type: 'datetime' })
  reconciliation_date: Date;

  @Column({ type: 'datetime' })
  created_at: Date;

  @Column({ type: 'datetime' })
  updated_at: Date;

  @Column()
  created_by: string;

  @Column()
  updated_by: string;
}
