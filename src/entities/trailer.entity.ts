import {Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn} from 'typeorm';

import { AccountEntity } from './account.entity';

@Entity({ name: 'trailer' })
export class TrailerEntity {

    @PrimaryGeneratedColumn()
    public id: number;

    @OneToOne(type => AccountEntity, account => account.trailer)
    @JoinColumn()
    public account: AccountEntity;

    @Column('timestamp with time zone', {default: () => 'CURRENT_TIMESTAMP'})
    createdAt: Date;

    @Column('timestamp with time zone', {default: () => 'CURRENT_TIMESTAMP'})
    updatedAt: Date;

    @Column('varchar')
    public type: string;

    @Column('varchar', {nullable: true})
    public VINNumber: string;

    @Column('integer', {nullable: true})
    public year?: number;

    @Column('varchar', {nullable: true})
    public make?: string;

    @Column('varchar', {nullable: true})
    public model?: string;

    @Column('varchar', {nullable: true})
    public capacity?: string;
}
