import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { path } from 'ramda';
import { getConnection, In, Not, Repository, Transaction, TransactionRepository } from 'typeorm';

import {
  CLIENT_NOTIFICATION_ACTIONS,
  CLIENT_NOTIFICATION_TYPES,
  DRIVER_NOTIFICATION_TYPES,
} from '../../dto/notification.dto';
import { OrderDTO } from '../../dto/order.dto';
import { SuccessDTO } from '../../dto/success.dto';
import { TripDTO } from '../../dto/trip.dto';
import { AccountEntity } from '../../entities/account.entity';
import { ORDER_STATUS } from '../../entities/orderBase.entity';
import { OrderToTripEntity } from '../../entities/orderToTrip.entity';
import { TRIP_STATUS } from '../../entities/trip.entity';
import { OrderRepository } from '../../repositories/order.repository';
import { TripRepository } from '../../repositories/trip.repository';
import { meterToMile } from '../../utils/meterToMile.util';
import { DriverToPickUpRequestDTO } from '../driver/dto/toPickUp.dto';
import { HereService } from '../here/here.service';
import { NotificationService } from '../notification/notification.service';
import { OrderService } from '../order/order.service';
import { TripCreateRequest } from './dto/create/request.dto';
import { GetTripsRequest } from './dto/list/request.dto';
import { GetTripsListResponse } from './dto/list/response.dto';
import { TripEditRequest } from './dto/patch/request.dto';
import { CalculateRouteTripRequestDTO } from './dto/save-route/request.dto';
import { ROLES } from '../../constants/roles.constant';

@Injectable()
export class TripService {
  constructor(
    @InjectRepository(OrderRepository)
    private readonly orderRepository: OrderRepository,
    @InjectRepository(TripRepository)
    private readonly tripRepository: TripRepository,
    @InjectRepository(AccountEntity)
    private readonly accountRepository: Repository<AccountEntity>,
    @InjectRepository(OrderToTripEntity)
    private readonly orderTripRepository: Repository<OrderToTripEntity>,
    private notificationService: NotificationService,
    private hereService: HereService,
    private orderService: OrderService,
  ) { }

  @Transaction()
  public async create(
    data: TripCreateRequest,
    @TransactionRepository(OrderRepository) orderRepository?: OrderRepository,
    @TransactionRepository(TripRepository) tripRepository?: TripRepository,
    @TransactionRepository(OrderToTripEntity) orderTripRepository?: Repository<OrderToTripEntity>,
  ): Promise<TripDTO> {
    const orders = await orderRepository.getNonDispatchedOrders(
      data.orderIds,
      data.companyId,
      false,
    );
    const orderIds = orders.map(order => order.id);
    if (orderIds.length < data.orderIds.length) {
      const incorrectOrderIds = data.orderIds.filter(
        id => orderIds.indexOf(id) < 0,
      );
      throw new BadRequestException(
        `No available orders found for ids [${incorrectOrderIds.join(',')}]`,
      );
    }

    const body = await this.checkDriverLinkedDispatcher(data);
    const result = await this.hereService.calculateRouteTrip(orders);
    const {
      totalPrice,
      route,
      distance,
      pickLocationId,
      deliveryLocationId,
    } = result;
    const trip = await tripRepository.save({
      ...body,
      totalPrice,
      route,
      distance,
      pickLocationId,
      deliveryLocationId,
    });
    const tripOrders = orderIds.map(id => {
      return {
        orderId: id,
        tripId: trip.id,
      };
    });
    await orderTripRepository.save(tripOrders);
    await orderRepository.update(
      { id: In(data.orderIds) },
      { dispatcherId: data.dispatcherId },
    );

    return await tripRepository.getTrip({ id: trip.id });
  }

  public async getList(query: GetTripsRequest): Promise<GetTripsListResponse> {
    return this.tripRepository.getAll(query);
  }

  public async getTrip(where: any): Promise<TripDTO> {
    return this.tripRepository.findOne(where);
  }

  public async get(where: any): Promise<TripDTO> {
    return await this.tripRepository.getTrip(where);
  }

  public async getCount(where: any): Promise<number> {
    return this.tripRepository.count(where);
  }

  public async patch(
    data: TripEditRequest,
    where: any,
  ): Promise<TripDTO> {
    const connection = getConnection();
    const queryRunner = connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const orderTripRepository = queryRunner.manager.getRepository(OrderToTripEntity);
      const tripRepository = queryRunner.manager.getCustomRepository(TripRepository);
      const orderRepository = queryRunner.manager.getCustomRepository(OrderRepository);

      const trip = await tripRepository.getTrip(where);

      if (!trip) {
        throw new BadRequestException(`Trip not found for id ${where.id}`);
      }

      const body = await this.checkDriverLinkedDispatcher(data);

      const { orderIds } = body;
      if (orderIds && orderIds.length) {
        const orderTrip = await orderTripRepository.find({ tripId: trip.id });
        const orderIdsTrip = orderTrip.map(item => item.orderId);
        const addOrders = orderIds.filter(id => !orderIdsTrip.includes(id));
        const deleteOrders = orderIdsTrip.filter(id => !orderIds.includes(id));
        const tripOrders = addOrders.map(id => {
          return {
            orderId: id,
            tripId: trip.id,
          };
        });
        for (const id of deleteOrders) {
          await orderTripRepository.delete({ orderId: id, tripId: trip.id });
        }
        await orderTripRepository.save(tripOrders);
        delete body.orderIds;
      }

      if (body) {
        await tripRepository.update(trip.id, {
          ...body,
          updatedAt: new Date(),
        });
      }

      await this.orderService.recalculateRoute([trip.id], orderRepository, tripRepository);

      await queryRunner.commitTransaction();

      if (trip.driverId && trip.status === TRIP_STATUS.ACTIVE) {
        this.notificationService.create({
          type: 'trip_changed',
          actions: [],
          title: `Trip was modified`,
          content: '',
          targetUserId: trip.driverId,
        });
      }

      return await this.tripRepository.getTrip({ id: trip.id });
    } catch (e) {
      await queryRunner.rollbackTransaction();
      throw e;
    } finally {
      await queryRunner.release();
    }

  }

  public async doAction(
    action: string,
    where: any,
    driverId: number,
  ): Promise<TripDTO> {
    const connection = getConnection();
    const queryRunner = connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const orderTripRepository = queryRunner.manager.getRepository(OrderToTripEntity);
      const tripRepository = queryRunner.manager.getCustomRepository(TripRepository);

      const data: any = {};
      let notification: any;
      let driver: AccountEntity;
      const trip = await tripRepository.getTrip(where);

      if (!trip) {
        throw new BadRequestException(`Trip not found for id ${where.id}`);
      }
      if (driverId) {
        const query = { id: driverId, companyId: where.companyId };
        driver = await this.accountRepository.findOne(query);
        if (!driver) {
          throw new BadRequestException(
            `Driver ${driverId} not not found`,
          );
        }
        if (!driver.dispatcherId) {
          throw new BadRequestException(
            `Driver ${driver.id} not link to dispatcher`,
          );
        }
      }

      switch (action) {
        case 'publish':
          const orders = await orderTripRepository.find({ tripId: trip.id });
          const orderIds = orders.map(item => item.orderId);
          const ordersDispatched = await this.orderRepository.find({
            id: In(orderIds),
            status: ORDER_STATUS.DISPATCHED,
          });
          if (ordersDispatched.length === orderIds.length) {
            data.status = TRIP_STATUS.PENDING;
            notification = {
              type: DRIVER_NOTIFICATION_TYPES.TRIP_TO_UPCOMING,
              actions: [],
              title: `A trip assigned to you`,
              content: `Congratulation. Trip #${trip.id} was assigned to you.`,
              targetUserId: trip.driverId,
            };
          } else {
            throw new BadRequestException(
              `Not all orders have status ${ORDER_STATUS.DISPATCHED}`,
            );
          }
          break;
        case 'start_progress':
          data.status = TRIP_STATUS.ACTIVE;
          notification = {
            type: DRIVER_NOTIFICATION_TYPES.TRIP_TO_ACTIVE,
            actions: [],
            title: `Trip #${trip.id} started`,
            content: `Congratulation. You just started trip #${trip.id}.`,
            targetUserId: trip.driverId,
          };
          break;
        case 'move_to_draft':
          data.status = TRIP_STATUS.DRAFT;
          notification = {
            type: DRIVER_NOTIFICATION_TYPES.TRIP_TO_DRAFT,
            actions: [],
            title: `Trip unassigned from you`,
            content: `Trip #${trip.id} was unassigned from you`,
            targetUserId: trip.driverId,
          };
          break;
        case 'assign':
          if (!driver.signatureUrl) {
            throw new BadRequestException(
              `Driver ${driver.id} doesn't have a signature`,
            );
          }
          data.driverId = driver.id;
          break;
        case 'unassign':
          data.driverId = null;
          break;
        default:
          throw new NotFoundException('Action not found');
      }

      if (data.status === TRIP_STATUS.ACTIVE) {
        const countActive = await tripRepository.count({
          driverId: trip.driverId,
          status: TRIP_STATUS.ACTIVE,
        });

        if (countActive) {
          throw new ConflictException('A driver can have only one active trip');
        }
      }

      if (data && data.status) {
        await orderTripRepository.update(
          { tripId: trip.id },
          { status: data.status },
        );
      }

      await tripRepository.update(trip.id, {
        ...data,
        updatedAt: new Date(),
      });
      await queryRunner.commitTransaction();

      trip.status = data.status;
      if (trip.driverId && notification) {
        this.notificationService.create(notification);
      }

      return trip;
    } catch (e) {
      await queryRunner.rollbackTransaction();
      throw e;
    } finally {
      await queryRunner.release();
    }
  }

  private async checkDriverLinkedDispatcher(
    data: TripEditRequest,
  ): Promise<TripEditRequest> {
    if (data.driverId) {
      const driver = await this.accountRepository.findOne(data.driverId);
      if (!driver.signatureUrl) {
        throw new BadRequestException(
          `Driver ${data.driverId} doesn't have a signature`,
        );
      }
      const companyAdmin = await this.accountRepository.findOne({ id: data.dispatcherId, roleId: ROLES.COMPANY_ADMIN, companyId: driver.companyId });
      if (companyAdmin) {
        data = { ...data, dispatcherId: companyAdmin.id };
        return data;
      }
      if (data.dispatcherId && driver.dispatcherId !== data.dispatcherId) {
        throw new BadRequestException(
          `Driver ${data.driverId} not link to dispatcher ${data.dispatcherId}`,
        );
      } else {
        data = { ...data, dispatcherId: driver.dispatcherId };
      }
    }
    return data;
  }

  @Transaction()
  public async delete(
    where: any,
    ids: number[],
    @TransactionRepository(TripRepository) tripRepository?: TripRepository,
    @TransactionRepository(OrderToTripEntity) orderTripRepository?: Repository<OrderToTripEntity>,
  ): Promise<SuccessDTO> {
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return { success: true };
    }
    const trips = await tripRepository.find({
      ...where,
      id: In(ids),
      status: Not(TRIP_STATUS.COMPLETED),
    });

    if (!trips.length) {
      throw new BadRequestException(
        `It is a trip with status ${TRIP_STATUS.COMPLETED}`,
      );
    }

    const tripIds = trips.map(trip => trip.id);
    await orderTripRepository.delete({
      tripId: In(tripIds),
    });
    await tripRepository.delete({
      id: In(tripIds),
    });
    return { success: true };
  }

  public async setDriverOnPickup(
    account: AccountEntity,
    body: DriverToPickUpRequestDTO,
  ): Promise<SuccessDTO> {
    const connection = getConnection();
    const queryRunner = connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const orderRepository = queryRunner.manager.getCustomRepository(OrderRepository);
      const tripRepository = queryRunner.manager.getCustomRepository(TripRepository);

      const activeTrips = await tripRepository.find({
        status: TRIP_STATUS.ACTIVE,
        driverId: account.id,
      });
      if (activeTrips.length === 1 && activeTrips[0].id !== body.tripId) {
        throw new BadRequestException(
          `Driver ${account.id} already has another active trip`,
        );
      }

      const tripOrder = await tripRepository.getTripOrderToPickUp(
        account,
        body,
      );
      if (!tripOrder) {
        throw new BadRequestException(
          `There is no order ${body.orderId} found in trip ${
          body.tripId
          } for driver ${account.id}`,
        );
      }

      await tripRepository.update(tripOrder.id, {
        status: TRIP_STATUS.ACTIVE,
        updatedAt: new Date(),
      });

      await orderRepository.update(body.orderId, {
        status: ORDER_STATUS.ON_WAY_TO_PICKUP,
        updatedAt: new Date(),
      });

      const order = path(['orderTrips', '0', 'order'], tripOrder) as OrderDTO;
      await queryRunner.commitTransaction();

      this.notificationService.create({
        targetUserId: order.createdById,
        type: CLIENT_NOTIFICATION_TYPES.ON_ROUTE_TO_PICK_UP,
        title: `Carrier on way to pick up Order #${order.uuid}`,
        content: `Driver #${account.id} is on route to pick up order #${order.uuid}`,
        additionalInfo: order.id.toString(),
        actions: [
          CLIENT_NOTIFICATION_ACTIONS.CLOSE_NOTIFICATION,
          CLIENT_NOTIFICATION_ACTIONS.SHOW_MAP_WITH_DRIVER,
        ],
      });

      return { success: true };
    } catch (e) {
      await queryRunner.rollbackTransaction();
      throw e;
    } finally {
      await queryRunner.release();
    }
  }

  public async calculateRoute(
    data: CalculateRouteTripRequestDTO,
    where: any,
  ): Promise<TripDTO> {
    const trip = await this.tripRepository.getTrip(where);

    if (!trip) {
      throw new BadRequestException(`Trip not found for id ${where.id}`);
    }
    const { locations } = data;
    let orderIds = locations.map(item => item.key);
    orderIds = [...new Set(orderIds)];
    const orders = await this.orderRepository.getOrdersByIds(trip.id, orderIds);
    if (orders.length !== orderIds.length) {
      throw new BadRequestException(`Trip not found for id ${where.id}`);
    }
    const query: any = {};
    for (let i = 0; i < locations.length; i++) {
      query[`waypoint${i}`] = `${locations[i].point}`;
    }

    const result = await this.hereService.calculateroute({
      ...query,
      improveFor: 'distance',
      mode: 'fastest;truck',
      routeattributes: 'sh,bb,gr',
    });
    const totalDistance: string = path(['0', 'summary', 'distance'], result);
    const route: string[] = path(['0', 'shape'], result);
    const distance = meterToMile(totalDistance);
    const pickOrder = orders.filter(pick => pick.id === locations[0].key)[0];
    const deliveryOrder = orders.filter(
      delivery => delivery.id === locations[locations.length - 1].key,
    )[0];
    const pickLocationId = path(['0', 'pickLocationId'], pickOrder) as number;
    const deliveryLocationId = path(
      ['0', 'deliveryLocationId'],
      deliveryOrder,
    ) as number;

    return await this.tripRepository.save({
      ...trip,
      route,
      distance,
      pickLocationId,
      deliveryLocationId,
    });
  }
}
