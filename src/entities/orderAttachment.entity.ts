import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { AccountEntity } from './account.entity';
import { OrderEntity } from './order.entity';

@Entity({ name: 'orderAttachment' })
export class OrderAttachmentEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('integer')
  orderId: number;

  @ManyToOne(type => OrderEntity)
  order: OrderEntity;

  @Column('integer', { nullable: true })
  createdById: number;

  @ManyToOne(type => AccountEntity)
  createdBy: AccountEntity;

  @Column('varchar')
  path: string;

  @Column('varchar')
  displayName: string;

  @Column('timestamp with time zone', { default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
