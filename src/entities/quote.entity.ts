import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';

import { CarEntity } from './car.entity';
import { NotificationEntity } from './notification.entity';
import { OrderBaseEntity } from './orderBase.entity';
import { VirtualAccountEntity } from './virtualAccount.entity';

@Entity({ name: 'quote' })
export class QuoteEntity extends OrderBaseEntity {
  @Column('integer', { nullable: true })
  orderId: number;

  @OneToMany(type => CarEntity, car => car.quote)
  @JoinColumn()
  cars: CarEntity[];

  @ManyToOne(type => VirtualAccountEntity)
  customer: VirtualAccountEntity;

  @Column('integer', { nullable: true })
  customerId: number;

  @Column('integer', { nullable: true })
  createdById: number;

  @Column('timestamp with time zone', { nullable: true })
  available: Date;

  @Column('varchar', { nullable: true })
  notes: string;

  @Column('boolean', { default: false })
  external: boolean;

  @Column('integer', { nullable: true })
  sentCount: number;

  @Column('timestamp with time zone', { nullable: true })
  sentDate: Date;

  @OneToMany(type => NotificationEntity, notification => notification.quote)
  notifications: NotificationEntity[];
}
