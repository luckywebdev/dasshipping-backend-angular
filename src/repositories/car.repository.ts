import { EntityRepository, Repository } from 'typeorm';

import {CarEntity} from '../entities/car.entity';
import {TRIP_STATUS} from '../entities/trip.entity';

@EntityRepository(CarEntity)
export class CarRepository extends Repository<CarEntity> {
    public findDriverCar(carId: number, driverId: number): Promise<CarEntity> {
        return this.createQueryBuilder('car')
            .innerJoin('car.order', 'order')
            .innerJoin('order.orderTrips', 'orderTrip')
            .innerJoin('orderTrip.trip', 'trip', 'trip.status = :active')
            .where('trip.driverId = :driver')
            .andWhere('car.id = :id')
            .setParameters({
                active: TRIP_STATUS.ACTIVE,
                driver: driverId,
                id: carId,
            }).getOne();
    }

    public findClientCar(carId: number, clientId: number): Promise<CarEntity> {
        return this.createQueryBuilder('car')
            .innerJoin('car.order', 'order')
            .where('order.createdById = :client')
            .andWhere('car.id = :id')
            .setParameters({
                client: clientId,
                id: carId,
            }).getOne();
    }
}
