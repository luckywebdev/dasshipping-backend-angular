import { EntityRepository, Repository } from 'typeorm';

import { GetAccountsListRequest } from '../app/account/dto/list/request.dto';
import { GetAccountsListResponse } from '../app/account/dto/list/response.dto';
import { ReportsByUserRequestDTO } from '../app/company/dto/reports-by-user/request.dto';
import { GetReportsByUserResponse } from '../app/company/dto/reports-by-user/response.dto';
import { GetList } from '../app/dto/requestList.dto';
import { SELECT_ACCOUNT } from '../constants';
import { ROLES } from '../constants/roles.constant';
import { WEB_NOTIFICATION } from '../dto/notification.dto';
import { AccountEntity } from '../entities/account.entity';
import { NotificationStatus } from '../entities/notification.entity';
import { ORDER_STATUS } from '../entities/orderBase.entity';
import { TripEntity } from '../entities/trip.entity';

@EntityRepository(AccountEntity)
export class AccountRepository extends Repository<AccountEntity> {

    public async getDriversForDispatcher(dispatcher: AccountEntity, query: GetList): Promise<GetAccountsListResponse> {
        const { orderByField, orderByDirection } = query;

        const queryBuilder = this.createQueryBuilder('account')
            .orderBy(`account.${orderByField || 'id'}`, orderByDirection || 'ASC')
            .where('"account"."dispatcherId" = :dispatcherId', { dispatcherId: dispatcher.id })
            .skip(query.offset || 0)
            .take(query.limit || 10);

        const countQueryBuilder = this.createQueryBuilder('account')
            .where('"account"."dispatcherId" = :dispatcherId', { dispatcherId: dispatcher.id });

        if (query.where) {
            queryBuilder.andWhere(query.where);
            countQueryBuilder.andWhere(query.where);
        }

        const data = await queryBuilder.getMany();
        const count = await countQueryBuilder.getCount();

        return { data, count };
    }

    public async getAccountsList(account: AccountEntity, query: GetAccountsListRequest, companyId?: number): Promise<GetAccountsListResponse> {
        const queryBuilder = this.createQueryBuilder('account')
            .select(SELECT_ACCOUNT)
            .leftJoinAndSelect('account.role', 'role')
            .leftJoinAndSelect('account.company', 'company')
            .leftJoinAndSelect('account.dispatcher', 'dispatcher')
            .leftJoinAndSelect('account.truck', 'truck')
            .leftJoinAndSelect('account.trailer', 'trailer')
            .where('account.deleted = :deleted', { deleted: false })
            .andWhere('account.id != :currentAccountId', { currentAccountId: account.id })
            .orderBy(query.orderByField, query.orderByDirection ? query.orderByDirection : 'ASC')
            .skip(query.offset)
            .take(query.limit);

        if (account.roleId === ROLES.COMPANY_ADMIN) {
            queryBuilder
                .leftJoinAndSelect('account.notifications', 'notifications',
                    'notifications.targetUserId = :targetUserId AND notifications.status = :notifyStatus AND notifications.type = :notifyType',
                    { targetUserId: account.id, notifyStatus: NotificationStatus.ACTIVE, notifyType: WEB_NOTIFICATION.USER });
        }

        if (query.textFilter) {
            queryBuilder.andWhere('account.firstName || \' \' || account.lastName ilike :filter', { filter: '%' + query.textFilter + '%' });
        }

        if (query.role) {
            queryBuilder.andWhere('role.name = :role', { role: query.role });
        }

        if (companyId) {
            queryBuilder.andWhere('account.companyId = :companyId', { companyId });
        }

        if (query.where) {
            queryBuilder.andWhere(query.where);
        }

        const [accounts, accountsCount] = await queryBuilder.getManyAndCount();

        return { count: accountsCount, data: accounts };

    }

    public async getAccount(accountId: number, query: any = {}): Promise<AccountEntity> {
        const queryBuilder = this.createQueryBuilder('account')
            .leftJoinAndSelect('account.role', 'role')
            .leftJoinAndSelect('account.gender', 'gender')
            .leftJoinAndSelect('account.company', 'company')
            .leftJoinAndSelect('account.truck', 'truck')
            .leftJoinAndSelect('account.trailer', 'trailer')
            .leftJoinAndSelect('account.files', 'files')
            .leftJoinAndSelect('account.dispatcher', 'dispatcher')
            .leftJoinAndSelect('account.languages', 'language')
            .where('account.deleted = false')
            .andWhere('account.id = :id', { id: accountId });

        if (query.where) {
            queryBuilder.andWhere(query.where);
        }

        return await queryBuilder.getOne();
    }

    public async getAccountsLastLocation(query: any): Promise<AccountEntity[]> {
        const count = await this.createQueryBuilder('account')
            .where(query)
            .getCount();

        const accounts = await this.createQueryBuilder('account')
            .select(['account.id',
                'account.firstName',
                'account.lastName',
                'account.avatarUrl',
            ])
            .where(query)
            .leftJoinAndSelect('account.locations', 'locations')
            .orderBy({
                'locations.id': 'DESC',
            })
            .take(count)
            .getMany();

        return accounts;
    }

    public async getByUserReport(query: ReportsByUserRequestDTO): Promise<GetReportsByUserResponse> {
        let statuses = [ORDER_STATUS.DELIVERED];
        if (!query.deliveredOnly) {
            statuses = [...statuses, ORDER_STATUS.CLAIMED];
        }
        let roles = [ROLES.DISPATCHER, ROLES.DRIVER];
        if (query.role) {
            roles = [query.role];
        }

        const queryBuilder = this.createQueryBuilder('account')
            .select('account.id', 'id')
            .addSelect(`case when "account"."payRate" is not null then "account"."payRate" else 0 end`, 'payRate')
            .addSelect('account.firstName', 'firstName')
            .addSelect('account.lastName', 'lastName')
            .andWhere('account.roleId IN (:...roles)', {
                roles,
            })
            .leftJoin(TripEntity, 'trip', 'trip.dispatcherId = account.id or trip.driverId = account.id')
            .leftJoin('trip.orderTrips', 'orderTrips')
            .leftJoin('orderTrips.order', 'order')
            .andWhere('order.status IN (:...statuses)', {
                statuses,
            })
            // tslint:disable-next-line: max-line-length
            .addSelect(`sum(case when "order"."salePrice" is not null then "order"."salePrice" else 0 end)`, 'grossRevenue')
            .groupBy('account.id');

        if (query && query.where) {
            queryBuilder.andWhere(query.where);
        }

        if (query && query.fromDeliveryDate) {
            queryBuilder.andWhere('order.deliveryDate >= :fromDeliveryDate', { fromDeliveryDate: query.fromDeliveryDate });
        }

        if (query && query.toDeliveryDate) {
            queryBuilder.andWhere('order.deliveryDate <= :toDeliveryDate', { toDeliveryDate: query.toDeliveryDate });
        }

        const count = await queryBuilder.getCount();
        const data = await queryBuilder
            .skip(query.offset || 0)
            .take(query.limit || 10)
            .getRawMany();

        return {
            data: data.map(item => {
                const grossRevenue = parseFloat(item.grossRevenue);
                return { ...item, grossRevenue, toPay: item.payRate ? ((grossRevenue * item.payRate) / 100) : 0 };
            }),
            count,
        };
    }

    public async getCount(where: any, roles: number[]): Promise<number> {
        const queryBuilder = this.createQueryBuilder('account')
            .andWhere('account.roleId IN (:...roles)', {
                roles,
            });

        if (where) {
            queryBuilder.andWhere(where);
        }
        return queryBuilder.getCount();
    }
}
