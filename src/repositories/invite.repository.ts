import { EntityRepository, In, Repository } from 'typeorm';

import {
    ACCOUNT_INVITES_ORDER_BY_FIELDS,
    GetAccountInvitesListRequest,
} from '../app/register/dto/account-invite-list/request.dto';
import { GetAccountInvitesListResponse } from '../app/register/dto/account-invite-list/response.dto';
import { ResendInviteRequest } from '../app/register/dto/resend-invite/request.dto';
import { ROLES } from '../constants/roles.constant';
import { WEB_NOTIFICATION } from '../dto/notification.dto';
import { AccountEntity } from '../entities/account.entity';
import { InviteEntity } from '../entities/invite.entity';
import { NotificationStatus } from '../entities/notification.entity';

@EntityRepository(InviteEntity)
export class InviteRepository extends Repository<InviteEntity> {

    public async getInvite(query: any, queryCompany: any = null): Promise<InviteEntity> {
        const queryBuilder = this.createQueryBuilder('invite')
            .leftJoinAndSelect('invite.status', 'status')
            .leftJoinAndSelect('invite.role', 'role')
            .leftJoinAndSelect('invite.company', 'company')
            .where(query);
        if (queryCompany) {
            if (queryCompany.msNumber) {
                queryBuilder.andWhere('company.msNumber = :msNumber', { msNumber: queryCompany.msNumber });
            }
            if (queryCompany.dotNumber) {
                queryBuilder.andWhere('company.dotNumber = :dotNumber', { dotNumber: queryCompany.dotNumber });
            }
        }
        return queryBuilder.getOne();
    }

    public async getInviteListByIds(data: ResendInviteRequest, account: AccountEntity): Promise<InviteEntity[]> {
        const query = account.roleId === ROLES.SUPER_ADMIN ? {} : { companyId: account.companyId };

        return await this.createQueryBuilder('invite')
            .leftJoinAndSelect('invite.company', 'company')
            .where({ id: In(data.ids), ...query, used: false })
            .getMany();
    }

    public async getInviteList(
        account: AccountEntity,
        query: GetAccountInvitesListRequest,
        extended: boolean = false,
    ): Promise<GetAccountInvitesListResponse> {
        const additional = account.roleId !== ROLES.SUPER_ADMIN ? { companyId: account ? account.companyId : undefined } : { extended };

        let orderByField = 'invite.id';
        if (query.orderByField) {
            switch (query.orderByField) {
                case ACCOUNT_INVITES_ORDER_BY_FIELDS.ROLE:
                    orderByField = 'invite.roleId';
                    break;
                case ACCOUNT_INVITES_ORDER_BY_FIELDS.CREATED_AT:
                    orderByField = 'invite.createdAt';
                    break;
                case ACCOUNT_INVITES_ORDER_BY_FIELDS.EXPIRE:
                    orderByField = 'invite.expire';
                    break;
                case ACCOUNT_INVITES_ORDER_BY_FIELDS.STATUS:
                    orderByField = 'invite.statusId';
                    break;
                default:
                    orderByField = 'invite.id';

            }
        }
        const queryBuilder = this.createQueryBuilder('invite')
            .leftJoinAndSelect('invite.status', 'status')
            .leftJoinAndSelect('invite.role', 'role')
            .leftJoinAndSelect('invite.company', 'company')
            .where(additional)
            .orderBy(orderByField, query.orderByDirection ? query.orderByDirection : 'DESC')
            .skip(query.offset)
            .take(query.limit);

        if (account.roleId === ROLES.SUPER_ADMIN) {
            queryBuilder
                .leftJoinAndSelect('invite.notifications', 'notifications',
                    'notifications.targetUserId = :targetUserId AND notifications.status = :notifyStatus AND notifications.type = :notifyType',
                    { targetUserId: account.id, notifyStatus: NotificationStatus.ACTIVE, notifyType: WEB_NOTIFICATION.CARRIER });
        }

        if (account.roleId === ROLES.COMPANY_ADMIN) {
            queryBuilder
                .leftJoinAndSelect('invite.notifications', 'notifications',
                    'notifications.targetUserId = :targetUserId AND notifications.status = :notifyStatus AND notifications.type = :notifyType',
                    { targetUserId: account.id, notifyStatus: NotificationStatus.ACTIVE, notifyType: WEB_NOTIFICATION.USER });
        }

        const countQueryBuilder = this.createQueryBuilder('invite')
            .where(additional);

        const data = await queryBuilder.getMany();
        const count = await countQueryBuilder.getCount();

        return { data, count };
    }
}
