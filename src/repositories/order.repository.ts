import { Brackets, EntityRepository, In, IsNull, Repository, SelectQueryBuilder } from 'typeorm';

import { DriverLocationPartialDTO } from '../app/client/dto/get/driverLocationPartial.dto';
import { ReportsByShipperRequestDTO } from '../app/company/dto/reports-by-shipper/request.dto';
import { GetReportsByShipperResponse } from '../app/company/dto/reports-by-shipper/response.dto';
import { FiltersOrdersRequest } from '../app/order/dto/list/filters.dto';
import { GetOrdersListResponse } from '../app/order/dto/list/response.dto';
import { SearchOrdersRequestDTO } from '../app/order/dto/list/search.dto';
import { OrdersCustomReportFilters } from '../app/order/dto/report/filters.dto';
import { ROLES } from '../constants/roles.constant';
import { GeneralReportDTO } from '../dto/generalReport.dto';
import { WEB_NOTIFICATION } from '../dto/notification.dto';
import { AccountEntity } from '../entities/account.entity';
import { INVITE_STATUS } from '../entities/inviteStatus.entity';
import { NotificationStatus } from '../entities/notification.entity';
import { OrderEntity } from '../entities/order.entity';
import { ORDER_STATUS } from '../entities/orderBase.entity';
import { TRIP_STATUS, TripEntity } from '../entities/trip.entity';

const metersToMileRate = 0.000621371;

@EntityRepository(OrderEntity)
export class OrderRepository extends Repository<OrderEntity> {

    public async getOrderList(
        query: FiltersOrdersRequest,
        account?: AccountEntity,
    ): Promise<GetOrdersListResponse> {
        let queryBuilder = this.createQueryBuilder('order')
            .leftJoinAndSelect('order.pickLocation', 'pickLocation')
            .leftJoinAndSelect('order.deliveryLocation', 'deliveryLocation')
            .leftJoinAndSelect('order.company', 'company')
            .leftJoinAndSelect('order.createdBy', 'createdBy')
            .leftJoinAndSelect('order.sender', 'sender')
            .leftJoinAndSelect('order.receiver', 'receiver')
            .leftJoinAndSelect('order.dispatches', 'dispatches')
            .leftJoinAndSelect('order.cars', 'cars')
            .leftJoinAndSelect('order.notes', 'notes')
            .leftJoinAndSelect('order.shipper', 'shipper')
            .leftJoinAndSelect('order.orderTrips', 'orderTrips')
            .leftJoinAndSelect('orderTrips.trip', 'trip')
            .leftJoinAndSelect('trip.driver', 'driver')
            .leftJoinAndSelect(
                'driver.locations',
                'locations',
                '"locations".id = (SELECT MAX("driverLocation".id) FROM "driverLocation" WHERE "driverLocation"."driverId" = driver.id)',
            )
            .andWhere('order.status NOT IN (:...statuses)', {
                statuses: [ORDER_STATUS.DELETED],
            })
            .skip(query.offset)
            .take(query.limit);

        if (query.grouped) {
            queryBuilder
                .orderBy('pickLocation.city', 'ASC')
                .addOrderBy('deliveryLocation.city', 'ASC');
        }

        if (query.shipperCompanyName) {
            queryBuilder
                .andWhere('LOWER(shipper.companyName) LIKE :companyName', {
                    companyName: `%${query.shipperCompanyName.toLowerCase()}%`,
                });
        }

        if (account && [ROLES.DRIVER, ROLES.CLIENT].includes(account.roleId)) {
            queryBuilder
                .leftJoinAndSelect('order.inspections', 'inspections')
                .leftJoinAndSelect('inspections.details', 'details');
        }

        if (account && [ROLES.SUPER_ADMIN, ROLES.DISPATCHER, ROLES.COMPANY_ADMIN].includes(account.roleId)) {
            queryBuilder
                .leftJoinAndSelect('order.notifications', 'notifications',
                    'notifications.targetUserId = :targetUserId AND notifications.status = :notifyStatus AND notifications.type = :notifyType',
                    { targetUserId: account.id, notifyStatus: NotificationStatus.ACTIVE, notifyType: WEB_NOTIFICATION.ORDER });
        }

        queryBuilder.addOrderBy(
            query.orderByField || 'order.updatedAt',
            query.orderByDirection ? query.orderByDirection : 'DESC',
        );

        queryBuilder = this.addOrderFilters(queryBuilder, query);

        const [orders, ordersCount] = await queryBuilder.getManyAndCount();

        return { count: ordersCount, data: orders };
    }

    public async getPublishedAndDeletedList(
        query: FiltersOrdersRequest,
        account?: AccountEntity,
    ): Promise<GetOrdersListResponse> {
        let queryBuilder = this.createQueryBuilder('order')
            .leftJoinAndSelect('order.pickLocation', 'pickLocation')
            .leftJoinAndSelect('order.deliveryLocation', 'deliveryLocation')
            .leftJoinAndSelect('order.company', 'company')
            .leftJoinAndSelect('order.createdBy', 'createdBy')
            .leftJoinAndSelect('order.sender', 'sender')
            .leftJoinAndSelect('order.receiver', 'receiver')
            .leftJoinAndSelect('order.dispatches', 'dispatches')
            .leftJoinAndSelect('order.cars', 'cars')
            .leftJoinAndSelect('order.notes', 'notes')
            .leftJoinAndSelect('order.shipper', 'shipper')
            .leftJoinAndSelect('order.orderTrips', 'orderTrips')
            .leftJoinAndSelect('orderTrips.trip', 'trip')
            .leftJoinAndSelect('trip.driver', 'driver')
            .leftJoinAndSelect(
                'driver.locations',
                'locations',
                '"locations".id = (SELECT MAX("driverLocation".id) FROM "driverLocation" WHERE "driverLocation"."driverId" = driver.id)',
            )
            .andWhere('order.status IN (:...statuses)', {
                statuses: [ORDER_STATUS.PUBLISHED, ORDER_STATUS.CANCELED],
            })
            .skip(query.offset)
            .take(query.limit);

        if (account && [ROLES.SUPER_ADMIN, ROLES.DISPATCHER, ROLES.COMPANY_ADMIN].includes(account.roleId)) {
            queryBuilder
                .leftJoinAndSelect('order.notifications', 'notifications',
                    'notifications.targetUserId = :targetUserId AND notifications.status = :notifyStatus AND notifications.type = :notifyType',
                    { targetUserId: account.id, notifyStatus: NotificationStatus.ACTIVE, notifyType: WEB_NOTIFICATION.ORDER });
        }

        queryBuilder.addOrderBy(
            query.orderByField || 'order.updatedAt',
            query.orderByDirection ? query.orderByDirection : 'DESC',
        );

        queryBuilder = this.addOrderFilters(queryBuilder, query);

        const [orders, ordersCount] = await queryBuilder.getManyAndCount();

        return { count: ordersCount, data: orders };
    }

    public async getCompanyOrders(
        query: SearchOrdersRequestDTO,
    ): Promise<GetOrdersListResponse> {
        let queryBuilder = this.createQueryBuilder('order')
            .leftJoinAndSelect('order.pickLocation', 'pickLocation')
            .leftJoinAndSelect('order.deliveryLocation', 'deliveryLocation')
            .leftJoinAndSelect('order.company', 'company')
            .leftJoinAndSelect('order.createdBy', 'createdBy')
            .leftJoinAndSelect('order.sender', 'sender')
            .leftJoinAndSelect('order.receiver', 'receiver')
            .leftJoinAndSelect('order.cars', 'cars')
            .leftJoinAndSelect('order.dispatcher', 'assignedDispatcher')
            .leftJoinAndSelect('order.orderTrips', 'orderTrips')
            .leftJoinAndSelect('orderTrips.trip', 'trip')
            .leftJoinAndSelect('trip.driver', 'driver')
            .leftJoinAndSelect('trip.dispatcher', 'dispatcher')
            .andWhere('order.published = :published', { published: true })
            .orderBy(
                this.getOrderSorting(query.orderByField),
                query.orderByDirection ? query.orderByDirection : 'DESC',
            )
            .skip(query.offset)
            .take(query.limit);

        if (query.searchText) {
            queryBuilder = this.addOrderFullTextSearch(
                queryBuilder,
                query.searchText,
            );
        }

        const { where = {} } = query;
        if (query.dispatcherId) {
            // tslint:disable-next-line:max-line-length
            queryBuilder.andWhere(
                '(trip.dispatcherId = :dispatcherId AND order.dispatcherId IS NULL) OR (trip.id IS NULL AND order.dispatcherId = :dispatcherId)',
                query,
            );
        }
        if (query.driverId) {
            queryBuilder.andWhere('trip.driverId = :driverId', query);
        }
        if (query.status) {
            queryBuilder.andWhere('order.status = :status', { status: query.status });
        }
        if (where) {
            queryBuilder.andWhere(where);
        }

        const [orders, ordersCount] = await queryBuilder.getManyAndCount();

        return { count: ordersCount, data: orders };
    }

    public async getCompanyAssignedOrders(
        accountId: number,
        query: SearchOrdersRequestDTO,
    ): Promise<GetOrdersListResponse> {
        let queryBuilder = this.createQueryBuilder('order')
            .leftJoinAndSelect('order.pickLocation', 'pickLocation')
            .leftJoinAndSelect('order.deliveryLocation', 'deliveryLocation')
            .leftJoinAndSelect('order.company', 'company')
            .leftJoinAndSelect('order.createdBy', 'createdBy')
            .leftJoinAndSelect('order.sender', 'sender')
            .leftJoinAndSelect('order.receiver', 'receiver')
            .leftJoinAndSelect('order.cars', 'cars')
            .leftJoinAndSelect('order.shipper', 'shipper')
            .leftJoinAndSelect('order.dispatcher', 'assignedDispatcher')
            .leftJoinAndSelect('order.orderTrips', 'orderTrips')
            .leftJoinAndSelect('order.notifications', 'notifications',
                'notifications.targetUserId = :targetUserId AND notifications.status = :notifyStatus AND notifications.type = :notifyType',
                { targetUserId: accountId, notifyStatus: NotificationStatus.ACTIVE, notifyType: WEB_NOTIFICATION.ORDER })
            .leftJoinAndSelect('orderTrips.trip', 'trip')
            .leftJoinAndSelect('trip.driver', 'driver')
            .leftJoinAndSelect('trip.dispatcher', 'dispatcher')
            .andWhere('order.published = :published', { published: true })
            .andWhere('order.hiddenForCompnay = :hiddenForCompnay', { hiddenForCompnay: false })
            .orderBy(
                this.getOrderSorting(query.orderByField),
                query.orderByDirection ? query.orderByDirection : 'DESC',
            )
            .skip(query.offset)
            .take(query.limit);

        if (query.searchText) {
            queryBuilder = this.addOrderFullTextSearch(
                queryBuilder,
                query.searchText,
            );
        }

        const { where = {} } = query;

        if (where.assignTrip) {
            queryBuilder.andWhere('(trip.companyId = :companyId)', where);
            delete where.assignTrip;
        }
        if (query.shipperCompanyName) {
            queryBuilder
                .andWhere('LOWER(shipper.companyName) ILIKE :companyName', {
                    companyName: `%${query.shipperCompanyName.toLowerCase()}%`,
                });
        }
        if (where.dispatcherId) {
            queryBuilder.andWhere('(trip.dispatcherId = :dispatcherId)', where);
            delete where.dispatcherId;
        }
        if (where.driverId) {
            queryBuilder.andWhere('trip.driverId = :driverId', where);
            delete where.driverId;
        }

        if (where.statuses && where.statuses.length) {
            if (where.statuses.includes(ORDER_STATUS.BILLED)) {
                queryBuilder.andWhere('"order"."invoiceUrl" is not null and "order"."invoiceDueDate" > NOW() OR "order"."invoiceUrl" is null');
            }
            queryBuilder.andWhere('order.status IN (:...statuses)', {
                statuses: where.statuses,
            });
            delete where.statuses;
        } else {
            queryBuilder.andWhere('order.status NOT IN (:...statusesNo)', {
                statusesNo: [
                    ORDER_STATUS.CANCELED,
                    ORDER_STATUS.DECLINED,
                ],
            });
        }

        if (where) {
            queryBuilder.andWhere(where);
        }

        const [orders, ordersCount] = await queryBuilder.getManyAndCount();

        return { count: ordersCount, data: orders };
    }

    public async getCompanyNewLoads(
        accountId: number,
        query: SearchOrdersRequestDTO,
    ): Promise<GetOrdersListResponse> {
        let queryBuilder = this.createQueryBuilder('order')
            .leftJoinAndSelect('order.pickLocation', 'pickLocation')
            .leftJoinAndSelect('order.deliveryLocation', 'deliveryLocation')
            .leftJoinAndSelect('order.company', 'company')
            .leftJoinAndSelect('order.createdBy', 'createdBy')
            .leftJoinAndSelect('order.sender', 'sender')
            .leftJoinAndSelect('order.receiver', 'receiver')
            .leftJoinAndSelect('order.cars', 'cars')
            .leftJoinAndSelect('order.dispatcher', 'assignedDispatcher')
            .leftJoinAndSelect('order.shipper', 'shipper')
            .leftJoinAndSelect('order.orderTrips', 'orderTrips')
            .leftJoinAndSelect('order.notifications', 'notifications',
                'notifications.targetUserId = :targetUserId AND notifications.status = :notifyStatus AND notifications.type = :notifyType',
                { targetUserId: accountId, notifyStatus: NotificationStatus.ACTIVE, notifyType: WEB_NOTIFICATION.ORDER })
            .leftJoinAndSelect('orderTrips.trip', 'trip')
            .leftJoinAndSelect('trip.driver', 'driver')
            .leftJoinAndSelect('trip.dispatcher', 'dispatcher')
            .andWhere('order.published = :published', { published: true })
            .andWhere('order.hiddenForCompnay = :hiddenForCompnay', { hiddenForCompnay: false })
            .andWhere('order.status NOT IN (:...statuses)', {
                statuses: [
                    ORDER_STATUS.DECLINED,
                    ORDER_STATUS.CLAIMED,
                    ORDER_STATUS.DELIVERED,
                    ORDER_STATUS.BILLED,
                    ORDER_STATUS.PAID,
                    ORDER_STATUS.DELETED,
                ],
            })
            .skip(query.offset)
            .take(query.limit);

        if (query.grouped) {
            queryBuilder
                .orderBy('pickLocation.city', 'ASC')
                .addOrderBy('deliveryLocation.city', 'ASC');
        }

        queryBuilder.orderBy(
            this.getOrderSorting(query.orderByField),
            query.orderByDirection ? query.orderByDirection : 'DESC',
        );

        if (query.searchText) {
            queryBuilder = this.addOrderFullTextSearch(
                queryBuilder,
                query.searchText,
            );
        }

        const { where = {} } = query;
        if (query.dispatcherId) {
            where.dispatcherId = query.dispatcherId;
        }
        if (query.shipperCompanyName) {
            queryBuilder
                .andWhere('LOWER(shipper.companyName) LIKE :companyName', {
                    companyName: `%${query.shipperCompanyName.toLowerCase()}%`,
                });
        }
        // do note get any orders if driverId is set
        if (query.driverId) {
            where.id = IsNull();
        }
        if (where && where.noTrip) {
            queryBuilder.andWhere('trip.id IS NULL');
        }

        queryBuilder.andWhere(where);

        const [orders, ordersCount] = await queryBuilder.getManyAndCount();

        return { count: ordersCount, data: orders };
    }

    public async getOrder(
        id: number,
        relations: string[],
        query?: any,
    ): Promise<OrderEntity> {
        const queryBuilder = this.createQueryBuilder('order')
            .andWhere(
                'order.id = :id',
                { id },
            );

        if (query && Object.keys(query).length) {
            queryBuilder.andWhere(query.where);
        }

        if (relations && relations.length) {
            relations.map(includeEntity => {
                queryBuilder.leftJoinAndSelect(`order.${includeEntity}`, includeEntity);
                if (includeEntity === 'orderTrips') {
                    queryBuilder
                        .leftJoinAndSelect('orderTrips.trip', 'trip')
                        .leftJoinAndSelect('trip.driver', 'driver')
                        .leftJoinAndSelect('trip.dispatcher', 'dispatcher');
                }
                if (includeEntity === 'inspections') {
                    queryBuilder
                        .leftJoinAndSelect('inspections.details', 'details');
                }
                if (includeEntity === 'invite') {
                    queryBuilder
                        .leftJoinAndSelect('invite.company', 'invite.company');
                }
            });
        }

        return queryBuilder.getOne();
    }

    private addOrderFilters(
        queryBuilder: SelectQueryBuilder<OrderEntity>,
        query: FiltersOrdersRequest,
    ): SelectQueryBuilder<OrderEntity> {
        if (query.where) {
            queryBuilder.andWhere(query.where);
        }
        if (query.makeOrModel) {
            queryBuilder.andWhere(
                'cars.make = :makeOrModel OR cars.model = :makeOrModel',
                { makeOrModel: query.makeOrModel },
            );
        }
        if (query.isVirtual) {
            queryBuilder.andWhere('order.isVirtual = :virtual', {
                virtual: query.isVirtual,
            });
        }
        if (query.companyId) {
            queryBuilder.andWhere('order.companyId = :companyId', {
                companyId: query.companyId,
            });
        }
        if (query.status) {
            queryBuilder.andWhere('order.status = :status', { status: query.status });
        }
        if (query.origin) {
            queryBuilder.andWhere('pickLocation.zipCode = :origin', {
                origin: query.origin,
            });
        }
        if (query.destination) {
            queryBuilder.andWhere('deliveryLocation.zipCode = :destination', {
                destination: query.destination,
            });
        }
        if (query.createdById) {
            queryBuilder.andWhere('order.createdById = :createdById', {
                createdById: query.createdById,
            });
        }
        if (query.trailerType) {
            queryBuilder.andWhere('order.trailerType = :trailerType', {
                trailerType: query.trailerType,
            });
        }
        if (query.vehicleType) {
            queryBuilder
                .innerJoin('driver.truck', 'truck')
                .andWhere('truck.type = :truckType', { truckType: query.vehicleType });
        }
        if (query.carType) {
            queryBuilder.andWhere('cars.type = :carType', { carType: query.carType });
        }
        if (query.condition) {
            queryBuilder.andWhere('cars.inop = :inop', { inop: query.condition });
        }

        if (query.originPoint) {
            // tslint:disable-next-line:max-line-length
            queryBuilder.andWhere(
                '(ST_Distance(pickLocation.point, ST_SetSRID(ST_GeomFromGeoJSON(:origin), ST_SRID(pickLocation.point)))) <= :radius',
                {
                    radius: query.originPoint.radius / metersToMileRate,
                    origin: {
                        type: 'Point',
                        coordinates: [
                            query.originPoint.point.lat,
                            query.originPoint.point.lon,
                        ],
                    },
                },
            );
        }
        if (query.destinationPoint) {
            // tslint:disable-next-line:max-line-length
            queryBuilder.andWhere(
                '(ST_Distance(deliveryLocation.point, ST_SetSRID(ST_GeomFromGeoJSON(:destination), ST_SRID(deliveryLocation.point)))) <= :radius',
                {
                    radius: query.destinationPoint.radius / metersToMileRate,
                    destination: {
                        type: 'Point',
                        coordinates: [
                            query.destinationPoint.point.lat,
                            query.destinationPoint.point.lon,
                        ],
                    },
                },
            );
        }

        if (query.dispatchStatus) {
            queryBuilder
                .innerJoinAndSelect(
                    'order.dispatches',
                    'dispatch',
                    'dispatch.status = :dispatchStatus',
                )
                .setParameters({ dispatchStatus: query.dispatchStatus });
        }

        if (query.noDispatchForCompany) {
            queryBuilder.andWhere(() => {
                // tslint:disable-next-line:max-line-length
                return `(select count(*) from dispatch where dispatch."orderId" = order.id AND dispatch."companyId" = ${
                    query.noDispatchForCompany
                    }) = 0`;
            });
        }

        if (query.minimumNumberOfVehiclesPerLoad) {
            queryBuilder.andWhere(() => {
                return `(select count(*) as cars_count from car where car."orderId" = order.id) >= ${
                    query.minimumNumberOfVehiclesPerLoad
                    }`;
            });
        }

        if (query.dispatchForCompany) {
            queryBuilder.andWhere(() => {
                // tslint:disable-next-line:max-line-length
                return `(select count(*) from dispatch where dispatch."orderId" = order.id  AND dispatch."companyId" = ${
                    query.dispatchForCompany
                    }) > 0`;
            });
        }

        if (query.dispatched) {
            queryBuilder.andWhere('order.status != :status', {
                status: ORDER_STATUS.PUBLISHED,
            });
        }

        if (query.where && query.where.tripId) {
            queryBuilder.andWhere('trip.id = :tripId', {
                tripId: query.where.tripId,
            });
        }

        return queryBuilder;
    }

    private getOrderSorting(orderByField?: string): string {
        let field = 'order.updatedAt';
        switch (orderByField) {
            case 'distance':
                field = 'order.distance';
                break;
            case 'price':
                field = 'order.salePrice';
                break;
            case 'id':
                field = 'order.id';
                break;
            case 'pickUpDate':
                field = 'order.pickDate';
                break;
            case 'deliveryDate':
                field = 'order.deliveryDate';
                break;
            case 'updatedTime':
                field = 'order.updatedAt';
                break;
            case 'creationTime':
                field = 'order.createdAt';
                break;
        }

        return field;
    }

    private addOrderFullTextSearch(
        queryBuilder: SelectQueryBuilder<OrderEntity>,
        searchText: string,
    ): SelectQueryBuilder<OrderEntity> {
        queryBuilder.andWhere(
            `("order".id||"order"."trailerType"||"order".distance||"order"."createdAt"||"order"."updatedAt")
         LIKE :searchText`,
            { searchText: `%${searchText}%` },
        );
        return queryBuilder;
    }

    public async getOrderByStatus(
        account: AccountEntity,
        orderId: number,
        orderStatuses: string[],
    ): Promise<OrderEntity | null> {
        return this.createQueryBuilder('order')
            .leftJoinAndSelect('order.orderTrips', 'orderTrips')
            .leftJoinAndSelect('orderTrips.trip', 'trip')
            .andWhere('order.status IN (:...orderStatuses)', {
                orderStatuses,
            })
            .andWhere('trip.driverId = :driverId', { driverId: account.id })
            .andWhere('order.id = :id', { id: orderId })
            .getOne();
    }

    public async getOrderStatusTrip(
        orderId: number,
        status: string,
    ): Promise<TripEntity | null> {
        const order = await this.createQueryBuilder('order')
            .leftJoinAndSelect('order.orderTrips', 'orderTrips')
            .leftJoinAndSelect('orderTrips.trip', 'trip')
            .where('trip.status = :status', { status })
            .andWhere('order.id = :id', { id: orderId })
            .getOne();

        let trip = null;
        if (order && order.orderTrips && order.orderTrips[0]) {
            trip = order.orderTrips[0].trip;
        }

        return trip;
    }

    public async getOrderTrip(orderId: number): Promise<TripEntity | null> {
        const order = await this.createQueryBuilder('order')
            .leftJoinAndSelect('order.orderTrips', 'orderTrips')
            .leftJoinAndSelect('orderTrips.trip', 'trip')
            .andWhere('order.id = :id', { id: orderId })
            .andWhere('trip.status = :tripActive', { tripActive: TRIP_STATUS.ACTIVE })
            .getOne();

        let trip = null;
        if (order && order.orderTrips && order.orderTrips[0]) {
            trip = order.orderTrips[0].trip;
        }

        return trip;
    }

    public async getOrderTripDecline(
        orderId: number,
    ): Promise<TripEntity | null> {
        const order = await this.createQueryBuilder('order')
            .leftJoinAndSelect('order.orderTrips', 'orderTrips')
            .leftJoinAndSelect('orderTrips.trip', 'trip')
            .andWhere('order.id = :id', { id: orderId })
            .andWhere('trip.status != :tripStatus', {
                tripStatus: TRIP_STATUS.COMPLETED,
            })
            .getOne();

        let trip = null;
        if (order && order.orderTrips && order.orderTrips[0]) {
            trip = order.orderTrips[0].trip;
        }

        return trip;
    }

    public async getOrdersByTrip(tripId: number): Promise<OrderEntity[]> {
        const orders = await this.createQueryBuilder('order')
            .leftJoinAndSelect('order.orderTrips', 'orderTrips')
            .leftJoinAndSelect('orderTrips.trip', 'trip')
            .leftJoinAndSelect('order.pickLocation', 'pickLocation')
            .leftJoinAndSelect('order.deliveryLocation', 'deliveryLocation')
            .andWhere('trip.id = :tripId', { tripId })
            .andWhere('order.status NOT IN (:...orderStatuses)', {
                orderStatuses: [ORDER_STATUS.CANCELED, ORDER_STATUS.ARCHIVED],
            })
            .getMany();

        return orders;
    }

    public async getNonDispatchedOrders(
        orderIds: number[],
        companyId: number,
        idOnly: boolean,
    ): Promise<OrderEntity[]> {
        const queryBuilder = this.createQueryBuilder('order')
            .leftJoinAndSelect('order.dispatches', 'dispatches')
            .where({
                id: In(orderIds),
            })
            .andWhere(
                new Brackets(subQb => {
                    subQb.where('dispatches.id IS NULL AND order.status = :published');
                    subQb.orWhere(
                        'order.status = :dispatched AND order.companyId = :companyId',
                    );
                }),
            )
            .leftJoinAndSelect('order.pickLocation', 'pickLocation')
            .leftJoinAndSelect('order.deliveryLocation', 'deliveryLocation')
            .setParameters({
                companyId,
                dispatched: ORDER_STATUS.DISPATCHED,
                published: ORDER_STATUS.PUBLISHED,
            });
        if (idOnly) {
            queryBuilder.select('order.id');
        }

        return queryBuilder.getMany();
    }

    public async getDriverOrderOnWayToPickUp(
        driverId: number,
    ): Promise<OrderEntity> {
        return this.createQueryBuilder('order')
            .leftJoinAndSelect('order.orderTrips', 'orderTrips')
            .leftJoinAndSelect('orderTrips.trip', 'trip')
            .leftJoinAndSelect('order.pickLocation', 'pickLocation')
            .where('trip.driverId = :driver', { driver: driverId })
            .andWhere('trip.status = :tripStatus', { tripStatus: TRIP_STATUS.ACTIVE })
            .andWhere('order.status = :orderStatus', {
                orderStatus: ORDER_STATUS.ON_WAY_TO_PICKUP,
            })
            .getOne();
    }

    public async getDriverOrderOnWayToDelivery(
        driverId: number,
    ): Promise<OrderEntity> {
        return this.createQueryBuilder('order')
            .leftJoinAndSelect('order.orderTrips', 'orderTrips')
            .leftJoinAndSelect('orderTrips.trip', 'trip')
            .leftJoinAndSelect('order.pickLocation', 'pickLocation')
            .where('trip.driverId = :driver', { driver: driverId })
            .andWhere('trip.status = :tripStatus', { tripStatus: TRIP_STATUS.ACTIVE })
            .andWhere('order.status = :orderStatus', {
                orderStatus: ORDER_STATUS.PICKED_UP,
            })
            .getOne();
    }

    public async getDriverByOrder(
        accountId: number,
        orderId: number,
    ): Promise<DriverLocationPartialDTO> {
        const order = await this.createQueryBuilder('order')
            .innerJoinAndSelect('order.orderTrips', 'orderTrips')
            .innerJoinAndSelect('orderTrips.trip', 'trip')
            .innerJoinAndSelect('trip.driver', 'driver')
            .innerJoinAndSelect('driver.company', 'company')
            .where('order.id = :id', { id: orderId })
            .andWhere('order.createdById = :clientId', { clientId: accountId })
            .andWhere('trip.status = :tripActive', { tripActive: TRIP_STATUS.ACTIVE })
            .andWhere('order.status IN (:...orderStatuses)', {
                orderStatuses: [
                    ORDER_STATUS.ON_WAY_TO_PICKUP,
                    ORDER_STATUS.ON_PICKUP,
                    ORDER_STATUS.ON_WAY_TO_DELIVERY,
                    ORDER_STATUS.ON_DELIVERY,
                    ORDER_STATUS.SIGNATURE_REQUESTED,
                ],
            })
            .getOne();

        let driver = null;

        if (
            order &&
            order.orderTrips &&
            order.orderTrips[0].trip &&
            order.orderTrips[0].trip.driver
        ) {
            const driverEntity = order.orderTrips[0].trip.driver;
            driver = {
                id: driverEntity.id,
                firstName: driverEntity.firstName,
                lastName: driverEntity.lastName,
                companyName: driverEntity.company.name,
                avatarUrl: driverEntity.avatarUrl,
                lat: null,
                lon: null,
            };
        }

        return driver;
    }

    public async countTripNoDeliveredOrders(tripId: number): Promise<number> {
        return this.createQueryBuilder('order')
            .leftJoinAndSelect('order.orderTrips', 'orderTrips')
            .where('orderTrips.tripId = :id', { id: tripId })
            .andWhere('order.status NOT IN (:...orderStatuses)', {
                orderStatuses: [ORDER_STATUS.DELIVERED, ORDER_STATUS.CLAIMED],
            })
            .getCount();
    }

    async getOrderForBOL(
        orderId: number,
        query: { where?: any },
    ): Promise<OrderEntity> {
        const queryBuilder = this.createQueryBuilder('order')
            .leftJoinAndSelect('order.company', 'company')
            .leftJoinAndSelect('order.createdBy', 'createdBy')
            .leftJoinAndSelect('order.pickLocation', 'pickLocation')
            .leftJoinAndSelect('order.deliveryLocation', 'deliveryLocation')
            .leftJoinAndSelect('order.sender', 'sender')
            .leftJoinAndSelect('order.receiver', 'receiver')
            .leftJoinAndSelect('order.cars', 'cars')
            .leftJoinAndSelect('order.inspections', 'inspection')
            .leftJoinAndSelect('inspection.createdLocation', 'createdLocation')
            .leftJoinAndSelect('inspection.signLocation', 'signLocation')
            .leftJoinAndSelect('order.notes', 'notes')
            .leftJoinAndSelect('order.shipper', 'shipper')
            .innerJoinAndSelect('order.orderTrips', 'orderTrips')
            .innerJoinAndSelect(
                'orderTrips.trip',
                'trip',
                'trip.status = :completedTrip OR trip.status = :activeTrip',
            )
            .leftJoinAndSelect('trip.driver', 'driver')
            .leftJoinAndSelect('inspection.details', 'inspectionDetails')
            .where('order.id = :id', { id: orderId })
            .andWhere('order.status IN (:...orderStatuses)', {
                orderStatuses: [
                    ORDER_STATUS.CLAIMED,
                    ORDER_STATUS.DELIVERED,
                    ORDER_STATUS.BILLED,
                ],
            })
            .setParameters({
                completedTrip: TRIP_STATUS.COMPLETED,
                activeTrip: TRIP_STATUS.ACTIVE,
            });

        if (query && query.where) {
            queryBuilder.andWhere(query.where);
        }

        return queryBuilder.getOne();
    }

    async getOrderForReceipt(
        orderId: number,
        query: { where?: any },
    ): Promise<OrderEntity> {
        const queryBuilder = this.createQueryBuilder('order')
            .leftJoinAndSelect('order.pickLocation', 'pickLocation')
            .leftJoinAndSelect('order.deliveryLocation', 'deliveryLocation')
            .leftJoinAndSelect('order.cars', 'cars')
            .leftJoinAndSelect('order.company', 'company')
            .leftJoinAndSelect('order.shipper', 'shipper')
            .where('order.id = :id', { id: orderId })
            .andWhere('order.status IN (:...orderStatuses)', {
                orderStatuses: [ORDER_STATUS.PAID],
            });
        if (query && query.where) {
            queryBuilder.andWhere(query.where);
        }

        return queryBuilder.getOne();
    }

    public async isAssignToDriver(
        orderId: number,
        driverId: number,
    ): Promise<number> {
        return await this.createQueryBuilder('order')
            .leftJoinAndSelect('order.orderTrips', 'orderTrips')
            .leftJoinAndSelect('orderTrips.trip', 'trip')
            .where('order.id = :id', { id: orderId })
            .andWhere('trip.driverId = :driverId', { driverId })
            .getCount();
    }

    public async getGeneralReport(where: any): Promise<GeneralReportDTO> {
        let query = this.createQueryBuilder('order')
            .where(where)
            // tslint:disable-next-line: max-line-length
            .select(
                `sum(case when "order"."salePrice" is not null and "order"."salePrice" != 'NaN' then "order"."salePrice" else 0 end)`,
                'totalRevenue',
            )
            .addSelect(
                `sum(case when status = '${
                ORDER_STATUS.PAID
                }' and "invoiceUrl" is not null then "order"."salePrice" else 0 end)`,
                'totalPaid',
            )
            .addSelect(
                // tslint:disable-next-line: max-line-length
                `sum(case when status != '${
                ORDER_STATUS.PAID
                }' and "invoiceUrl" is not null and "invoiceDueDate" > NOW() then "order"."salePrice" else 0 end)`,
                'totalPastDue',
            )
            .addSelect(
                // tslint:disable-next-line: max-line-length
                `sum(case when status != '${
                ORDER_STATUS.PAID
                }' and "invoiceUrl" is not null and "invoiceDueDate" < NOW() then "order"."salePrice" else 0 end)`,
                'totalDue',
            )

        const report = await query.getRawOne();
        return {
            ...report,
            totalRevenue: parseFloat(report.totalRevenue),
            totalDue: parseFloat(report.totalDue),
            totalPaid: parseFloat(report.totalPaid),
            totalPastDue: parseFloat(report.totalPastDue),
        };
    }

    public async getByShipperReport(
        query: ReportsByShipperRequestDTO,
    ): Promise<GetReportsByShipperResponse> {
        const queryBuilder = this.createQueryBuilder('order')
            .select(['shipper.companyName'])
            .leftJoin('order.shipper', 'shipper')
            // tslint:disable-next-line: max-line-length
            .addSelect(
                `sum(case when "order"."salePrice" is not null and "order"."salePrice" != 'NaN' then "order"."salePrice" else 0 end)`,
                'totalRevenue',
            )
            .addSelect(
                `sum(case when status = '${
                ORDER_STATUS.PAID
                }' and "invoiceUrl" is not null then "order"."salePrice" else 0 end)`,
                'totalPaid',
            )
            // tslint:disable-next-line: max-line-length
            .addSelect(
                `sum(case when status != '${
                ORDER_STATUS.PAID
                }' and "invoiceUrl" is not null and "invoiceDueDate" > NOW() then "order"."salePrice" else 0 end)`,
                'totalDue',
            )
            // tslint:disable-next-line: max-line-length
            .addSelect(
                `sum(case when status != '${
                ORDER_STATUS.PAID
                }' and "invoiceUrl" is not null and "invoiceDueDate" < NOW() then "order"."salePrice" else 0 end)`,
                'totalPastDue',
            )
            .groupBy('shipper.companyName');

        const countQuery = this.createQueryBuilder('order')
            .select(['shipper.companyName'])
            .leftJoin('order.shipper', 'shipper')
            .select('COUNT(DISTINCT("shipper"."companyName"))', 'count');

        if (query && query.where) {
            countQuery.andWhere(query.where);
            queryBuilder.andWhere(query.where);
        }

        if (query && query.fromDeliveryDate) {
            countQuery.andWhere('order.deliveryDate >= :fromDeliveryDate', {
                fromDeliveryDate: query.fromDeliveryDate,
            });
            queryBuilder.andWhere('order.deliveryDate >= :fromDeliveryDate', {
                fromDeliveryDate: query.fromDeliveryDate,
            });
        }

        if (query && query.toDeliveryDate) {
            countQuery.andWhere('order.deliveryDate <= :toDeliveryDate', {
                toDeliveryDate: query.toDeliveryDate,
            });
            queryBuilder.andWhere('order.deliveryDate <= :toDeliveryDate', {
                toDeliveryDate: query.toDeliveryDate,
            });
        }

        if (query && query.searchText) {
            countQuery.andWhere('shipper.fullName ILIKE :searchText', {
                searchText: `%${query.searchText}%`,
            });
            queryBuilder.andWhere('shipper.fullName ILIKE :searchText', {
                searchText: `%${query.searchText}%`,
            });
        }

        const count = await countQuery.getRawOne();
        const data = await queryBuilder
            .skip(query.offset || 0)
            .take(query.limit || 10)
            .getRawMany();

        return {
            data: data.map(item => {
                return {
                    ...item,
                    totalRevenue: parseFloat(item.totalRevenue),
                    totalPaid: parseFloat(item.totalPaid),
                    totalDue: parseFloat(item.totalDue),
                    totalPastDue: parseFloat(item.totalPastDue),
                };
            }),
            count: count.count,
        };
    }

    public async getCustomReport(
        selectString: string,
        filter: OrdersCustomReportFilters,
    ): Promise<any> {
        let queryBuilder = await this.createQueryBuilder('order')
            .select(selectString)
            .leftJoin('order.sender', 'sender')
            .leftJoin('order.receiver', 'receiver')
            .leftJoin('order.pickLocation', 'pickLocation')
            .leftJoin('order.deliveryLocation', 'deliveryLocation')
            .leftJoin('order.shipper', 'shipper')
            .leftJoin('order.cars', 'car')
            .groupBy('order.id')
            .addGroupBy('sender.id')
            .addGroupBy('shipper.id')
            .addGroupBy('receiver.id')
            .addGroupBy('pickLocation.id')
            .addGroupBy('deliveryLocation.id')
            .orderBy(
                filter.orderByField || 'order.id',
                filter.orderByDirection || 'DESC',
            );

        queryBuilder = this.applyCustomReportFilters(queryBuilder, filter);

        const result = await queryBuilder.getRawMany();

        return result;
    }

    private applyCustomReportFilters(
        queryBuilder: SelectQueryBuilder<OrderEntity>,
        filter: OrdersCustomReportFilters,
    ) {
        if (filter.status) {
            queryBuilder.andWhere('order.status = :orderStatus', {
                orderStatus: filter.status,
            });
        }
        if (filter.fromCreatedDate) {
            queryBuilder.andWhere('order.createdAt >= :fromCreatedDate', {
                fromCreatedDate: filter.fromCreatedDate,
            });
        }
        if (filter.toCreatedDate) {
            queryBuilder.andWhere('order.createdAt <= :toCreatedDate', {
                toCreatedDate: filter.toCreatedDate,
            });
        }
        if (filter.fromDeliveryDate) {
            queryBuilder.andWhere('order.deliveryDate >= :fromDeliveryDate', {
                fromDeliveryDate: filter.fromDeliveryDate,
            });
        }
        if (filter.toDeliveryDate) {
            queryBuilder.andWhere('order.deliveryDate <= :toDeliveryDate', {
                toDeliveryDate: filter.toDeliveryDate,
            });
        }

        switch (filter.include) {
            case ORDER_STATUS.ARCHIVED:
                queryBuilder.andWhere('order.status = :fromDeliveryDate', {
                    fromDeliveryDate: filter.fromDeliveryDate,
                });
                break;
            case 'active':
                queryBuilder.andWhere('order.active = :active', { active: true });
                break;
            default:
        }

        switch (filter.assignedTo) {
            case 'all':
                queryBuilder
                    .leftJoin('order.orderTrips', 'orderTrip')
                    .leftJoin('orderTrip.trip', 'trip', 'trip.status IN (:...statuses)', {
                        statuses: [
                            TRIP_STATUS.ACTIVE,
                            TRIP_STATUS.PICKED_UP,
                            TRIP_STATUS.COMPLETED,
                        ],
                    })
                    .andWhere(
                        'trip.driverId IS NOT NULL OR order.dispatcherId IS NOT NULL',
                    );
                break;
            case 'all drivers':
                queryBuilder
                    .leftJoin('order.orderTrips', 'orderTrip')
                    .leftJoin('orderTrip.trip', 'trip', 'trip.status IN (:...statuses)', {
                        statuses: [
                            TRIP_STATUS.ACTIVE,
                            TRIP_STATUS.PICKED_UP,
                            TRIP_STATUS.COMPLETED,
                        ],
                    })
                    .andWhere('order.driverId IS NOT NULL');
                break;
            case 'all dispatchers':
                queryBuilder.andWhere('order.dispatcherId IS NOT NULL');
                break;
            case 'no drivers':
                queryBuilder
                    .leftJoin('order.orderTrips', 'orderTrip')
                    .leftJoin('orderTrip.trip', 'trip', 'trip.status IN (:...statuses)', {
                        statuses: [
                            TRIP_STATUS.ACTIVE,
                            TRIP_STATUS.PICKED_UP,
                            TRIP_STATUS.COMPLETED,
                        ],
                    })
                    .andWhere('order.driverId IS NULL');
                break;
            case 'no dispatcher':
                queryBuilder.andWhere('order.dispatcherId IS NULL');
                break;
            default:
        }

        return queryBuilder;
    }

    public async getOrdersByIds(
        tripId: number,
        orderIds: number[],
    ): Promise<OrderEntity[]> {
        const orders = await this.createQueryBuilder('order')
            .leftJoinAndSelect('order.orderTrips', 'orderTrips')
            .leftJoinAndSelect('orderTrips.trip', 'trip')
            .leftJoinAndSelect('order.pickLocation', 'pickLocation')
            .leftJoinAndSelect('order.deliveryLocation', 'deliveryLocation')
            .andWhere('trip.id = :tripId', { tripId })
            .andWhere('order.id IN (:...orderIds)', {
                orderIds,
            })
            .getMany();

        return orders;
    }

    async getOrderDispatchedInviteList(accountId: number, query: FiltersOrdersRequest) {
        let queryBuilder = this.createQueryBuilder('order')
            .innerJoinAndSelect('order.invite', 'invite')
            .leftJoinAndSelect('order.pickLocation', 'pickLocation')
            .leftJoinAndSelect('order.deliveryLocation', 'deliveryLocation')
            .leftJoinAndSelect('order.company', 'company')
            .leftJoinAndSelect('order.createdBy', 'createdBy')
            .leftJoinAndSelect('order.sender', 'sender')
            .leftJoinAndSelect('order.receiver', 'receiver')
            .leftJoinAndSelect('order.dispatches', 'dispatches')
            .leftJoinAndSelect('order.cars', 'cars')
            .leftJoinAndSelect('order.notes', 'notes')
            .leftJoinAndSelect('order.shipper', 'shipper')
            .leftJoinAndSelect('order.orderTrips', 'orderTrips')
            .leftJoinAndSelect('orderTrips.trip', 'trip')
            .leftJoinAndSelect('trip.driver', 'driver')
            .leftJoinAndSelect(
                'driver.locations',
                'locations',
                '"locations".id = (SELECT MAX("driverLocation".id) FROM "driverLocation" WHERE "driverLocation"."driverId" = driver.id)',
            )
            .leftJoinAndSelect('order.notifications', 'notifications',
                'notifications.targetUserId = :targetUserId AND notifications.status = :notifyStatus AND notifications.type = :notifyType',
                { targetUserId: accountId, notifyStatus: NotificationStatus.ACTIVE, notifyType: WEB_NOTIFICATION.ORDER })
            .andWhere('order.status NOT IN (:...statuses)', {
                statuses: [ORDER_STATUS.DELETED],
            })
            .andWhere('order.hiddenForAdmin = :hiddenForAdmin', { hiddenForAdmin: false })
            .andWhere('invite.statusId = :pending', {
                pending: INVITE_STATUS.PENDING,
            })
            .skip(query.offset)
            .take(query.limit);

        if (query.grouped) {
            queryBuilder
                .orderBy('pickLocation.city', 'ASC')
                .addOrderBy('deliveryLocation.city', 'ASC');
        }

        if (query.shipperCompanyName) {
            queryBuilder
                .andWhere('LOWER(shipper.companyName) LIKE :companyName', {
                    companyName: `%${query.shipperCompanyName.toLowerCase()}%`,
                });
        }

        queryBuilder.addOrderBy(
            query.orderByField || 'order.updatedAt',
            query.orderByDirection ? query.orderByDirection : 'DESC',
        );

        queryBuilder = this.addOrderFilters(queryBuilder, query);

        const [orders, ordersCount] = await queryBuilder.getManyAndCount();

        return { count: ordersCount, data: orders };
    }

    async getOrderExpiredInviteList(accountId: number, query: FiltersOrdersRequest) {
        let queryBuilder = this.createQueryBuilder('order')
            .innerJoinAndSelect('order.invite', 'invite')
            .leftJoinAndSelect('invite.company', 'invite.company')
            .leftJoinAndSelect('order.pickLocation', 'pickLocation')
            .leftJoinAndSelect('order.deliveryLocation', 'deliveryLocation')
            .leftJoinAndSelect('order.company', 'company')
            .leftJoinAndSelect('order.createdBy', 'createdBy')
            .leftJoinAndSelect('order.sender', 'sender')
            .leftJoinAndSelect('order.receiver', 'receiver')
            .leftJoinAndSelect('order.dispatches', 'dispatches')
            .leftJoinAndSelect('order.cars', 'cars')
            .leftJoinAndSelect('order.notes', 'notes')
            .leftJoinAndSelect('order.shipper', 'shipper')
            .leftJoinAndSelect('order.orderTrips', 'orderTrips')
            .leftJoinAndSelect('orderTrips.trip', 'trip')
            .leftJoinAndSelect('trip.driver', 'driver')
            .leftJoinAndSelect(
                'driver.locations',
                'locations',
                '"locations".id = (SELECT MAX("driverLocation".id) FROM "driverLocation" WHERE "driverLocation"."driverId" = driver.id)',
            )
            .leftJoinAndSelect('order.notifications', 'notifications',
                'notifications.targetUserId = :targetUserId AND notifications.status = :notifyStatus AND notifications.type = :notifyType',
                { targetUserId: accountId, notifyStatus: NotificationStatus.ACTIVE, notifyType: WEB_NOTIFICATION.ORDER })
            .andWhere('order.status NOT IN (:...statuses)', {
                statuses: [ORDER_STATUS.DELETED],
            })
            .andWhere('order.hiddenForAdmin = :hiddenForAdmin', { hiddenForAdmin: false })
            .andWhere('invite.statusId = :declined OR invite.statusId = :expired', {
                declined: INVITE_STATUS.DECLINED,
                expired: INVITE_STATUS.EXPIRED,
            })
            .skip(query.offset)
            .take(query.limit);

        if (query.grouped) {
            queryBuilder
                .orderBy('pickLocation.city', 'ASC')
                .addOrderBy('deliveryLocation.city', 'ASC');
        }

        if (query.shipperCompanyName) {
            queryBuilder
                .andWhere('LOWER(shipper.companyName) LIKE :companyName', {
                    companyName: `%${query.shipperCompanyName.toLowerCase()}%`,
                });
        }

        queryBuilder.addOrderBy(
            query.orderByField || 'order.updatedAt',
            query.orderByDirection ? query.orderByDirection : 'DESC',
        );

        queryBuilder = this.addOrderFilters(queryBuilder, query);

        const [orders, ordersCount] = await queryBuilder.getManyAndCount();

        return { count: ordersCount, data: orders };
    }

    async getOrdersLateDate(query: any): Promise<OrderEntity[]> {
        const orders = await this.createQueryBuilder('order')
            .where(query)
            .andWhere(() => {
                // tslint:disable-next-line: max-line-length
                return `(select count(*) from notification where notification."orderId" = order.id AND notification."additionalInfo" = 'lateDate') = 0`;
            })
            .getMany();
        return orders;
    }

    async getOrdersWithTransactions(query: any): Promise<OrderEntity[]> {
        const orders = await this.createQueryBuilder('order')
            .where(query)
            .leftJoinAndSelect('order.transactions', 'transactions')
            .getMany();
        return orders;
    }
}
