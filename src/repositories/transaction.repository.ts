import moment = require('moment');
import { EntityRepository, In, MoreThan, Not, Repository } from 'typeorm';

import { GetTransactionListRequest, INTERVALS } from '../app/client/dto/get/request.dto';
import { GetTransactionListResponse } from '../app/client/dto/get/transactions.dto';
import { TRANSACTION_STATUSES, TransactionEntity } from '../entities/transaction.entity';

@EntityRepository(TransactionEntity)
export class TransactionRepository extends Repository<TransactionEntity> {

    public async get(query: GetTransactionListRequest): Promise<GetTransactionListResponse> {
        const { orderByField, orderByDirection, time, clientId } = query;

        let lastDate;
        switch (time) {
            case INTERVALS.TODAY:
                lastDate = moment().subtract(1, 'day');
                break;
            case INTERVALS.WEEK:
                lastDate = moment().subtract(7, 'day');
                break;
            case INTERVALS.MONTH:
                lastDate = moment().subtract(1, 'month');
                break;
            default:
                lastDate = null;
        }
        let where: any = { clientId, status: Not(In([TRANSACTION_STATUSES.PENDING, TRANSACTION_STATUSES.FAILED])) };
        if (lastDate) {
            const tillDate = moment(lastDate).endOf('day').toISOString();
            where = { ...where, createdAt: MoreThan(tillDate) };
        }
        const data = await this.createQueryBuilder('transaction')
            .where(where)
            .leftJoinAndSelect('transaction.order', 'order')
            .select(['transaction.id', 'transaction.order', 'transaction.amount', 'transaction.createdAt',
                'transaction.status', 'order.id', 'order.uuid', 'order.priceWithDiscount'])
            .orderBy(`transaction.${orderByField || 'id'}`, orderByDirection || 'ASC')
            .skip(query.offset)
            .take(query.limit)
            .getMany();

        const count = await this.createQueryBuilder('transaction')
            .where(where)
            .getCount();

        const report = await this.createQueryBuilder('transaction')
            .where(where)
            .select(`sum("transaction"."amount"::float)`, 'totalMonth')
            .getRawOne();

        return { data, count, totalMonth: report && report.totalMonth || 0 };
    }
}
