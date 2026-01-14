import { Entity, PrimaryGeneratedColumn, Column, Point } from 'typeorm';

export enum AmbulanceStatus {
  AVAILABLE = 'available',
  BUSY = 'busy',
  DISPATCHED = 'dispatched',
}

@Entity('ambulances')
export class Ambulance {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    type: 'enum',
    enum: AmbulanceStatus,
    default: AmbulanceStatus.AVAILABLE,
  })
  status!: AmbulanceStatus;

  @Column({
    type: 'geography',
    spatialFeatureType: 'Point',
    srid: 4326,
  })
  location!: Point;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  last_updated!: Date;
}

