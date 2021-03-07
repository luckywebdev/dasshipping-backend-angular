import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, Unique } from 'typeorm';

import { InspectionImagesDTO } from '../dto/inspectionImages.dto';
import { SignedByDTO } from '../dto/signedBy.dto';
import { AccountEntity } from './account.entity';
import { CarEntity } from './car.entity';
import { InspectionDetailsEntity } from './inspectionDetails.entity';
import { LocationEntity } from './location.entity';
import { OrderEntity } from './order.entity';

export enum INSPECTION_TYPE {
  PICKUP = 'pickup',
  DELIVERY = 'delivery',
}
export enum INSPECTION_STATUS {
  STARTED = 'started',
  PENDING_SIGNATURE = 'pending signature',
  VIEWED = 'viewed',
  DECLINED = 'declined',
  SIGNED = 'signed',
  FINISHED = 'finished',
  SIGNATURE_REQUESTED = 'signature_requested',
}

@Entity({ name: 'inspection' })
@Unique('UNX_car_inspection_type', ['carId', 'type'])
export class InspectionEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('varchar', { nullable: false })
  type: string;

  @Column('boolean', { default: false })
  vinNumberConfirmed: boolean;

  @ManyToOne(type => AccountEntity)
  driver: AccountEntity;

  @Column('integer', { nullable: false })
  driverId: number;

  @ManyToOne(type => AccountEntity)
  client: AccountEntity;

  @Column('integer', { nullable: true })
  clientId: number;

  @ManyToOne(type => AccountEntity)
  createdBy: AccountEntity;

  @Column('integer', { nullable: false })
  createdById: number;

  @ManyToOne(type => LocationEntity)
  @JoinColumn()
  createdLocation: LocationEntity;

  @Column('integer', { nullable: true })
  createdLocationId: number;

  @ManyToOne(type => LocationEntity)
  @JoinColumn()
  signLocation: LocationEntity;

  @Column('integer', { nullable: true })
  signLocationId: number;

  @ManyToOne(type => CarEntity)
  @JoinColumn()
  car: CarEntity;

  @Column('integer', { nullable: false })
  carId: number;

  @OneToMany(type => InspectionDetailsEntity, detail => detail.inspection, {
    cascade: true,
  })
  details: InspectionDetailsEntity[];

  @Column('json', { nullable: true })
  signedBy: SignedByDTO;

  @Column('varchar', { nullable: true })
  signatureUrl: string;

  @Column('timestamp with time zone', { nullable: true })
  signedAt: Date;

  @Column('varchar', { nullable: false })
  status: string;

  @ManyToOne(type => OrderEntity)
  order: OrderEntity;

  @Column('integer', { nullable: true })
  orderId: number;

  @Column('timestamp with time zone', { default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column('timestamp with time zone', { default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @Column('json', { nullable: true })
  images: InspectionImagesDTO[];

  @Column('text', { nullable: true })
  driverNotes: string;
}
