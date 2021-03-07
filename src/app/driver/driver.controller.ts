import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiOperation, ApiResponse, ApiUseTags } from '@nestjs/swagger';
import { InjectEventEmitter } from 'nest-emitter';

import { ROLES } from '../../constants/roles.constant';
import { CarDTO } from '../../dto/car.dto';
import { CompanyDTO } from '../../dto/company.dto';
import { DriverLocationDTO } from '../../dto/driverLocation.dto';
import { InspectionDTO } from '../../dto/inspection.dto';
import { CLIENT_NOTIFICATION_TYPES } from '../../dto/notification.dto';
import { OrderDTO } from '../../dto/order.dto';
import { SOURCE_TYPE } from '../../dto/signedBy.dto';
import { SuccessDTO } from '../../dto/success.dto';
import { AccountEntity } from '../../entities/account.entity';
import { ORDER_STATUS } from '../../entities/orderBase.entity';
import { Account } from '../account/account.decorator';
import { Roles } from '../auth/guards/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guart';
import { CarService } from '../car/car.service';
import { DeliveryDamagesRequest } from '../client/dto/patch/deliveryDamages.dto';
import { SignPickUpRequest } from '../client/dto/post/requestSignPickUp.dto';
import { CompanyService } from '../company/company.service';
import { CreateDriverLocationRequestDTO } from '../driverLocation/create/createDriverLocationRequest';
import { DriverLocationService } from '../driverLocation/driverLocation.service';
import { BadRequestDTO } from '../dto/badRequest.dto';
import { NotFoundDTO } from '../dto/notFound.dto';
import { GetList } from '../dto/requestList.dto';
import { SuccessResponseDTO } from '../dto/successResponse.dto';
import { AppEventEmitter } from '../event/app.events';
import { InspectionService } from '../inspection/inspection.service';
import { GetOrdersListResponse } from '../order/dto/list/response.dto';
import { OrderService } from '../order/order.service';
import { GetOrderAttachmentListResponse } from '../orderAttachment/dto/get/response.dto';
import { OrderAttachmentService } from '../orderAttachment/orderAttachment.service';
import { GetOrderTimelineListResponse } from '../orderTimeline/dto/get/response.dto';
import { OrderTimelineService } from '../orderTimeline/orderTimeline.service';
import { DriverScope } from '../shared/scopes/driver';
import { GetTripsRequest } from '../trip/dto/list/request.dto';
import { GetTripsListResponse } from '../trip/dto/list/response.dto';
import { TripService } from '../trip/trip.service';
import { DriverToPickUpRequestDTO } from './dto/toPickUp.dto';
import { Not } from 'typeorm';

@ApiUseTags('drivers')
@Controller('/drivers')
export class DriverController {
  constructor(
    private readonly tripService: TripService,
    private readonly orderService: OrderService,
    private readonly inspectionService: InspectionService,
    private readonly driverLocationService: DriverLocationService,
    private readonly carService: CarService,
    @InjectEventEmitter() private readonly emitter: AppEventEmitter,
    private readonly orderAttachmentService: OrderAttachmentService,
    private readonly orderTimelineService: OrderTimelineService,
    private readonly companyService: CompanyService,
  ) { }

  @Get('/me/trips')
  @ApiOperation({ title: 'Get all your trips' })
  @ApiResponse({ status: HttpStatus.OK, type: GetTripsListResponse })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.DRIVER)
  async getTrips(
    @Account() account: AccountEntity,
    @Query() query: GetTripsRequest,
  ) {
    query = {
      ...query,
      where: {
        status: query.status || 'active',
        driverId: account.id,
      },
    };
    return await this.tripService.getList(query);
  }

  @Get('/me/trips/:tripId/orders')
  @ApiOperation({ title: 'Get Orders for a trip' })
  @ApiResponse({ status: HttpStatus.OK, type: GetOrdersListResponse })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.DRIVER)
  async getDriverOrdersByTrip(
    @Account() account: AccountEntity,
    @Query() query: GetList,
    @Param('tripId') tripId: number,
  ) {
    const trip = await this.tripService.getCount({
      id: tripId,
      driverId: account.id,
    });
    if (!trip) {
      throw new BadRequestException(`Trip not found for id ${tripId}`);
    }
    query = { ...query, where: { tripId, status: Not(ORDER_STATUS.ARCHIVED) } };
    const { data, count } = await this.orderService.getOrders(account, query);
    return { data: DriverScope.orders(data), count };
  }

  @Get('/me/company/docs')
  @ApiOperation({ title: 'Get Orders for a trip' })
  @ApiResponse({ status: HttpStatus.OK, type: CompanyDTO })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.DRIVER)
  async getCompanyDocs(@Account() account: AccountEntity) {
    if (!account.companyId) {
      throw new ForbiddenException(`You do not have access to this docs company`);
    }

    return this.companyService.getCompanyFiles(account.companyId);
  }

  @Get('/me/orders/:orderId')
  @ApiOperation({ title: 'Get Order for a trip' })
  @ApiResponse({ status: HttpStatus.OK, type: OrderDTO })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.DRIVER)
  async getDriverOrder(
    @Account() account: AccountEntity,
    @Param('orderId') orderId: number,
  ) {
    const count = await this.orderService.isAssignToDriver(orderId, account.id);

    if (!count) {
      throw new ForbiddenException(`You do not have access to this order`);
    }

    const data = await this.orderService.getOrder(orderId, 'pickLocation,deliveryLocation,createdBy,sender,receiver,cars,inspections,orderTrips');
    return DriverScope.order(data);
  }

  @Post(
    '/me/orders/:orderId/request-:inspectionType(pickup|delivery)-inspection-signature',
  )
  @ApiOperation({ title: 'Request inspection signature for order' })
  @ApiResponse({ status: HttpStatus.OK, type: SuccessResponseDTO })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: NotFoundDTO })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.DRIVER)
  async requestInspectionSignature(
    @Account() account: AccountEntity,
    @Param('orderId') orderId: number,
    @Param('inspectionType') inspectionType: string,
    @Body('requestSignature') requestSignature: boolean = false,
  ) {
    const resp = await this.orderService.requestInspectionSignature(
      orderId,
      account,
      inspectionType,
      requestSignature,
    );
    this.emitter.emit('order_timeline', {
      orderId,
      actionAccountId: account.id,
      description: `Request to sign ${inspectionType} confirmation by ${account.firstName} ${account.lastName}`,
    });
    return resp;
  }

  @Post('/me/orders/:orderId/sign-:inspectionType(delivery|pickup)')
  @ApiOperation({ title: 'Pickup inspection sign' })
  @ApiResponse({ status: HttpStatus.OK, type: SuccessDTO })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.DRIVER)
  async signPickUp(
    @Account() account: AccountEntity,
    @Param('orderId') orderId: number,
    @Param('inspectionType') inspectionType: string,
    @Body() data: SignPickUpRequest,
  ) {
    data.source = SOURCE_TYPE.DRIVER_APP;
    data.inspectionType = inspectionType;
    const resp = await this.orderService.signInspectionDriverApp(
      orderId,
      account,
      data,
    );
    this.emitter.emit('order_timeline', {
      orderId,
      actionAccountId: account.id,
      description: `Order inspection report signed by ${inspectionType} ${account.firstName} ${account.lastName}`,
    });
    return resp;
  }

  @Patch('/me/inspections/:id/delivery-damages')
  @ApiOperation({ title: 'Add delivery damages' })
  @ApiResponse({ status: HttpStatus.OK, type: InspectionDTO })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.DRIVER)
  async addDeliveryDamages(
    @Account() account: AccountEntity,
    @Param('id') inspectionId: number,
    @Body() data: DeliveryDamagesRequest,
  ) {
    const query = { where: { driverId: account.id } };
    const inspection = await this.inspectionService.addInspectionDamages(
      inspectionId,
      data,
      query,
    );

    const order = await this.orderService.getOrder(inspection.orderId, '');
    this.emitter.emit('notification', {
      type: CLIENT_NOTIFICATION_TYPES.ORDER_INSPECTIONS,
      actions: [],
      title: '',
      content: '',
      additionalInfo: inspection.orderId.toString(),
      targetUserId: order.createdById,
    });

    return inspection;
  }

  @Post('/me/orders/:orderId/decline')
  @ApiOperation({ title: 'Driver decline an order' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: NotFoundDTO })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.DRIVER)
  async declineOrder(
    @Account() account: AccountEntity,
    @Param('orderId') orderId: number,
    @Body('reason') reason: string,
  ) {
    const resp = await this.orderService.decline(orderId, account.id, reason);
    this.emitter.emit('order_timeline', {
      orderId,
      actionAccountId: account.id,
      description: `Order status to changed to ${ORDER_STATUS.DECLINED} by ${account.firstName} ${account.lastName}`,
    });
    return resp;
  }

  @Post('/me/orders/:orderId/:action')
  @ApiOperation({ title: 'Pick up an order' })
  @ApiResponse({ status: HttpStatus.OK, type: SuccessResponseDTO })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: NotFoundDTO })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.DRIVER)
  async changeOrderAction(
    @Account() account: AccountEntity,
    @Param('orderId') orderId: number,
    @Param('action') action: string,
  ) {
    const resp = await this.orderService.changeOrderAction(
      account,
      orderId,
      action,
    );
    this.emitter.emit('order_timeline', {
      orderId,
      actionAccountId: account.id,
      description: `Order status to changed to ${action.replace(/\_/g, ' ')} by ${account.firstName} ${account.lastName}`,
    });
    return resp;
  }

  @Get('/me/cars/:carId/:inspectionType(delivery|pickup)-inspection')
  @ApiOperation({ title: 'Get car inspection for driver' })
  @ApiResponse({ status: HttpStatus.OK, type: InspectionDTO })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: NotFoundDTO })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.DRIVER)
  getCarInspection(
    @Account() account: AccountEntity,
    @Param('carId') carId: number,
    @Param('inspectionType') inspectionType: string,
  ) {
    const query = {
      where: { driverId: account.id, type: inspectionType },
    };
    return this.inspectionService.getCarInspectionBasedOnOrder(carId, query);
  }

  @Post('/me/cars/:carId/vin')
  @ApiOperation({ title: 'Edit car vin' })
  @ApiResponse({ status: HttpStatus.OK, type: CarDTO })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.DRIVER)
  editCar(
    @Account() account: AccountEntity,
    @Param('carId') carId: number,
    @Body('vin') vin: string) {
    return this.carService.addCarVinByDriver(carId, account.id, vin);
  }

  @Post('/me/cars/:carId/photo')
  @ApiOperation({ title: 'Add car photo' })
  @ApiResponse({ status: HttpStatus.OK, type: CarDTO })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: NotFoundDTO })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.DRIVER)
  addCarPhoto(
    @Account() account: AccountEntity,
    @Param('carId') carId: number,
    @Body('photoUrl') photoUrl: string,
  ) {
    return this.carService.addCarPhotoByDriver(carId, account.id, photoUrl);
  }

  @Get('/me/orders/:orderId/:inspectionType(delivery|pickup)-inspections')
  @ApiOperation({ title: 'Get order inspections for driver' })
  @ApiResponse({ status: HttpStatus.OK, type: InspectionDTO })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: NotFoundDTO })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.DRIVER)
  getOrderInspections(
    @Account() account: AccountEntity,
    @Query() query: GetList,
    @Query('status') statusName: string,
    @Param('orderId') orderId: number,
    @Param('inspectionType') inspectionType: string,
  ) {
    query = { ...query, where: { driverId: account.id, type: inspectionType } };
    if (statusName) {
      query.where.status = statusName;
    }
    return this.inspectionService.getOrderInspections(orderId, query);
  }

  @Post('/me/location')
  @ApiOperation({ title: 'Insert a location driver' })
  @ApiResponse({ status: HttpStatus.OK, type: DriverLocationDTO })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: NotFoundDTO })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.DRIVER)
  async insertLocation(
    @Account() account: AccountEntity,
    @Body() body: CreateDriverLocationRequestDTO[],
  ) {
    const location = await this.driverLocationService.create(account, body);
    this.orderService.checkDriverIsNearOrderToPickUp(account, location);
    this.orderService.checkDriverIsNearOrderToDelivery(account, location);

    return location;
  }

  @Post('/me/on-way-to-pick-up')
  @ApiOperation({ title: 'Activate trip' })
  @ApiResponse({ status: HttpStatus.OK, type: SuccessResponseDTO })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: NotFoundDTO })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.DRIVER)
  async activateTrip(
    @Account() account: AccountEntity,
    @Body() body: DriverToPickUpRequestDTO,
  ) {
    const resp = await this.tripService.setDriverOnPickup(account, body);

    this.emitter.emit('order_timeline', {
      orderId: body.orderId,
      actionAccountId: account.id,
      description: `Order status to changed to ${ORDER_STATUS.ON_WAY_TO_PICKUP.replace(/\_/g, ' ')} by ${account.firstName} ${account.lastName}`,
    });

    return resp;
  }

  @Get('/me/orders/:orderId/attachments')
  @ApiOperation({ title: 'Get list attachments order' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: GetOrderAttachmentListResponse,
  })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.DRIVER)
  async getAttachmentsOrder(
    @Account() account: AccountEntity,
    @Param('orderId') orderId: number,
    @Body() query: GetList,
  ) {
    if (!account.companyId || !account.dispatcherId) {
      throw new ForbiddenException(`You do not have access to this order`);
    }

    const count = await this.orderService.isAssignToDriver(orderId, account.id);

    if (!count) {
      throw new ForbiddenException(`You do not have access to this order`);
    }

    return this.orderAttachmentService.get(orderId, {
      ...query,
      where: {
        companyId: account.companyId,
      },
    });
  }

  @Get('/me/orders/:orderId/timeline')
  @ApiOperation({ title: 'Get list timeline order' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: GetOrderTimelineListResponse,
  })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.DRIVER)
  async getTimelineOrder(
    @Account() account: AccountEntity,
    @Param('orderId') orderId: number,
    @Body() query: GetList,
  ) {
    if (!account.companyId || !account.dispatcherId) {
      throw new ForbiddenException(`You do not have access to this order`);
    }

    const count = await this.orderService.isAssignToDriver(orderId, account.id);

    if (!count) {
      throw new ForbiddenException(`You do not have access to this order`);
    }

    return this.orderTimelineService.get(orderId, {
      ...query,
      where: {
        companyId: account.companyId,
      },
    });
  }

  @Post('/me/orders/:orderId/mark-paid')
  @ApiOperation({ title: 'MArk Order as paid' })
  @ApiResponse({ status: HttpStatus.OK, type: SuccessResponseDTO })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: NotFoundDTO })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.DRIVER)
  async markPaid(
    @Account() account: AccountEntity,
    @Body('paymentMethod') paymentMethod: string,
    @Param('orderId') orderId: number,
  ) {
    const count = await this.orderService.isAssignToDriver(orderId, account.id);

    if (!count) {
      throw new ForbiddenException(`You do not have access to this order`);
    }

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
}
