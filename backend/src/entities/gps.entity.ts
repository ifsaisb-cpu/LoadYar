import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('driver_locations')
export class DriverLocation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  tenant_id: number;

  @Column()
  driver_id: number;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  longitude: number;

  @Column({ type: 'decimal', precision: 6, scale: 2, nullable: true })
  accuracy: number;

  @Column({ type: 'decimal', precision: 6, scale: 2, nullable: true })
  speed_kmh: number;

  @Column({ type: 'int', nullable: true })
  heading: number;

  @Column({ type: 'int', nullable: true })
  altitude: number;

  @Column({ type: 'datetime' })
  recorded_at: Date;

  @Column({ type: 'datetime' })
  created_at: Date;

  @Column({ type: 'datetime' })
  updated_at: Date;

  @Column()
  created_by: string;

  @Column()
  updated_by: string;
}

@Entity('geofences')
export class Geofence {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  tenant_id: number;

  @Column()
  name: string;

  @Column({ type: 'varchar' })
  type: 'delivery_zone' | 'no_entry' | 'slow_zone' | 'checkpoint';

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  center_latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  center_longitude: number;

  @Column({ type: 'decimal', precision: 6, scale: 2 })
  radius_meters: number;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @Column({ default: true })
  is_active: boolean;

  @Column({ type: 'datetime' })
  created_at: Date;

  @Column({ type: 'datetime' })
  updated_at: Date;

  @Column()
  created_by: string;

  @Column()
  updated_by: string;
}

@Entity('route_snapshots')
export class RouteSnapshot {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  tenant_id: number;

  @Column()
  trip_id: number;

  @Column()
  driver_id: number;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  start_latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  start_longitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  end_latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  end_longitude: number;

  @Column({ type: 'decimal', precision: 8, scale: 2 })
  distance_km: number;

  @Column({ type: 'int' })
  estimated_duration_minutes: number;

  @Column({ type: 'int', nullable: true })
  actual_duration_minutes: number;

  @Column({ type: 'json' })
  waypoints: Record<string, any>[];

  @Column({ type: 'datetime' })
  created_at: Date;

  @Column({ type: 'datetime' })
  updated_at: Date;

  @Column()
  created_by: string;

  @Column()
  updated_by: string;
}
