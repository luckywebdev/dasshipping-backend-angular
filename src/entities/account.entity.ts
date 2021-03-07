import {
    Column,
    Entity,
    JoinColumn,
    JoinTable,
    ManyToMany,
    ManyToOne,
    OneToMany,
    OneToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';

import { dbSelectFileSign } from '../transformers/dbSelectFileSign.transformer';
import { AccountFilesEntity } from './accountFiles.entity';
import { CompanyEntity } from './company.entity';
import { DispatchEntity } from './dispatch.entity';
import { DriverLocationEntity } from './driverLocation.entity';
import { GenderEntity } from './gender.entity';
import { LanguageEntity } from './language.entity';
import { NotificationEntity } from './notification.entity';
import { OrderEntity } from './order.entity';
import { ResetTokenEntity } from './resetToken.entity';
import { RoleEntity } from './role.entity';
import { TrailerEntity } from './trailer.entity';
import { TruckEntity } from './truck.entity';

@Entity({ name: 'account' })
export class AccountEntity {
    @Column('character varying', { nullable: true })
    address: string;

    @Column('boolean', { default: false })
    approved: boolean;

    @Column({
        type: 'varchar',
        transformer: dbSelectFileSign,
        nullable: true,
    })
    avatarUrl: string;

    @Column('boolean', { default: false })
    blocked: boolean;

    @Column('character varying', { nullable: true })
    city: string;

    @ManyToOne(type => CompanyEntity, company => company.accounts)
    company: CompanyEntity;

    @Column('integer', { nullable: true })
    companyId: number;

    @Column('integer', { nullable: true })
    dispatcherId: number;

    @Column('boolean', { default: false })
    deleted: boolean;

    @Column('character varying', { nullable: true })
    dlNumber: string;

    @Column('varchar', { nullable: true })
    phoneNumber: string;

    @Column('character varying')
    email: string;

    @Column('boolean', { default: false })
    emailConfirmed: boolean;

    @Column('varchar')
    firstName: string;

    @Column('date', { nullable: true })
    birthday: Date;

    @ManyToOne(type => GenderEntity)
    gender: GenderEntity;

    @Column('integer', { nullable: true })
    genderId: number;

    @Column('integer', { nullable: true })
    payRate: number;

    @PrimaryGeneratedColumn()
    id: number;

    @Column('varchar')
    lastName: string;

    @OneToMany(type => OrderEntity, order => order.createdBy)
    orders: OrderEntity[];

    @Column({
        type: 'varchar',
        select: false,
    })
    password: string;

    @Column('boolean', { default: false })
    receiveNotifications: boolean;

    @ManyToOne(type => RoleEntity, role => role.accounts)
    role: RoleEntity;

    @Column('integer')
    roleId: number;

    @Column('character varying', { nullable: true })
    state: string;

    @OneToMany(type => ResetTokenEntity, resetToken => resetToken.account, { nullable: true })
    tokens: ResetTokenEntity[];

    @Column('character varying', { nullable: true })
    zip: string;

    @OneToOne(type => TruckEntity, truck => truck.account, { nullable: true })
    public truck: TruckEntity;

    @OneToOne(type => TrailerEntity, trailer => trailer.account, { nullable: true })
    public trailer: TrailerEntity;

    @ManyToOne(type => AccountEntity, { nullable: true })
    @JoinColumn()
    dispatcher: AccountEntity;

    @OneToMany(type => AccountFilesEntity, accountFiles => accountFiles.account, { nullable: true })
    files: AccountFilesEntity[];

    @ManyToMany(type => LanguageEntity)
    @JoinTable({ name: 'account_language' })
    languages: LanguageEntity[];

    @OneToMany(type => DispatchEntity, dispatch => dispatch.account, { nullable: true })
    dispatches: DispatchEntity[];

    @OneToMany(type => DriverLocationEntity, location => location.driver, { nullable: true })
    locations: DriverLocationEntity[];

    @Column({ type: 'varchar', nullable: true })
    signatureUrl: string;

    @Column({ type: 'varchar', nullable: true })
    companyName: string;

    @Column('boolean', { default: true })
    termsOfServiceAccepted: boolean;

    @OneToMany(type => NotificationEntity, notification => notification.account)
    notifications: NotificationEntity[];

    @Column('boolean', { default: false })
    paymentFailed: boolean;
}
