import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectEventEmitter } from 'nest-emitter';

import { OrderTimelineRepository } from '../../repositories/orderTimeline.repository';
import { GetList } from '../dto/requestList.dto';
import { AppEventEmitter } from '../event/app.events';
import { TimelineRequestDTO } from './dto/create/request.dto';
import { GetOrderTimelineListResponse } from './dto/get/response.dto';

@Injectable()
export class OrderTimelineService implements OnModuleInit {
    constructor(
        @InjectEventEmitter() private readonly emitter: AppEventEmitter,
        @InjectRepository(OrderTimelineRepository) private readonly orderTimelineRepository: OrderTimelineRepository,
    ) { }

    onModuleInit(): any {
        this.emitter.on('order_timeline', data => this.createTimeline(data));
    }

    public async get(orderId: number, query: GetList): Promise<GetOrderTimelineListResponse> {
        return await this.orderTimelineRepository.getOrderTimelines(orderId, query);
    }

    private async createTimeline(data: TimelineRequestDTO) {
        await this.orderTimelineRepository.save(data);
    }
}
