import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DeviceEntity } from '../../entities/device.entity';
import { AccountRepository } from '../../repositories/account.repository';
import { NotificationRepository } from '../../repositories/notification.repository';
import { OrderRepository } from '../../repositories/order.repository';
import { AuthModule } from '../auth/auth.module';
import { EventsModule } from '../events/events.module';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([NotificationRepository, AccountRepository, OrderRepository, DeviceEntity]),
        AuthModule,
        EventsModule,
    ],
    providers: [NotificationService],
    controllers: [NotificationController],
    exports: [NotificationService],
})
export class NotificationModule { }
