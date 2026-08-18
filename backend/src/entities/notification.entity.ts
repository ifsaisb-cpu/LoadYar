import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('device_tokens')
export class DeviceToken {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  tenant_id: number;

  @Column()
  user_id: number;

  @Column()
  fcm_token: string;

  @Column({ type: 'varchar', default: 'mobile' })
  device_type: 'mobile' | 'web' | 'tablet';

  @Column({ type: 'varchar', nullable: true })
  device_model: string;

  @Column({ type: 'varchar', nullable: true })
  os_version: string;

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

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  tenant_id: number;

  @Column()
  user_id: number;

  @Column({ type: 'varchar' })
  type: 'trip_assignment' | 'delivery_status' | 'geofence_alert' | 'payment' | 'system' | 'custom';

  @Column()
  title: string;

  @Column()
  body: string;

  @Column({ type: 'json', nullable: true })
  data: Record<string, any>;

  @Column({ type: 'varchar', nullable: true })
  deep_link: string;

  @Column({ default: false })
  is_read: boolean;

  @Column({ type: 'datetime', nullable: true })
  read_at: Date;

  @Column({ type: 'datetime' })
  sent_at: Date;

  @Column({ type: 'datetime' })
  created_at: Date;

  @Column({ type: 'datetime' })
  updated_at: Date;

  @Column()
  created_by: string;

  @Column()
  updated_by: string;
}

@Entity('notification_schedules')
export class NotificationSchedule {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  tenant_id: number;

  @Column()
  name: string;

  @Column({ type: 'varchar' })
  trigger_event: string;

  @Column({ type: 'json' })
  notification_template: Record<string, any>;

  @Column({ default: true })
  is_enabled: boolean;

  @Column({ type: 'datetime' })
  created_at: Date;

  @Column({ type: 'datetime' })
  updated_at: Date;

  @Column()
  created_by: string;

  @Column()
  updated_by: string;
}
