import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { OrderEntity } from '../../entities/order.entity';
import { TripEntity } from '../../entities/trip.entity';
import { TripRepository } from '../../repositories/trip.repository';
import { AuthModule } from '../auth/auth.module';
import { TripController } from './trip.controller';
import { TripService } from './trip.service';
import { NotificationModule } from '../notification/notification.module';
import { OrderRepository } from '../../repositories/order.repository';
import { OrderToTripEntity } from '../../entities/orderToTrip.entity';
import { HereModule } from '../here/here.module';
import { OrderModule } from '../order/order.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([TripEntity, OrderEntity, TripRepository, OrderRepository, OrderToTripEntity]),
        AuthModule,
        NotificationModule,
        HereModule,
        OrderModule,
    ],
    providers: [TripService],
    controllers: [TripController],
    exports: [TripService],
})
export class TripModule { }
