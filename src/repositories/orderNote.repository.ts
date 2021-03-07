import { EntityRepository, Repository } from 'typeorm';

import { GetOrderNotesRequest } from '../app/orderNote/dto/get/request.dto';
import { GetOrderNotesListResponse } from '../app/orderNote/dto/get/response.dto';
import { OrderNoteEntity } from '../entities/orderNote.entity';

@EntityRepository(OrderNoteEntity)
export class OrderNoteRepository extends Repository<OrderNoteEntity> {
  public async getOrderNotes(
    orderId: number,
    query: GetOrderNotesRequest,
  ): Promise<GetOrderNotesListResponse> {
    const queryBuilder = this.createQueryBuilder('orderNote')
      .leftJoinAndSelect('orderNote.account', 'account')
      .leftJoin('orderNote.order', 'order')
      .where('order.id = :orderId', { orderId })
      .orderBy(
        query.orderByField || 'orderNote.createdAt',
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

    if (query.eventKey) {
      queryBuilder.andWhere('orderNote.eventKey = :eventKey', {
        eventKey: query.eventKey,
      });
    }

    const [data, count] = await queryBuilder.getManyAndCount();

    return { count, data };
  }
}
