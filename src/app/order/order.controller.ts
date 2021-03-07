import { Body, Controller, Delete, Get, HttpStatus, Param, Patch, Post, Query, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiOperation, ApiResponse, ApiUseTags } from '@nestjs/swagger';
import { Response } from 'express';
import { InjectEventEmitter } from 'nest-emitter';
import { IsNull } from 'typeorm';

import { ROLES } from '../../constants/roles.constant';
import { OrderDTO } from '../../dto/order.dto';
import { OrderAttachmentDTO } from '../../dto/orderAttachment.dto';
import { SuccessDTO } from '../../dto/success.dto';
import { TempPriceDTO } from '../../dto/tempPrice.dto';
import { AccountEntity } from '../../entities/account.entity';
import { ORDER_SOURCE } from '../../entities/order.entity';
import { ORDER_STATUS } from '../../entities/orderBase.entity';
import { Account } from '../account/account.decorator';
import { Roles } from '../auth/guards/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guart';
import { BadRequestDTO } from '../dto/badRequest.dto';
import { NotFoundDTO } from '../dto/notFound.dto';
import { GetList } from '../dto/requestList.dto';
import { SuccessResponseDTO } from '../dto/successResponse.dto';
import { AppEventEmitter } from '../event/app.events';
import { AddAttachmentToOrderRequest } from '../orderAttachment/dto/post/request.dto';
import { OrderAttachmentService } from '../orderAttachment/orderAttachment.service';
import { CalculatePriceRequest } from './dto/create/calculatePrice.dto';
import { OrderCreateRequest } from './dto/create/request.dto';
import { EditOrderRequestDTO } from './dto/edit-web-roles/request.dto';
import { GetOrdersRequest } from './dto/list/request.dto';
import { GetOrdersListResponse } from './dto/list/response.dto';
import { DiscountRequestDTO } from './dto/patch/discountRequest.dto';
import { OrderService } from './order.service';
import { SendInvoiceRequestDTO } from '../company/dto/sendInvoiceRequest.dto';

@ApiUseTags('orders')
@Controller('/orders')
export class OrderController {
  constructor(
    private readonly orderService: OrderService,
    private readonly orderAttachmentService: OrderAttachmentService,
    @InjectEventEmitter() private readonly emitter: AppEventEmitter,
  ) { }

  @Post('/')
  @ApiOperation({ title: 'Create Order' })
  @ApiResponse({ status: HttpStatus.OK, type: OrderDTO })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.SUPER_ADMIN, ROLES.COMPANY_ADMIN, ROLES.DISPATCHER)
  post(@Account() account: AccountEntity, @Body() data: OrderCreateRequest) {
    return this.orderService.createTransactional(account, data);
  }

  @Post('/:id/cancel')
  @ApiOperation({ title: 'Cancel order' })
  @ApiResponse({ status: HttpStatus.OK, type: SuccessDTO })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.SUPER_ADMIN)
  async cancel(@Param('id') id: number, @Account() account: AccountEntity) {
    const resp = await this.orderService.cancelOrder(account, id);
    this.emitter.emit('order_timeline', {
      orderId: id,
      actionAccountId: account.id,
      description: `Order canceled by ${account.firstName} ${account.lastName}`,
    });
    return resp;
  }

  @Get('/')
  @ApiOperation({ title: 'Get Orders List' })
  @ApiResponse({ status: HttpStatus.OK, type: GetOrdersListResponse })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.SUPER_ADMIN)
  get(@Query() query: GetOrdersRequest, @Account() account: AccountEntity) {
    return this.orderService.get(account, query);
  }

  @Get('/published')
  @ApiOperation({ title: 'Get published orders list' })
  @ApiResponse({ status: HttpStatus.OK, type: GetOrdersListResponse })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.SUPER_ADMIN)
  getPublished(
    @Query() query: GetOrdersRequest,
    @Account() account: AccountEntity,
  ) {
    query = {
      ...query,
      where: {
        companyId: IsNull(),
        source: ORDER_SOURCE.INTERNAL
      },
    };
    return this.orderService.getPublishedOrders(account, query);
  }

  @Get('/requested')
  @ApiOperation({ title: 'Get Orders List Requested to dispatch' })
  @ApiResponse({ status: HttpStatus.OK, type: GetOrdersListResponse })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.SUPER_ADMIN)
  getOrdersRequested(@Query() query: GetList, @Account() account: AccountEntity) {
    return this.orderService.getRequestedOrders(query, account);
  }

  @Get('/assigned')
  @ApiOperation({ title: 'Get Orders List assigned' })
  @ApiResponse({ status: HttpStatus.OK, type: GetOrdersListResponse })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.SUPER_ADMIN)
  getOrdersDispatched(@Query() query: GetList, @Account() account: AccountEntity) {
    return this.orderService.getDispatchedOrders(query, account);
  }

  @Get('/picked_up')
  @ApiOperation({ title: 'Get Orders List pick up' })
  @ApiResponse({ status: HttpStatus.OK, type: GetOrdersListResponse })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.SUPER_ADMIN)
  getOrdersPickedUp(@Query() query: GetList, @Account() account: AccountEntity) {
    return this.orderService.getPickedUpOrders(query, account);
  }

  @Get('/delivered')
  @ApiOperation({ title: 'Get Orders List delivered' })
  @ApiResponse({ status: HttpStatus.OK, type: GetOrdersListResponse })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.SUPER_ADMIN)
  getOrdersDelivered(@Query() query: GetList, @Account() account: AccountEntity) {
    return this.orderService.getDeliveredOrders(query, account);
  }

  @Get('/dispatched')
  @ApiOperation({ title: 'Get Orders List by dispatched invites' })
  @ApiResponse({ status: HttpStatus.OK, type: GetOrdersListResponse })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.SUPER_ADMIN)
  getOrdersInviteDispatched(@Account() account: AccountEntity, @Query() query: GetList) {
    return this.orderService.getDispatchedInviteOrders(account.id, {
      ...query, where: {
        hiddenForAdmin: false,
        source: ORDER_SOURCE.INTERNAL,
      }
    });
  }

  @Get('/expired')
  @ApiOperation({ title: 'Get Orders List by expired/declined invites' })
  @ApiResponse({ status: HttpStatus.OK, type: GetOrdersListResponse })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.SUPER_ADMIN)
  getOrdersInviteExpired(@Account() account: AccountEntity, @Query() query: GetList) {
    return this.orderService.getOrderExpiredInviteList(account.id, {
      ...query, where: {
        hiddenForAdmin: false,
        source: ORDER_SOURCE.INTERNAL
      }
    });
  }

  @Get('/:id')
  @ApiOperation({ title: 'Get Order Details' })
  @ApiResponse({ status: HttpStatus.OK, type: OrderDTO })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.SUPER_ADMIN)
  find(@Param('id') id: number, @Query('include') include: string) {
    const query = { where: { hiddenForAdmin: false } };
    return this.orderService.getOrder(id, include, query);
  }

  @Delete('/:id')
  @ApiOperation({ title: 'Delete Order' })
  @ApiResponse({ status: HttpStatus.OK, type: SuccessDTO })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.SUPER_ADMIN)
  delete(@Account() account: AccountEntity, @Param('id') id: number) {
    return this.orderService.delete(account, id);
  }

  @Patch('/:id')
  @ApiOperation({ title: 'Edit Order' })
  @ApiResponse({ status: HttpStatus.OK, type: OrderDTO })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.SUPER_ADMIN)
  async patch(
    @Account() account: AccountEntity,
    @Param('id') id: number,
    @Body() data: EditOrderRequestDTO,
    @Query('recalculate') recalculate: string,
  ) {
    const resp = await this.orderService.patch(account, id, data, {
      where: {
        source: ORDER_SOURCE.INTERNAL,
      },
    }, recalculate);
    this.emitter.emit('order_timeline', {
      orderId: id,
      actionAccountId: account.id,
      description: `Order edit by ${account.firstName} ${account.lastName}`,
    });
    return resp;
  }

  @Patch('/:id/discount')
  @ApiOperation({ title: 'Add Order Discount' })
  @ApiResponse({ status: HttpStatus.OK, type: OrderDTO })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.SUPER_ADMIN)
  async addOrderDiscount(
    @Account() account: AccountEntity,
    @Param('id') id: number,
    @Body() data: DiscountRequestDTO,
  ) {
    const resp = await this.orderService.addOrderDiscount(account, id, data);
    this.emitter.emit('order_timeline', {
      orderId: id,
      actionAccountId: account.id,
      description: `Order offered ${resp.discount}% discount by ${account.firstName} ${account.lastName}`,
    });
    return resp;
  }

  @Patch('/:id/unpublish')
  @ApiOperation({ title: 'Set Order unpublish' })
  @ApiResponse({ status: HttpStatus.OK, type: OrderDTO })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.SUPER_ADMIN)
  async addOrderUnpublish(
    @Account() account: AccountEntity,
    @Param('id') id: number,
  ) {
    const resp = await this.orderService.publish(account, id);
    this.emitter.emit('order_timeline', {
      orderId: id,
      actionAccountId: account.id,
      description: `Order was unpublished by ${account.firstName} ${account.lastName}`,
    });
    return resp;
  }

  @Patch('/:id/publish')
  @ApiOperation({ title: 'Set Order publish' })
  @ApiResponse({ status: HttpStatus.OK, type: OrderDTO })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.SUPER_ADMIN)
  async addOrderPublish(
    @Account() account: AccountEntity,
    @Param('id') id: number,
  ) {
    const resp = await this.orderService.publish(account, id, true);
    this.emitter.emit('order_timeline', {
      orderId: id,
      actionAccountId: account.id,
      description: `Order was published by ${account.firstName} ${account.lastName}`,
    });
    return resp;
  }

  @Post('/calculate-price')
  @ApiOperation({ title: 'Calculate price' })
  @ApiResponse({ status: HttpStatus.OK, type: TempPriceDTO })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
  @UseGuards(AuthGuard())
  calculatePrice(@Account() account, @Body() data: CalculatePriceRequest) {
    return this.orderService.calculatePrice(account, data);
  }

  @Post('/:orderId/mark-paid')
  @ApiOperation({ title: 'MArk Order as paid' })
  @ApiResponse({ status: HttpStatus.OK, type: SuccessResponseDTO })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: NotFoundDTO })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.SUPER_ADMIN)
  async markPaid(
    @Account() account: AccountEntity,
    @Body('paymentMethod') paymentMethod: string,
    @Param('orderId') orderId: number,
  ) {
    const resp = await this.orderService.markPaid(orderId, paymentMethod, {
      where: {
        status: ORDER_STATUS.BILLED,
      },
    });
    this.emitter.emit('order_timeline', {
      orderId,
      actionAccountId: account.id,
      description: `Order marked as paid by ${account.firstName} ${account.lastName}`,
    });
    return resp;
  }

  @Post('/:orderId/archive')
  @ApiOperation({ title: 'Archive Order' })
  @ApiResponse({ status: HttpStatus.OK, type: SuccessResponseDTO })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: NotFoundDTO })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.SUPER_ADMIN)
  archiveOrder(@Account() account: AccountEntity, @Param('orderId') orderId: number) {
    return this.orderService.archiveOrder(account, orderId, {});
  }

  @Get('/:orderId/photos')
  @ApiOperation({ title: 'Archive Order' })
  @ApiResponse({ status: HttpStatus.OK, type: SuccessDTO })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: NotFoundDTO })
  async getPhotos(@Param('orderId') orderId: number, @Res() res: Response) {
    const url = await this.orderService.getInspectionPhotosZip(orderId);
    return res.redirect(url);
  }

  @Post('/:orderId/attachments')
  @ApiOperation({ title: 'Add attachment to order' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: OrderAttachmentDTO,
  })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.SUPER_ADMIN)
  async addAttachmentOrder(
    @Account() account: AccountEntity,
    @Param('orderId') orderId: number,
    @Body() data: AddAttachmentToOrderRequest,
  ) {
    data = { orderId, ...data };
    const query = {
      id: orderId,
    };
    return this.orderAttachmentService.post({ ...data, createdById: account.id }, query);
  }

  @Delete('/:orderId/attachments/:id')
  @ApiOperation({ title: 'Remove attachment to order' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SuccessDTO,
  })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.SUPER_ADMIN)
  async removeAttachmentOrder(
    @Account() account: AccountEntity,
    @Param('orderId') orderId: number,
    @Param('id') id: number,
  ) {
    return this.orderAttachmentService.delete(
      { id: orderId },
      { orderId, id, createdById: account.id },
    );
  }

  @Get('/:orderId/invoice')
  @ApiOperation({ title: 'Get Order BOL' })
  @ApiResponse({ status: HttpStatus.OK, type: SuccessResponseDTO })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: NotFoundDTO })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.SUPER_ADMIN)
  getInvoice(@Param('orderId') orderId: number) {
    return this.orderService.getInvoiceLink(orderId);
  }

  @Get('/:orderId/bol')
  @ApiOperation({ title: 'Get Order BOL' })
  @ApiResponse({ status: HttpStatus.OK, type: SuccessResponseDTO })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: NotFoundDTO })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.SUPER_ADMIN)
  getBOL(@Param('orderId') orderId: number) {
    return this.orderService.getBOLLink(orderId);
  }

  @Get('/:orderId/receipt')
  @ApiOperation({ title: 'Get Order Receipt' })
  @ApiResponse({ status: HttpStatus.OK, type: SuccessResponseDTO })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: NotFoundDTO })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.SUPER_ADMIN)
  getReceipt(@Param('orderId') orderId: number) {
    return this.orderService.getReceiptLink(orderId);
  }

  @Post('/:orderId/send-invoice')
  @ApiOperation({ title: 'Send Order Invoice' })
  @ApiResponse({ status: HttpStatus.OK, type: SuccessResponseDTO })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: NotFoundDTO })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.SUPER_ADMIN)
  sendInvoice(
    @Param('orderId') orderId: number,
    @Body() data: SendInvoiceRequestDTO,
  ) {
    return this.orderService.sendInvoice(orderId, data);
  }

  @Post('/:orderId/send-bol')
  @ApiOperation({ title: 'Send Order BOL' })
  @ApiResponse({ status: HttpStatus.OK, type: SuccessResponseDTO })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: NotFoundDTO })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.SUPER_ADMIN)
  sendBOL(
    @Body('email') email: string,
    @Param('orderId') orderId: number,
  ) {
    return this.orderService.sendBOL(orderId, email);
  }

  @Post('/:orderId/send-receipt')
  @ApiOperation({ title: 'Send Order Receipt' })
  @ApiResponse({ status: HttpStatus.OK, type: SuccessResponseDTO })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: NotFoundDTO })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.SUPER_ADMIN)
  sendReceipt(
    @Body('email') email: string,
    @Param('orderId') orderId: number,
  ) {
    return this.orderService.sendReceipt(orderId, email);
  }
}
