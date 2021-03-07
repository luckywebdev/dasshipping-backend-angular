import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiOperation, ApiResponse, ApiUseTags } from '@nestjs/swagger';
import { InjectEventEmitter } from 'nest-emitter';
import { IsNull, LessThan, Not } from 'typeorm';

import { ROLES } from '../../constants/roles.constant';
import { AccountDTO } from '../../dto/account.dto';
import { InspectionDTO } from '../../dto/inspection.dto';
import { OrderDTO } from '../../dto/order.dto';
import { OrderAttachmentDTO } from '../../dto/orderAttachment.dto';
import { OrderNoteDTO } from '../../dto/orderNote.dto';
import { SuccessDTO } from '../../dto/success.dto';
import { TripDTO } from '../../dto/trip.dto';
import { AccountEntity } from '../../entities/account.entity';
import { ORDER_SOURCE } from '../../entities/order.entity';
import { ORDER_STATUS } from '../../entities/orderBase.entity';
import { FileDTO } from '../../file/dto/upload/file.dto';
import { FileUploadResponse } from '../../file/dto/upload/response.dto';
import { Account } from '../account/account.decorator';
import { AccountService } from '../account/account.service';
import { GetAccountsListResponse } from '../account/dto/list/response.dto';
import { PatchUserRequest } from '../account/dto/patch/request.dto';
import { Roles } from '../auth/guards/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guart';
import { CompanyService } from '../company/company.service';
import { GetCompanyResponse } from '../company/dto/get/response.dto';
import { SendInvoiceRequestDTO } from '../company/dto/sendInvoiceRequest.dto';
import { DriverLocationService } from '../driverLocation/driverLocation.service';
import { GetListLocations } from '../driverLocation/get/request.dto';
import { GetLocationsListResponse } from '../driverLocation/get/response.dto';
import { BadRequestDTO } from '../dto/badRequest.dto';
import { NotFoundDTO } from '../dto/notFound.dto';
import { GetList } from '../dto/requestList.dto';
import { SuccessResponseDTO } from '../dto/successResponse.dto';
import { AppEventEmitter } from '../event/app.events';
import { InspectionService } from '../inspection/inspection.service';
import { OrderCreateRequest } from '../order/dto/create/request.dto';
import { EditOrderRequestDTO } from '../order/dto/edit-web-roles/request.dto';
import { GetOrdersListResponse } from '../order/dto/list/response.dto';
import { SearchOrdersRequestDTO } from '../order/dto/list/search.dto';
import { ImportOrderService } from '../order/import.service';
import { OrderService } from '../order/order.service';
import { GetOrderAttachmentListResponse } from '../orderAttachment/dto/get/response.dto';
import { AddAttachmentToOrderRequest } from '../orderAttachment/dto/post/request.dto';
import { OrderAttachmentService } from '../orderAttachment/orderAttachment.service';
import { GetOrderNotesRequest } from '../orderNote/dto/get/request.dto';
import { GetOrderNotesListResponse } from '../orderNote/dto/get/response.dto';
import { CreateOrderNoteDTO } from '../orderNote/dto/post/request.dto';
import { OrderNoteService } from '../orderNote/orderNote.service';
import { GetOrderTimelineListResponse } from '../orderTimeline/dto/get/response.dto';
import { OrderTimelineService } from '../orderTimeline/orderTimeline.service';
import { CompanyScope } from '../shared/scopes/company';
import { TripAssignOrderRequest } from '../trip/dto/assing-order/request.dto';
import { TripCreateRequest } from '../trip/dto/create/request.dto';
import { TripDeleteOrderRequest } from '../trip/dto/delete-order/request.dto';
import { GetTripsRequest } from '../trip/dto/list/request.dto';
import { GetTripsListResponse } from '../trip/dto/list/response.dto';
import { TripEditRequest } from '../trip/dto/patch/request.dto';
import { CalculateRouteTripRequestDTO } from '../trip/dto/save-route/request.dto';
import { TripService } from '../trip/trip.service';

@ApiUseTags('dispatchers')
@Controller('/dispatchers')
export class DispatcherController {
  constructor(
    private readonly tripService: TripService,
    private readonly orderService: OrderService,
    private readonly accountService: AccountService,
    private readonly inspectionService: InspectionService,
    private readonly companyService: CompanyService,
    private readonly driverLocationService: DriverLocationService,
    private readonly orderNoteService: OrderNoteService,
    private readonly orderAttachmentService: OrderAttachmentService,
    private readonly orderTimelineService: OrderTimelineService,
    private readonly importOrderService: ImportOrderService,
    @InjectEventEmitter() private readonly emitter: AppEventEmitter,
  ) { }

  @Get('/me/trips')
  @ApiOperation({ title: 'Get all your trips' })
  @ApiResponse({ status: HttpStatus.OK, type: GetTripsListResponse })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.DISPATCHER)
  async getTrips(
    @Account() account: AccountEntity,
    @Query() query: GetTripsRequest,
  ) {
    query.where = {
      companyId: account.companyId,
      dispatcherId: account.id,
    };
    return await this.tripService.getList(query);
  }

  @Get('/me/drivers')
  @ApiOperation({ title: 'Get Drivers List' })
  @ApiResponse({ status: HttpStatus.OK, type: GetAccountsListResponse })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.DISPATCHER)
  getAccountsList(@Account() account: AccountEntity, @Query() query: GetList) {
    query = {
      ...query,
      where: { dispatcherId: account.id, roleId: ROLES.DRIVER },
    };
    return this.accountService.getAccountsList(account, query);
  }

  @Get('/me/orders')
  @ApiOperation({ title: 'Get all your orders' })
  @ApiResponse({ status: HttpStatus.OK, type: GetOrdersListResponse })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.DISPATCHER)
  async getCompanyOrders(
    @Account() account: AccountEntity,
    @Query() query: SearchOrdersRequestDTO,
  ) {
    query = { ...query, where: { dispatcherId: account.id } };
    const { data, count } = await this.orderService.getCompanyOrders(
      account,
      query,
    );
    return { data: CompanyScope.orders(data), count };
  }

  @Get('/me/orders/:id')
  @ApiOperation({ title: 'Get Order Details' })
  @ApiResponse({ status: HttpStatus.OK, type: OrderDTO })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.DISPATCHER)
  async getOrder(
    @Account() account: AccountEntity,
    @Param('id') id: number,
    @Query('include') include: string,
  ) {
    const query = {
      where: {
        companyId: account.companyId,
        dispatcherId: account.id,
        hiddenForCompnay: false
      },
    };
    const order = await this.orderService.getOrder(id, include, query);
    return CompanyScope.order(order);
  }

  @Get('/me/load-board/new-loads')
  @ApiOperation({ title: 'Get all your orders not assigned' })
  @ApiResponse({ status: HttpStatus.OK, type: GetOrdersListResponse })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.DISPATCHER)
  async getCompanyOrdersNewLoads(
    @Account() account: AccountEntity,
    @Query() query: SearchOrdersRequestDTO,
  ) {
    const { data, count } = await this.orderService.getCompanyOrdersNewLoads(
      account,
      query,
    );

    const ordersList = query.grouped
      ? data.map(orders => CompanyScope.orders(orders))
      : CompanyScope.orders(data);

    return { data: ordersList, count };
  }

  @Get('/me/load-board/past-due')
  @ApiOperation({ title: 'Get all your orders past due' })
  @ApiResponse({ status: HttpStatus.OK, type: GetOrdersListResponse })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.DISPATCHER)
  async getCompanyOrdersPastDue(
    @Account() account: AccountEntity,
    @Query() query: SearchOrdersRequestDTO,
  ) {
    const { data, count } = await this.orderService.getCompanyAssignedOrders(account.id, {
      ...query,
      where: {
        companyId: account.companyId,
        dispatcherId: account.id,
        invoiceUrl: Not(IsNull()),
        invoiceDueDate: LessThan('NOW()'),
        status: Not(ORDER_STATUS.PAID),
      },
    });
    return { data: CompanyScope.orders(data), count };
  }

  @Get('/me/load-board/:condition')
  @ApiOperation({ title: 'Get all your orders declined' })
  @ApiResponse({ status: HttpStatus.OK, type: GetOrdersListResponse })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.DISPATCHER)
  async getCompanyOrdersDeclined(
    @Account() account: AccountEntity,
    @Query() query: SearchOrdersRequestDTO,
    @Param('condition') condition: string,
  ) {
    const { data, count } = await this.orderService.getCompanyOrdersAssigned(
      account.id,
      {
        ...query,
        where: { companyId: account.companyId, dispatcherId: account.id },
      },
      condition,
    );
    return { data: CompanyScope.orders(data), count };
  }

  @Get('/me/trips/:tripId/orders')
  @ApiOperation({ title: 'Get Orders for trip' })
  @ApiResponse({ status: HttpStatus.OK, type: GetOrdersListResponse })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.DISPATCHER)
  async getCompanyOrder(
    @Account() account: AccountEntity,
    @Query() query: GetList,
    @Param('tripId') tripId: number,
  ) {
    const trip = await this.tripService.getCount({
      id: tripId,
      dispatcherId: account.id,
      companyId: account.companyId,
    });
    if (!trip) {
      throw new BadRequestException(`Trip not found for id ${tripId}`);
    }
    query = { ...query, where: { tripId } };
    const { data, count } = await this.orderService.getOrders(account, query);
    return { data: CompanyScope.orders(data), count };
  }

  @Post('/me/trips')
  @ApiOperation({ title: 'Create Trip' })
  @ApiResponse({ status: HttpStatus.OK, type: TripDTO })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.DISPATCHER)
  async createTrip(
    @Account() account: AccountEntity,
    @Body() data: TripCreateRequest,
  ) {
    data = {
      ...data,
      companyId: account.companyId,
      createdById: account.id,
      dispatcherId: account.id,
    };
    return await this.tripService.create(data);
  }

  @Get('/me/company')
  @ApiOperation({ title: 'Get dispatcher company' })
  @ApiResponse({ status: HttpStatus.OK, type: GetCompanyResponse })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.DISPATCHER)
  async getDispatcherCompany(@Account() account: AccountEntity) {
    return await this.companyService.getCompany(account.companyId);
  }

  @Patch('/me/trips/:id')
  @ApiOperation({ title: 'Edit Trip' })
  @ApiResponse({ status: HttpStatus.OK, type: TripDTO })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.DISPATCHER)
  async patchTrip(
    @Account() account: AccountEntity,
    @Body() data: TripEditRequest,
    @Param('id') id: number,
  ) {
    const where = {
      companyId: account.companyId,
      dispatcherId: account.id,
      id,
    };
    return await this.tripService.patch(data, where);
  }

  @Patch('/me/trips/:id/route')
  @ApiOperation({ title: 'Edit Trip' })
  @ApiResponse({ status: HttpStatus.OK, type: TripDTO })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.DISPATCHER)
  async patchTripRoute(
    @Account() account: AccountEntity,
    @Body() body: CalculateRouteTripRequestDTO,
    @Param('id') id: number,
  ) {
    const where = {
      companyId: account.companyId,
      dispatcherId: account.id,
      id,
    };
    return await this.tripService.calculateRoute(body, where);
  }

  @Patch('/me/trips/:tripId/assign-order')
  @ApiOperation({ title: 'Assign order to trip' })
  @ApiResponse({ status: HttpStatus.OK, type: TripDTO })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.DISPATCHER)
  async updateOrder(
    @Account() account: AccountEntity,
    @Param('tripId') tripId: number,
    @Body() data: TripAssignOrderRequest,
  ) {
    const resp = await this.orderService.assignOrder(data.orderId, {
      id: tripId,
      companyId: account.companyId,
      dispatcherId: account.id,
    });
    this.emitter.emit('order_timeline', {
      orderId: data.orderId,
      actionAccountId: account.id,
      description: `Order added to Trip #${tripId} by ${account.firstName} ${account.lastName}`,
    });
    return resp;
  }

  @Patch('/me/trips/:id/:action')
  @ApiOperation({ title: 'Change trip state' })
  @ApiResponse({ status: HttpStatus.OK, type: TripDTO })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.DISPATCHER)
  async changeState(
    @Account() account: AccountEntity,
    @Param('id') id: number,
    @Param('action') action: string,
    @Body('driverId') driverId?: number,
  ) {
    const where = {
      companyId: account.companyId,
      dispatcherId: account.id,
      id,
    };
    return await this.tripService.doAction(action, where, driverId);
  }

  @Delete('/me/trips')
  @ApiOperation({ title: 'Delete Trips' })
  @ApiResponse({ status: HttpStatus.OK, type: SuccessDTO })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.DISPATCHER)
  async deleteTrip(
    @Account() account: AccountEntity,
    @Body('ids') ids: number[],
  ) {
    const where = { companyId: account.companyId, dispatcherId: account.id };
    return await this.tripService.delete(where, ids);
  }

  @Get('/me/cars/:carId/:inspectionType(delivery|pickup)-inspection')
  @ApiOperation({ title: 'Get car inspection for dispatcher' })
  @ApiResponse({ status: HttpStatus.OK, type: InspectionDTO })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: NotFoundDTO })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.DISPATCHER)
  getCarInspection(
    @Account() account: AccountEntity,
    @Param('carId') carId: number,
    @Param('inspectionType') inspectionType: string,
  ) {
    return this.inspectionService.getCarInspectionBasedOnOrder(carId, {
      where: { dispatcherId: account.dispatcherId, type: inspectionType },
    });
  }

  @Get('/me/orders/:orderId/:inspectionType(delivery|pickup)-inspections')
  @ApiOperation({ title: 'Get order inspections for dispatcher' })
  @ApiResponse({ status: HttpStatus.OK, type: InspectionDTO })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: NotFoundDTO })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.DISPATCHER)
  getOrderInspections(
    @Account() account: AccountEntity,
    @Query() query: GetList,
    @Query('status') statusName: string,
    @Param('orderId') orderId: number,
    @Param('inspectionType') inspectionType: string,
  ) {
    query = {
      ...query,
      where: { dispatcherId: account.dispatcherId, type: inspectionType },
    };
    if (statusName) {
      query.where.status = statusName;
    }
    return this.inspectionService.getInspectionsBasedOnOrder(orderId, query);
  }

  @Get('/me/accounts/:id')
  @ApiOperation({ title: 'Get account for dispatcher' })
  @ApiResponse({ status: HttpStatus.OK, type: AccountDTO })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: NotFoundDTO })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.DISPATCHER)
  getCompanyAccount(
    @Account() account: AccountEntity,
    @Param('id') accountId: number,
  ) {
    return this.accountService.getAccount(accountId, {
      where: { dispatcherId: account.id },
    });
  }

  @Post('/me/orders/:orderId/cancel')
  @ApiOperation({ title: 'Cancel order for dispatcher' })
  @ApiResponse({ status: HttpStatus.OK, type: SuccessDTO })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: NotFoundDTO })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.DISPATCHER)
  async cancelOrder(
    @Account() account: AccountEntity,
    @Param('orderId') orderId: number,
  ) {
    const query = { where: { dispatcherId: account.id } };
    const resp = await this.orderService.cancelOrder(account, orderId, query);
    // this.emitter.emit('order_timeline', {
    //   orderId,
    //   actionAccountId: account.id,
    //   description: `Order canceled by ${account.company.name}`,
    // });
    return resp;
  }

  @Delete('/me/orders/:orderId')
  @ApiOperation({ title: 'Delete order for dispetcher' })
  @ApiResponse({ status: HttpStatus.OK, type: SuccessDTO })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: NotFoundDTO })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.DISPATCHER)
  async deleteOrder(
    @Account() account: AccountEntity,
    @Param('orderId') orderId: number,
  ) {
    const query = { where: { companyId: account.companyId, status: ORDER_STATUS.CANCELED } };
    const resp = await this.orderService.deleteOrder(orderId, query);
    return resp;
  }

  @Get('me/drivers')
  @ApiOperation({ title: `Get dispatcher's drivers` })
  @ApiResponse({ status: HttpStatus.OK, type: GetAccountsListResponse })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: BadRequestDTO })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.DISPATCHER)
  getLinkedDrivers(@Account() account: AccountEntity, @Query() query: GetList) {
    query = { ...query, where: { companyId: account.companyId } };
    return this.accountService.getDispatcherDrivers(account.id, query);
  }

  @Patch('me/driver/:id')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.DISPATCHER)
  @ApiOperation({ title: 'Edit Account Profile' })
  @ApiResponse({ status: HttpStatus.OK, type: AccountDTO })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
  patchAccount(
    @Account() account: AccountEntity,
    @Param('id') id: number,
    @Body() data: PatchUserRequest,
  ) {
    return this.accountService.patch(data, id, {
      where: { companyId: account.companyId, status: ROLES.DRIVER },
    });
  }

  @Get('/me/drivers/:id/locations')
  @ApiOperation({ title: 'Get locations for a driver' })
  @ApiResponse({ status: HttpStatus.OK, type: GetLocationsListResponse })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.DISPATCHER)
  async getLocationsDriver(
    @Account() account: AccountEntity,
    @Query() query: GetListLocations,
    @Param('id') id: number,
  ) {
    return this.driverLocationService.getList(query, id, {
      companyId: account.companyId,
      dispatcherId: account.id,
    });
  }

  @Post('/me/load-board/:orderId/cancel')
  @ApiOperation({ title: 'Cancel order for carrier' })
  @ApiResponse({ status: HttpStatus.OK, type: SuccessDTO })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: NotFoundDTO })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.DISPATCHER)
  async cancelLoadBoard(
    @Account() account: AccountEntity,
    @Param('orderId') orderId: number,
  ) {
    const resp = await this.orderService.cancelRequestDispatch(
      orderId,
      account.companyId,
    );
    this.emitter.emit('order_timeline', {
      orderId,
      actionAccountId: account.id,
      description: `Order request to dispatch canceled by ${account.company.name}`,
    });
    return resp;
  }

  @Get('/me/drivers-location')
  @ApiOperation({ title: 'Get last location for a drivers' })
  @ApiResponse({ status: HttpStatus.OK, isArray: true, type: AccountDTO })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.DISPATCHER)
  async getLastLocationDrivers(@Account() account: AccountEntity) {
    return this.accountService.getDriversLastLocation({
      companyId: account.companyId,
      roleId: ROLES.DRIVER,
      dispatcherId: account.id,
    });
  }

  @Get('/me/orders/:orderId/notes')
  @ApiOperation({ title: 'Get dispatcher order notes' })
  @ApiResponse({
    status: HttpStatus.OK,
    isArray: true,
    type: GetOrderNotesListResponse,
  })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.DISPATCHER)
  async getOrderNotes(
    @Account() account: AccountEntity,
    @Param('orderId') orderId: number,
    @Query() query: GetOrderNotesRequest,
  ) {
    query = {
      ...query,
      where: { companyId: account.companyId, dispatcherId: account.id },
    };
    return this.orderNoteService.getOrderNotes(orderId, query);
  }

  @Delete('/me/trips/:tripId/orders')
  @ApiOperation({ title: 'Assign order to trip' })
  @ApiResponse({ status: HttpStatus.OK, type: TripDTO })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.DISPATCHER)
  async deleteFromTrip(
    @Account() account: AccountEntity,
    @Param('tripId') tripId: number,
    @Body() data: TripDeleteOrderRequest,
  ) {
    const { orderIds } = data;
    return await this.orderService.deleteFromTrip(orderIds, {
      id: tripId,
      companyId: account.companyId,
      dispatcherId: account.id,
    });
  }

  @Get('/me/trips/:id')
  @ApiOperation({ title: 'Edit Trip' })
  @ApiResponse({ status: HttpStatus.OK, type: TripDTO })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.DISPATCHER)
  async getTrip(@Account() account: AccountEntity, @Param('id') id: number) {
    const where = { companyId: account.companyId, id };
    return await this.tripService.get(where);
  }

  @Post('/me/orders/:orderId/notes')
  @ApiOperation({ title: 'Create order note' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: OrderNoteDTO,
  })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.DISPATCHER)
  async createOrderNote(
    @Account() account: AccountEntity,
    @Param('orderId') orderId: number,
    @Body() data: CreateOrderNoteDTO,
  ) {
    data = { orderId, accountId: account.id, ...data };
    const query = {
      id: orderId,
      companyId: account.companyId,
      dispatcherId: account.id,
    };
    return this.orderNoteService.post(data, query);
  }

  @Post('/me/orders/:orderId/attachments')
  @ApiOperation({ title: 'Add attachment to order' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: OrderAttachmentDTO,
  })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.DISPATCHER)
  async addAttachmentOrder(
    @Account() account: AccountEntity,
    @Param('orderId') orderId: number,
    @Body() data: AddAttachmentToOrderRequest,
  ) {
    data = { orderId, ...data };
    const query = {
      id: orderId,
      companyId: account.companyId,
      dispatcherId: account.id,
    };
    return this.orderAttachmentService.post({ ...data, createdById: account.id }, query);
  }

  @Delete('/me/orders/:orderId/attachments/:id')
  @ApiOperation({ title: 'Remove attachment to order' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SuccessDTO,
  })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.DISPATCHER)
  async removeAttachmentOrder(
    @Account() account: AccountEntity,
    @Param('orderId') orderId: number,
    @Param('id') id: number,
  ) {
    return this.orderAttachmentService.delete(
      { id: orderId, companyId: account.companyId, dispatcherId: account.id },
      { orderId, id },
    );
  }

  @Get('/me/orders/:orderId/attachments')
  @ApiOperation({ title: 'Get list attachments order' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: GetOrderAttachmentListResponse,
  })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.DISPATCHER)
  async getAttachmentsOrder(
    @Account() account: AccountEntity,
    @Param('orderId') orderId: number,
    @Body() query: GetList,
  ) {
    return this.orderAttachmentService.get(orderId, {
      ...query,
      where: { companyId: account.companyId, dispatcherId: account.id },
    });
  }

  @Get('/me/orders/:orderId/timeline')
  @ApiOperation({ title: 'Get list timeline order' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: GetOrderTimelineListResponse,
  })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.DISPATCHER)
  async getTimelineOrder(
    @Account() account: AccountEntity,
    @Param('orderId') orderId: number,
    @Body() query: GetList,
  ) {
    return this.orderTimelineService.get(orderId, {
      ...query,
      where: { companyId: account.companyId, dispatcherId: account.id },
    });
  }

  @Post('/me/orders/:orderId/send-bol')
  @ApiOperation({ title: 'Send Order BOL' })
  @ApiResponse({ status: HttpStatus.OK, type: SuccessResponseDTO })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: NotFoundDTO })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.DISPATCHER)
  sendBOL(
    @Account() account: AccountEntity,
    @Body('email') email: string,
    @Param('orderId') orderId: number,
  ) {
    return this.orderService.sendBOL(orderId, email, {
      where: { companyId: account.companyId, dispatcherId: account.id },
    });
  }

  @Post('/me/orders/:orderId/send-invoice')
  @ApiOperation({ title: 'Send Order Invoice' })
  @ApiResponse({ status: HttpStatus.OK, type: SuccessResponseDTO })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: NotFoundDTO })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.DISPATCHER)
  sendInvoice(
    @Account() account: AccountEntity,
    @Param('orderId') orderId: number,
    @Body() data: SendInvoiceRequestDTO,
  ) {
    return this.orderService.sendInvoice(orderId, data, {
      where: { companyId: account.companyId, dispatcherId: account.id },
    });
  }

  @Get('/me/orders/:orderId/bol')
  @ApiOperation({ title: 'Get Order BOL' })
  @ApiResponse({ status: HttpStatus.OK, type: SuccessResponseDTO })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: NotFoundDTO })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.DISPATCHER)
  getBOL(
    @Account() account: AccountEntity,
    @Param('orderId') orderId: number,
  ) {
    return this.orderService.getBOLLink(orderId, {
      where: { companyId: account.companyId, dispatcherId: account.id },
    });
  }

  @Get('/me/orders/:orderId/invoice')
  @ApiOperation({ title: 'Get Order BOL' })
  @ApiResponse({ status: HttpStatus.OK, type: SuccessResponseDTO })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: NotFoundDTO })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.DISPATCHER)
  getInvoice(
    @Account() account: AccountEntity,
    @Param('orderId') orderId: number,
  ) {
    return this.orderService.getInvoiceLink(orderId, {
      where: { companyId: account.companyId, dispatcherId: account.id },
    });
  }

  @Get('/me/orders/:orderId/receipt')
  @ApiOperation({ title: 'Get Order Receipt' })
  @ApiResponse({ status: HttpStatus.OK, type: SuccessResponseDTO })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: NotFoundDTO })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.DISPATCHER)
  getReceipt(
    @Account() account: AccountEntity,
    @Param('orderId') orderId: number,
  ) {
    return this.orderService.getReceiptLink(orderId, {
      where: { companyId: account.companyId, dispatcherId: account.id },
    });
  }

  @Post('/me/orders/:orderId/send-receipt')
  @ApiOperation({ title: 'Send Order Receipt' })
  @ApiResponse({ status: HttpStatus.OK, type: SuccessResponseDTO })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: NotFoundDTO })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.DISPATCHER)
  sendReceipt(
    @Account() account: AccountEntity,
    @Body('email') email: string,
    @Param('orderId') orderId: number,
  ) {
    return this.orderService.sendReceipt(orderId, email, {
      where: { companyId: account.companyId, dispatcherId: account.id },
    });
  }

  @Patch('/me/orders/:id')
  @ApiOperation({ title: 'Edit Order' })
  @ApiResponse({ status: HttpStatus.OK, type: OrderDTO })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.DISPATCHER)
  async patchCompanyOrder(
    @Account() account: AccountEntity,
    @Param('id') id: number,
    @Body() data: EditOrderRequestDTO,
  ) {
    const query = {
      where: { companyId: account.companyId, dispatcherId: account.id, source: Not(ORDER_SOURCE.INTERNAL) },
    };
    const resp = await this.orderService.patch(account, id, data, query);
    this.emitter.emit('order_timeline', {
      orderId: id,
      actionAccountId: account.id,
      description: `Order edit by ${account.firstName} ${account.lastName}`,
    });
    return resp;
  }

  @Post('/me/orders/:orderId/mark-paid')
  @ApiOperation({ title: 'MArk Order as paid' })
  @ApiResponse({ status: HttpStatus.OK, type: SuccessResponseDTO })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: NotFoundDTO })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.DISPATCHER)
  async markPaid(
    @Account() account: AccountEntity,
    @Body('paymentMethod') paymentMethod: string,
    @Param('orderId') orderId: number,
  ) {
    const resp = await this.orderService.markPaid(orderId, paymentMethod, {
      where: {
        companyId: account.companyId,
        dispatcherId: account.id,
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

  @Post('/me/orders/:orderId/archive')
  @ApiOperation({ title: 'Archive Order' })
  @ApiResponse({ status: HttpStatus.OK, type: SuccessResponseDTO })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: NotFoundDTO })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.DISPATCHER)
  archiveOrder(
    @Account() account: AccountEntity,
    @Param('orderId') orderId: number,
  ) {
    return this.orderService.archiveOrder(account, orderId, {
      where: { companyId: account.companyId, dispatcherId: account.id },
    });
  }

  @Post('/me/orders/import')
  @UseInterceptors(FileInterceptor('order'))
  @ApiOperation({ title: 'Import single order' })
  @ApiResponse({ status: HttpStatus.OK, type: FileUploadResponse })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.DISPATCHER)
  async uploadOrderPdf(
    @Account() account: AccountEntity,
    @UploadedFile() file: FileDTO,
  ) {
    const orderParser = await this.importOrderService.import(file);

    return await this.orderService.saveImportedOrder(
      account,
      file,
      orderParser,
      null,
    );
  }

  @Post('/me/orders')
  @ApiOperation({ title: 'Create Order' })
  @ApiResponse({ status: HttpStatus.OK, type: OrderDTO })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.DISPATCHER)
  post(@Account() account: AccountEntity, @Body() data: OrderCreateRequest) {
    return this.orderService.createOrder(account, data);
  }
}
