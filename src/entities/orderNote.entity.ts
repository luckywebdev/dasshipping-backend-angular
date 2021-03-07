import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { AccountEntity } from './account.entity';
import { OrderEntity } from './order.entity';

export enum OrderNoteEventKeys {
  DECLINE_ORDER = 'decline_order',
}
@Entity({ name: 'orderNote' })
export class OrderNoteEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('integer')
  orderId: number;

  @ManyToOne(type => OrderEntity, order => order.notes)
  order: OrderEntity;

  @Column('integer')
  accountId: number;

  @ManyToOne(type => AccountEntity)
  account: AccountEntity;

  @Column('timestamp with time zone', { default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column('character varying')
  note: string;

  @Column('varchar', { nullable: true })
  eventKey: string;
}
