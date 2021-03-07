import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { DetailsWalletDTO } from '../dto/detailsWallet.dto';
import { AccountEntity } from './account.entity';

export enum WALLET_STATUSES {
    FAILED = 'failed',
    VERIFIED = 'verified',
    GATEWAY_REJECTED = 'gateway_rejected',
    PROCESSOR_DECLINED = 'processor_declined',
}

@Entity({ name: 'wallet' })
export class WalletEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(type => AccountEntity)
    client: AccountEntity;

    @Column('integer')
    clientId: number;

    @Column('varchar')
    status: string;

    @Column('varchar')
    type: string;

    @Column('varchar')
    customerId: string;

    @Column('varchar', { nullable: true })
    token: string;

    @Column('json', { nullable: true })
    details: DetailsWalletDTO;

    @Column('timestamp with time zone', { default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date;

    @Column('timestamp with time zone', { default: () => 'CURRENT_TIMESTAMP' })
    updatedAt: Date;
}
