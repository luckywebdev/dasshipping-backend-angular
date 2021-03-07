import { EntityRepository, Repository } from 'typeorm';

import { GetList } from '../app/dto/requestList.dto';
import { GetOrderAttachmentListResponse } from '../app/orderAttachment/dto/get/response.dto';
import { OrderAttachmentEntity } from '../entities/orderAttachment.entity';
import { fileSign } from '../utils/fileSign.util';

@EntityRepository(OrderAttachmentEntity)
export class OrderAttachmentRepository extends Repository<
OrderAttachmentEntity
> {
  public async getOrderAttachments(
    orderId: number,
    query: GetList,
  ): Promise<GetOrderAttachmentListResponse> {
    const queryBuilder = this.createQueryBuilder('orderAttachment')
      .leftJoin('orderAttachment.order', 'order')
      .where('order.id = :orderId', { orderId })
      .orderBy(
        query.orderByField || 'orderAttachment.createdAt',
        query.orderByDirection ? query.orderByDirection : 'DESC',
      )
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

    const [data, count] = await queryBuilder.getManyAndCount();

    return {
      count,
      data: data.map(item => {
        return { ...item, url: fileSign(item.path) };
      }),
    };
  }
}
