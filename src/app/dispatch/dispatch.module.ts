import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { GeneralEntity } from '../../entities/general.entity';
import { DispatchRepository } from '../../repositories/dispatch.repository';
import { OrderRepository } from '../../repositories/order.repository';
import { AuthModule } from '../auth/auth.module';
import { NotificationModule } from '../notification/notification.module';
import { TransactionModule } from '../transaction/transaction.module';
import { DispatchController } from './dispatch.controller';
import { DispatchService } from './dispatch.service';
import { InviteRepository } from '../../repositories/invite.repository';

@Module({
    imports: [
        TypeOrmModule.forFeature([DispatchRepository, OrderRepository, GeneralEntity, OrderRepository, InviteRepository]),
        AuthModule,
        NotificationModule,
        TransactionModule,
    ],
    providers: [DispatchService],
    controllers: [DispatchController],
    exports: [DispatchService],
})
export class DispatchModule { }
