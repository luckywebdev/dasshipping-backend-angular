import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';

import { dbSelectNumeric } from '../transformers/dbSelectNumeric.transformer';
import { AccountEntity } from './account.entity';
import { CarEntity } from './car.entity';
import { CompanyEntity } from './company.entity';
import { DispatchEntity } from './dispatch.entity';
import { InspectionEntity } from './inspection.entity';
import { InviteEntity } from './invite.entity';
import { NotificationEntity } from './notification.entity';
import { OrderAttachmentEntity } from './orderAttachment.entity';
import { OrderBaseEntity } from './orderBase.entity';
import { OrderNoteEntity } from './orderNote.entity';
import { OrderToTripEntity } from './orderToTrip.entity';
import { ShipperEntity } from './shipper.entity';
import { TransactionEntity } from './transaction.entity';
import { VirtualAccountEntity } from './virtualAccount.entity';

export const BaseOrderRelations = [
  'company',
  'createdBy',
  'pickLocation',
  'deliveryLocation',
  'sender',
  'receiver',
  'cars',
  'dispatches',
  'inspections',
  'orderTrips',
  'shipper',
  'invite',
];

export enum ORDER_SOURCE {
  INTERNAL = 'internal',
  PDF = 'pdf',
  MANUAL = 'manual',
}
export enum PAYMENT_METHODS {
  CASH = 'Cash',
  CHECK = 'Check',
  ACH = 'ACH',
  CREDIT_CARD = 'Credit Card',
  CHECK_AT_DELIVERY = 'Check at Delivery',
}

export enum CLIENT_PAYMENT_STATUSES {
  NONE = 'none',
  SERVICE_FEE_FAILED = 'service_fee_failed',
  SERVICE_FEE_PAID = 'service_fee_paid',
  CAR_PICKUP_FAILED = 'car_pickup_failed',
  CAR_PICKUP_PAID = 'car_pickup_paid',
}

@Entity({ name: 'order' })
export class OrderEntity extends OrderBaseEntity {
  @ManyToOne(type => VirtualAccountEntity)
  sender: VirtualAccountEntity;

  @Column('integer', { nullable: true })
  senderId: number;

  @ManyToOne(type => VirtualAccountEntity)
  receiver: VirtualAccountEntity;

  @Column('integer')
  createdById: number;

  @Column('integer', { nullable: true })
  receiverId: number;

  @OneToMany(type => InviteEntity, invite => invite.order, { nullable: true })
  invite: InviteEntity;

  @ManyToOne(type => CompanyEntity, company => company.orders)
  company: CompanyEntity;

  @Column('integer', { nullable: true })
  companyId: number;

  @OneToMany(type => CarEntity, car => car.order)
  @JoinColumn()
  cars: CarEntity[];

  @OneToMany(type => InspectionEntity, inspection => inspection.order)
  inspections: InspectionEntity[];

  @OneToMany(type => NotificationEntity, notification => notification.order)
  notifications: NotificationEntity[];

  @Column('boolean', { default: false })
  isVirtual: boolean;

  @OneToMany(type => OrderToTripEntity, orderTrip => orderTrip.order)
  orderTrips: OrderToTripEntity[];

  @ManyToOne(type => AccountEntity)
  driver: AccountEntity;

  @Column('integer', { nullable: true })
  driverId: number;

  @ManyToOne(type => AccountEntity)
  dispatcher: AccountEntity;

  @Column('integer', { nullable: true })
  dispatcherId: number;

  @OneToMany(type => OrderNoteEntity, note => note.order)
  notes: OrderNoteEntity[];

  @OneToMany(type => OrderAttachmentEntity, attachment => attachment.order)
  attachments: OrderAttachmentEntity[];

  @Column('boolean')
  published: boolean;

  @OneToMany(type => DispatchEntity, dispatch => dispatch.order, {
    nullable: true,
  })
  dispatches: DispatchEntity[];

  @OneToMany(type => TransactionEntity, transaction => transaction.order, {
    nullable: true,
  })
  transactions: TransactionEntity[];

  @Column('varchar', { nullable: true })
  pickInstructions: string;

  @Column('varchar', { nullable: true })
  deliveryInstructions: string;

  @Column('varchar', { nullable: true })
  bolUrl: string;

  @Column('varchar', { nullable: true })
  invoiceUrl: string;

  @Column('varchar', { nullable: true })
  receiptUrl: string;

  @Column('timestamp with time zone', { nullable: true })
  invoiceDueDate: Date;

  @Column('timestamp with time zone', { nullable: true })
  invoicePaidDate: Date;

  @Column('integer', { nullable: true })
  quoteId: number;

  @Column('varchar', { nullable: false, default: ORDER_SOURCE.INTERNAL })
  source: string;

  @Column('timestamp with time zone', { nullable: true })
  pickDate: Date;

  @Column('timestamp with time zone', { nullable: true })
  deliveryDate: Date;

  // it's the price shown for carrier actors: load price - agent profit
  @Column({ type: 'numeric', transformer: dbSelectNumeric, nullable: true })
  salePrice: number;

  // it's the price shown to the system users: quote original estimate - discount - service fee
  @Column({ type: 'numeric', transformer: dbSelectNumeric, nullable: true })
  loadPrice: number;

  @Column({
    type: 'numeric',
    transformer: dbSelectNumeric,
    nullable: true,
  })
  exactDistance: number;

  @ManyToOne(type => ShipperEntity)
  shipper: ShipperEntity;

  @Column('integer', { nullable: true })
  shipperId: number;

  @Column({ type: 'numeric', nullable: true })
  brokerFee: number;

  @Column('varchar', { nullable: true })
  paymentNote: string;

  @Column('varchar', { nullable: true, default: PAYMENT_METHODS.ACH })
  paymentMethods: string;

  @Column('varchar', { nullable: true })
  dispatchInstructions: string;

  @Column('varchar', { default: CLIENT_PAYMENT_STATUSES.NONE })
  clientPaymentStatus: string;

  @Column('varchar', { default: null })
  preStatus: string;

  @Column('varchar', { nullable: true })
  externalId: string;

  @Column('boolean', { default: false })
  hiddenForAdmin: boolean;

  @Column('boolean', { default: false })
  hiddenForCompnay: boolean;

  @Column('boolean', { default: false })
  paymentDelivery: boolean;
}
