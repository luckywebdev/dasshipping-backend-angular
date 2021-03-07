import {
  Controller,
  Get,
  HttpStatus,
  Query,
  UseGuards,
  Param,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiOperation, ApiResponse, ApiUseTags } from '@nestjs/swagger';

import { GetOrderNotesRequest } from './dto/get/request.dto';
import { OrderNoteService } from './orderNote.service';
import { Roles } from '../auth/guards/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guart';
import { GetOrderNotesListResponse } from './dto/get/response.dto';
import { ROLES } from '../../constants/roles.constant';

@ApiUseTags('Order Note')
@Controller('/order-note')
export class OrderNoteController {
  constructor(private readonly orderNoteService: OrderNoteService) {}

  @Get('/:orderId')
  @ApiOperation({ title: 'Get Order Notes' })
  @ApiResponse({
    status: HttpStatus.OK,
    isArray: true,
    type: GetOrderNotesListResponse,
  })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.SUPER_ADMIN)
  async getOrderNotes(
    @Param('orderId') orderId: number,
    @Query() query: GetOrderNotesRequest,
  ) {
    return this.orderNoteService.getOrderNotes(orderId, query);
  }
}
