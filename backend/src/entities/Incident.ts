import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Point } from 'typeorm';
import { Ambulance } from './Ambulance';

export enum IncidentStatus {
  PENDING = 'pending',
  DISPATCHED = 'dispatched',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  CANCELLED = 'cancelled',
}

export enum IncidentPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

@Entity('incidents')
export class Incident {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  address!: string;

  @Column({
    type: 'geography',
    spatialFeatureType: 'Point',
    srid: 4326,
  })
  location!: Point;

  @Column({
    type: 'enum',
    enum: IncidentPriority,
    default: IncidentPriority.MEDIUM,
  })
  priority!: IncidentPriority;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({
    type: 'enum',
    enum: IncidentStatus,
    default: IncidentStatus.PENDING,
  })
  status!: IncidentStatus;

  @Column({ type: 'uuid', nullable: true })
  assigned_ambulance_id?: string;

  @ManyToOne(() => Ambulance, { nullable: true })
  @JoinColumn({ name: 'assigned_ambulance_id' })
  assignedAmbulance?: Ambulance;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updated_at!: Date;
}

