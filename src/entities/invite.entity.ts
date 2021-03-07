import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

import { AccountEntity } from './account.entity';
import { CompanyEntity } from './company.entity';
import { InviteStatusEntity } from './inviteStatus.entity';
import { NotificationEntity } from './notification.entity';
import { OrderEntity } from './order.entity';
import { RoleEntity } from './role.entity';

@Entity({ name: 'invite' })
export class InviteEntity {

    @ManyToOne(type => CompanyEntity, company => company.invites)
    company: CompanyEntity;

    @Column('integer', { nullable: true })
    companyId: number;

    @ManyToOne(type => OrderEntity, order => order.invite, { nullable: true })
    order: OrderEntity;

    @Column('integer', { nullable: true })
    orderId: number;

    @Column('timestamp with time zone', { default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date;

    @Column('timestamp with time zone', { default: () => 'CURRENT_TIMESTAMP' })
    updatedAt: Date;

    @ManyToOne(type => AccountEntity)
    createdBy: AccountEntity;

    @Column('integer')
    createdById: number;

    @Column('varchar')
    email: string;

    @Column('timestamp with time zone')
    expire: Date;

    @Column('boolean', { default: false })
    extended: boolean;

    @Column('boolean', { default: false })
    offerExpired: boolean;

    @Column('varchar', { nullable: true })
    firstName: string;

    @Column('varchar')
    hash: string;

    @PrimaryGeneratedColumn()
    id: number;

    @Column('varchar', { nullable: true })
    lastName: string;

    @ManyToOne(type => RoleEntity)
    role: RoleEntity;

    @Column('integer')
    roleId: number;

    @ManyToOne(type => InviteStatusEntity)
    status: InviteStatusEntity;

    @Column('integer', { nullable: true, default: 1 })
    statusId: number;

    @OneToMany(type => NotificationEntity, notification => notification.invite)
    notifications: NotificationEntity[];
}
