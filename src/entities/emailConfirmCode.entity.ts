import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { AccountEntity } from './account.entity';

@Entity({ name: 'emailConfirmCode' })
export class EmailConfirmCodeEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column('varchar')
    code: string;

    @Column('varchar')
    hash: string;

    @Column('integer')
    accountId: number;

    @ManyToOne(type => AccountEntity)
    account: AccountEntity;

    @Column('timestamp with time zone')
    createdAt: Date;

    @Column('timestamp with time zone')
    expire: Date;

    @Column('boolean', {default: false})
    used: boolean;
}
