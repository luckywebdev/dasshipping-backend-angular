import {Column, Entity, ManyToOne, PrimaryGeneratedColumn} from 'typeorm';

import {AccountEntity} from './account.entity';

@Entity({name: 'resetToken'})
export class ResetTokenEntity {
    @ManyToOne(type => AccountEntity)
    account: AccountEntity;

    @Column('integer')
    accountId: number;

    @Column('timestamp with time zone', {default: () => 'CURRENT_TIMESTAMP'})
    createdAt: Date;

    @Column('timestamp with time zone')
    expire: Date;

    @PrimaryGeneratedColumn()
    id: number;

    @Column('varchar')
    token: string;

    @Column('boolean', {default: false})
    used: boolean;
}
