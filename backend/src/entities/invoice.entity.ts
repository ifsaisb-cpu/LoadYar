import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Tenant } from './tenant.entity';
import { Customer } from './customer.entity';
import { Trip } from './trip.entity';

@Entity('invoices')
export class Invoice {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer' })
  tenant_id: number;

  @Column({ type: 'integer' })
  trip_id: number;

  @Column({ type: 'integer' })
  customer_id: number;

  @Column({ type: 'varchar', length: 50 })
  invoice_number: string;

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  amount_paisa: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  tax_label: string;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  tax_paisa: number;

  @Column({ type: 'varchar', length: 50, default: 'unpaid' })
  status: string; // unpaid, partial, paid

  @Column({ type: 'date' })
  invoice_date: Date;

  @Column({ type: 'date', nullable: true })
  due_date: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  created_by: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  updated_by: string;

  // Relations
  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @ManyToOne(() => Trip)
  @JoinColumn({ name: 'trip_id' })
  trip: Trip;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;
}
