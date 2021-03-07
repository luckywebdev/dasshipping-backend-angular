import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { DriverLocationDTO } from '../../dto/driverLocation.dto';
import { AccountEntity } from '../../entities/account.entity';
import { AccountRepository } from '../../repositories/account.repository';
import { DriverLocationRepository } from '../../repositories/driverLocation.repository';
import { CreateDriverLocationRequestDTO } from './create/createDriverLocationRequest';
import { GetListLocations } from './get/request.dto';
import { GetLocationsListResponse } from './get/response.dto';

@Injectable()
export class DriverLocationService {

    constructor(
        @InjectRepository(DriverLocationRepository) private readonly driverLocationRepository: DriverLocationRepository,
        @InjectRepository(AccountRepository) private readonly accountRepository: AccountRepository,
    ) { }

    public async create(account: AccountEntity, locationData: CreateDriverLocationRequestDTO[]): Promise<DriverLocationDTO> {
        const [location] = locationData;

        return await this.driverLocationRepository.save({
            ...location,
            driverId: account.id,
        });
    }

    public async getLastLocation(driverId: number): Promise<DriverLocationDTO> {
        return await this.driverLocationRepository.findOne({ driverId }, { order: { createdAt: 'DESC' } });
    }

    public async getList(query: GetListLocations, id: number, where: any = {}): Promise<GetLocationsListResponse> {
        const driver = await this.accountRepository.getAccount(id, { where });
        if (!driver) {
            throw new BadRequestException('Driver was not found.');
        }
        return await this.driverLocationRepository.getList(query, id);
    }

}
