import {Column, Entity, PrimaryGeneratedColumn} from 'typeorm';

import {dbSelectNumeric} from '../transformers/dbSelectNumeric.transformer';
import {LocationDTO} from '../dto/location.dto';
import {CreateCarDTO} from '../app/temporaryLead/dto/requests/car.dto';

export enum LEAD_STATUSES {
  CREATED = 'created',
  SENT = 'sent',
}

@Entity({ name: 'temporaryLead' })
export class TemporaryLeadEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('varchar', { nullable: true })
  trailerType: string;

  @Column('json')
  pickLocation: LocationDTO;

  @Column('json')
  deliveryLocation: LocationDTO;

  @Column('integer', { default: 0 })
  discount: number;

  @Column('varchar')
  status: string;

  // it's original estimate of quote
  @Column({ type: 'numeric', transformer: dbSelectNumeric })
  initialPrice: number;

  // it's price show to de client: original estimate - discount
  @Column({ type: 'numeric', transformer: dbSelectNumeric })
  priceWithDiscount: number;

  @Column({
    type: 'numeric',
    transformer: dbSelectNumeric,
  })
  distance: number;

  // it's the price shown for carrier actors: load price - agent profit
  @Column({ type: 'numeric', transformer: dbSelectNumeric, nullable: true })
  salePrice: number;

  // it's the price shown to the system users: quote original estimate - discount - service fee
  @Column({ type: 'numeric', transformer: dbSelectNumeric, nullable: true })
  loadPrice: number;

  @Column('timestamp with time zone', { default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column('timestamp with time zone', { default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @Column('json')
  cars: CreateCarDTO[];

  @Column('json')
  customer: { firstName: string, lastName: string, email: string };

  @Column('text', { nullable: true })
  notes: string;

  @Column('integer', { nullable: false, default: 0 })
  sentCount: number;

  @Column('timestamp with time zone', { nullable: true })
  sentDate: Date;

  @Column('varchar', { nullable: false })
  ipAddress: string;

  @Column('timestamp with time zone', { nullable: false, default: () => `CURRENT_TIMESTAMP + INTERVAL '3 DAY'` })
  expirationDate: Date;

  @Column('integer', { nullable: true })
  leadId: number;
}
