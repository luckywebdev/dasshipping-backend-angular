import {Column, Entity, ManyToOne, PrimaryGeneratedColumn} from 'typeorm';
import {CompanyEntity} from './company.entity';
import {AccountEntity} from './account.entity';

export enum JOIN_REQUEST_STATUS {
    PENDING = 'Pending',
    ACCEPTED = 'Accepted',
    DECLINED = 'Declined',
    CANCELLED = 'Cancelled',
}

@Entity({ name: 'joinRequest' })
export class JoinRequestEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(type => CompanyEntity, company => company.joinRequests)
    company: CompanyEntity;

    @ManyToOne(type => AccountEntity)
    account: AccountEntity;

    @Column('varchar')
    status: string;

    @Column('timestamp with time zone', {default: () => 'CURRENT_TIMESTAMP'})
    createdAt: Date;

    @Column('timestamp with time zone', {default: () => 'CURRENT_TIMESTAMP'})
    updatedAt: Date;
}
