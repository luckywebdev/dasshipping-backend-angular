import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import moment = require('moment');
import { path } from 'ramda';
import * as shortid from 'shortid';
import { MoreThanOrEqual, Repository, Transaction, TransactionRepository } from 'typeorm';

import { CONTACT_INFO } from '../../constants/contactInfo.constant';
import { ROLES } from '../../constants/roles.constant';
import { CarDTO } from '../../dto/car.dto';
import { CLIENT_NOTIFICATION_ACTIONS, CLIENT_NOTIFICATION_TYPES } from '../../dto/notification.dto';
import { QuoteDTO } from '../../dto/quote.dto';
import { SuccessDTO } from '../../dto/success.dto';
import { AccountEntity } from '../../entities/account.entity';
import { CarEntity } from '../../entities/car.entity';
import { LocationEntity } from '../../entities/location.entity';
import { ORDER_STATUS, QUOTE_STATUS, TRAILER_TYPE } from '../../entities/orderBase.entity';
import { QuoteEntity } from '../../entities/quote.entity';
import { ShipperEntity } from '../../entities/shipper.entity';
import { VirtualAccountEntity } from '../../entities/virtualAccount.entity';
import { AccountRepository } from '../../repositories/account.repository';
import { CarRepository } from '../../repositories/car.repository';
import { OrderRepository } from '../../repositories/order.repository';
import { OrderAttachmentRepository } from '../../repositories/orderAttachment.repository';
import { QuoteRepository } from '../../repositories/quote.repository';
import { PatchQuoteRequest } from '../client/dto/patch/request.dto';
import { GetList } from '../dto/requestList.dto';
import { NotificationService } from '../notification/notification.service';
import { DiscountRequestDTO } from '../order/dto/patch/discountRequest.dto';
import { OrderService } from '../order/order.service';
import { CalculatorService } from '../shared/calculator.service';
import { QuoteCreateRequest } from './dto/requests/create.dto';
import { QuotePublishRequest } from './dto/requests/publish.dto';
import { QuotesListResponse } from './dto/responses/list.dto';
import { PAYMENT_METHODS } from '../../entities/order.entity';

@Injectable()
export class QuoteService {
    constructor(
        @InjectRepository(QuoteRepository)
        private readonly quoteRepository: QuoteRepository,
        @InjectRepository(OrderAttachmentRepository)
        private readonly orderAttachmentRepository: OrderAttachmentRepository,
        @InjectRepository(CarRepository)
        private readonly carRepository: CarRepository,
        @InjectRepository(LocationEntity)
        private readonly locationRepository: Repository<LocationEntity>,
        @InjectRepository(ShipperEntity)
        private readonly shipperRepository: Repository<ShipperEntity>,
        @InjectRepository(AccountEntity)
        private readonly accountRepository: Repository<AccountEntity>,
        private calcService: CalculatorService,
        private orderService: OrderService,
        private readonly notificationService: NotificationService,
    ) {
    }

    public async get(query: GetList, accountId?: number): Promise<QuotesListResponse> {
        query.where = QuoteService.injectExpire(query.where);
        return await this.quoteRepository.getVisible(query, accountId);
    }

    public async find(account: any, id: number): Promise<QuoteDTO> {
        const instance = await this.quoteRepository.getFullById(id);

        if (!instance) {
            throw new NotFoundException(`Quote ${id} not found`);
        }

        return instance;
    }

    @Transaction()
    public async create(
        account: any,
        quote: QuoteCreateRequest,
        @TransactionRepository(LocationEntity) locationRepository?: Repository<LocationEntity>,
        @TransactionRepository(QuoteRepository) quoteRepository?: QuoteRepository,
        @TransactionRepository(CarEntity) carRepository?: Repository<CarEntity>,
    ): Promise<QuoteDTO> {
        const pickup = await locationRepository.save(quote.pickLocation);
        const delivery = await locationRepository.save(quote.deliveryLocation);
        const from = path(['pickLocation', 'zipCode'], quote) as string;
        const to = path(['deliveryLocation', 'zipCode'], quote) as string;
        const distance = await this.calcService.getDistance(from, to);

        const price = await this.calcService.getCarsDeliveryPrice(
            quote.cars,
            distance,
            quote.enclosed,
        );
        const salePrice = await this.calcService.getSalePrice(price);
        const loadPrice = await this.calcService.getLoadPrice(price);
        const trailerType = quote.enclosed
            ? TRAILER_TYPE.ENCLOSED
            : TRAILER_TYPE.OPEN;
        const payload = Object.assign({}, quote, {
            createdById: account.id,
            initialPrice: price,
            priceWithDiscount: price,
            distance,
            trailerType,
            salePrice,
            loadPrice,
            pickLocationId: pickup.id,
            deliveryLocationId: delivery.id,
            uuid: shortid.generate(),
        });

        const instance = await quoteRepository.save(payload);

        const promises = [];
        for (const car of quote.cars) {
            promises.push(
                carRepository.save({
                    ...car,
                    quoteId: instance.id,
                }),
            );
        }

        const cars = await Promise.all(promises);
        account.password = null;

        this.notificationService.createNotificationAdmin({ quoteId: instance.id });
        return {
            ...instance,
            cars,
            createdBy: account,
        };
    }

    public async decline(id: number, where = {}): Promise<SuccessDTO> {
        where = QuoteService.injectExpire(where);
        await this.quoteRepository.update(
            {
                ...where,
                id,
            },
            { status: QUOTE_STATUS.QUOTE_CANCELED },
        );
        return { success: true };
    }

    public async accept(id: number, where = {}): Promise<any> {
        where = QuoteService.injectExpire(where);
        return this.quoteRepository.update(
            {
                ...where,
                id,
            },
            { status: QUOTE_STATUS.ACCEPTED },
        );
    }

    @Transaction()
    public async publish(
        account: any,
        data: QuotePublishRequest,
        where: any,
        @TransactionRepository(QuoteRepository) quoteRepository?: QuoteRepository,
        @TransactionRepository(AccountRepository) accountRepository?: AccountRepository,
        @TransactionRepository(ShipperEntity) shipperRepository?: Repository<ShipperEntity>,
        @TransactionRepository(OrderAttachmentRepository) orderAttachmentRepository?: OrderAttachmentRepository,
        @TransactionRepository(VirtualAccountEntity) virtualAccountRepository?: Repository<VirtualAccountEntity>,
        @TransactionRepository(LocationEntity) locationRepository?: Repository<LocationEntity>,
        @TransactionRepository(OrderRepository) orderRepository?: OrderRepository,
        @TransactionRepository(CarRepository) carRepository?: CarRepository,
    ): Promise<any> {
        where = QuoteService.injectExpire(where);
        const instance = await quoteRepository.getFullByWhere(where);
        if (!instance) {
            throw new BadRequestException(`Quote ${where.id} not found`);
        }
        if (
            [QUOTE_STATUS.NEW, QUOTE_STATUS.ACCEPTED].indexOf(
                instance.status as QUOTE_STATUS,
            ) === -1
        ) {
            throw new ForbiddenException(
                `You cannot book quote ${where.id} due to status ${instance.status}`,
            );
        }
        let payload: any = Object.assign(data, instance, {
            quoteId: instance.id,
            pickLocation: {
                ...instance.pickLocation,
                address: data.pickLocation ? data.pickLocation.address : instance.pickLocation.address,
            },
            deliveryLocation: {
                ...instance.deliveryLocation,
                address: data.deliveryLocation ? data.deliveryLocation.address : instance.deliveryLocation.address,
            },
            isVirtual: false,
            published: true,
            status: ORDER_STATUS.PUBLISHED,
            paymentMethods: data.paymentDelivery ? PAYMENT_METHODS.CHECK_AT_DELIVERY : PAYMENT_METHODS.ACH,
        });

        if (!instance.external) {
            const superAdmin = await accountRepository.findOne({ roleId: ROLES.SUPER_ADMIN });
            const shipper = await shipperRepository.save({
                phone: superAdmin.phoneNumber,
                companyName: superAdmin.companyName,
                fullName: `${superAdmin.firstName} ${superAdmin.lastName}`,
                address: superAdmin.address,
                city: superAdmin.city,
                state: superAdmin.state,
                zipCode: superAdmin.zip,
                billingEmail: CONTACT_INFO.BILLING_EMAIL,
                email: CONTACT_INFO.CONTACT_EMAIL,
            });
            payload = {
                ...payload,
                shipper,
            };
        }
        delete payload.id;
        const order = await this.orderService.create(account, payload, virtualAccountRepository, locationRepository, orderRepository, carRepository);
        if (data && data.attachments && data.attachments.length) {
            const attachments = data.attachments.map(item => ({ ...item, orderId: order.id, createdById: account.id }));
            await orderAttachmentRepository.save(attachments);
        }
        instance.orderId = order.id;
        instance.status = QUOTE_STATUS.BOOKED;
        await quoteRepository.update({
            id: instance.id,
        },
            {
                orderId: order.id,
                status: QUOTE_STATUS.BOOKED,
            },
        );
        return order;
    }

    public async addQuoteDiscount(
        account: AccountEntity,
        id: number,
        data: DiscountRequestDTO,
    ): Promise<QuoteDTO> {
        const quote = await this.find(account, id);
        const priceWithDiscount = await this.calcService.getDiscountPrice(
            quote.initialPrice,
            data.discount,
        );

        await this.quoteRepository.update(quote.id, {
            discount: data.discount,
            priceWithDiscount,
        });

        this.notificationService.create({
            type: CLIENT_NOTIFICATION_TYPES.QUOTE_DISCOUNT,
            actions: [
                CLIENT_NOTIFICATION_ACTIONS.SHOW_QOUTE_LIST,
            ],
            title: `Added discount`,
            content: `Added discount for quote ${quote.uuid}`,
            additionalInfo: quote.id.toString(),
            targetUserId: quote.createdById,
        });

        return this.find(account, id);
    }

    @Transaction()
    public async patch(
        account: AccountEntity,
        id: number,
        data: PatchQuoteRequest,
        query: any,
        @TransactionRepository(QuoteRepository) quoteRepository?: QuoteRepository,
        @TransactionRepository(CarRepository) carRepository?: CarRepository,
    ): Promise<QuoteDTO> {
        query.id = id;
        const quote = await quoteRepository.getFullByWhere(query);
        if (!quote) {
            throw new NotFoundException(`Quote not found for id ${id}`);
        }

        const price = await this.calcService.getCarsDeliveryPrice(
            data.cars,
            quote.distance,
            TRAILER_TYPE.ENCLOSED === quote.trailerType,
        );
        quote.cars = await this.updateQuoteCars(quote, data.cars, carRepository);
        const salePrice = await this.calcService.getSalePrice(price);
        const loadPrice = await this.calcService.getLoadPrice(price);
        await quoteRepository.update(quote.id, {
            initialPrice: price,
            priceWithDiscount: price,
            updatedAt: new Date(),
            salePrice,
            loadPrice,
        });

        return await quoteRepository.getFullById(id);
    }

    private async updateQuoteCars(
        quote: QuoteEntity,
        cars: CarDTO[],
        carRepository: CarRepository = this.carRepository,
    ): Promise<CarEntity[]> {
        const carsToDelete = quote.cars.filter(
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
                    quoteId: quote.id,
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

        return carRepository.save(carsToSave);
    }

    private static injectExpire(where: any = {}): any {
        where.createdAt = MoreThanOrEqual(moment().subtract(72, 'hours'));
        return where;
    }
}
