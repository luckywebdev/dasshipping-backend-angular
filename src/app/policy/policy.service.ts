import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import Axios from 'axios';

import { ConfigService } from '../../config/config.service';
import { PolicyDTO } from '../../dto/policy.dto';
import { SuccessDTO } from '../../dto/success.dto';
import { PolicyRepository } from '../../repositories/policy.repository';
import { PolicyCreateRequest } from './create/request.dto';
import { RequestPolicyDTO } from './list/request.dto';
import { GetPolicyListResponse } from './list/response.dto';

@Injectable()
export class PolicyService {
    constructor(
        @InjectRepository(PolicyRepository) private readonly policyRepository: PolicyRepository,
        private readonly configService: ConfigService,
    ) { }

    public async delete(id: number): Promise<SuccessDTO> {
        const existPolicy = await this.policyRepository.findOne(id);
        if (!existPolicy) {
            throw new BadRequestException('Price Policy not found');
        }
        await this.policyRepository.delete(existPolicy.id);

        return {
            success: true,
        };

    }

    public async get(query: RequestPolicyDTO): Promise<GetPolicyListResponse> {
        const [data, count] = await this.policyRepository.findAndCount({
            skip: query.offset || 0,
            take: query.limit || 0,
            order: { [query.orderByField || 'type']: query.orderByDirection || 'ASC' },
        });

        return { data, count };
    }

    public async patch(id: number, data: PolicyCreateRequest): Promise<PolicyDTO> {
        const existPolicy = await this.policyRepository.findOne(id);
        if (!existPolicy) {
            throw new BadRequestException('Price Policy not found');
        }
        const newPrice = await this.policyRepository.save({
            ...existPolicy,
            ...data,
            isNew: false,
        });

        return this.policyRepository.findOne(newPrice.id);
    }

    public async post(data: PolicyCreateRequest): Promise<PolicyDTO> {
        const newPrice = await this.policyRepository.save({
            ...data,
            isNew: false,
        });

        return this.policyRepository.findOne(newPrice.id);
    }

    public async sync(): Promise<void> {
        try {
            const response = await Axios.get(`${this.configService.carTypeApi}/car-types?field=type`);
            const remoteCarTypes = response.data;
            if (remoteCarTypes && remoteCarTypes.length) {
                await this.policyRepository.updateCarTypePolicies(remoteCarTypes);
            }
        } catch (e) {
            throw new BadRequestException(e && e.message ? e.message : e);
        }
    }
}
