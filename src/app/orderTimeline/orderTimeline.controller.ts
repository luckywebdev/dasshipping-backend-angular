import { Controller, Get, HttpStatus, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiOperation, ApiResponse, ApiUseTags } from '@nestjs/swagger';

import { ROLES } from '../../constants/roles.constant';
import { Roles } from '../auth/guards/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guart';
import { BadRequestDTO } from '../dto/badRequest.dto';
import { GetList } from '../dto/requestList.dto';
import { GetOrderTimelineListResponse } from './dto/get/response.dto';
import { OrderTimelineService } from './orderTimeline.service';

@ApiUseTags('Order Timeline')
@Controller('/order-timeline')
export class OrderTimelineController {
    constructor(
        private readonly orderTimelineService: OrderTimelineService,
    ) { }

    @Get('/:orderId')
    @ApiOperation({ title: 'Get Order Timeline' })
    @ApiResponse({ status: HttpStatus.OK, type: GetOrderTimelineListResponse })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    @UseGuards(AuthGuard(), RolesGuard)
    @Roles(ROLES.SUPER_ADMIN)
    get(@Param('orderId') orderId: number, @Query() query: GetList) {
        return this.orderTimelineService.get(orderId, query);
    }
}
