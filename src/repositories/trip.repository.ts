import { EntityRepository, Repository, SelectQueryBuilder } from 'typeorm';

import { DriverToPickUpRequestDTO } from '../app/driver/dto/toPickUp.dto';
import { GetTripsRequest } from '../app/trip/dto/list/request.dto';
import { GetTripsListResponse } from '../app/trip/dto/list/response.dto';
import { AccountEntity } from '../entities/account.entity';
import { TRIP_STATUS, TripEntity } from '../entities/trip.entity';

@EntityRepository(TripEntity)
export class TripRepository extends Repository<TripEntity> {

    public async getTrip(where = {}): Promise<TripEntity> {
        return await this.createQueryBuilder('trip')
            .leftJoinAndSelect('trip.pickLocation', 'pickLocation')
            .leftJoinAndSelect('trip.deliveryLocation', 'deliveryLocation')
            .leftJoinAndSelect('trip.createdBy', 'createdBy')
            .leftJoinAndSelect('trip.dispatcher', 'dispatcher')
            .leftJoinAndSelect('trip.company', 'company')
            .leftJoinAndSelect('trip.driver', 'driver')
            .leftJoinAndSelect('driver.truck', 'truck')
            .leftJoinAndSelect('driver.trailer', 'trailer')
            .leftJoinAndSelect('trip.orderTrips', 'orderTrips')
            .leftJoinAndSelect('orderTrips.order', 'orders')
            .where(where)
            .getOne();
    }

    public async getAll(query: GetTripsRequest): Promise<GetTripsListResponse> {
        let queryBuilder = this.createQueryBuilder('trip')
            .leftJoinAndSelect('trip.pickLocation', 'pickLocation')
            .leftJoinAndSelect('trip.deliveryLocation', 'deliveryLocation')
            .leftJoinAndSelect('trip.createdBy', 'createdBy')
            .leftJoinAndSelect('trip.dispatcher', 'dispatcher')
            .leftJoinAndSelect('trip.company', 'company')
            .leftJoinAndSelect('trip.driver', 'driver')
            .leftJoinAndSelect('trip.orderTrips', 'orderTrips')
            .leftJoinAndSelect('orderTrips.order', 'orders')
            .orderBy(query.orderByField ? `trip.${query.orderByField}` : 'trip.updatedAt', query.orderByDirection ? query.orderByDirection : 'DESC')
            .skip(query.offset)
            .take(query.limit);

        queryBuilder = this.addTripFilters(queryBuilder, query);

        const [trips, tripsCount] = await queryBuilder.getManyAndCount();

        return { count: tripsCount, data: trips };
    }

    private addTripFilters(queryBuilder: SelectQueryBuilder<TripEntity>, query: GetTripsRequest): SelectQueryBuilder<TripEntity> {
        if (query.where) {
            queryBuilder.andWhere(query.where);
        }

        if (query.driverId) {
            queryBuilder.andWhere('trip.driverId = :driverId', { driverId: query.driverId });
        }

        if (query.id) {
            queryBuilder.andWhere('trip.id = :id', { id: query.id });
        }

        if (query.dispatcherId) {
            queryBuilder.andWhere('trip.dispatcherId = :dispatcherId', { dispatcherId: query.dispatcherId });
        }

        if (query.status) {
            queryBuilder.andWhere('trip.status = :status', { status: query.status });
        }

        return queryBuilder;
    }

    public async getTripOrderToPickUp(account: AccountEntity, body: DriverToPickUpRequestDTO): Promise<TripEntity> {
        return this.createQueryBuilder('trip')
            .leftJoinAndSelect('trip.orderTrips', 'orderTrips')
            .leftJoinAndSelect('orderTrips.order', 'order')
            .where('trip.id = :tripId', { tripId: body.tripId })
            .andWhere('order.id = :orderId', { orderId: body.orderId })
            .andWhere('trip.driverId = :driverId', { driverId: account.id })
            .andWhere('trip.status IN (:...tripStatuses)', { tripStatuses: [TRIP_STATUS.PENDING, TRIP_STATUS.ACTIVE] })
            .getOne();
    }
}
