import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { GeneralDTO } from '../../dto/general.dto';
import { GeneralEntity } from '../../entities/general.entity';
import { GeneralPatchDTO } from './dto/patch/request.dto';

@Injectable()
export class GeneralService {
    constructor(
        @InjectRepository(GeneralEntity) private readonly generalRepository: Repository<GeneralEntity>,
    ) { }

    find(): Promise<GeneralDTO> {
        return this.generalRepository.findOne();
    }

    async findServiceFee(): Promise<{ serviceAbsoluteFee: number; creditCardPaymentFee: number; achPaymentFee: number }> {
        const general = await this.generalRepository.findOne();
        const { serviceAbsoluteFee, creditCardPaymentFee, achPaymentFee } = general;
        return { serviceAbsoluteFee, creditCardPaymentFee, achPaymentFee };
    }

    async patch(body: GeneralPatchDTO): Promise<GeneralDTO> {
        const general = await this.generalRepository.findOne();
        return this.generalRepository.save({
            id: general.id,
            ...general,
            ...body,
        });
    }
}
