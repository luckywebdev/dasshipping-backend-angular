import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import Axios from 'axios';
import * as CryptoJS from 'crypto-js';
import * as csvjson from 'csvjson';
import * as fs from 'fs';
import * as moment from 'moment';
import { InjectEventEmitter } from 'nest-emitter';
import * as nodepath from 'path';
import { path } from 'ramda';
import * as rimraf from 'rimraf';
import * as shortid from 'shortid';
import {
  EntityManager,
  getConnection,
  In,
  IsNull,
  LessThan,
  Not,
  Repository,
  Transaction,
  TransactionRepository,
} from 'typeorm';

import { ConfigService } from '../../config/config.service';
import { ROLES } from '../../constants/roles.constant';
import { CarDTO } from '../../dto/car.dto';
import { DriverLocationDTO } from '../../dto/driverLocation.dto';
import { GeneralReportDTO } from '../../dto/generalReport.dto';
import { InspectionDTO } from '../../dto/inspection.dto';
import { LocationDTO } from '../../dto/location.dto';
import { LocationPointDTO } from '../../dto/locationPoint.dto';
import {
  CLIENT_NOTIFICATION_ACTIONS,
  CLIENT_NOTIFICATION_TYPES,
  DRIVER_NOTIFICATION_TYPES,
} from '../../dto/notification.dto';
import { OrderDTO } from '../../dto/order.dto';
import { SuccessDTO } from '../../dto/success.dto';
import { AccountEntity } from '../../entities/account.entity';
import { CarEntity } from '../../entities/car.entity';
import { DISPATCH_STATUS } from '../../entities/dispatch.entity';
import { DriverLocationEntity } from '../../entities/driverLocation.entity';
import { INSPECTION_STATUS, INSPECTION_TYPE } from '../../entities/inspection.entity';
import { LocationEntity } from '../../entities/location.entity';
import { BaseOrderRelations, CLIENT_PAYMENT_STATUSES, ORDER_SOURCE, OrderEntity } from '../../entities/order.entity';
import { OrderAttachmentEntity } from '../../entities/orderAttachment.entity';
import { DELIVERED_ORDERS, ORDER_STATUS, PICKED_UP_ORDERS, TRAILER_TYPE } from '../../entities/orderBase.entity';
import { OrderNoteEntity, OrderNoteEventKeys } from '../../entities/orderNote.entity';
import { OrderToTripEntity } from '../../entities/orderToTrip.entity';
import { ShipperEntity } from '../../entities/shipper.entity';
import { TempPriceEntity } from '../../entities/tempPrice.entity';
import { TRIP_STATUS } from '../../entities/trip.entity';
import { VirtualAccountEntity } from '../../entities/virtualAccount.entity';
import { FileDTO } from '../../file/dto/upload/file.dto';
import { FileService } from '../../file/file.service';
import { MailService } from '../../mail/mail.service';
import { AccountRepository } from '../../repositories/account.repository';
import { CarRepository } from '../../repositories/car.repository';
import { DispatchRepository } from '../../repositories/dispatch.repository';
import { DriverLocationRepository } from '../../repositories/driverLocation.repository';
import { InspectionRepository } from '../../repositories/inspection.repository';
import { OrderRepository } from '../../repositories/order.repository';
import { OrderAttachmentRepository } from '../../repositories/orderAttachment.repository';
import { OrderNoteRepository } from '../../repositories/orderNote.repository';
import { OrderTimelineRepository } from '../../repositories/orderTimeline.repository';
import { PolicyRepository } from '../../repositories/policy.repository';
import { TripRepository } from '../../repositories/trip.repository';
import { getHash } from '../../utils/crypto.utils';
import { fileSign, uploadBufferFile } from '../../utils/fileSign.util';
import { ObjectEqual, PropsChanged } from '../../utils/order.utils';
import { DriverLocationPartialDTO } from '../client/dto/get/driverLocationPartial.dto';
import { SignPickUpRequest } from '../client/dto/post/requestSignPickUp.dto';
import { ReportsByShipperRequestDTO } from '../company/dto/reports-by-shipper/request.dto';
import { GetReportsByShipperResponse } from '../company/dto/reports-by-shipper/response.dto';
import { SendInvoiceRequestDTO } from '../company/dto/sendInvoiceRequest.dto';
import { GetList } from '../dto/requestList.dto';
import { SuccessResponseDTO } from '../dto/successResponse.dto';
import { AppEventEmitter } from '../event/app.events';
import { HereService } from '../here/here.service';
import { NotificationService } from '../notification/notification.service';
import { InspectionPhotosService } from '../services/inspectionPhotos.service';
import { LocationService } from '../services/location/location.service';
import { PdfGenerationService } from '../services/pdfGeneration.service';
import { CalculatorService } from '../shared/calculator.service';
import { TransactionService } from '../transaction/transaction.service';
import { CalculatePriceRequest } from './dto/create/calculatePrice.dto';
import { OrderCreateRequest } from './dto/create/request.dto';
import { EditOrderRequestDTO } from './dto/edit-web-roles/request.dto';
import { FiltersOrdersRequest } from './dto/list/filters.dto';
import { GetOrdersRequest } from './dto/list/request.dto';
import { GetOrdersListResponse } from './dto/list/response.dto';
import { SearchOrdersRequestDTO } from './dto/list/search.dto';
import { DiscountRequestDTO } from './dto/patch/discountRequest.dto';
import { OrdersCustomReportMapper, OrdersCustomReportOrderByMapper } from './dto/report/customMapper';
import { OrdersCustomReportFields } from './dto/report/fields.dto';
import { OrdersCustomReportFilters } from './dto/report/filters.dto';
import { ImportOrderBuilder } from './importOrderBuilder';
import { OrderParserInterface } from './templateParsers/orderParser.interface';

export const hashTTL: number = 30;
const ORDERS_CONDITION = {
  ASSIGNED: 'assigned',
  DECLINED: 'declined',
  PICKED_UP: 'picked-up',
  DELIVERED: 'delivered',
  CLAIMED: 'claimed',
  BILLED: 'billed',
  PAID: 'paid',
};

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(OrderRepository)
    private readonly orderRepository: OrderRepository,
    @InjectRepository(CarRepository)
    private readonly carRepository: CarRepository,
    @InjectRepository(TempPriceEntity)
    private readonly tempPriceRepository: Repository<TempPriceEntity>,
    @InjectRepository(TripRepository)
    private readonly tripRepository: TripRepository,
    @InjectRepository(InspectionRepository)
    private readonly inspectionRepository: InspectionRepository,
    @InjectRepository(AccountRepository)
    private readonly accountRepository: AccountRepository,
    @InjectRepository(VirtualAccountEntity)
    private readonly virtualAccountRepository: Repository<VirtualAccountEntity>,
    @InjectRepository(ShipperEntity)
    private readonly shipperRepository: Repository<ShipperEntity>,
    @InjectRepository(DispatchRepository)
    private readonly dispatchRepository: DispatchRepository,
    @InjectRepository(OrderNoteEntity)
    private readonly orderNoteRepository: Repository<OrderNoteEntity>,
    @InjectRepository(OrderToTripEntity)
    private readonly orderTripRepository: Repository<OrderToTripEntity>,
    @InjectRepository(OrderAttachmentRepository)
    private readonly orderAttachmentRepository: OrderAttachmentRepository,
    @InjectRepository(DriverLocationRepository)
    private readonly driverLocationRepository: DriverLocationRepository,
    @InjectRepository(PolicyRepository) private readonly policyRepository: PolicyRepository,
    private readonly calcService: CalculatorService,
    private readonly notificationService: NotificationService,
    private readonly locationService: LocationService,
    private readonly hereService: HereService,
    private readonly pdfGenerationService: PdfGenerationService,
    private readonly inspectionPhotosService: InspectionPhotosService,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
    @InjectEventEmitter() private readonly emitter: AppEventEmitter,
    private readonly jwtService: JwtService,
    private readonly transactionService: TransactionService,
  ) { }

  onModuleInit(): any {
    this.emitter.on('order_delivered', ({ orderId, tripId }) =>
      this.actionsOrderDelivered(orderId, tripId),
    );
    this.emitter.on('order_charge', (clientId) =>
      this.chargeOrdersFailed(clientId),
    );
  }

  @Transaction()
  public async createOrder(
    account: AccountEntity,
    orderReq: OrderCreateRequest,
    @TransactionRepository(VirtualAccountEntity) virtualAccountRepository?: Repository<VirtualAccountEntity>,
    @TransactionRepository(LocationEntity) locationRepository?: Repository<LocationEntity>,
    @TransactionRepository(OrderRepository) orderRepository?: OrderRepository,
    @TransactionRepository(CarRepository) carRepository?: CarRepository,
    @TransactionRepository(ShipperEntity) shipperRepository?: Repository<ShipperEntity>,
  ): Promise<OrderDTO> {
    orderReq.companyId = account.companyId;
    orderReq.published = true;
    orderReq.status = ORDER_STATUS.DISPATCHED;
    if (account.roleId === ROLES.DISPATCHER) {
      orderReq.dispatcherId = account.id;
    }

    if (orderReq.shipper && !!Object.keys(orderReq.shipper).length) {
      orderReq.shipper = await shipperRepository.save(orderReq.shipper);
    }
    orderReq.source = ORDER_SOURCE.MANUAL;
    return await this.create(account, orderReq, virtualAccountRepository, locationRepository, orderRepository, carRepository);
  }

  public async create(
    account: AccountEntity,
    orderReq: OrderCreateRequest,
    virtualAccountRepository: Repository<VirtualAccountEntity>,
    locationRepository: Repository<LocationEntity>,
    orderRepository: OrderRepository,
    carRepository: CarRepository,
  ): Promise<OrderDTO> {
    const order = orderReq as OrderDTO;
    const from = path(['pickLocation', 'zipCode'], order) as string;
    const to = path(['deliveryLocation', 'zipCode'], order) as string;

    const [pickup, delivery, sender, receiver, distance] = await Promise.all([
      await this.locationService.save(order.pickLocation, locationRepository),
      await this.locationService.save(order.deliveryLocation, locationRepository),
      await virtualAccountRepository.save(order.sender),
      await virtualAccountRepository.save(order.receiver),
      await this.calcService.getDistance(from, to),
    ]);

    order.exactDistance = await this.getOrderExactDistance(pickup, delivery);
    order.initialPrice = await this.calcService.getCarsDeliveryPrice(
      order.cars,
      distance,
      TRAILER_TYPE.ENCLOSED === order.trailerType,
    );
    order.priceWithDiscount = await this.calcService.getDiscountPrice(
      order.initialPrice,
      order.discount,
    );
    order.salePrice = await this.calcService.getSalePrice(order.initialPrice);
    order.loadPrice = await this.calcService.getLoadPrice(
      order.initialPrice,
      order.discount,
    );

    delete order.sender;
    delete order.receiver;
    if (order.shipper && !Object.keys(orderReq.shipper).length) {
      delete order.shipper;
    }

    if (order.notes && typeof order.notes === 'string') {
      order.dispatchInstructions = order.notes;
      delete order.notes;
    }

    const newOrder = await orderRepository.save({
      ...order,
      distance,
      pickLocation: pickup,
      deliveryLocation: delivery,
      status: order.status || ORDER_STATUS.QUOTE,
      senderId: sender.id,
      receiverId: receiver.id,
      createdById: account.id,
      uuid: shortid.generate(),
    });

    order.cars.map(car => (car.orderId = newOrder.id));
    await carRepository.save(order.cars);
    return newOrder;
  }

  @Transaction()
  public async createTransactional(
    account: AccountEntity,
    orderReq: OrderCreateRequest,
    @TransactionRepository(VirtualAccountEntity) virtualAccountRepository?: Repository<VirtualAccountEntity>,
    @TransactionRepository(LocationEntity) locationRepository?: Repository<LocationEntity>,
    @TransactionRepository(OrderRepository) orderRepository?: OrderRepository,
    @TransactionRepository(CarRepository) carRepository?: CarRepository,
  ): Promise<OrderDTO> {
    return this.create(account, orderReq, virtualAccountRepository, locationRepository, orderRepository, carRepository);
  }

  public async cancelRequestDispatch(
    id: number,
    companyId: number,
  ): Promise<SuccessDTO> {
    const order = await this.orderRepository.findOne(id, {});

    if (!order) {
      throw new BadRequestException(`Order not found for id ${id}`);
    }

    const dispatches = await this.dispatchRepository.find({
      orderId: order.id,
      companyId,
    });

    await this.dispatchRepository.remove(dispatches);

    return {
      success: true,
    };
  }

  public async cancelOrder(
    account: AccountEntity,
    id: number,
    where: any = {},
  ): Promise<SuccessDTO> {
    const order = await this.orderRepository.getOrder(
      id,
      ['notes', 'orderTrips'],
      where,
    );

    if (!order) {
      throw new BadRequestException(`Order not found for id ${id}`);
    }

    if (
      !order.published ||
      ![
        ORDER_STATUS.DISPATCHED.toString(),
        ORDER_STATUS.ON_PICKUP.toString(),
        ORDER_STATUS.DECLINED.toString(),
        ORDER_STATUS.BILLED.toString(),
        ORDER_STATUS.PAID.toString(),
      ].includes(order.status)
    ) {
      throw new BadRequestException(
        `Order cannot be cancelled as it is ${
        order.published ? '' : 'not'
        } published and status is ${order.status} for order ${id}`,
      );
    }

    await this.actionCancelOrder(account, order);
    const trip = await this.orderRepository.getOrderStatusTrip(
      order.id,
      TRIP_STATUS.ACTIVE,
    );

    if (trip) {
      await this.notificationService.create({
        type: 'order_cancel',
        actions: [],
        title: `Order was canceled`,
        content: `Order #${order.uuid} from trip #${trip.id} was canceled`,
        targetUserId: trip.driverId,
      });
    }

    if ([ROLES.COMPANY_ADMIN, ROLES.DISPATCHER].includes(account.roleId)) {
      this.notificationService.createNotificationAdmin({ orderId: order.id });
    }

    await this.notificationService.markAllAsReadByOrder(order.id);
    return {
      success: true,
    };
  }

  @Transaction()
  private async actionCancelOrder(
    account: AccountEntity,
    order: OrderEntity,
    @TransactionRepository(OrderToTripEntity) orderTripRepository?: Repository<OrderToTripEntity>,
    @TransactionRepository(OrderNoteRepository) orderNoteRepository?: OrderNoteRepository,
    @TransactionRepository(OrderRepository) orderRepository?: OrderRepository,
    @TransactionRepository(DispatchRepository) dispatchRepository?: DispatchRepository,
    @TransactionRepository(OrderTimelineRepository) orderTimelineRepository?: OrderTimelineRepository,
  ) {
    if (order.orderTrips && order.orderTrips.length) {
      const [orderTrip] = order.orderTrips;
      const { trip } = orderTrip;
      if (trip.companyId === account.companyId) {
        const orderToTrips = await orderTripRepository.find({
          orderId: order.id,
          tripId: trip.id,
        });
        await orderTripRepository.remove(orderToTrips);
        await this.recalculateRoute([trip.id]);
      }
    }

    await orderNoteRepository.remove(order.notes);
    await orderTimelineRepository.delete({
      orderId: order.id,
    });
    order.notes = [];
    const status = order.source === ORDER_SOURCE.INTERNAL ? ORDER_STATUS.PUBLISHED : ORDER_STATUS.CANCELED;
    await orderRepository.update(order.id, {
      status,
      dispatcherId: null,
      companyId: null,
    });
    const dispatches = await this.dispatchRepository.find({
      orderId: order.id,
    });

    await dispatchRepository.remove(dispatches);
  }

  public async cancelOrderForClient(
    account: AccountEntity,
    id: number,
    where: any = {},
  ): Promise<SuccessDTO> {
    const connection = getConnection();
    const queryRunner = connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const orderRepository = queryRunner.manager.getCustomRepository(OrderRepository);
      const tripRepository = queryRunner.manager.getCustomRepository(TripRepository);

      const order = await orderRepository.getOrder(id, [], where);

      if (!order) {
        throw new BadRequestException(`Order not found for id ${id}`);
      }

      if ([ORDER_STATUS.PICKED_UP.toString(), ORDER_STATUS.ON_DELIVERY.toString(), ORDER_STATUS.DELIVERED.toString(),
      ORDER_STATUS.ON_WAY_TO_DELIVERY.toString(), ORDER_STATUS.PAID.toString()].includes(order.status)) {
        throw new BadRequestException(
          `Order cannot be cancelled as it status is ${order.status}`,
        );
      }

      await orderRepository.update(order.id, {
        status: ORDER_STATUS.CANCELED,
      });

      const trip = await this.orderRepository.getOrderStatusTrip(
        order.id,
        TRIP_STATUS.ACTIVE,
      );

      this.verifyOrderTrip(id, orderRepository, tripRepository);
      await queryRunner.commitTransaction();

      if (trip) {
        this.notificationService.create({
          type: DRIVER_NOTIFICATION_TYPES.CLIENT_CANCEL_ORDER,
          actions: [],
          title: `Order was canceled`,
          content: `Order #${order.uuid} from trip #${trip.id} was canceled`,
          targetUserId: trip.driverId,
        });
      }

      this.notificationService.createNotificationCarriers(order.id);
      return {
        success: true,
      };
    } catch (e) {
      await queryRunner.rollbackTransaction();
      throw e;
    } finally {
      await queryRunner.release();
    }
  }

  public async getRequestedOrders(
    query: GetList,
    account: AccountEntity,
  ): Promise<GetOrdersListResponse> {
    return await this.orderRepository.getOrderList({
      ...query,
      status: ORDER_STATUS.PUBLISHED,
      dispatchStatus: DISPATCH_STATUS.NEW,
      where: {
        hiddenForAdmin: false,
        source: ORDER_SOURCE.INTERNAL
      }
    }, account);
  }

  public async getDispatchedOrders(
    query: GetList,
    account: AccountEntity,
  ): Promise<GetOrdersListResponse> {
    return await this.orderRepository.getOrderList({
      ...query,
      where: {
        companyId: Not(IsNull()),
        status: Not(In(DELIVERED_ORDERS.concat(PICKED_UP_ORDERS))),
        hiddenForAdmin: false,
        source: ORDER_SOURCE.INTERNAL,
      },
    }, account);
  }

  public async getPickedUpOrders(
    query: GetList,
    account: AccountEntity,
  ): Promise<GetOrdersListResponse> {
    return await this.orderRepository.getOrderList({
      ...query,
      where: {
        companyId: Not(IsNull()),
        status: In(PICKED_UP_ORDERS),
        hiddenForAdmin: false,
        source: ORDER_SOURCE.INTERNAL,
      },
    }, account);
  }

  public async getDeliveredOrders(
    query: GetList,
    account: AccountEntity,
  ): Promise<GetOrdersListResponse> {
    return await this.orderRepository.getOrderList({
      ...query,
      where: {
        companyId: Not(IsNull()),
        status: In(DELIVERED_ORDERS),
        hiddenForAdmin: false,
        source: ORDER_SOURCE.INTERNAL,
      },
    }, account);
  }

  public async getDispatchedInviteOrders(
    accountId: number,
    query: GetList,
  ): Promise<any> {
    return await this.orderRepository.getOrderDispatchedInviteList(accountId, query);
  }

  public async getOrderExpiredInviteList(
    accountId: number,
    query: GetList,
  ): Promise<any> {
    return await this.orderRepository.getOrderExpiredInviteList(accountId, query);
  }

  public async getPublishedOrders(
    account: AccountEntity,
    query: GetOrdersRequest,
  ): Promise<GetOrdersListResponse> {
    return await this.orderRepository.getPublishedAndDeletedList(query, account);
  }

  public async get(
    account: AccountEntity,
    query: GetOrdersRequest,
  ): Promise<GetOrdersListResponse> {
    return await this.orderRepository.getOrderList(query, account);
  }

  public async getOrder(
    orderId: number,
    include: string,
    where?: any,
  ): Promise<OrderDTO> {
    const relations = (include || '').split(',').filter(value => value.length);
    relations.map(relationName => {
      if (!BaseOrderRelations.includes(relationName)) {
        throw new BadRequestException(
          `Relation ${relationName} is not allowed`,
        );
      }
    });
    const order = await this.orderRepository.getOrder(
      orderId,
      relations,
      where,
    );
    if (!order) {
      throw new NotFoundException(`Order not found for id: ${orderId}`);
    }

    if (
      order.companyId &&
      order.status !== ORDER_STATUS.DISPATCHED &&
      order.orderTrips &&
      order.orderTrips.length
    ) {
      const orderTrip = order.orderTrips.find(
        item => item.trip.status === TRIP_STATUS.ACTIVE,
      );
      order.driver = path(['trip', 'driver'], orderTrip);
    }

    if (order && order.inspections && order.inspections.length) {
      const secretKey = this.configService.secretKeyThumbnail;
      order.inspections = order.inspections.map((inspection => {
        const images = inspection.images.map(item => {
          const sign = CryptoJS.HmacSHA1(`h=200&op=thumbnail&path=${item.url}&w=200`, secretKey).toString(CryptoJS.enc.Hex);
          const urlThumb = `${this.configService.imageUrl}/display?path=${item.url}&w=200&h=200&op=thumbnail&sig=${sign}`;
          return {
            ...item,
            signedUrl: fileSign(item.url),
            thumbImage: urlThumb,
          };
        });
        return {
          ...inspection,
          images,
        };
      }));
    }

    return order;
  }

  public async delete(
    account: AccountEntity,
    id: number,
    where?: any,
  ): Promise<SuccessDTO> {
    const order = await this.orderRepository.getOrder(id, [], where);

    if (order) {
      await this.orderRepository.update(order.id, {
        status: ORDER_STATUS.DELETED,
        published: false,
      });
    }

    return {
      success: true,
    };
  }

  public async patch(
    account: AccountEntity,
    id: number,
    data: EditOrderRequestDTO,
    where: any,
    recalculatePrice: string = null,
  ): Promise<OrderDTO> {
    const order = await this.orderRepository.getOrder(
      id,
      [
        'pickLocation',
        'deliveryLocation',
        'cars',
        'sender',
        'receiver',
        'shipper',
      ],
      where,
    );

    if (!order) {
      throw new BadRequestException(`Order not found for id ${id}`);
    }
    if (order.source === ORDER_SOURCE.INTERNAL) {
      return this.patchInternal(account, id, data, where, order, recalculatePrice);
    }

    return this.patchExternal(account, id, data, where, order);
  }

  @Transaction()
  public async patchInternal(
    account: AccountEntity,
    id: number,
    data: EditOrderRequestDTO,
    where: any,
    order: OrderEntity,
    recalculatePrice: string,
    @TransactionRepository(OrderRepository) orderRepository?: OrderRepository,
    @TransactionRepository(VirtualAccountEntity) virtualAccountRepository?: Repository<VirtualAccountEntity>,
    @TransactionRepository(LocationEntity) locationRepository?: Repository<LocationEntity>,
    @TransactionRepository(CarRepository) carRepository?: CarRepository,
    @TransactionRepository(ShipperEntity) shipperRepository?: Repository<ShipperEntity>,
  ): Promise<OrderDTO> {

    let locationUpdated = false;
    let carsUpdated = false;
    let orderUpdated = false;
    data.pickLocation = {
      ...order.pickLocation,
      ...data.pickLocation,
    };
    if (data.pickLocation && !ObjectEqual(data.pickLocation, order.pickLocation)) {
      data.pickLocation = await this.locationService.save(data.pickLocation, locationRepository);
      locationUpdated = true;
      orderUpdated = true;
    }

    data.deliveryLocation = {
      ...order.deliveryLocation,
      ...data.deliveryLocation,
    };
    if (data.deliveryLocation && !ObjectEqual(data.deliveryLocation, order.deliveryLocation)) {
      data.deliveryLocation = await this.locationService.save(data.deliveryLocation, locationRepository);
      locationUpdated = true;
      orderUpdated = true;
    }

    data.cars = data.cars || [];
    order.cars = order.cars || [];
    if (data.cars.length !== order.cars.length) {
      carsUpdated = true;
    }

    if (!carsUpdated) {
      for (let i = 0; i < data.cars.length; i++) {
        const a = {
          ...order.cars[i],
          ...data.cars[i],
        };
        const b = {
          ...order.cars[i],
        };

        delete a.pricePerMile;
        delete b.pricePerMile;
        if (!ObjectEqual(a, b)) {
          carsUpdated = true;
          break;
        }
      }
    }

    if (carsUpdated) {
      data.cars = await this.updateOrderCars(order, data.cars, carRepository);
      orderUpdated = true;
    }

    data.sender = {
      ...order.sender,
      ...data.sender,
    };
    if (data.sender && !ObjectEqual(data.sender, order.sender)) {
      data.sender = await virtualAccountRepository.save(data.sender);
      delete data.senderId;
      orderUpdated = true;
    }

    data.receiver = {
      ...order.receiver,
      ...data.receiver,
    };
    if (data.receiver && !ObjectEqual(data.receiver, order.receiver)) {
      data.receiver = await virtualAccountRepository.save(data.receiver);
      delete data.receiverId;
      orderUpdated = true;
    }

    data.shipper = {
      ...order.shipper,
      ...data.shipper,
    };
    if (data.shipper && !ObjectEqual(data.shipper, order.shipper)) {
      data.shipper = await shipperRepository.save(data.shipper);
      delete data.shipperId;
      orderUpdated = true;
    }

    if (PropsChanged([
      'pickInstructions',
      'deliveryInstructions',
      'paymentMethods',
      'brokerFee',
      'paymentNote',
    ], data, order)) {
      orderUpdated = true;
    }

    let exactDistance = order.exactDistance;
    let initialPrice = order.initialPrice;
    let priceWithDiscount = order.priceWithDiscount;
    let loadPrice = order.loadPrice;
    let salePrice = data.salePrice || order.salePrice;

    const pickLocation = data.pickLocation || order.pickLocation;
    const deliveryLocation = data.deliveryLocation || order.deliveryLocation;
    if (locationUpdated) {
      exactDistance = await this.getOrderExactDistance(
        pickLocation,
        deliveryLocation,
      );
    }

    if ((locationUpdated || carsUpdated) && !recalculatePrice) {
      const distance = await this.calcService.getDistance(
        pickLocation.zipCode,
        deliveryLocation.zipCode,
      );
      const trailerType = data.trailerType || order.trailerType;
      const cars = data.cars || order.cars;
      initialPrice = await this.calcService.getCarsDeliveryPrice(
        cars,
        distance,
        TRAILER_TYPE.ENCLOSED === trailerType,
      );
      priceWithDiscount = await this.calcService.getDiscountPrice(
        initialPrice,
        order.discount,
      );
      if (order.published && !order.companyId) {
        if (!data.hash) {
          throw new BadRequestException('Hash is empty');
        }
        await this.checkHashIsValid(data.hash, priceWithDiscount);
      }
      salePrice = await this.calcService.getSalePrice(initialPrice);
      loadPrice = await this.calcService.getLoadPrice(
        initialPrice,
        order.discount,
      );
    }

    if (!orderUpdated) {
      throw new BadRequestException('No fields to update');
    }

    delete data.hash;
    delete data.cars;

    await orderRepository.update(order.id, {
      ...data,
      initialPrice,
      priceWithDiscount,
      loadPrice,
      updatedAt: new Date(),
      salePrice,
      exactDistance,
    });

    return orderRepository.getOrder(
      id,
      [
        'pickLocation',
        'deliveryLocation',
        'cars',
        'sender',
        'receiver',
        'shipper',
      ],
      where,
    );
  }

  @Transaction()
  public async patchExternal(
    account: AccountEntity,
    id: number,
    data: EditOrderRequestDTO,
    where: any,
    order: OrderEntity,
    @TransactionRepository(OrderRepository) orderRepository?: OrderRepository,
    @TransactionRepository(VirtualAccountEntity) virtualAccountRepository?: Repository<VirtualAccountEntity>,
    @TransactionRepository(LocationEntity) locationRepository?: Repository<LocationEntity>,
    @TransactionRepository(CarRepository) carRepository?: CarRepository,
    @TransactionRepository(ShipperEntity) shipperRepository?: Repository<ShipperEntity>,
  ): Promise<OrderDTO> {

    let exactDistance = order.exactDistance;
    let recalculateDist = false;
    let orderUpdated = false;

    data.pickLocation = {
      ...order.pickLocation,
      ...data.pickLocation,
    };
    if (data.pickLocation && !ObjectEqual(data.pickLocation, order.pickLocation)) {
      data.pickLocation = await this.locationService.save(data.pickLocation, locationRepository);
      recalculateDist = true;
      orderUpdated = true;
    }

    data.deliveryLocation = {
      ...order.deliveryLocation,
      ...data.deliveryLocation,
    };
    if (data.deliveryLocation && !ObjectEqual(data.deliveryLocation, order.deliveryLocation)) {
      data.deliveryLocation = await this.locationService.save(data.deliveryLocation, locationRepository);
      recalculateDist = true;
      orderUpdated = true;
    }

    let carsUpdated = false;
    data.cars = data.cars || [];
    order.cars = order.cars || [];
    if (data.cars.length !== order.cars.length) {
      carsUpdated = true;
    }

    if (!carsUpdated) {
      for (let i = 0; i < data.cars.length; i++) {
        const a = {
          ...order.cars[i],
          ...data.cars[i],
        };
        const b = {
          ...order.cars[i],
        };

        delete a.pricePerMile;
        delete b.pricePerMile;
        if (!ObjectEqual(a, b)) {
          carsUpdated = true;
          break;
        }
      }
    }

    if (carsUpdated) {
      data.cars = await this.updateOrderCars(order, data.cars, carRepository);
      orderUpdated = true;
    }

    data.sender = {
      ...order.sender,
      ...data.sender,
    };
    if (data.sender && !ObjectEqual(data.sender, order.sender)) {
      data.sender = await virtualAccountRepository.save(data.sender);
      delete data.senderId;
      orderUpdated = true;
    }

    data.receiver = {
      ...order.receiver,
      ...data.receiver,
    };
    if (data.receiver && !ObjectEqual(data.receiver, order.receiver)) {
      data.receiver = await virtualAccountRepository.save(data.receiver);
      delete data.receiverId;
      orderUpdated = true;
    }

    data.shipper = {
      ...order.shipper,
      ...data.shipper,
    };
    if (data.shipper && !ObjectEqual(data.shipper, order.shipper)) {
      data.shipper = await shipperRepository.save(data.shipper);
      delete data.shipperId;
      orderUpdated = true;
    }

    if (recalculateDist) {
      const pickLocation = data.pickLocation || order.pickLocation;
      const deliveryLocation = data.deliveryLocation || order.deliveryLocation;
      exactDistance = await this.getOrderExactDistance(
        pickLocation,
        deliveryLocation,
      );
      orderUpdated = true;
    }

    if (PropsChanged([
      'pickInstructions',
      'deliveryInstructions',
      'paymentMethods',
      'brokerFee',
      'paymentNote',
      'externalId',
    ], data, order)) {
      orderUpdated = true;
    }

    delete data.hash;
    delete data.cars;

    if (!orderUpdated) {
      throw new BadRequestException('No fields to update');
    }

    await orderRepository.update(order.id, {
      ...data,
      updatedAt: new Date(),
      exactDistance,
    });

    return orderRepository.getOrder(
      id,
      [
        'pickLocation',
        'deliveryLocation',
        'cars',
        'sender',
        'receiver',
        'shipper',
      ],
      where,
    );
  }

  public async getAvailableOrdersForBoard(
    account: AccountEntity,
    query: GetOrdersRequest,
  ): Promise<any> {
    const where = Object.assign({}, query.where, {
      published: true,
      clientPaymentStatus: Not(In([CLIENT_PAYMENT_STATUSES.SERVICE_FEE_FAILED, CLIENT_PAYMENT_STATUSES.CAR_PICKUP_FAILED])),
    });
    const originPoint = await this.getLocationFilter(query.origin);
    const destinationPoint = await this.getLocationFilter(query.destination);

    delete query.origin;
    delete query.destination;

    const queryCustom = Object.assign({}, query, {
      status: ORDER_STATUS.PUBLISHED,
      noDispatchForCompany: account.companyId,
      originPoint,
      destinationPoint,
      where,
    });
    const orderList = await this.orderRepository.getOrderList(
      queryCustom,
      account,
    );

    let groupedOrders = null;
    if (query.grouped) {
      groupedOrders = this.groupOrderResult(orderList.data);
    }

    return { count: orderList.count, data: groupedOrders || orderList.data };
  }

  public async getRequestedOrdersForBoard(
    account: AccountEntity,
    query: GetOrdersRequest,
  ): Promise<GetOrdersListResponse> {
    const where = Object.assign({}, query.where, {
      published: true,
      hiddenForCompnay: false,
    });
    const queryCustom = Object.assign({}, query, {
      status: ORDER_STATUS.PUBLISHED,
      dispatchForCompany: account.companyId,
      where,
    });
    return await this.orderRepository.getOrderList(queryCustom, account);
  }

  public async getOrders(
    account: AccountEntity,
    query: GetOrdersRequest,
  ): Promise<GetOrdersListResponse> {
    let queryCustom: FiltersOrdersRequest = {
      ...query,
      where: { ...query.where, published: true },
    };
    if (account.roleId === ROLES.DISPATCHER) {
      queryCustom = { ...queryCustom, dispatcherId: account.id };
    }
    return await this.orderRepository.getOrderList(queryCustom, account);
  }

  public async getCompanyOrders(
    account: AccountEntity,
    query: SearchOrdersRequestDTO,
  ): Promise<GetOrdersListResponse> {
    const where: any = { ...query.where, companyId: account.companyId };
    query = { ...query, where };
    return await this.orderRepository.getCompanyOrders(query);
  }

  public async getCompanyOrdersNewLoads(
    account: AccountEntity,
    query: SearchOrdersRequestDTO,
  ): Promise<GetOrdersListResponse> {
    const where: any = {
      ...query.where,
      companyId: account.companyId,
      noTrip: true,
    };
    query = { ...query, where };
    const orderList = await this.orderRepository.getCompanyNewLoads(account.id, query);

    let groupedOrders = null;
    if (query.grouped) {
      groupedOrders = this.groupOrderResult(orderList.data);
    }

    return { count: orderList.count, data: groupedOrders || orderList.data };
  }

  public async getCompanyOrdersAssigned(
    accountId: number,
    query: SearchOrdersRequestDTO,
    condition: string,
  ): Promise<GetOrdersListResponse> {
    let statuses: any = [];
    let assignTrip = true;
    switch (condition) {
      case ORDERS_CONDITION.ASSIGNED:
        statuses = [
          ORDER_STATUS.DISPATCHED,
          ORDER_STATUS.PUBLISHED,
          ORDER_STATUS.ON_WAY_TO_PICKUP,
          ORDER_STATUS.ON_PICKUP,
          ORDER_STATUS.CANCELED,
        ];
        break;
      case ORDERS_CONDITION.BILLED:
        statuses = [ORDER_STATUS.BILLED];
        break;
      case ORDERS_CONDITION.CLAIMED:
        statuses = [ORDER_STATUS.CLAIMED];
        break;
      case ORDERS_CONDITION.DECLINED:
        statuses = [ORDER_STATUS.DECLINED];
        assignTrip = false;
        break;
      case ORDERS_CONDITION.DELIVERED:
        statuses = [ORDER_STATUS.DELIVERED];
        break;
      case ORDERS_CONDITION.PAID:
        statuses = [ORDER_STATUS.PAID];
        break;
      case ORDERS_CONDITION.PICKED_UP:
        statuses = [
          ORDER_STATUS.PICKED_UP,
          ORDER_STATUS.ON_WAY_TO_DELIVERY,
          ORDER_STATUS.ON_DELIVERY,
        ];
        break;
      default:
        throw new BadRequestException(`No action found for ${condition}`);
    }

    query = {
      ...query,
      where: {
        ...query.where,
        statuses,
      },
    };
    if (assignTrip) {
      query.where.assignTrip = true;
    }
    return await this.orderRepository.getCompanyAssignedOrders(accountId, query);
  }

  public async getCompanyAssignedOrders(
    accountId: number,
    query: SearchOrdersRequestDTO,
  ): Promise<GetOrdersListResponse> {
    return await this.orderRepository.getCompanyAssignedOrders(accountId, query);
  }

  public async getOrdersForLoadBoard(
    account: AccountEntity,
    query: FiltersOrdersRequest,
  ): Promise<GetOrdersListResponse> {
    const { count, data } = await this.orderRepository.getOrderList(
      query,
      account,
    );
    data.map((order: OrderEntity) => {
      if (order.companyId && order.status !== ORDER_STATUS.DISPATCHED) {
        const orderTrip = order.orderTrips.find(
          item => item.trip.status === TRIP_STATUS.ACTIVE,
        );
        order.driver = path(['trip', 'driver'], orderTrip);
      }
    });
    return { count, data };
  }

  public async addOrderDiscount(
    account: AccountEntity,
    id: number,
    data: DiscountRequestDTO,
  ): Promise<OrderDTO> {
    const order = await this.getOrder(id, 'pickLocation,deliveryLocation,cars');
    const priceWithDiscount = await this.calcService.getDiscountPrice(
      order.initialPrice,
      data.discount,
    );
    const salePrice = await this.calcService.getSalePrice(order.initialPrice);

    await this.orderRepository.update(order.id, {
      discount: data.discount,
      priceWithDiscount,
      salePrice,
    });

    return this.getOrder(id, '');
  }

  public async calculatePrice(
    account: AccountEntity,
    data: CalculatePriceRequest,
  ): Promise<TempPriceEntity> {
    const order = await this.orderRepository.getOrder(data.orderId, [
      'pickLocation',
      'deliveryLocation',
      'cars',
    ]);
    const tempPrice = new TempPriceEntity();
    const pickLocation = data.pickLocation || order.pickLocation;
    const deliveryLocation = data.deliveryLocation || order.deliveryLocation;
    const cars = data.cars || order.cars;
    const trailerType = data.trailerType || order.trailerType;

    const distance = await this.calcService.getDistance(
      pickLocation.zipCode,
      deliveryLocation.zipCode,
    );
    const initialPrice = await this.calcService.getCarsDeliveryPrice(
      cars,
      distance,
      TRAILER_TYPE.ENCLOSED === trailerType,
    );
    tempPrice.price = await this.calcService.getDiscountPrice(
      initialPrice,
      order.discount,
    );
    tempPrice.createdAt = new Date();
    tempPrice.hash = getHash(
      (tempPrice.createdAt.getTime() + tempPrice.price).toString(),
    );

    return await this.tempPriceRepository.save(tempPrice);
  }

  private async checkHashIsValid(
    hashField: string,
    newPrice: number,
  ): Promise<boolean> {
    const hash = await this.tempPriceRepository.findOne({ hash: hashField });
    if (!hash) {
      throw new BadRequestException('Invalid hash');
    }
    const diffMins = moment().diff(moment(hash.createdAt), 'minutes');
    if (diffMins > hashTTL) {
      throw new BadRequestException('Hash is too old, generate a new one');
    }
    if (Math.abs(hash.price - newPrice) > 1) {
      throw new BadRequestException(
        `Something went wrong with price calculation. Desired price: ${newPrice} but got ${JSON.stringify(
          hash,
        )}`,
      );
    }

    return true;
  }

  private async updateOrderCars(
    order: OrderEntity,
    cars: CarDTO[],
    carRepository: CarRepository = this.carRepository,
  ): Promise<CarEntity[]> {
    const carsToDelete = order.cars.filter(
      car =>
        !cars
          .filter(dataCar => dataCar.hasOwnProperty('id'))
          .map(dataC => dataC.id)
          .includes(car.id),
    );
    const carsToAdd: CarDTO[] = cars
      .filter(car => !car.hasOwnProperty('id'))
      .map(car => {
        return {
          ...car,
          orderId: order.id,
        };
      });
    const carsToUpdate: CarDTO[] = cars
      .filter(car => car.hasOwnProperty('id'))
      .map(car => {
        return {
          ...car,
          updatedAt: new Date(),
        };
      });
    const carsToSave = carsToAdd.concat(carsToUpdate);
    await carRepository.remove(carsToDelete);

    return await carRepository.save(carsToSave);
  }

  public async publish(
    account: AccountEntity,
    id: number,
    published: boolean = false,
  ): Promise<OrderDTO> {
    const order = await this.orderRepository.getOrder(id, [
      'pickLocation',
      'deliveryLocation',
      'cars',
    ]);

    if (!order) {
      throw new BadRequestException(`Order not found for id ${id}`);
    }

    await this.orderRepository.update(order.id, {
      published,
    });

    return { ...order, published };
  }

  public async assignOrder(
    id: number,
    queryTrip: any,
  ): Promise<OrderDTO> {
    const connection = getConnection();
    const queryRunner = connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const orderRepository = queryRunner.manager.getCustomRepository(OrderRepository);
      const tripRepository = queryRunner.manager.getCustomRepository(TripRepository);
      const orderTripRepository = queryRunner.manager.getRepository(OrderToTripEntity);
      queryTrip = {
        ...queryTrip,
        status: Not(In([ORDER_STATUS.BILLED, ORDER_STATUS.PAID])),
      };
      const trip = await tripRepository.findOne(queryTrip);

      if (!trip) {
        throw new BadRequestException(`Trip not found for id ${queryTrip.id}`);
      }

      const order = await orderRepository.getOrder(id, ['orderTrips']);

      if (!order) {
        throw new BadRequestException(`Order not found for id ${id}`);
      }

      const body: any = {
        dispatcherId: trip.dispatcherId,
      };

      if (order.status === ORDER_STATUS.DECLINED) {
        body.status = ORDER_STATUS.DISPATCHED;
      }

      const oldDriverId = trip.driverId;
      await orderRepository.update(order.id, body);

      let trips = [trip.id];
      if (order.orderTrips && order.orderTrips.length) {
        const [orderTrip] = order.orderTrips;
        const OldTrip = orderTrip.trip;
        trips = [...trips, OldTrip.id];
        await orderTripRepository.update(orderTrip.id, {
          tripId: trip.id,
          orderId: id,
        });
      } else {
        await orderTripRepository.save({ tripId: trip.id, orderId: id });
      }

      await this.recalculateRoute(trips, orderRepository, tripRepository);
      await queryRunner.commitTransaction();

      if (
        trip.status !== TRIP_STATUS.DRAFT &&
        oldDriverId &&
        oldDriverId !== trip.driverId
      ) {
        this.notificationService.create({
          type: DRIVER_NOTIFICATION_TYPES.TRIP_UNASSIGNED,
          actions: [],
          title: `Trip unassigned from you`,
          content: `Trip ${trip.id} was unassigned from you`,
          targetUserId: oldDriverId,
        });
      }

      if (trip.driverId && oldDriverId !== trip.driverId) {
        this.notificationService.create({
          type: DRIVER_NOTIFICATION_TYPES.TRIP_ASSIGNED,
          actions: [],
          title: `A trip assigned to you`,
          content: `Congratulation. Trip ${trip.id} was assigned to you.`,
          targetUserId: trip.driverId,
        });
      }

      return await this.orderRepository.getOrder(order.id, [
        'pickLocation',
        'deliveryLocation',
        'cars',
        'company',
        'orderTrips',
      ]);

    } catch (e) {
      await queryRunner.rollbackTransaction();
      throw e;
    } finally {
      await queryRunner.release();
    }
  }

  private async changeOrderToPickup(
    account: AccountEntity,
    orderId: number,
  ): Promise<any> {
    const order = await this.orderRepository.getOrderByStatus(
      account,
      orderId,
      [
        ORDER_STATUS.DISPATCHED,
        ORDER_STATUS.ON_PICKUP,
        ORDER_STATUS.ON_WAY_TO_PICKUP,
      ],
    );

    if (!order) {
      throw new NotFoundException(
        `No dispatched order found for id ${orderId}`,
      );
    }

    const trip = await this.orderRepository.getOrderStatusTrip(
      order.id,
      TRIP_STATUS.ACTIVE,
    );

    if (!trip) {
      throw new BadRequestException(`Order (${orderId}) has no active trip`);
    }

    await this.orderRepository.update(order.id, {
      status: ORDER_STATUS.ON_PICKUP,
      updatedAt: new Date(),
    });

    await this.notificationService.create({
      type: CLIENT_NOTIFICATION_TYPES.ARRIVED_AT_YOUR_PICK_UP,
      actions: [],
      title: `Order #${order.uuid} at pick up`,
      content: `Congratulation. Arrived at your pick up`,
      additionalInfo: order.id.toString(),
      targetUserId: order.createdById,
    });
  }

  private async changeOrderToDelivery(
    account: AccountEntity,
    orderId: number,
  ): Promise<any> {
    const order = await this.orderRepository.getOrderByStatus(
      account,
      orderId,
      [ORDER_STATUS.PICKED_UP],
    );

    if (!order) {
      throw new NotFoundException(
        `No dispatched order found for id ${orderId}`,
      );
    }

    const trip = await this.orderRepository.getOrderStatusTrip(
      order.id,
      TRIP_STATUS.ACTIVE,
    );

    if (!trip) {
      throw new BadRequestException(`Order (${orderId}) has no active trip`);
    }

    await this.orderRepository.update(order.id, {
      status: ORDER_STATUS.ON_WAY_TO_DELIVERY,
      updatedAt: new Date(),
    });

    await this.notificationService.create({
      type: CLIENT_NOTIFICATION_TYPES.ON_DELIVERY,
      additionalInfo: order.id.toString(),
      actions: [],
      title: `Order #${order.uuid} on way to delivery`,
      content: `Congratulation. Your order is on way to the delivery place`,
      targetUserId: order.createdById,
    });
  }

  private async changeOrderOnDelivery(
    account: AccountEntity,
    orderId: number,
  ): Promise<any> {
    const order = await this.orderRepository.getOrderByStatus(
      account,
      orderId,
      [ORDER_STATUS.ON_WAY_TO_DELIVERY],
    );

    if (!order) {
      throw new NotFoundException(
        `No dispatched order found for id ${orderId}`,
      );
    }

    const trip = await this.orderRepository.getOrderStatusTrip(
      order.id,
      TRIP_STATUS.ACTIVE,
    );

    if (!trip) {
      throw new BadRequestException(`Order (${orderId}) has no active trip`);
    }

    await this.orderRepository.update(order.id, {
      status: ORDER_STATUS.ON_DELIVERY,
      updatedAt: new Date(),
    });

    await this.notificationService.create({
      type: CLIENT_NOTIFICATION_TYPES.ARRIVED_AT_YOUR_DELIVERY,
      actions: [],
      additionalInfo: order.id.toString(),
      title: `Order #${order.uuid} on to delivery`,
      content: `Congratulation. Arrived at your delivery place`,
      targetUserId: order.createdById,
    });
  }

  public async changeOrderAction(
    account: AccountEntity,
    orderId: number,
    action: string,
  ): Promise<any> {
    switch (action) {
      case 'on_pickup':
        await this.changeOrderToPickup(account, orderId);
        break;
      case 'picked_up':
        await this.changeOrderToDelivery(account, orderId);
        break;
      case 'on_delivery':
        await this.changeOrderOnDelivery(account, orderId);
        break;
      default:
        throw new NotFoundException('Action not found');
    }

    return {
      status: 'success',
      message: `Order is updated`,
    };
  }

  @Transaction()
  public async decline(
    orderId: number,
    accountId: number,
    reason: string,
    @TransactionRepository(OrderRepository) orderRepository?: OrderRepository,
    @TransactionRepository(InspectionRepository) inspectionRepository?: InspectionRepository,
    @TransactionRepository(OrderNoteRepository) orderNoteRepository?: OrderNoteRepository,
  ): Promise<any> {
    const order = await orderRepository.getOrder(orderId, [
      'notes',
      'orderTrips',
    ], { where: { status: Not(In([ORDER_STATUS.DELETED, ORDER_STATUS.DECLINED, ORDER_STATUS.CANCELED, ORDER_STATUS.ARCHIVED])) } });

    if (!order) {
      throw new BadRequestException(`Order not found for id ${orderId}`);
    }

    if ([ORDER_STATUS.PICKED_UP.toString(), ORDER_STATUS.ON_DELIVERY.toString(), ORDER_STATUS.DELIVERED.toString(),
    ORDER_STATUS.ON_WAY_TO_DELIVERY.toString(), ORDER_STATUS.PAID.toString()].includes(order.status)) {
      throw new BadRequestException(
        `Order cannot be declined as it status is ${order.status}`,
      );
    }

    const trip = await orderRepository.getOrderTripDecline(order.id);
    if (!trip || trip.driverId !== accountId) {
      throw new BadRequestException(`Order not found for id ${orderId}`);
    }

    let orderNote = new OrderNoteEntity();
    orderNote.accountId = accountId;
    orderNote.orderId = orderId;
    orderNote.note = reason;
    orderNote.eventKey = OrderNoteEventKeys.DECLINE_ORDER;

    orderNote = await orderNoteRepository.save(orderNote);
    order.notes.push(orderNote);

    await orderRepository.update(order.id, {
      status: ORDER_STATUS.DECLINED,
      driverId: null,
    });

    await inspectionRepository.deleteOrderInspection(orderId);
    this.notificationService.createNotificationCarriers(orderId);
    return {
      success: true,
    };
  }

  private async getOrderExactDistance(
    pickUpLocation: LocationDTO,
    deliveryLocation: LocationDTO,
  ): Promise<number | null> {
    if (
      !pickUpLocation.lat ||
      !pickUpLocation.lon ||
      !deliveryLocation.lat ||
      !deliveryLocation.lon
    ) {
      return null;
    }

    return await this.calcService.getPointsDistance(
      { lat: pickUpLocation.lat, lon: pickUpLocation.lon },
      { lat: deliveryLocation.lat, lon: deliveryLocation.lon },
    );
  }

  private async getLocationFilter(
    location?: string,
  ): Promise<{
    point: LocationPointDTO;
    radius: number;
    unit?: string;
  } | null> {
    if (!location) {
      return null;
    }
    let locationObject = null;
    try {
      locationObject = JSON.parse(location);
    } catch (e) {
      throw new BadRequestException(`Invalid json at ${e.message}`);
    }
    const foundLocation = await this.hereService.geocode({
      searchtext: `${locationObject.city} ${locationObject.state}`,
    });
    return {
      point: {
        lat: path([0, 'lat'], foundLocation),
        lon: path([0, 'lon'], foundLocation),
      },
      radius: Number(locationObject.radius),
      unit: locationObject.unit,
    };
  }

  private groupOrderResult(orders: OrderDTO[]): OrderDTO[] {
    const groupedOrders = {};
    orders.map(order => {
      const cityKey = `${order.pickLocation.city} - ${
        order.deliveryLocation.city
        }`;
      if (!groupedOrders.hasOwnProperty(cityKey)) {
        groupedOrders[cityKey] = [];
      }
      groupedOrders[cityKey].push(order);
    });

    return Object.values(groupedOrders);
  }

  public async recalculateRoute(
    tripIds: number[],
    orderRepository: OrderRepository = this.orderRepository,
    tripRepository: TripRepository = this.tripRepository,
  ) {
    for (const tripId of tripIds) {
      const orders = await orderRepository.getOrdersByTrip(tripId);
      let data = {
        totalPrice: 0,
        route: null,
        distance: 0,
        pickLocationId: null,
        deliveryLocationId: null,
      };
      if (orders && orders.length) {
        const result = await this.hereService.calculateRouteTrip(orders);
        data = {
          totalPrice: result.totalPrice,
          route: result.route,
          distance: result.distance,
          pickLocationId: result.pickLocationId,
          deliveryLocationId: result.deliveryLocationId,
        };
      }
      await tripRepository.update(tripId, {
        ...data,
      });
    }
  }

  @Transaction()
  public async deleteFromTrip(
    orderIds: number[],
    where: { id: number; companyId: number; dispatcherId?: number },
    @TransactionRepository(OrderRepository) orderRepository?: OrderRepository,
    @TransactionRepository(TripRepository) tripRepository?: TripRepository,
    @TransactionRepository(OrderToTripEntity) orderTripRepository?: Repository<OrderToTripEntity>,
  ): Promise<SuccessDTO> {
    const trip = await tripRepository.getTrip(where);

    if (!trip) {
      throw new BadRequestException(`Trip not found for id ${where.id}`);
    }

    const orderTrips = await orderTripRepository.find({
      orderId: In(orderIds),
      tripId: trip.id,
    });
    await orderTripRepository.remove(orderTrips);
    await this.recalculateRoute([where.id], orderRepository, tripRepository);
    orderIds.forEach(id => {
      this.notificationService.createNotificationCarriers(id);
    });
    this.notificationService.create({
      type: DRIVER_NOTIFICATION_TYPES.ORDER_REMOVED,
      actions: [],
      title: `Orders removed from trip`,
      content: `From trip #${trip.id} removed orders`,
      targetUserId: trip.driverId,
    });
    return { success: true };
  }

  public async checkDriverIsNearOrderToPickUp(
    driver: AccountEntity,
    location: DriverLocationDTO,
  ): Promise<void> {
    const order = await this.orderRepository.getDriverOrderOnWayToPickUp(
      driver.id,
    );
    if (!order) {
      return;
    }
    const distance = await this.calcService.getPointsDistance(
      location,
      order.pickLocation,
    );
    if (distance < 1) {
      await this.orderRepository.update(order.id, {
        status: ORDER_STATUS.ON_PICKUP,
      });
      await this.notificationService.create({
        type: CLIENT_NOTIFICATION_TYPES.ON_PICK_UP,
        actions: [],
        additionalInfo: order.id.toString(),
        title: `Driver is on pick up`,
        content: `Driver arrived to pick up your vehicle`,
        targetUserId: order.createdById,
      });
    }
  }

  public async checkDriverIsNearOrderToDelivery(
    driver: AccountEntity,
    location: DriverLocationDTO,
  ): Promise<void> {
    const order = await this.orderRepository.getDriverOrderOnWayToDelivery(
      driver.id,
    );
    if (!order) {
      return;
    }
    const distance = await this.calcService.getPointsDistance(
      location,
      order.pickLocation,
    );
    if (distance < 1) {
      await this.orderRepository.update(order.id, {
        status: ORDER_STATUS.ON_DELIVERY,
      });
      await this.notificationService.create({
        type: CLIENT_NOTIFICATION_TYPES.ON_DELIVERY,
        actions: [],
        additionalInfo: order.id.toString(),
        title: `Driver is on delivery`,
        content: `Driver arrived to deliver your vehicle`,
        targetUserId: order.createdById,
      });
    }
  }

  public async getDriverByOrder(
    account: AccountEntity,
    orderId: number,
  ): Promise<DriverLocationPartialDTO> {
    const driver = await this.orderRepository.getDriverByOrder(
      account.id,
      orderId,
    );

    if (!driver) {
      throw new NotFoundException(
        `The order ${orderId} does not exist or doesn't have an attached driver`,
      );
    }
    return driver;
  }

  public async requestInspectionSignature(
    orderId: number,
    driver: AccountEntity,
    inspectionType: string,
    requestSignature: boolean,
  ): Promise<SuccessResponseDTO> {
    const connection = getConnection();
    const queryRunner = connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const orderRepository = queryRunner.manager.getCustomRepository(OrderRepository);
      const inspectionRepository = queryRunner.manager.getCustomRepository(InspectionRepository);
      const locationRepository = queryRunner.manager.getRepository(LocationEntity);

      const trip = await orderRepository.getOrderTrip(orderId);
      if (!trip || (trip && driver.id !== trip.driverId)) {
        throw new BadRequestException(
          `No active order found for id ${orderId} assigned to driver`,
        );
      }

      const order = await orderRepository.findOne(orderId, {
        relations: ['cars'],
      });
      if (
        order.status !== ORDER_STATUS.ON_PICKUP &&
        order.status !== ORDER_STATUS.ON_DELIVERY
      ) {
        throw new BadRequestException(
          `Order ${orderId} is not on pick up or on delivery`,
        );
      }

      if (inspectionType === INSPECTION_TYPE.DELIVERY) {
        let driverLocation;
        if (this.configService.environment === 'dev') {
          driverLocation = {
            lat: '37.785834',
            lon: '-122.406417',
          };
        } else {
          driverLocation = await this.driverLocationRepository.findOne(
            { driverId: trip.driverId },
            { order: { createdAt: 'DESC' } },
          );
        }
        try {
          await this.clonePickUpToDeliverySignatures(order, driverLocation, inspectionRepository, locationRepository);
        } catch (e) {
          throw new BadRequestException(e && e.message);
        }
      }

      const inspections = await inspectionRepository.find({
        orderId: order.id,
        status: INSPECTION_STATUS.FINISHED,
        type: inspectionType,
      });
      if (
        !inspections ||
        !order.cars ||
        (inspections && order.cars && inspections.length !== order.cars.length)
      ) {
        throw new BadRequestException(
          `Not all cars from order ${orderId} have finished inspection. Please finish inspections first.`,
        );
      }

      await orderRepository.update(orderId, {
        status: ORDER_STATUS.SIGNATURE_REQUESTED,
        updatedAt: new Date(),
        preStatus: order.status,
      });
      await inspectionRepository.update(
        { orderId: order.id, type: inspectionType },
        {
          status: INSPECTION_STATUS.SIGNATURE_REQUESTED,
          updatedAt: new Date(),
        },
      );
      await queryRunner.commitTransaction();

      if (requestSignature) {
        this.notificationService.create({
          type: CLIENT_NOTIFICATION_TYPES.ORDER_SIGNATURE_REQUESTED,
          actions: [
            CLIENT_NOTIFICATION_ACTIONS.CLOSE_NOTIFICATION,
            CLIENT_NOTIFICATION_ACTIONS.SHOW_ORDER_CAR_LIST,
          ],
          title: `Driver requested a signature`,
          content: `You Received a Request to Sign ${inspectionType} Confirmation for order ${order.uuid}`,
          additionalInfo: orderId.toString(),
          targetUserId: order.createdById,
        });
      }

      return {
        message: `Signature requested for order ${orderId}`,
      };
    } catch (e) {
      await queryRunner.rollbackTransaction();
      throw e;
    } finally {
      await queryRunner.release();
    }
  }

  public async signInspectionClient(
    orderId: number,
    data: SignPickUpRequest,
    query: any = {},
  ): Promise<SuccessResponseDTO> {
    const connection = getConnection();
    const queryRunner = connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    const orderRepository = queryRunner.manager.getCustomRepository(OrderRepository);
    const inspectionRepository = queryRunner.manager.getCustomRepository(InspectionRepository);

    const order = await orderRepository.findOne({
      id: orderId,
      status: In([ORDER_STATUS.SIGNATURE_REQUESTED, ORDER_STATUS.ON_PICKUP]),
      ...query.where,
    });

    if (!order) {
      await queryRunner.rollbackTransaction();
      throw new BadRequestException(
        `No order in Signature Requested found for id ${orderId}`,
      );
    }

    const changedStatus = await this.signInspection(
      order,
      data,
      queryRunner.manager,
    );

    const inspection = await inspectionRepository.findOne({
      orderId: order.id,
      type: data.inspectionType,
    });

    await queryRunner.commitTransaction();

    if ([ORDER_STATUS.DELIVERED as string, ORDER_STATUS.CLAIMED as string].includes(changedStatus)) {
      this.actionsOrderDelivered(order.id);
    }

    this.notificationService.create({
      type: DRIVER_NOTIFICATION_TYPES.ORDER_SIGNED,
      actions: [],
      title: `Order signed`,
      content: `Order #${order.uuid} was successfully signed by ${data.firstName} ${data.lastName}`,
      targetUserId: inspection.driverId,
      additionalInfo: order.id.toString(),
    });

    await queryRunner.release();
    return {
      message: `Order #${orderId} was successfully signed`,
      status: changedStatus,
    };

  }

  public async signInspectionDriverApp(
    orderId: number,
    driver: AccountEntity,
    data: SignPickUpRequest,
  ): Promise<SuccessResponseDTO> {
    const connection = getConnection();
    const queryRunner = connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    const orderRepository = queryRunner.manager.getCustomRepository(OrderRepository);

    const order = await orderRepository.findOne(
      {
        id: orderId,
        status: ORDER_STATUS.SIGNATURE_REQUESTED,
      },
      { relations: ['createdBy'] },
    );
    if (!order) {
      await queryRunner.rollbackTransaction();
      throw new BadRequestException(
        `No order in Signature Requested found for id ${orderId}`,
      );
    }

    const trip = await orderRepository.getOrderTrip(orderId);
    if (!trip || trip.driverId !== driver.id) {
      await queryRunner.rollbackTransaction();
      throw new BadRequestException(`No order found for #${orderId}`);
    }

    const changedStatus = await this.signInspection(
      order,
      data,
      queryRunner.manager,
    );
    await queryRunner.commitTransaction();

    if ([ORDER_STATUS.DELIVERED as string, ORDER_STATUS.CLAIMED as string].includes(changedStatus)) {
      this.actionsOrderDelivered(order.id);
    }

    if (
      order.createdBy.firstName !== data.firstName ||
      order.createdBy.lastName !== data.lastName
    ) {
      this.notificationService.create({
        type: CLIENT_NOTIFICATION_TYPES.ORDER_SIGNED,
        actions: [],
        title: `Order signed`,
        content: `Order #${order.uuid} was successfully signed by ${data.firstName} ${data.lastName}`,
        additionalInfo: order.id.toString(),
        targetUserId: order.createdById,
      });
    }
    await queryRunner.release();
    return {
      message: `Order # ${orderId} was successfully signed`,
      status: changedStatus,
    };
  }

  private async signInspection(
    order: OrderEntity,
    data: SignPickUpRequest,
    transactionalEntityManager: EntityManager,
  ): Promise<string> {

    const nextStatus: any =
      data.inspectionType === INSPECTION_TYPE.PICKUP
        ? ORDER_STATUS.PICKED_UP
        : (order.preStatus === ORDER_STATUS.DECLINED ? ORDER_STATUS.CLAIMED : ORDER_STATUS.DELIVERED);

    if (
      ORDER_STATUS.PICKED_UP === nextStatus &&
      order.source === ORDER_SOURCE.INTERNAL &&
      order.clientPaymentStatus !== CLIENT_PAYMENT_STATUSES.CAR_PICKUP_PAID &&
      !order.paymentDelivery
    ) {
      try {
        await this.chargeOrder(order);
      } catch (e) {
        throw new BadRequestException(`could not charge order #${order.uuid}, error ${e && e.message ? e.message : e}`);
      }
    }

    await transactionalEntityManager.getCustomRepository(OrderRepository).update(order.id, {
      status: nextStatus,
      updatedAt: new Date(),
      preStatus: null,
    });

    const location = await this.locationService.save(data.signLocation, transactionalEntityManager.getRepository(LocationEntity));
    delete data.signLocation;
    await transactionalEntityManager.getCustomRepository(InspectionRepository).update(
      { orderId: order.id, type: data.inspectionType },
      {
        signatureUrl: data.signatureUrl,
        signedBy: {
          firstName: data.firstName,
          lastName: data.lastName,
          source: data.source,
        },
        signedAt: new Date(),
        status: INSPECTION_STATUS.SIGNED,
        updatedAt: new Date(),
        signLocationId: location.id,
      },
    );

    this.notificationService.createNotificationAdmin(order.id);
    this.notificationService.createNotificationCarriers(order.id);
    this.notificationService.create({
      type: CLIENT_NOTIFICATION_TYPES.ORDER_PICKED_UP,
      actions: [],
      title: `Order is picked up`,
      content: `Order #${order.uuid} is picked up`,
      targetUserId: order.createdById,
    });
    return nextStatus;
  }

  private async verifyOrderTrip(orderId: number, orderRepository?: OrderRepository, tripRepository?: TripRepository) {
    const trip = await this.orderRepository.getOrderTrip(orderId);
    if (trip) {
      await this.recalculateRoute([trip.id], orderRepository, tripRepository);
    }
  }

  public async sendBOL(
    orderId: number,
    email: string,
    query: any = {},
  ): Promise<SuccessResponseDTO> {
    const order = await this.orderRepository.getOrderForBOL(orderId, query);

    if (!order) {
      throw new BadRequestException(`Order not found for id ${orderId}`);
    }
    let signedBOL: string;
    try {
      if (!order.bolUrl) {
        const bol = await this.pdfGenerationService.generateBOL(order, {
          domain: this.configService.apiDomain,
        });
        const filename = `bol-${Date.now().toString()}.pdf`;
        await uploadBufferFile(bol, filename, {
          ContentType: 'application/pdf',
        });
        await this.orderRepository.update(orderId, { bolUrl: filename });
        order.bolUrl = filename;
      }

      signedBOL = fileSign(order.bolUrl);
      const file = await Axios.request({
        responseType: 'arraybuffer',
        url: signedBOL,
        method: 'get',
      });
      await this.mailService.sendEmail({
        from: `no-reply@${this.configService.email.domain}`,
        to: email,
        subject: `BOL for order ${order.uuid}`,
        html: `Hello, See the BOL attached`,
        attachment: [{ fileName: order.bolUrl, data: file.data }],
      });
    } catch (e) {
      throw new BadRequestException(`Send BOL Error: ${e || e.message}`);
    }

    return { message: signedBOL };
  }

  public async getBOLLink(
    orderId: number,
    query: any = {},
  ): Promise<SuccessResponseDTO> {
    const order = await this.orderRepository.getOrderForBOL(orderId, query);

    if (!order) {
      throw new BadRequestException(`Order not found for id ${orderId}`);
    }
    let signedBOL: string;
    try {
      if (!order.bolUrl) {
        const bol = await this.pdfGenerationService.generateBOL(order, {
          domain: this.configService.apiDomain,
        });
        const filename = `bol-${Date.now().toString()}.pdf`;
        await uploadBufferFile(bol, filename, {
          ContentType: 'application/pdf',
        });
        await this.orderRepository.update(orderId, { bolUrl: filename });
        order.bolUrl = filename;
      }

      signedBOL = fileSign(order.bolUrl);
      await Axios.request({
        responseType: 'arraybuffer',
        url: signedBOL,
        method: 'get',
      });
    } catch (e) {
      throw new BadRequestException(`generate BOL Error: ${e || e.message}`);
    }

    return { message: signedBOL };
  }

  public async sendReceipt(
    orderId: number,
    email: string,
    query: any = {},
  ): Promise<SuccessResponseDTO> {
    const order = await this.orderRepository.getOrderForReceipt(orderId, query);

    if (!order) {
      throw new BadRequestException(`Order not found for id ${orderId}`);
    }
    if (!order.receiptUrl) {
      const receipt = await this.pdfGenerationService.generateReceipt(order, {
        domain: this.configService.apiDomain,
      });
      const filename = `invoice-receipt-${Date.now().toString()}.pdf`;
      await uploadBufferFile(receipt, filename, {
        ContentType: 'application/pdf',
      });
      await this.orderRepository.update(orderId, { receiptUrl: filename });
      order.receiptUrl = filename;
    }

    const signedReceipt = fileSign(order.receiptUrl);
    const file = await Axios.request({
      responseType: 'arraybuffer',
      url: signedReceipt,
      method: 'get',
    });
    await this.mailService.sendEmail({
      from: `no-reply@${this.configService.email.domain}`,
      to: email,
      subject: `Invoice Receipt for order ${orderId}`,
      html: `Hello, See the Invoice Receipt attached`,
      attachment: [{ fileName: order.receiptUrl, data: file.data }],
    });

    return { message: signedReceipt };
  }

  public async sendInvoice(
    orderId: number,
    data: SendInvoiceRequestDTO,
    query: any = {},
  ): Promise<SuccessResponseDTO> {
    let signedInvoice = null;
    try {
      const order = await this.orderRepository.getOrderForBOL(orderId, query);

      if (!order) {
        throw new BadRequestException(`Order not found for id ${orderId}`);
      }
      if (!order.invoiceUrl) {
        const invoice = await this.pdfGenerationService.generateInvoice(order, {
          domain: this.configService.apiDomain,
        });
        const filename = `invoice-${Date.now().toString()}.pdf`;
        await uploadBufferFile(invoice, filename, {
          ContentType: 'application/pdf'
        });
        await this.orderRepository.update(orderId, { invoiceUrl: filename });
        order.invoiceUrl = filename;
      }
      if (!order.bolUrl) {
        const bol = await this.pdfGenerationService.generateBOL(order, {
          domain: this.configService.apiDomain,
        });
        const filename = `bol-${Date.now().toString()}.pdf`;
        await uploadBufferFile(bol, filename, {
          ContentType: 'application/pdf',
        });
        await this.orderRepository.update(orderId, { bolUrl: filename });
        order.bolUrl = filename;
      }

      const signedBOL = fileSign(order.bolUrl);
      signedInvoice = fileSign(order.invoiceUrl);
      const bol = await Axios.request({
        responseType: 'arraybuffer',
        url: signedBOL,
        method: 'get',
      });
      const invoice = await Axios.request({
        responseType: 'arraybuffer',
        url: signedInvoice,
        method: 'get',
      });

      await this.mailService.sendEmail({
        from: `no-reply@${this.configService.email.domain}`,
        to: data.email,
        subject: `Invoice for order #${order.uuid}`,
        html: `Hello, Invoice and BOL for Order #${order.uuid}`,
        attachment: [
          { fileName: order.bolUrl, data: bol.data },
          { fileName: order.invoiceUrl, data: invoice.data },
        ],
      });

      await this.orderRepository.update(orderId, {
        status: ORDER_STATUS.BILLED,
        invoiceDueDate: order.invoiceDueDate || data.dueDate || new Date(),
      });
      this.notificationService.createNotificationCarriers(orderId);
    } catch (e) {
      throw new BadRequestException(`Send Invoice Error: ${e && e.message ? e.message : e}`);
    }

    return { message: signedInvoice };
  }

  public async getInvoiceLink(
    orderId: number,
    query: any = {},
  ): Promise<SuccessResponseDTO> {
    let signedInvoice = null;
    const order = await this.orderRepository.getOrderForBOL(orderId, query);

    if (!order) {
      throw new BadRequestException(`Order not found for id ${orderId}`);
    }
    try {
      if (!order.invoiceUrl) {
        const invoice = await this.pdfGenerationService.generateInvoice(order, {
          domain: this.configService.apiDomain,
        });
        const filename = `invoice-${Date.now().toString()}.pdf`;
        await uploadBufferFile(invoice, filename, {
          ContentType: 'application/pdf',
        });
        await this.orderRepository.update(orderId, { invoiceUrl: filename });
        order.invoiceUrl = filename;
      }

      signedInvoice = fileSign(order.invoiceUrl);
    } catch (e) {
      throw new BadRequestException(`Send Invoice Error: ${e && e.message ? e.message : e}`);
    }

    return { message: signedInvoice };
  }

  public async getReceiptLink(
    orderId: number,
    query: any = {},
  ): Promise<SuccessResponseDTO> {
    let signedReceipt = null;
    const order = await this.orderRepository.getOrderForReceipt(orderId, query);

    if (!order) {
      throw new BadRequestException(`Order not found for id ${orderId}`);
    }

    try {
      if (!order.receiptUrl) {
        const receipt = await this.pdfGenerationService.generateReceipt(order, {
          domain: this.configService.apiDomain,
        });
        const filename = `invoice-receipt-${Date.now().toString()}.pdf`;
        await uploadBufferFile(receipt, filename, {
          ContentType: 'application/pdf',
        });
        await this.orderRepository.update(orderId, { receiptUrl: filename });
        order.receiptUrl = filename;
      }

      signedReceipt = fileSign(order.receiptUrl);
    } catch (e) {
      throw new BadRequestException(`Get Receipt Error: ${e && e.message ? e.message : e}`);
    }

    return { message: signedReceipt };
  }

  private async clonePickUpToDeliverySignatures(
    order: OrderEntity,
    driverLocation: DriverLocationEntity,
    inspectionRepository: InspectionRepository = this.inspectionRepository,
    locationRepository?: Repository<LocationEntity>,
  ): Promise<void> {
    const pickupInspections = await inspectionRepository.find({
      relations: ['details'],
      where: {
        orderId: order.id,
        status: INSPECTION_STATUS.SIGNED,
        type: INSPECTION_TYPE.PICKUP,
      },
    });
    let deliveryInspections = await inspectionRepository.find({
      orderId: order.id,
      type: INSPECTION_TYPE.DELIVERY,
    });
    if (!deliveryInspections || !deliveryInspections.length) {
      let address = await this.hereService.reverseGeocode({
        prox: `${driverLocation.lat},${driverLocation.lon}`,
        mode: 'retrieveAddresses',
        maxresults: '1',
      });

      address = await this.locationService.save(address[0] as LocationDTO, locationRepository);
      deliveryInspections = pickupInspections.map(pickupInspection => {
        const deliveryInspection = pickupInspection;
        delete deliveryInspection.id;
        delete deliveryInspection.signedAt;
        delete deliveryInspection.signLocationId;
        deliveryInspection.createdLocationId = address.id;
        delete deliveryInspection.signedBy;
        delete deliveryInspection.signatureUrl;
        if (pickupInspection.details) {
          deliveryInspection.details = pickupInspection.details.map(
            inspectionDetails => {
              delete inspectionDetails.id;
              return inspectionDetails;
            },
          );
        }
        deliveryInspection.status = INSPECTION_STATUS.FINISHED;
        deliveryInspection.type = INSPECTION_TYPE.DELIVERY;

        return deliveryInspection;
      });
      await inspectionRepository.save(deliveryInspections);
    }
  }

  private actionsOrderDelivered(orderId: number, tripId?: number) {
    this.createInspectionPhotosZip(orderId);
    this.completedTrip(orderId, tripId);
  }

  private async completedTrip(orderId: number, tripId?: number) {
    if (!tripId) {
      const trip = await this.orderRepository.getOrderTrip(orderId);
      tripId = trip.id;
    }
    const count = await this.orderRepository.countTripNoDeliveredOrders(tripId);
    if (!count) {
      this.tripRepository.update(tripId, {
        status: TRIP_STATUS.COMPLETED,
        updatedAt: new Date(),
      });
    }
  }

  public async isAssignToDriver(
    orderId: number,
    driverId: number,
  ): Promise<number> {
    return await this.orderRepository.isAssignToDriver(orderId, driverId);
  }

  public async markPaid(
    orderId: number,
    paymentMethod: string = null,
    query: any = {},
  ): Promise<SuccessResponseDTO> {
    const order = await this.orderRepository.getOrder(orderId, [], query);

    if (!order) {
      throw new BadRequestException(
        `Order not found for id ${orderId} or doesn't have the status ${
        ORDER_STATUS.DELIVERED
        }`,
      );
    }

    await this.orderRepository.update(order.id, {
      status: ORDER_STATUS.PAID,
      updatedAt: new Date(),
      invoicePaidDate: new Date(),
      paymentMethods: paymentMethod || order.paymentMethods,
    });

    this.notificationService.createNotificationCarriers(order.id);
    return { message: 'success' };
  }

  @Transaction()
  public async archiveOrder(
    account: AccountEntity,
    orderId: number,
    query: any = {},
    @TransactionRepository(OrderRepository) orderRepository?: OrderRepository,
    @TransactionRepository(TripRepository) tripRepository?: TripRepository,
  ): Promise<SuccessResponseDTO> {
    const order = await orderRepository.getOrder(orderId, [], query);

    if (!order) {
      throw new BadRequestException(`Order not found for id ${orderId}`);
    }
    let updateOrder: any = {
      status: ORDER_STATUS.ARCHIVED,
      updatedAt: new Date(),
    };
    if (account.roleId === ROLES.SUPER_ADMIN) {
      updateOrder = { ...updateOrder, hiddenForAdmin: true };
    } else {
      updateOrder = { ...updateOrder, hiddenForCompnay: true };
    }
    await orderRepository.update(order.id, updateOrder);

    this.verifyOrderTrip(order.id, orderRepository, tripRepository);

    return { message: 'success' };
  }

  @Transaction()
  public async saveImportedOrder(
    account: AccountEntity,
    orderPdfFile: FileDTO,
    parser: OrderParserInterface,
    tripId: number,
    @TransactionRepository(OrderRepository) orderRepository?: OrderRepository,
    @TransactionRepository(VirtualAccountEntity) virtualAccountRepository?: Repository<VirtualAccountEntity>,
    @TransactionRepository(LocationEntity) locationRepository?: Repository<LocationEntity>,
    @TransactionRepository(ShipperEntity) shipperRepository?: Repository<ShipperEntity>,
    @TransactionRepository(CarRepository) carRepository?: CarRepository,
    @TransactionRepository(OrderToTripEntity) orderTripRepository?: Repository<OrderToTripEntity>,
    @TransactionRepository(OrderAttachmentRepository) orderAttachmentRepository?: OrderAttachmentRepository,
    @TransactionRepository(TripRepository) tripRepository?: TripRepository,
  ): Promise<OrderEntity> {
    const orderBuilder = new ImportOrderBuilder(this.hereService, parser);
    let newOrder = null;
    await orderBuilder.setPickUpLocation();
    await orderBuilder.setDeliveryLocation();

    try {
      await orderBuilder.setDispatchInstructions();
      await orderBuilder.setPickUpInstructions();
      await orderBuilder.setDeliveryInstructions();
      await orderBuilder.setExternalId();
      await orderBuilder.setShipper();
      await orderBuilder.setSender();
      await orderBuilder.setReceiver();
      await orderBuilder.setCars();
      await orderBuilder.build(account.companyId);
      const order = orderBuilder.getOrder();

      const [
        pickup,
        delivery,
        sender,
        receiver,
        shipper,
        distance,
      ] = await Promise.all([
        order.pickLocation ? await this.locationService.save(order.pickLocation, locationRepository) : null,
        order.deliveryLocation ? await this.locationService.save(order.deliveryLocation, locationRepository) : null,
        order.sender ? await virtualAccountRepository.save(order.sender) : null,
        order.receiver ? await virtualAccountRepository.save(order.receiver) : null,
        await shipperRepository.save(order.shipper),
        order.pickLocation && order.deliveryLocation ? await this.calcService.getDistance(
          order.pickLocation.zipCode,
          order.deliveryLocation.zipCode,
        ) : 0,
      ]);
      if (account.roleId === ROLES.DISPATCHER) {
        order.dispatcherId = account.id;
      }

      const exactDistance = pickup && delivery ? await this.getOrderExactDistance(pickup, delivery) : 0;
      let dataOrder = {
        ...order,
        distance,
        exactDistance,
        status: order.status || ORDER_STATUS.DISPATCHED,
        shipper,
        sender,
        receiver,
        createdById: account.id,
        uuid: shortid.generate(),
      };
      if (pickup && pickup.id) {
        dataOrder = { ...dataOrder, pickLocation: pickup };
      }
      if (delivery && delivery.id) {
        dataOrder = { ...dataOrder, deliveryLocation: delivery };
      }

      newOrder = await orderRepository.save(dataOrder);

      const fileName = `imported-order-${
        newOrder.id
        }-${Date.now().toString()}.pdf`;
      await uploadBufferFile(orderPdfFile.buffer, fileName);
      let orderAttachment = new OrderAttachmentEntity();
      orderAttachment.path = fileName;
      orderAttachment.displayName = fileName;
      orderAttachment.orderId = newOrder.id;
      orderAttachment = await orderAttachmentRepository.save(
        orderAttachment,
      );
      orderAttachment.path = fileSign(orderAttachment.path);
      newOrder.attachments = [orderAttachment];

      order.cars.map(car => (car.orderId = newOrder.id));
      const types: any[] = [...new Set(order.cars.map(car => car.type))];

      // tslint:disable-next-line: prefer-for-of
      for (let i = 0; i < types.length; i++) {
        const type = types[i];
        const policy = await this.policyRepository.findOne({ type });
        if (!policy) {
          await this.policyRepository.save({ type, price: 1 });
        }
      }
      newOrder.cars = await carRepository.save(order.cars);

      if (tripId) {
        await Promise.all([
          await orderTripRepository.save({ tripId, orderId: newOrder.id }),
          await this.recalculateRoute([tripId], orderRepository, tripRepository),
        ]);
      }
      this.notificationService.createNotificationCarriers(newOrder.id, account);
    } catch (e) {
      throw new BadRequestException(`Import Order Error: ${e && e.message ? e.message : e}`);
    }

    return newOrder;
  }

  public async createInspectionPhotosZip(orderId: number): Promise<void> {
    const order = await this.orderRepository.getOrderForBOL(orderId, {});

    if (!order) {
      throw new BadRequestException(`Order not found for id ${orderId}`);
    }
    await this.inspectionPhotosService.createPhotos(order);
  }

  public async getInspectionPhotosZip(orderId: number): Promise<string> {
    const order = await this.orderRepository.findOne(orderId);

    if (!order) {
      throw new BadRequestException(`Order not found for id ${orderId}`);
    }

    return fileSign(`order-${order.id}.zip`);
  }

  public async getGeneralReport(where: any): Promise<GeneralReportDTO> {
    return await this.orderRepository.getGeneralReport(where);
  }

  public async getByShipperReport(
    query: ReportsByShipperRequestDTO,
  ): Promise<GetReportsByShipperResponse> {
    return await this.orderRepository.getByShipperReport(query);
  }

  public async sendCustomReport(
    fields: OrdersCustomReportFields,
    query: OrdersCustomReportFilters = {},
  ): Promise<SuccessDTO> {
    const selectedFields = [];
    Object.keys(fields).map(group => {
      Object.keys(fields[group]).map(field => {
        if (
          fields[group][field] &&
          OrdersCustomReportMapper[group] &&
          OrdersCustomReportMapper[group][field]
        ) {
          selectedFields.push(OrdersCustomReportMapper[group][field]);
        }
      });
    });

    query.orderByField =
      OrdersCustomReportOrderByMapper[query.orderByField] || null;

    const report = await this.orderRepository.getCustomReport(
      selectedFields.join(','),
      query || {},
    );
    try {
      const folderPath = nodepath.join(
        __dirname,
        `../../../upload/company-${moment().unix()}`,
      );
      const csvData = csvjson.toCSV(report, { headers: 'relative' });

      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath);
      }

      fs.writeFileSync(`${folderPath}/report.csv`, csvData);
      await FileService.createZip(folderPath);
      const dataBuffer = fs.readFileSync(`${folderPath}.zip`);
      await this.mailService.sendEmail({
        from: `no-reply@${this.configService.email.domain}`,
        to: fields.emailAddress,
        subject: `Custom Report`,
        html: `Hello, See the report archive attached`,
        attachment: [{ fileName: `Report.zip`, data: dataBuffer }],
      });
      rimraf.sync(folderPath);
      fs.unlinkSync(`${folderPath}.zip`);
    } catch (e) {
      throw new BadRequestException(
        `Send Custom Report Error: ${e.message || e}`,
      );
    }

    return { success: true };
  }

  private async chargeOrder(order: OrderEntity): Promise<void> {
    try {
      await this.transactionService.chargeOrder(order);
      await this.orderRepository.update(order.id, {
        clientPaymentStatus: CLIENT_PAYMENT_STATUSES.CAR_PICKUP_PAID,
      });
    } catch (e) {
      await this.orderRepository.update(order.id, {
        clientPaymentStatus: CLIENT_PAYMENT_STATUSES.CAR_PICKUP_FAILED,
      });
      const driver = await this.orderRepository.getDriverByOrder(
        order.createdById,
        order.id,
      );
      const err = e && e.message;

      await this.accountRepository.update(order.createdById, { paymentFailed: true });
      this.notificationService.create({
        type: CLIENT_NOTIFICATION_TYPES.ORDER_PAYMENT_FAILED,
        actions: [],
        title: `Order payment fails`,
        content: `Payment for order #${order.uuid} FAILED, reason ${err && err.message ? err.message : err}`,
        additionalInfo: order.id.toString(),
        targetUserId: order.createdById,
      });
      this.notificationService.create({
        type: CLIENT_NOTIFICATION_TYPES.ORDER_PAYMENT_FAILED,
        actions: [],
        title: `Order payment fails`,
        content: `Payment for order #${order.uuid} FAILED, reason ${err && err.message ? err.message : err}`,
        additionalInfo: order.id.toString(),
        targetUserId: driver.id,
      });
      throw new BadRequestException(e && e.message ? e.message : e);
    }
  }

  public async getOrderCount(where: any): Promise<number> {
    return this.orderRepository.count(where);
  }

  @Transaction()
  public async createDeliveryInspection(
    orderId: number,
    accountId: number,
    @TransactionRepository(OrderRepository) orderRepository?: OrderRepository,
    @TransactionRepository(InspectionRepository) inspectionRepository?: InspectionRepository,
    @TransactionRepository(LocationEntity) locationRepository?: Repository<LocationEntity>,
  ): Promise<InspectionDTO[]> {
    const order = await orderRepository.findOne({ id: orderId, createdById: accountId }, {
      relations: ['orderTrips', 'orderTrips.trip', 'inspections', 'inspections.details', 'cars'],
    });

    if (ORDER_STATUS.SIGNATURE_REQUESTED === order.status && order.inspections.length > order.cars.length) {
      return order.inspections;
    }

    if (![ORDER_STATUS.ON_DELIVERY.toString(),
    ORDER_STATUS.ON_WAY_TO_DELIVERY.toString(),
    ORDER_STATUS.PICKED_UP.toString()].includes(order.status)) {
      throw new BadRequestException(
        `Order ${orderId} is not on delivery`,
      );
    }

    if (order.orderTrips && order.orderTrips.length) {
      const [orderTrip] = order.orderTrips;
      const { trip } = orderTrip;
      let driverLocation;
      if (this.configService.environment === 'dev') {
        driverLocation = {
          lat: '37.785834',
          lon: '-122.406417',
        };
      } else {
        driverLocation = await this.driverLocationRepository.findOne(
          { driverId: trip.driverId },
          { order: { createdAt: 'DESC' } },
        );
      }
      try {
        await this.clonePickUpToDeliverySignatures(order, driverLocation, inspectionRepository, locationRepository);
      } catch (e) {
        throw new BadRequestException(e && e.message);
      }
    }
    await orderRepository.update(orderId, {
      status: ORDER_STATUS.SIGNATURE_REQUESTED,
      updatedAt: new Date(),
    });

    await inspectionRepository.update(
      { orderId, type: INSPECTION_TYPE.DELIVERY },
      {
        status: INSPECTION_STATUS.SIGNATURE_REQUESTED,
        updatedAt: new Date(),
      },
    );

    const inspections = await inspectionRepository.getInspections({ orderId });
    return inspections.map(inspection => {
      return {
        ...inspection,
        images: inspection.images ? inspection.images.map(item => ({ ...item, signedUrl: fileSign(item.url) })) : [],
      };
    });
  }

  public async lateDate() {
    const query = {
      status: Not(In([
        ORDER_STATUS.DECLINED,
        ORDER_STATUS.CLAIMED,
        ORDER_STATUS.DELIVERED,
        ORDER_STATUS.ARCHIVED,
        ORDER_STATUS.CANCELED,
        ORDER_STATUS.BILLED,
        ORDER_STATUS.PAID,
        ORDER_STATUS.DELETED,
      ])),
      published: true,
      companyId: Not(IsNull()),
      hiddenForAdmin: false,
      hiddenForCompnay: false
    };
    const ordersLateDelivery = await this.orderRepository.getOrdersLateDate({
      deliveryDate: LessThan(new Date()),
      ...query,
    });
    const lateDeliveryIds = ordersLateDelivery.map(item => item.id);
    let queryDelivery: any = {
      pickDate: LessThan(new Date()),
      ...query,
    };
    if (lateDeliveryIds.length) {
      queryDelivery = { ...queryDelivery, id: Not(In(lateDeliveryIds)) };
    }
    const ordersLatePickUp = await this.orderRepository.getOrdersLateDate(queryDelivery);
    const additionalInfo = 'lateDate';
    lateDeliveryIds.forEach(id => {
      this.notificationService.createNotificationAdmin(id, additionalInfo);
      this.notificationService.createNotificationCarriers(id, null, additionalInfo);
    });
    ordersLatePickUp.forEach(item => {
      this.notificationService.createNotificationAdmin(item.id, additionalInfo);
      this.notificationService.createNotificationCarriers(item.id, null, additionalInfo);
    });
  }

  async chargeOrdersFailed(createdById: number): Promise<void> {
    const orders = await this.orderRepository.find({
      createdById,
      clientPaymentStatus: In([CLIENT_PAYMENT_STATUSES.CAR_PICKUP_FAILED]),
      paymentDelivery: false,
    });
    orders.forEach(async (order) => {
      try {
        await this.chargeOrder(order);
        this.notificationService.create({
          type: CLIENT_NOTIFICATION_TYPES.ORDER_PAYMENT_SUCCES,
          actions: [],
          title: `Payment Successful. Thank You`,
          content: `The payment for order id #${order.uuid}, is Successful. Thank You`,
          additionalInfo: order.id.toString(),
          targetUserId: order.createdById,
        });
      } catch (e) { }
    });
  }

  @Transaction()
  public async deleteOrder(
    orderId: number,
    query: any,
    @TransactionRepository(OrderRepository) orderRepository?: OrderRepository,
    @TransactionRepository(TripRepository) tripRepository?: TripRepository,
    @TransactionRepository(OrderToTripEntity) orderTripRepository?: Repository<OrderToTripEntity>,
  ): Promise<SuccessDTO> {
    const order = await orderRepository.getOrder(
      orderId,
      ['orderTrips'],
      query,
    );
    if (!order) {
      throw new BadRequestException(`Order not found for id ${orderId}`);
    }

    try {
      const trip = path(['orderTrips', '0'], order) as OrderToTripEntity;
      if (trip) {
        const orderTrips = await orderTripRepository.find({
          orderId,
          tripId: trip.tripId,
        });
        await orderTripRepository.remove(orderTrips);
        await this.recalculateRoute([trip.tripId], orderRepository, tripRepository);
      }
      await orderRepository.update(orderId, { companyId: null });

      return { success: true };
    } catch (e) {
      throw e;
    }
  }
}
