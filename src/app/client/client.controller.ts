import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Render,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiOperation, ApiResponse, ApiUseTags } from '@nestjs/swagger';
import { number } from 'joi';
import { InjectEventEmitter } from 'nest-emitter';
import { In, IsNull, Not } from 'typeorm';

import { ConfigService } from '../../config/config.service';
import { ROLES } from '../../constants/roles.constant';
import { CarDTO } from '../../dto/car.dto';
import { InspectionDTO } from '../../dto/inspection.dto';
import { DRIVER_NOTIFICATION_TYPES } from '../../dto/notification.dto';
import { OrderDTO } from '../../dto/order.dto';
import { OrderAttachmentDTO } from '../../dto/orderAttachment.dto';
import { QuoteDTO } from '../../dto/quote.dto';
import { SOURCE_TYPE } from '../../dto/signedBy.dto';
import { SuccessDTO } from '../../dto/success.dto';
import { WalletDTO } from '../../dto/wallet.dto';
import { AccountEntity } from '../../entities/account.entity';
import { ORDER_STATUS } from '../../entities/orderBase.entity';
import { Account } from '../account/account.decorator';
import { AccountService } from '../account/account.service';
import { FileSignResponse } from '../account/dto/file-sign/response.dto';
import { Roles } from '../auth/guards/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guart';
import { CarService } from '../car/car.service';
import { DriverLocationService } from '../driverLocation/driverLocation.service';
import { BadRequestDTO } from '../dto/badRequest.dto';
import { NotFoundDTO } from '../dto/notFound.dto';
import { GetList } from '../dto/requestList.dto';
import { AppEventEmitter } from '../event/app.events';
import { GeneralService } from '../general/general.service';
import { InspectionService } from '../inspection/inspection.service';
import { FiltersOrdersRequest } from '../order/dto/list/filters.dto';
import { GetOrdersRequest } from '../order/dto/list/request.dto';
import { GetOrdersListResponse } from '../order/dto/list/response.dto';
import { PatchOrderRequestDTO } from '../order/dto/patch/patchRequest.dto';
import { OrderService } from '../order/order.service';
import { GetOrderAttachmentListResponse } from '../orderAttachment/dto/get/response.dto';
import { AddAttachmentToOrderRequest } from '../orderAttachment/dto/post/request.dto';
import { OrderAttachmentService } from '../orderAttachment/orderAttachment.service';
import { GetOrderTimelineListResponse } from '../orderTimeline/dto/get/response.dto';
import { OrderTimelineService } from '../orderTimeline/orderTimeline.service';
import { PaymentService } from '../payment/payment.service';
import { QuotePublishRequest } from '../quote/dto/requests/publish.dto';
import { QuotesListResponse } from '../quote/dto/responses/list.dto';
import { QuoteService } from '../quote/quote.service';
import { ClientScope } from '../shared/scopes/clinet';
import { TransactionService } from '../transaction/transaction.service';
import { WalletRequestDTO } from '../wallet/dto/addWallet.dto';
import { WalletService } from '../wallet/wallet.service';
import { DriverLocationPartialDTO } from './dto/get/driverLocationPartial.dto';
import { GetTransactionListRequest } from './dto/get/request.dto';
import { GetTransactionListResponse } from './dto/get/transactions.dto';
import { DeliveryDamagesRequest } from './dto/patch/deliveryDamages.dto';
import { PatchQuoteRequest } from './dto/patch/request.dto';
import { SignPickUpRequest } from './dto/post/requestSignPickUp.dto';

@ApiUseTags('clients')
@Controller('/clients')
export class ClientController {
  constructor(
    private readonly quotesService: QuoteService,
    private readonly orderService: OrderService,
    private readonly inspectionService: InspectionService,
    private readonly generalService: GeneralService,
    private readonly walletService: WalletService,
    private readonly paymentService: PaymentService,
    private readonly driverLocationService: DriverLocationService,
    private readonly orderAttachmentService: OrderAttachmentService,
    private readonly transactionService: TransactionService,
    private readonly carService: CarService,
    private readonly orderTimelineService: OrderTimelineService,
    private readonly configService: ConfigService,
    private readonly accountService: AccountService,
    @InjectEventEmitter() private readonly emitter: AppEventEmitter,
  ) { }

  @Get('/me/quotes')
  @ApiOperation({ title: 'Get all your quotes' })
  @ApiResponse({ status: HttpStatus.OK, type: QuotesListResponse })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.CLIENT)
  async getMyQuotes(
    @Account() account: AccountEntity,
    @Query() query: GetList,
  ) {
    query.where = { ...query.where, createdById: account.id };
    const { data, count } = await this.quotesService.get(query);
    return { data: ClientScope.quotes(data), count };
  }

  @Get('/me/quotes/:id')
  @ApiOperation({ title: 'Get your quote' })
  @ApiResponse({ status: HttpStatus.OK, type: QuoteDTO })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.CLIENT)
  async getMyQuote(
    @Account() account: AccountEntity,
    @Param('id') id: number,
  ) {
    const data = await this.quotesService.find(account, id);
    return ClientScope.quote(data);
  }

  @Delete('/me/quotes/:id')
  @ApiOperation({ title: 'Get all your quotes' })
  @ApiResponse({ status: HttpStatus.OK, type: SuccessDTO })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.CLIENT)
  async declineMyQuotes(
    @Account() account: AccountEntity,
    @Param('id') id: number,
  ) {
    return await this.quotesService.decline(id, {
      createdById: account.id,
    });
  }

  @Patch('/me/quotes/:id/accept')
  @ApiOperation({ title: 'Get all your quotes' })
  @ApiResponse({ status: HttpStatus.OK, type: QuoteDTO })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.CLIENT)
  async acceptMyQuotes(
    @Account() account: AccountEntity,
    @Param('id') id: number,
  ) {
    const quote = await this.quotesService.accept(id, {
      createdById: account.id,
    });
    return ClientScope.quote(quote);
  }

  @Post('/me/quotes/:id/publish')
  @ApiOperation({ title: 'Publish quote on load board' })
  @ApiResponse({ status: HttpStatus.OK, type: OrderDTO })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.CLIENT)
  async publishMyQuotes(
    @Account() account: AccountEntity,
    @Param('id') id: number,
    @Body() data: QuotePublishRequest,
  ) {
    const quote = await this.quotesService.publish(account, data, {
      createdById: account.id,
      id,
    });
    this.emitter.emit('notification_admin', { orderId: quote.id });
    return ClientScope.order(quote);
  }

  @Get('/:id/quotes')
  @ApiOperation({ title: 'Get all quotes for a client' })
  @ApiResponse({ status: HttpStatus.OK, type: QuotesListResponse })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.SUPER_ADMIN)
  getQuotes(
    @Account() account: AccountEntity,
    @Param('id') id: number,
    @Query() query: GetList,
  ) {
    query.where = { ...query.where, createdById: id };
    return this.quotesService.get(query);
  }

  @Get('/me/orders/:status/status')
  @ApiOperation({ title: 'Get all your orders' })
  @ApiResponse({ status: HttpStatus.OK, type: GetOrdersListResponse })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.CLIENT, ROLES.DISPATCHER)
  async getOrders(
    @Param('status') status: string,
    @Account() account: AccountEntity,
    @Query() query: FiltersOrdersRequest,
  ) {
    if (status === ORDER_STATUS.DELIVERED) {
      query.where = {
        createdById: account.id,
        status: In([ORDER_STATUS.DELIVERED, ORDER_STATUS.CLAIMED]),
      };
    } else {
      query.where = {
        createdById: account.id,
        published: true,
        status: Not(In([ORDER_STATUS.DELIVERED, ORDER_STATUS.CLAIMED, ORDER_STATUS.CANCELED,
        ORDER_STATUS.PAID, ORDER_STATUS.BILLED, ORDER_STATUS.DELETED, ORDER_STATUS.ARCHIVED])),
        hiddenForAdmin: false,
        hiddenForCompnay: false
      };
    }
    const { data, count } = await this.orderService.getOrdersForLoadBoard(
      account,
      query,
    );
    return { data: ClientScope.orders(data), count };
  }

  @Get('/me/orders/:orderId/attachments')
  @ApiOperation({ title: 'Get list attachments order' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: GetOrderAttachmentListResponse,
  })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.CLIENT)
  async getAttachmentsOrder(
    @Account() account: AccountEntity,
    @Param('orderId') orderId: number,
    @Body() query: GetList,
  ) {
    const count = await this.orderService.getOrderCount({
      id: orderId,
      createdById: account.id,
    });

    if (!count) {
      throw new ForbiddenException(`You do not have access to this order`);
    }

    return this.orderAttachmentService.get(orderId, query);
  }

  @Post('/me/orders/:orderId/attachments')
  @ApiOperation({ title: 'Add an attachment to order' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: OrderAttachmentDTO,
  })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.CLIENT)
  async addAttachmentsOrder(
    @Account() account: AccountEntity,
    @Param('orderId') orderId: number,
    @Body() data: AddAttachmentToOrderRequest,
  ) {
    return this.orderAttachmentService.post({ ...data, orderId, createdById: account.id }, {
      id: orderId,
      createdById: account.id,
      status: Not(In([ORDER_STATUS.CLAIMED, ORDER_STATUS.DELIVERED])),
    });
  }

  @Delete('/me/orders/:orderId/attachments/:attachmentId')
  @ApiOperation({ title: 'Delete an attachment from order' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SuccessDTO,
  })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.CLIENT)
  async removeAttachmentsOrder(
    @Account() account: AccountEntity,
    @Param('orderId') orderId: number,
    @Param('attachmentId') attachmentId: number,
  ) {
    return this.orderAttachmentService.delete({
      id: orderId,
      createdById: account.id,
      status: Not(In([ORDER_STATUS.CLAIMED, ORDER_STATUS.DELIVERED])),
    }, { orderId, id: attachmentId, createdById: account.id });
  }

  @Get('/me/books')
  @ApiOperation({ title: 'Get all your booked orders' })
  @ApiResponse({ status: HttpStatus.OK, type: GetOrdersListResponse })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.CLIENT, ROLES.DISPATCHER)
  async getBooks(
    @Account() account: AccountEntity,
    @Query() query: GetOrdersRequest,
  ) {
    query.where = {
      createdById: account.id,
      status: Not(ORDER_STATUS.CANCELED),
      companyId: IsNull(),
    };
    const { data, count } = await this.orderService.getOrdersForLoadBoard(
      account,
      query,
    );
    return { data: ClientScope.orders(data), count };
  }

  @Get('/me/orders/:id')
  @ApiOperation({ title: 'Get Order Details' })
  @ApiResponse({ status: HttpStatus.OK, type: OrderDTO })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.CLIENT, ROLES.DISPATCHER)
  async getCompanyOrder(
    @Account() account: AccountEntity,
    @Param('id') id: number,
    @Query('include') include: string,
  ) {
    const query = {
      where: {
        createdById: account.id,
        published: true,
      },
    };
    const order = await this.orderService.getOrder(id, include, query);
    return ClientScope.order(order);
  }

  @Post('/me/orders/:id/cancel')
  @ApiOperation({ title: 'Cancel Order' })
  @ApiResponse({ status: HttpStatus.OK, type: SuccessDTO })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.CLIENT)
  async cancelOrder(
    @Account() account: AccountEntity,
    @Param('id') id: number,
  ) {
    const query = { where: { createdById: account.id } };
    const resp = await this.orderService.cancelOrderForClient(account, id, query);
    this.emitter.emit('order_timeline', {
      orderId: id,
      actionAccountId: account.id,
      description: `Order status to changed to ${ORDER_STATUS.CANCELED} by ${account.firstName} ${account.lastName}`,
    });
    return resp;
  }

  @Post('/me/orders/:orderId/inspections/:id/viewed')
  @ApiOperation({ title: 'Mark inspection as viewed' })
  @ApiResponse({ status: HttpStatus.OK, type: SuccessDTO })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.CLIENT)
  async markInspectionAsViewed(
    @Param('orderId') orderId: number,
    @Param('id') id: number,
  ) {
    const query = { where: {} };
    return await this.inspectionService.markPickUpInspectionAsViewed(
      orderId,
      id,
      query,
    );
  }

  @Post('/me/orders/:orderId/sign-:inspectionType(delivery|pickup)')
  @ApiOperation({ title: 'Pickup inspection sign' })
  @ApiResponse({ status: HttpStatus.OK, type: SuccessDTO })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.CLIENT)
  async signPickUp(
    @Account() account: AccountEntity,
    @Param('orderId') orderId: number,
    @Body() data: SignPickUpRequest,
    @Param('inspectionType') inspectionType: string,
  ) {
    const query = { where: { createdById: account.id } };
    data.source = SOURCE_TYPE.CLIENT_APP;
    data.inspectionType = inspectionType;
    const resp = await this.orderService.signInspectionClient(orderId, data, query);
    this.emitter.emit('order_timeline', {
      orderId,
      actionAccountId: account.id,
      description: `Order inspection report signed by ${inspectionType} ${account.firstName} ${account.lastName}`,
    });
    return resp;
  }

  @Patch('/me/inspections/:id/delivery-damages')
  @ApiOperation({ title: 'Add delivery damages' })
  @ApiResponse({ status: HttpStatus.OK, type: SuccessDTO })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.CLIENT)
  async addDeliveryDamages(
    @Account() account: AccountEntity,
    @Param('id') inspectionId: number,
    @Body() data: DeliveryDamagesRequest,
  ) {
    const query = { where: {} };
    const inspection = await this.inspectionService.addInspectionDamages(
      inspectionId,
      data,
      query,
    );
    const driver = await this.orderService.getDriverByOrder(account, inspection.orderId);

    this.emitter.emit('notification', {
      type: DRIVER_NOTIFICATION_TYPES.ORDER_INSPECTIONS,
      actions: [],
      title: '',
      content: '',
      additionalInfo: inspection.orderId.toString(),
      targetUserId: driver.id,
    });

    return inspection;
  }

  @Patch('/me/orders/:id')
  @ApiOperation({ title: 'Edit Order' })
  @ApiResponse({ status: HttpStatus.OK, type: OrderDTO })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.CLIENT, ROLES.DISPATCHER)
  async patchCompanyOrder(
    @Account() account: AccountEntity,
    @Param('id') id: number,
    @Body() data: PatchOrderRequestDTO,
  ) {
    const query = { where: { createdById: account.id } };
    const resp = await this.orderService.patch(account, id, data, query);
    this.emitter.emit('order_timeline', {
      orderId: id,
      actionAccountId: account.id,
      description: `Order edit by ${account.firstName} ${account.lastName}`,
    });
    return resp;
  }

  @Patch('/me/quotes/:id')
  @ApiOperation({ title: 'Edit Quote' })
  @ApiResponse({ status: HttpStatus.OK, type: QuoteDTO })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.CLIENT)
  async patchClientQuote(
    @Account() account: AccountEntity,
    @Param('id') id: number,
    @Body() data: PatchQuoteRequest,
  ) {
    const query = { where: { createdById: account.id } };
    const quote = await this.quotesService.patch(account, id, data, query);
    return ClientScope.quote(quote);
  }

  @Delete('/:id')
  @ApiOperation({ title: 'Delete Order' })
  @ApiResponse({ status: HttpStatus.OK, type: SuccessDTO })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.CLIENT, ROLES.DISPATCHER)
  delete(@Account() account: AccountEntity, @Param('id') id: number) {
    const query = { where: { createdById: account.id } };
    return this.orderService.delete(account, id, query);
  }

  @Get('/me/cars/:carId/:inspectionType(delivery|pickup)-inspection')
  @ApiOperation({ title: 'Get car inspection for client' })
  @ApiResponse({ status: HttpStatus.OK, type: InspectionDTO })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: NotFoundDTO })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.CLIENT)
  getCarInspection(
    @Account() account: AccountEntity,
    @Param('carId') carId: number,
    @Param('inspectionType') inspectionType: string,
  ) {
    return this.inspectionService.getCarInspectionBasedOnOrder(carId, {
      where: { type: inspectionType },
    });
  }

  @Post('/me/cars/:carId/photo')
  @ApiOperation({ title: 'Add car photo' })
  @ApiResponse({ status: HttpStatus.OK, type: CarDTO })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: NotFoundDTO })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.CLIENT)
  addCarPhoto(
    @Account() account: AccountEntity,
    @Param('carId') carId: number,
    @Body('photoUrl') photoUrl: string,
  ) {
    return this.carService.addCarPhotoByClient(carId, account.id, photoUrl);
  }

  @Post('/me/orders/:orderId/inspection')
  @ApiOperation({ title: 'Create delivery inspection' })
  @ApiResponse({ status: HttpStatus.OK, isArray: true, type: InspectionDTO })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: NotFoundDTO })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.CLIENT)
  createDeliveryInspection(
    @Account() account: AccountEntity,
    @Param('orderId') orderId: number,
  ) {
    return this.orderService.createDeliveryInspection(orderId, account.id);
  }

  @Get('/me/orders/:orderId/:inspectionType(delivery|pickup)-inspections')
  @ApiOperation({ title: 'Get order inspections for client' })
  @ApiResponse({ status: HttpStatus.OK, type: InspectionDTO })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: NotFoundDTO })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.CLIENT)
  getOrderInspections(
    @Account() account: AccountEntity,
    @Query() query: GetList,
    @Query('status') statusName: string,
    @Param('orderId') orderId: number,
    @Param('inspectionType') inspectionType: string,
  ) {
    query = { ...query, where: { clientId: account.id, type: inspectionType } };
    if (statusName) {
      query.where.status = statusName;
    }
    return this.inspectionService.getInspectionsBasedOnOrder(orderId, query);
  }

  @Get('/me/orders/:orderId/driver-location')
  @ApiOperation({ title: 'Get driver location by order' })
  @ApiResponse({ status: HttpStatus.OK, type: DriverLocationPartialDTO })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: NotFoundDTO })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.CLIENT)
  async getDriverLocationByOrder(
    @Account() account: AccountEntity,
    @Param('orderId') orderId: number,
  ) {
    const driver = await this.orderService.getDriverByOrder(account, orderId);
    if (!driver) {
      return null;
    }
    const location = await this.driverLocationService.getLastLocation(
      driver.id,
    );

    return {
      ...driver,
      lat: location.lat,
      lon: location.lon,
    };
  }

  @Get('/settings')
  @ApiOperation({ title: 'Get service fee for client' })
  @ApiResponse({ status: HttpStatus.OK, type: { serviceAbsoluteFee: number } })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.CLIENT)
  getServiceFee() {
    return this.generalService.findServiceFee();
  }

  @Get('/me/orders/:orderId/timeline')
  @ApiOperation({ title: 'Get list timeline order' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: GetOrderTimelineListResponse,
  })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.CLIENT)
  async getTimelineOrder(
    @Account() account: AccountEntity,
    @Param('orderId') orderId: number,
    @Body() query: GetList,
  ) {

    return this.orderTimelineService.get(orderId, {
      ...query,
      where: {
        createdById: account.id,
      },
    });
  }

  @Get('/me/wallet')
  @ApiOperation({ title: 'Get wallet for client' })
  @ApiResponse({ status: HttpStatus.OK, type: WalletDTO })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.CLIENT)
  getWallet(@Account() account: AccountEntity) {
    return this.walletService.findWallet(account.id);
  }

  @Post('/me/wallet')
  @ApiOperation({ title: 'Create wallet for client' })
  @ApiResponse({ status: HttpStatus.OK, type: WalletDTO })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.CLIENT)
  addWallet(@Account() account: AccountEntity, @Body() data: WalletRequestDTO) {
    return this.walletService.addWallet(account, data);
  }

  @Patch('/me/wallet')
  @ApiOperation({ title: 'Get wallet for client' })
  @ApiResponse({ status: HttpStatus.OK, type: WalletDTO })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.CLIENT)
  editWallet(@Account() account: AccountEntity, @Body() data: WalletRequestDTO) {
    return this.walletService.editWallet(account, data);
  }

  @Delete('/me/wallet')
  @ApiOperation({ title: 'Delete wallet for client' })
  @ApiResponse({ status: HttpStatus.OK, type: SuccessDTO })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.CLIENT)
  removeWallet(@Account() account: AccountEntity) {
    return this.walletService.removeWallet(account.id);
  }

  @Get('/me/wallet/CreditCard')
  @Render('creditCard')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.CLIENT)
  async getTokenForCreditCard() {
    const token = await this.paymentService.getClientToken();
    return { ...token, domain: this.configService.apiDomain };
  }

  @Get('/me/wallet/ACH')
  @Render('aCH')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.CLIENT)
  async getTokenForACH(@Account() account: AccountEntity) {
    const token = await this.paymentService.getClientToken();
    return {
      ...token,
      domain: this.configService.apiDomain,
      firstName: account.firstName,
      lastName: account.lastName,
      postalCode: account.zip,
      city: account.city,
      state: account.state,
      address: account.address,
    };
  }

  @Get('/me/transactions')
  @ApiOperation({ title: 'Get transactions for client' })
  @ApiResponse({ status: HttpStatus.OK, type: GetTransactionListResponse })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.CLIENT)
  async getTtransactions(@Account() account: AccountEntity, @Query() query: GetTransactionListRequest) {
    return this.transactionService.getList({ ...query, clientId: account.id });
  }

  @Get('/me/file/:filename')
  @ApiOperation({ title: 'Get Url Sign' })
  @ApiResponse({ status: HttpStatus.OK, type: FileSignResponse })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.CLIENT)
  getFileSign(@Param('filename') filename: string) {
    return this.accountService.getFileSign(filename);
  }
}
