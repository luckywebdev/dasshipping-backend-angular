import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { JoinRequestDTO } from '../../dto/joinRequest.dto';
import { DRIVER_NOTIFICATION_ACTIONS, DRIVER_NOTIFICATION_TYPES } from '../../dto/notification.dto';
import { AccountEntity } from '../../entities/account.entity';
import { CompanyEntity } from '../../entities/company.entity';
import { JOIN_REQUEST_STATUS } from '../../entities/joinRequest.entity';
import { JoinRequestRepository } from '../../repositories/joinRequests.repository';
import { AccountService } from '../account/account.service';
import { NotificationService } from '../notification/notification.service';
import { JoinCompanyRequest } from './dto/joinRequest.dto';
import { GetJoinedRequests } from './dto/requestList.dto';
import { GetJoinedRequestsResponse } from './dto/responseList.dto';

@Injectable()
export class JoinRequestService {

    constructor(
        @InjectRepository(CompanyEntity) private readonly companyRepository: Repository<CompanyEntity>,
        @InjectRepository(JoinRequestRepository) private readonly joinRequestRepository: JoinRequestRepository,
        private readonly accountService: AccountService,
        private notificationService: NotificationService,
    ) { }

    public async createJoinRequest(data: JoinCompanyRequest, account: AccountEntity): Promise<JoinRequestDTO> {
        if (account.company) {
            throw new BadRequestException(`Account ${account.firstName} ${account.lastName} has already a company assigned`);
        }
        const company = await this.companyRepository.findOne(data);

        if (!company) {
            throw new NotFoundException(`Company with dot number ${data.dotNumber} not found`);
        }

        if (await this.joinRequestRepository.findOne({ account, status: JOIN_REQUEST_STATUS.PENDING })) {
            throw new BadRequestException(`Account ${account.firstName} ${account.lastName} has already a join request`);
        }

        return await this.joinRequestRepository.save({
            company,
            account,
            status: JOIN_REQUEST_STATUS.PENDING,
        });
    }

    public async getJoinedRequests(account: AccountEntity, query: GetJoinedRequests, status?: string): Promise<GetJoinedRequestsResponse> {
        return this.joinRequestRepository.getJoinedRequests(account, query, status);
    }

    public async joinRequestAction(id: number, action: string): Promise<void> {
        const joinRequest = await this.joinRequestRepository.findOne(id, { relations: ['company', 'account'] });
        if (!joinRequest) {
            throw new NotFoundException(`Join request ${id} not found`);
        }
        if (JOIN_REQUEST_STATUS.PENDING !== joinRequest.status) {
            throw new BadRequestException(`Join request ${id} has already been closed`);
        }
        let status;
        let notification: any = null;
        switch (action) {
            case 'accept':
                status = JOIN_REQUEST_STATUS.ACCEPTED;
                await this.accountService.joinCompany(joinRequest.account, joinRequest.company);
                notification = {
                    type: DRIVER_NOTIFICATION_TYPES.JOIN_REQUEST_ACCEPTED,
                    actions: [{
                        label: DRIVER_NOTIFICATION_ACTIONS.GO_TO_CARRIER_CONNECT,
                    }],
                    title: 'Account status update',
                    content: `Congratulations, your join fleet request was approved`,
                    targetUserId: joinRequest.account.id,
                };
                break;
            case 'decline':
                status = JOIN_REQUEST_STATUS.DECLINED;
                notification = {
                    type: DRIVER_NOTIFICATION_TYPES.JOIN_REQUEST_DECLINED,
                    actions: [{
                        label: DRIVER_NOTIFICATION_ACTIONS.GO_TO_CARRIER_CONNECT,
                    }],
                    title: 'Join request declined',
                    // tslint:disable-next-line: max-line-length
                    content: `Unfortunately, Carrier ${joinRequest.company.name} denied your joint fleet request. Do you wish to connect to another Carrier?`,
                    targetUserId: joinRequest.account.id,
                };
                break;
            case 'cancel':
                status = JOIN_REQUEST_STATUS.CANCELLED;
                break;
            default:
                throw new BadRequestException(`No action found for ${action}`);
        }

        await this.joinRequestRepository.update(id, {
            status,
            updatedAt: new Date(),
        });

        if (notification) {
            await this.notificationService.create(notification);
        }
    }
}
