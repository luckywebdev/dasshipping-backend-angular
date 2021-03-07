import { EntityRepository, Repository } from 'typeorm';

import { GetJoinedRequests } from '../app/joinRequest/dto/requestList.dto';
import { GetJoinedRequestsResponse } from '../app/joinRequest/dto/responseList.dto';
import { AccountEntity } from '../entities/account.entity';
import { JoinRequestEntity } from '../entities/joinRequest.entity';

@EntityRepository(JoinRequestEntity)
export class JoinRequestRepository extends Repository<JoinRequestEntity> {

    public async getJoinedRequests(account: AccountEntity, query: GetJoinedRequests, status: string = null): Promise<GetJoinedRequestsResponse> {
        const { orderByField, orderByDirection } = query;

        const queryBuilder = this.createQueryBuilder('joinRequest')
            .innerJoinAndSelect('joinRequest.account', 'account')
            .orderBy(`joinRequest.${orderByField || 'id'}`, orderByDirection || 'ASC')
            .where('"joinRequest"."companyId" = :companyId', { companyId: account.companyId })
            .skip(query.offset || 0)
            .take(query.limit || 10);

        const countQueryBuilder = this.createQueryBuilder('joinRequest')
            .where('"joinRequest"."companyId" = :companyId', { companyId: account.companyId });

        if (status) {
            queryBuilder.andWhere('joinRequest.status = :status', { status });
            countQueryBuilder.andWhere('joinRequest.status = :status', { status });
        }

        const data = await queryBuilder.getMany();
        const count = await countQueryBuilder.getCount();

        return { data, count };
    }
}
