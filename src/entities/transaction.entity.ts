import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { AccountEntity } from './account.entity';
import { CompanyEntity } from './company.entity';
import { OrderEntity } from './order.entity';

export enum TRANSACTION_STATUSES {
    PENDING = 'pending',
    NEW = 'new',
    FAILED = 'failed',
    PAID = 'paid',
    SETTLEMENT_PENDING = 'settlement_pending',
    AUTHORIZED = 'authorized',
    AUTHORIZED_EXPIRED = 'authorization_expired',
    PROCESSOR_DECLINED = 'processor_declined',
    GATEWAY_REJECTED = 'gateway_rejected',
    VOIDED = 'voided',
    SETTLEMENT_DECLINED = 'settlement_declined',
    SETTLING = 'settling',
    SUBMITTED_FOR_SETTLEMENT = 'submitted_for_settlement',
    SETTLED = 'settled',
}

@Entity({ name: 'transaction' })
export class TransactionEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(type => AccountEntity)
    client: AccountEntity;

    @Column('integer')
    clientId: number;

    @ManyToOne(type => OrderEntity)
    order: OrderEntity;

    @Column('integer')
    orderId: number;

    @ManyToOne(type => CompanyEntity)
    company: CompanyEntity;

    @Column('integer')
    companyId: number;

    @Column('varchar')
    status: string;

    @Column('varchar', { nullable: true })
    provider: string;

    @Column('varchar', { nullable: true })
    externalId: string;

    @Column('varchar')
    amount: string;

    @Column('varchar', { nullable: true })
    secret: string;

    @Column('varchar')
    uuid: string;

    @Column('varchar')
    paymentMethod: string;

    @Column('timestamp with time zone', { default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date;

    @Column('timestamp with time zone', { default: () => 'CURRENT_TIMESTAMP' })
    updatedAt: Date;
}
