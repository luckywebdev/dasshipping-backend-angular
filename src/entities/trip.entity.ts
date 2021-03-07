import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

import { dbSelectNumeric } from '../transformers/dbSelectNumeric.transformer';
import { AccountEntity } from './account.entity';
import { CompanyEntity } from './company.entity';
import { LocationEntity } from './location.entity';
import { OrderToTripEntity } from './orderToTrip.entity';

export enum TRIP_STATUS {
    DRAFT = 'draft',
    PENDING = 'pending',
    ACTIVE = 'active',
    COMPLETED = 'completed',
    PICKED_UP = 'picked_up',
}

@Entity({ name: 'trip' })
export class TripEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column('varchar', { nullable: true })
    name: string;

    @ManyToOne(type => CompanyEntity)
    company: CompanyEntity;

    @Column('integer')
    companyId: number;

    @ManyToOne(type => AccountEntity)
    createdBy: AccountEntity;

    @Column('integer')
    createdById: number;

    @ManyToOne(type => AccountEntity, { nullable: true })
    dispatcher: AccountEntity;

    @Column('integer', { nullable: true })
    dispatcherId: number;

    @ManyToOne(type => AccountEntity, { nullable: true })
    driver: AccountEntity;

    @Column('integer', { nullable: true })
    driverId: number;

    @OneToMany(type => OrderToTripEntity, orderTrip => orderTrip.trip)
    orderTrips: OrderToTripEntity[];

    @Column('varchar', { default: TRIP_STATUS.DRAFT })
    status: string;

    @ManyToOne(type => LocationEntity)
    pickLocation: LocationEntity;

    @Column('integer', { nullable: true })
    pickLocationId: number;

    @ManyToOne(type => LocationEntity)
    deliveryLocation: LocationEntity;

    @Column('integer', { nullable: true })
    deliveryLocationId: number;

    @Column({ type: 'numeric', transformer: dbSelectNumeric, nullable: true })
    distance: number;

    @Column({ type: 'numeric', transformer: dbSelectNumeric, nullable: true })
    totalPrice: number;

    @Column('json', { nullable: true })
    route: string[];

    @Column('timestamp with time zone', { default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date;

    @Column('timestamp with time zone', { default: () => 'CURRENT_TIMESTAMP' })
    updatedAt: Date;
}
