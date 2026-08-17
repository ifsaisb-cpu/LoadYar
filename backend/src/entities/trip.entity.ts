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

@Entity('trips')
export class Trip {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer' })
  tenant_id: number;

  @Column({ type: 'varchar', length: 50 })
  bilty_no: string;

  @Column({ type: 'integer', nullable: true })
  booking_id: number;

  @Column({ type: 'varchar', length: 20, nullable: true })
  entry_mode: string; // digital, manual_logged

  @Column({ type: 'date' })
  date: Date;

  @Column({ type: 'integer' })
  customer_id: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  route: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  consigner: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  consignee: string;

  @Column({ type: 'text', nullable: true })
  consignee_address: string;

  @Column({ type: 'integer', nullable: true })
  carrier_id: number;

  @Column({ type: 'integer', nullable: true })
  driver_id: number;

  @Column({ type: 'varchar', length: 10, nullable: true })
  booking_time: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  return_load_type: string;

  @Column({ type: 'varchar', length: 50, default: 'booked' })
  status: string; // booked, in_transit, delivered, closed

  @Column({ type: 'numeric', precision: 14, scale: 2, nullable: true })
  freight_paisa: number;

  @Column({ type: 'boolean', default: false })
  open_market: boolean;

  @Column({ type: 'integer', nullable: true })
  rate_agreement_id: number;

  @Column({ type: 'boolean', default: false })
  rate_overridden: boolean;

  @Column({ type: 'text', nullable: true })
  media_ref: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  veh_make: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  veh_type: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  veh_chassis: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  veh_engine: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  veh_colour: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  veh_model: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  veh_reg: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  veh_condition: string;

  @Column({ type: 'integer', nullable: true })
  agent_id: number;

  @Column({ type: 'numeric', precision: 14, scale: 2, nullable: true })
  agent_cost_paisa: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'integer', nullable: true })
  journey_id: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  load_from: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  load_to: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  pay_status: string; // to_be_billed, to_pay, partial, paid

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  created_by: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  updated_by: string;

  @Column({ type: 'timestamp', nullable: true })
  deleted_at: Date;

  // Relations
  @ManyToOne(() => Tenant, (tenant) => tenant.trips, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @ManyToOne(() => Customer, (customer) => customer.trips)
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;
}
