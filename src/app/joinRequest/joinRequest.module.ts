import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '../auth/auth.module';
import {JoinRequestEntity} from '../../entities/joinRequest.entity';
import {JoinRequestRepository} from '../../repositories/joinRequests.repository';
import {JoinRequestController} from './joinRequest.controller';
import {JoinRequestService} from './joinRequest.service';
import {CompanyEntity} from '../../entities/company.entity';
import {AccountModule} from '../account/account.module';
import {NotificationModule} from '../notification/notification.module';
import {HereService} from '../here/here.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([JoinRequestEntity, JoinRequestRepository, CompanyEntity]),
        AuthModule,
        AccountModule,
        NotificationModule,
    ],
    providers: [JoinRequestService, HereService],
    controllers: [JoinRequestController],
})
export class JoinRequestModule { }
