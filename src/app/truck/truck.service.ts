import {BadRequestException, Injectable, NotFoundException} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import {TruckEntity} from '../../entities/truck.entity';
import {RequestTruckDTO} from './dto/requestTruck.dto';
import {AccountEntity} from '../../entities/account.entity';
import {RequestTrailerDTO} from '../trailer/dto/requestTrailer.dto';
import {TrailerEntity} from '../../entities/trailer.entity';

@Injectable()
export class TruckService {

    constructor(
        @InjectRepository(TruckEntity) private readonly truckRepository: Repository<TruckEntity>,
        @InjectRepository(AccountEntity) private readonly accountRepository: Repository<AccountEntity>,
    ) { }

    public async createTruck(data: RequestTruckDTO): Promise<TruckEntity> {
        const accountObject = await this.accountRepository.findOne(data.accountId);
        delete data.accountId;
        if (!accountObject) {
            throw new NotFoundException(`Account ${data.accountId} not found`);
        }
        if (await this.truckRepository.findOne({account: accountObject})) {
            throw new BadRequestException(`Account ${accountObject.id} already have a truck assigned`);
        }

        return await this.truckRepository.save({account: accountObject, ...data});
    }

    public async updateTruck(id: number, data: RequestTruckDTO): Promise<TruckEntity> {
        const accountObject = await this.accountRepository.findOne(data.accountId);
        if (!accountObject) {
            throw new NotFoundException(`Account ${data.accountId} not found`);
        }
        delete data.accountId;
        const truck = await this.truckRepository.findOne(id);
        if (!truck) {
            throw new NotFoundException(`trailer ${id} not found`);
        }

        const accountTruck = await this.truckRepository.findOne({account: accountObject});

        if (accountTruck && accountTruck.id !== truck.id) {
            throw new BadRequestException(`Account ${accountObject.id} has assigned another truck`);
        }

        await this.truckRepository.update(id, {
            account: accountObject,
            ...data,
            updatedAt: new Date(),
        });

        return await this.truckRepository.findOne(id);
    }

    public async getTruck(id: number): Promise<TruckEntity> {
        const truck = await this.truckRepository.findOne(id);
        if (!truck) {
            throw new NotFoundException(`Truck ${id} not found`);
        }

        return truck;
    }

    public async getAccountTruck(accountEntity: AccountEntity): Promise<TruckEntity> {
        const truck =  await this.truckRepository.findOne({account: accountEntity});
        if (!truck) {
            throw new NotFoundException(`Account ${accountEntity.firstName} ${accountEntity.lastName} has no truck assigned`);
        }

        return truck;
    }

    public async updateAccountTruck(accountEntity: AccountEntity, data: RequestTrailerDTO): Promise<TrailerEntity> {
        const truck = await this.truckRepository.findOne({account: accountEntity});
        if (!truck) {
            throw new NotFoundException(`Account ${accountEntity.firstName} ${accountEntity.lastName} has no truck assigned`);
        }
        data.account = accountEntity;
        data.accountId = accountEntity.id;

        return this.updateTruck(truck.id, data);
    }

    public async createAccountTruck(accountEntity: AccountEntity, data: RequestTruckDTO): Promise<TruckEntity> {
        data.account = accountEntity;
        data.accountId = accountEntity.id;

        return this.createTruck(data);
    }
}
