import { EntityRepository, Repository } from 'typeorm';

import { GetList } from '../app/dto/requestList.dto';
import { GetNotificationListResponse } from '../app/notification/dto/get/listResponse.dto';
import { NotificationEntity } from '../entities/notification.entity';

@EntityRepository(NotificationEntity)
export class NotificationRepository extends Repository<NotificationEntity> {

    public async getAll(query: GetList): Promise<GetNotificationListResponse> {
        const queryBuilder = this.createQueryBuilder('notification')
            .leftJoinAndSelect('notification.targetUser', 'account')
            .orderBy(query.orderByField ?
                `notification.${query.orderByField}` :
                'notification.createdAt', query.orderByDirection ? query.orderByDirection : 'DESC')
            .skip(query.offset)
            .take(query.limit);

        if (query.where) {
            queryBuilder.andWhere(query.where);
        }

        const [notifications, notificationsCount] = await queryBuilder.getManyAndCount();

        return { count: notificationsCount, data: notifications };
    }

    public async getCount(where: any): Promise<number> {
        const count = await this.createQueryBuilder('notification')
            .andWhere(where).getCount();
        return count;
    }

    public async getCountNotifyCompany(where: any): Promise<number> {
        const count = await this.createQueryBuilder('notification')
            .andWhere('notification.companyId is not null OR notification.inviteId is not null')
            .andWhere(where)
            .getCount();
        return count;
    }

    public async getCountNotifyUsers(where: any): Promise<number> {
        const count = await this.createQueryBuilder('notification')
            .andWhere('notification.accountId is not null OR notification.inviteId is not null')
            .andWhere(where)
            .getCount();
        return count;
    }
}
