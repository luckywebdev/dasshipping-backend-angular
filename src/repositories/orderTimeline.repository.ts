import { EntityRepository, Repository } from 'typeorm';

import { GetList } from '../app/dto/requestList.dto';
import { GetOrderTimelineListResponse } from '../app/orderTimeline/dto/get/response.dto';
import { OrderTimelineEntity } from '../entities/orderTimeline.entity';

@EntityRepository(OrderTimelineEntity)
export class OrderTimelineRepository extends Repository<OrderTimelineEntity> {

  public async getOrderTimelines(
    orderId: number,
    query: GetList,
  ): Promise<GetOrderTimelineListResponse> {
    const queryBuilder = this.createQueryBuilder('orderTimeline')
      .leftJoin('orderTimeline.order', 'order')
      .where('order.id = :orderId', { orderId })
      .orderBy(
        query.orderByField || 'orderTimeline.id',
        query.orderByDirection ? query.orderByDirection : 'DESC')
      .skip(query.offset || 0)
      .take(query.limit || 10);

    if (query.where && query.where.companyId) {
      queryBuilder.andWhere('order.companyId = :companyId', {
        companyId: query.where.companyId,
      });
      if (query.where.dispatcherId) {
        queryBuilder.andWhere('order.dispatcherId = :dispatcherId', {
          dispatcherId: query.where.dispatcherId,
        });
      }
    }

    if (query.where && query.where.createdById) {
      queryBuilder.andWhere('order.createdById = :createdById', {
        createdById: query.where.createdById,
      });
    }

    const [data, count] = await queryBuilder.getManyAndCount();
    return { data, count };
  }
}
