import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { AccountEntity } from './account.entity';
import { CompanyEntity } from './company.entity';
import { InviteEntity } from './invite.entity';
import { OrderEntity } from './order.entity';
import { QuoteEntity } from './quote.entity';

export enum NotificationStatus {
    ACTIVE = 'active',
    EXPIRED = 'expired',
}
@Entity({ name: 'notification' })
export class NotificationEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @Column('varchar', { nullable: false })
    type: string;

    @Column('json')
    actions: string[];

    @Column('varchar', { nullable: false })
    title: string;

    @Column('varchar', { nullable: true })
    content: string;

    @Column('varchar')
    status: string;

    @Column('varchar', { nullable: true })
    additionalInfo: string;

    @ManyToOne(type => OrderEntity)
    order: OrderEntity;

    @Column('integer', { nullable: true })
    orderId: number;

    @ManyToOne(type => CompanyEntity)
    company: CompanyEntity;

    @Column('integer', { nullable: true })
    companyId: number;

    @ManyToOne(type => InviteEntity)
    invite: InviteEntity;

    @Column('integer', { nullable: true })
    inviteId: number;

    @ManyToOne(type => AccountEntity)
    account: AccountEntity;

    @Column('integer', { nullable: true })
    accountId: number;

    @ManyToOne(type => QuoteEntity)
    quote: QuoteEntity;

    @Column('integer', { nullable: true })
    quoteId: number;

    @Column('integer', { nullable: false })
    targetUserId: number;

    @ManyToOne(type => AccountEntity)
    targetUser: AccountEntity;

    @Column('timestamp with time zone', { default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date;

    @Column('timestamp with time zone', { nullable: true })
    viewedAt: Date;
}
