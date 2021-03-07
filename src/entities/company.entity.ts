import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

import { dbSelectFileSign } from '../transformers/dbSelectFileSign.transformer';
import { AccountEntity } from './account.entity';
import { CompanyFilesEntity } from './companyFiles.entity';
import { DispatchEntity } from './dispatch.entity';
import { InviteEntity } from './invite.entity';
import { JoinRequestEntity } from './joinRequest.entity';
import { NotificationEntity } from './notification.entity';
import { OrderEntity } from './order.entity';

export enum COMPANY_STATUSES {
    ACTIVE = 'active',
    REQUESTED = 'requested',
    INVITED = 'invited',
}
@Entity({ name: 'company' })
export class CompanyEntity {
    @OneToMany(type => AccountEntity, account => account.company)
    accounts: AccountEntity[];

    @Column('varchar', { nullable: true })
    address: string;

    @Column({
        type: 'varchar',
        transformer: dbSelectFileSign,
        nullable: true,
    })
    avatarUrl: string;

    @Column('boolean', { default: false })
    blocked: boolean;

    @Column('varchar', { nullable: true })
    city: string;

    @Column('varchar', { nullable: true })
    contactPersonFirstName: string;

    @Column('varchar', { nullable: true })
    contactPersonLastName: string;

    @Column('varchar', { nullable: true })
    contactPersonPhone: string;

    @Column('varchar')
    dotNumber: string;

    @Column('varchar')
    email: string;

    @PrimaryGeneratedColumn()
    id: number;

    @Column({
        type: 'varchar',
        transformer: dbSelectFileSign,
        nullable: true,
    })
    insuranceUrl: string;

    @OneToMany(type => InviteEntity, invite => invite.company)
    invites: InviteEntity[];

    @OneToMany(type => JoinRequestEntity, joinRequest => joinRequest.company)
    joinRequests: JoinRequestEntity[];

    @Column({
        type: 'varchar',
        transformer: dbSelectFileSign,
        nullable: true,
    })
    mcCertificateUrl: string;

    @Column('varchar', { nullable: true })
    msNumber: string;

    @Column('varchar')
    name: string;

    @Column('varchar', { default: COMPANY_STATUSES.REQUESTED })
    status: string;

    @Column('varchar', { nullable: true })
    officePhone: string;

    @OneToMany(type => OrderEntity, order => order.company)
    orders: OrderEntity[];

    @Column('varchar', { nullable: true })
    state: string;

    @Column('varchar', { nullable: true })
    zip: string;

    @OneToMany(type => DispatchEntity, dispatch => dispatch.company)
    dispatches: DispatchEntity[];

    @Column('timestamp with time zone', { default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date;

    @Column('timestamp with time zone', { default: () => 'CURRENT_TIMESTAMP' })
    updatedAt: Date;

    @OneToMany(type => CompanyFilesEntity, companyFiles => companyFiles.company, { nullable: true })
    files: CompanyFilesEntity[];

    @OneToMany(type => NotificationEntity, notification => notification.company)
    notifications: NotificationEntity[];
}
