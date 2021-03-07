import { Column, Entity, Index, ManyToMany, ManyToOne, PrimaryGeneratedColumn, JoinColumn } from 'typeorm';

import { OrderEntity } from './order.entity';
import { TRIP_STATUS, TripEntity } from './trip.entity';

@Index(['orderId', 'status'], { unique: true, where: `status = '${TRIP_STATUS.ACTIVE}' OR status = '${TRIP_STATUS.COMPLETED}'` })
@Entity({ name: 'orderToTrip' })
export class OrderToTripEntity {

    @PrimaryGeneratedColumn()
    public id: number;

    @Column('integer')
    public tripId: number;

    @Column('integer')
    public orderId: number;

    @Column('varchar', { default: TRIP_STATUS.DRAFT })
    public status: string;

    @ManyToOne(type => TripEntity, trip => trip.orderTrips)
    public trip: TripEntity;

    @ManyToOne(type => OrderEntity, order => order.orderTrips)
    public order: OrderEntity;
}
