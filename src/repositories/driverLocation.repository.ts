import { EntityRepository, Repository } from 'typeorm';

import { GetListLocations } from '../app/driverLocation/get/request.dto';
import { GetLocationsListResponse } from '../app/driverLocation/get/response.dto';
import { DriverLocationEntity } from '../entities/driverLocation.entity';

@EntityRepository(DriverLocationEntity)
export class DriverLocationRepository extends Repository<DriverLocationEntity> {

    public async getList(query: GetListLocations, id: number): Promise<GetLocationsListResponse> {
        const data = await this.createQueryBuilder('driverLocation')
            .orderBy('"driverLocation"."createdAt"', 'DESC')
            .where('"driverLocation"."driverId" = :id', { id })
            .skip(query.offset || 0)
            .take(query.limit || 10)
            .getMany();

        const count = await this.createQueryBuilder('driverLocation')
            .where('"driverLocation"."driverId" = :id', { id })
            .getCount();

        return { data, count };
    }
}
