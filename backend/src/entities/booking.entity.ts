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

@Entity('bookings')
export class Booking {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer' })
  tenant_id: number;

  @Column({ type: 'integer' })
  customer_id: number;

  @Column({ type: 'date' })
  booking_date: Date;

  @Column({ type: 'varchar', length: 50, nullable: true })
  bilty_no: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  gate_pass: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  route_from: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  destination: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  consignee: string;

  @Column({ type: 'date', nullable: true })
  requested_pickup: Date;

  @Column({ type: 'varchar', length: 50, default: 'open' })
  status: string; // open, converted, booked

  @Column({ type: 'integer', nullable: true })
  trip_id: number;

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
  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;
}
