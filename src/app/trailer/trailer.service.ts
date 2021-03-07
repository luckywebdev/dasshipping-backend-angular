import {BadRequestException, Injectable, NotFoundException} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import {TrailerEntity} from '../../entities/trailer.entity';
import {AccountEntity} from '../../entities/account.entity';
import {RequestTrailerDTO} from './dto/requestTrailer.dto';
import {TruckEntity} from '../../entities/truck.entity';
import {RequestTruckDTO} from '../truck/dto/requestTruck.dto';

@Injectable()
export class TrailerService {

    constructor(
        @InjectRepository(TrailerEntity) private readonly trailerRepository: Repository<TrailerEntity>,
        @InjectRepository(AccountEntity) private readonly accountRepository: Repository<AccountEntity>,
    ) { }

    public async createTrailer(data: RequestTrailerDTO): Promise<TrailerEntity> {
        const accountObject = await this.accountRepository.findOne(data.accountId);
        delete data.accountId;
        if (!accountObject) {
            throw new NotFoundException(`Account ${data.accountId} not found`);
        }
        if (await this.trailerRepository.findOne({account: accountObject})) {
            throw new BadRequestException(`Account ${accountObject.id} already have a trailer assigned`);
        }

        return await this.trailerRepository.save({account: accountObject, ...data});
    }

    public async updateTrailer(id: number, data: RequestTrailerDTO): Promise<TrailerEntity> {
        const accountObject = await this.accountRepository.findOne(data.accountId);
        if (!accountObject) {
            throw new NotFoundException(`Account ${data.accountId} not found`);
        }
        delete data.accountId;
        const trailer = await this.trailerRepository.findOne(id);
        if (!trailer) {
            throw new NotFoundException(`trailer ${id} not found`);
        }

        const accountTrailer = await this.trailerRepository.findOne({account: accountObject});

        if (accountTrailer && accountTrailer.id !== trailer.id) {
            throw new BadRequestException(`Account ${accountObject.id} has assigned another trailer`);
        }

        await this.trailerRepository.update(id, {
            account: accountObject,
            ...data,
            updatedAt: new Date(),
        });

        return await this.trailerRepository.findOne(id);
    }

    public async getTrailer(id: number): Promise<TrailerEntity> {
        const trailer = await this.trailerRepository.findOne(id);
        if (!trailer) {
            throw new NotFoundException(`Trailer ${id} not found`);
        }

        return trailer;
    }

    public async getAccountTrailer(accountEntity: AccountEntity): Promise<TruckEntity> {
        const trailer =  await this.trailerRepository.findOne({account: accountEntity});
        if (!trailer) {
            throw new NotFoundException(`Account ${accountEntity.firstName} ${accountEntity.lastName} has no trailer assigned`);
        }

        return trailer;
    }

    public async updateAccountTrailer(accountEntity: AccountEntity, data: RequestTrailerDTO): Promise<TrailerEntity> {
        const trailer = await this.trailerRepository.findOne({account: accountEntity});
        if (!trailer) {
            throw new NotFoundException(`Account ${accountEntity.firstName} ${accountEntity.lastName} has no trailer assigned`);
        }
        data.account = accountEntity;
        data.accountId = accountEntity.id;

        return this.updateTrailer(trailer.id, data);
    }

    public async createAccountTrailer(accountEntity: AccountEntity, data: RequestTruckDTO): Promise<TruckEntity> {
        data.account = accountEntity;
        data.accountId = accountEntity.id;

        return this.createTrailer(data);
    }
}
