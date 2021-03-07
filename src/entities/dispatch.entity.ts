import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { AccountEntity } from './account.entity';
import { CompanyEntity } from './company.entity';
import { OrderEntity } from './order.entity';

export enum DISPATCH_STATUS {
    ACCEPTED = 'Accepted',
    NEW = 'New',
    CANCELLED = 'Canceled',
    EXPIRED = 'Expired',
}

@Entity({ name: 'dispatch' })
export class DispatchEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(type => CompanyEntity, company => company.dispatches)
    company: CompanyEntity;

    @Column('integer')
    companyId: number;

    @ManyToOne(type => AccountEntity)
    account: AccountEntity;

    @Column('integer')
    accountId: number;

    @ManyToOne(type => OrderEntity)
    order: OrderEntity;

    @Column('integer')
    orderId: number;

    @Column('varchar')
    status: string;

    @Column('timestamp with time zone')
    pickDate: Date;

    @Column('timestamp with time zone')
    deliveryDate: Date;

    @Column('timestamp with time zone', { default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date;

    @Column('timestamp with time zone', { default: () => 'CURRENT_TIMESTAMP' })
    updatedAt: Date;
}
