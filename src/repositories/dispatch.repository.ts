import { EntityRepository, Repository } from 'typeorm';

import { DispatchListResponseDTO } from '../app/dispatch/dto/list/dispatchListResponse.dto';
import { DispatchListRequest } from '../app/dispatch/dto/list/requestList.dto';
import { DispatchEntity } from '../entities/dispatch.entity';

@EntityRepository(DispatchEntity)
export class DispatchRepository extends Repository<DispatchEntity> {

    public async getDispatchRequests(query: DispatchListRequest, companyId?: string): Promise<DispatchListResponseDTO> {
        const { orderByField, orderByDirection } = query;

        const queryBuilder = this.createQueryBuilder('dispatch')
            .leftJoinAndSelect('dispatch.company', 'company')
            .leftJoinAndSelect('dispatch.account', 'account')
            .orderBy(`dispatch.${orderByField || 'id'}`, orderByDirection || 'ASC')
            .skip(query.offset || 0)
            .take(query.limit || 10);

        const countQueryBuilder = this.createQueryBuilder('dispatch');

        if (query.status) {
            queryBuilder.andWhere('dispatch.status = :status', { status: query.status });
            countQueryBuilder.andWhere('dispatch.status = :status', { status: query.status });
        }
        if (query.orderId) {
            queryBuilder.andWhere('dispatch.orderId = :orderId', { orderId: query.orderId });
            countQueryBuilder.andWhere('dispatch.orderId = :orderId', { orderId: query.orderId });
        }
        if (companyId) {
            queryBuilder.andWhere('dispatch.companyId = :companyId', { companyId });
            countQueryBuilder.andWhere('dispatch.companyId = :companyId', { companyId });
        }

        const data = await queryBuilder.getMany();
        const count = await countQueryBuilder.getCount();

        return { data, count };
    }
}
