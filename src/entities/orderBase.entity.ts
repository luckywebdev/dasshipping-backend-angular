import { Column, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from 'typeorm';

import { dbSelectNumeric } from '../transformers/dbSelectNumeric.transformer';
import { AccountEntity } from './account.entity';
import { LocationEntity } from './location.entity';

export enum TRAILER_TYPE {
  OPEN = 'Open',
  ENCLOSED = 'Enclosed',
}

export enum QUOTE_STATUS {
  NEW = 'new',
  ACCEPTED = 'accepted',
  BOOKED = 'booked',
  QUOTE_EXPIRED = 'expired',
  QUOTE_CANCELED = 'canceled',
  LEAD = 'lead',
  QUOTED = 'quoted',
}

export enum ORDER_STATUS {
  QUOTE = 'new',
  PUBLISHED = 'published',
  DECLINED = 'declined',
  CLAIMED = 'claimed',
  DISPATCHED = 'dispatched',
  CANCELED = 'canceled',
  PAID = 'paid',
  ON_PICKUP = 'on_pickup',
  ON_WAY_TO_PICKUP = 'on_way_to_pickup',
  PICKED_UP = 'picked_up',
  ON_DELIVERY = 'on_delivery',
  DELIVERED = 'delivered',
  ON_WAY_TO_DELIVERY = 'on_way_to_delivery',
  SIGNATURE_REQUESTED = 'signature_requested',
  DELETED = 'deleted',
  ARCHIVED = 'archived',
  BILLED = 'billed',
}

export const DELIVERED_ORDERS: string[] = [ORDER_STATUS.DELIVERED, ORDER_STATUS.CLAIMED, ORDER_STATUS.BILLED, ORDER_STATUS.PAID];
export const PICKED_UP_ORDERS: string[] = [ORDER_STATUS.ON_WAY_TO_DELIVERY, ORDER_STATUS.PICKED_UP, ORDER_STATUS.ON_DELIVERY];

export abstract class OrderBaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('varchar', { nullable: true })
  trailerType: string;

  @OneToOne(type => LocationEntity)
  @JoinColumn()
  pickLocation: LocationEntity;

  @Column('integer', { nullable: true })
  pickLocationId: number;

  @OneToOne(type => LocationEntity)
  @JoinColumn()
  deliveryLocation: LocationEntity;

  @Column('integer', { nullable: true })
  deliveryLocationId: number;

  @ManyToOne(type => AccountEntity, account => account.orders)
  createdBy: AccountEntity;

  @Column('integer', { default: 0 })
  discount: number;

  @Column('varchar', { default: ORDER_STATUS.QUOTE })
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

  @Column('varchar', { nullable: true })
  uuid: string;
}
