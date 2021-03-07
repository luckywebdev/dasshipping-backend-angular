import { Controller, Get, HttpStatus, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiOperation, ApiResponse, ApiUseTags } from '@nestjs/swagger';

import { ROLES } from '../../constants/roles.constant';
import { Roles } from '../auth/guards/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guart';
import { BadRequestDTO } from '../dto/badRequest.dto';
import { GetList } from '../dto/requestList.dto';
import { GetOrderAttachmentListResponse } from './dto/get/response.dto';
import { OrderAttachmentService } from './orderAttachment.service';

@ApiUseTags('Order Attachment')
@Controller('/order-attachment')
export class OrderAttachmentController {
  constructor(
    private readonly orderAttachmentService: OrderAttachmentService,
  ) { }

  @Get('/:orderId')
  @ApiOperation({ title: 'Get Order Attachments' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: GetOrderAttachmentListResponse,
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.SUPER_ADMIN)
  get(@Query() query: GetList, @Param('orderId') orderId: number) {
    return this.orderAttachmentService.get(orderId, query);
  }
}
