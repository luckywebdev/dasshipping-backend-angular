import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { AccountEntity } from './account.entity';
import { OrderEntity } from './order.entity';

@Entity({ name: 'orderTimeline' })
export class OrderTimelineEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column('varchar')
    description: string;

    @Column('integer')
    orderId: number;

    @ManyToOne(type => OrderEntity)
    order: OrderEntity;

    @Column('integer')
    actionAccountId: number;

    @ManyToOne(type => AccountEntity)
    actionAccount: AccountEntity;

    @Column('timestamp with time zone', { default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date;
}
