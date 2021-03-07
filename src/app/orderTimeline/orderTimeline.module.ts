import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from 'aws-sdk';

import { OrderTimelineEntity } from '../../entities/orderTimeline.entity';
import { OrderTimelineRepository } from '../../repositories/orderTimeline.repository';
import { AuthModule } from '../auth/auth.module';
import { OrderTimelineController } from './orderTimeline.controller';
import { OrderTimelineService } from './orderTimeline.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([OrderTimelineEntity, OrderTimelineRepository]),
        AuthModule,
    ],
    providers: [OrderTimelineService, ConfigService],
    controllers: [OrderTimelineController],
    exports: [OrderTimelineService],
})
export class OrderTimelineModule { }
