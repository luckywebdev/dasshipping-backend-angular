import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectEventEmitter } from 'nest-emitter';
import { getConnection, In, Not, Repository } from 'typeorm';

import { ROLES } from '../../constants/roles.constant';
import { CLIENT_NOTIFICATION_TYPES } from '../../dto/notification.dto';
import { AccountEntity } from '../../entities/account.entity';
import { DISPATCH_STATUS, DispatchEntity } from '../../entities/dispatch.entity';
import { GeneralEntity } from '../../entities/general.entity';
import { CLIENT_PAYMENT_STATUSES, OrderEntity } from '../../entities/order.entity';
import { ORDER_STATUS } from '../../entities/orderBase.entity';
import { AccountRepository } from '../../repositories/account.repository';
import { DispatchRepository } from '../../repositories/dispatch.repository';
import { OrderRepository } from '../../repositories/order.repository';
import { AppEventEmitter } from '../event/app.events';
import { NotificationService } from '../notification/notification.service';
import { TransactionService } from '../transaction/transaction.service';
import { DispatchRequestDTO } from './dto/dispatchRequest.dto';
import { DispatchListResponseDTO } from './dto/list/dispatchListResponse.dto';
import { DispatchListRequest } from './dto/list/requestList.dto';
import { DispatchUpdateDTO } from './dto/update.dto';
import { InviteRepository } from '../../repositories/invite.repository';
import { INVITE_STATUS } from '../../entities/inviteStatus.entity';

@Injectable()
export class DispatchService {
  constructor(
    @InjectRepository(DispatchRepository)
    private readonly dispatchRepository: DispatchRepository,
    @InjectRepository(OrderRepository)
    private readonly orderRepository: OrderRepository,
    @InjectRepository(GeneralEntity)
    private readonly generalRepository: Repository<GeneralEntity>,
    @InjectRepository(InviteRepository)
    private readonly inviteRepository: InviteRepository,
    @InjectRepository(AccountRepository)
    private readonly accountRepository: AccountRepository,
    private readonly notificationService: NotificationService,
    private readonly transactionService: TransactionService,
    @InjectEventEmitter() private readonly emitter: AppEventEmitter,
  ) { }

  onModuleInit(): any {
    this.emitter.on('order_charge', (clientId) =>
      this.chargeOrdersFailed(clientId),
    );
  }

  public async create(
    account: AccountEntity,
    dispatchData: DispatchRequestDTO,
  ): Promise<DispatchEntity> {
    const numberOfActiveDispatches = await this.dispatchRepository.count({
      orderId: dispatchData.orderId,
      companyId: account.companyId,
    });

    if (numberOfActiveDispatches) {
      throw new BadRequestException(
        `Order has already been dispatched by a company member`,
      );
    }

    const order = await this.orderRepository.findOne(dispatchData.orderId);

    if (!order) {
      throw new BadRequestException(
        `Order ${dispatchData.orderId} does not exists`,
      );
    }

    this.emitter.emit('notification_admin', { orderId: order.id });
    return await this.dispatchRepository.save({
      ...dispatchData,
      status: DISPATCH_STATUS.NEW,
      accountId: account.id,
      companyId: account.companyId,
    });
  }

  public async getList(
    account: AccountEntity,
    query: DispatchListRequest,
  ): Promise<DispatchListResponseDTO> {
    let companyId = null;
    if (ROLES.SUPER_ADMIN !== account.roleId) {
      companyId = account.companyId;
    }
    return await this.dispatchRepository.getDispatchRequests(query, companyId);
  }

  public async update(
    account: AccountEntity,
    dispatchId: number,
    dispatchData: DispatchUpdateDTO,
  ): Promise<void> {
    const dispatch = await this.dispatchRepository.findOne({
      id: dispatchId,
      status: DISPATCH_STATUS.NEW,
      companyId: account.companyId,
    });

    if (!dispatch) {
      throw new BadRequestException(
        `No active dispatch found for id ${dispatchId}`,
      );
    }

    await this.dispatchRepository.update(dispatchId, {
      ...dispatchData,
      updatedAt: new Date(),
    });
  }

  public async accept(
    dispatchId: number,
  ): Promise<void> {
    const connection = getConnection();
    const queryRunner = connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const dispatchRepository = queryRunner.manager.getCustomRepository(DispatchRepository);
      const orderRepository = queryRunner.manager.getCustomRepository(OrderRepository);
      const inviteRepository = queryRunner.manager.getCustomRepository(InviteRepository);
      const dispatch = await dispatchRepository.findOne(
        { id: dispatchId, status: DISPATCH_STATUS.NEW },
        { relations: ['company', 'order'] },
      );

      if (!dispatch) {
        throw new BadRequestException(
          `No active dispatch found for id ${dispatchId}`,
        );
      }
      const { deliveryDate, companyId, pickDate } = dispatch;
      if (CLIENT_PAYMENT_STATUSES.SERVICE_FEE_PAID !== dispatch.order.clientPaymentStatus) {
        await this.chargeServiceFee(dispatch.order, companyId);
      }
      await dispatchRepository.update(dispatchId, {
        status: DISPATCH_STATUS.ACCEPTED,
        updatedAt: new Date(),
      });
      const updateOrder = {
        companyId,
        status: ORDER_STATUS.DISPATCHED,
        pickDate,
        deliveryDate,
        clientPaymentStatus: CLIENT_PAYMENT_STATUSES.SERVICE_FEE_PAID,
      };
      await orderRepository.update(dispatch.orderId, updateOrder);
      await dispatchRepository.update(
        { orderId: dispatch.orderId, id: Not(dispatchId) },
        { status: DISPATCH_STATUS.EXPIRED, updatedAt: new Date() },
      );
      const order = await orderRepository.findOne(dispatch.orderId);
      await inviteRepository.update({ orderId: dispatch.orderId }, { statusId: INVITE_STATUS.EXPIRED });
      await queryRunner.commitTransaction();
      if (order.createdById) {
        this.notificationService.create({
          type: CLIENT_NOTIFICATION_TYPES.ORDER_BOOKED,
          actions: [],
          title: `Order #${order.uuid} was dispatched`,
          content: `Congratulation your order was dispatched to Carrier ${dispatch.company.name}`,
          targetUserId: order.createdById,
        });
      }
      this.notificationService.createNotificationCarriers(order.id);
    } catch (e) {
      await queryRunner.rollbackTransaction();
      throw e;
    } finally {
      await queryRunner.release();
    }
  }

  public async cancel(
    account: AccountEntity,
    dispatchId: number,
  ): Promise<void> {
    const dispatch = await this.dispatchRepository.findOne({
      id: dispatchId,
      companyId: account.companyId,
      status: DISPATCH_STATUS.NEW,
    });

    if (!dispatch) {
      throw new BadRequestException(
        `No active dispatch found for id ${dispatchId}`,
      );
    }

    await this.dispatchRepository.update(dispatchId, {
      status: DISPATCH_STATUS.CANCELLED,
      updatedAt: new Date(),
    });
  }

  private async chargeServiceFee(
    order: OrderEntity,
    companyId: number,
  ): Promise<void> {
    const general = await this.generalRepository.findOne();
    const { serviceAbsoluteFee } = general;
    try {
      await this.transactionService.charge(
        { ...order, companyId },
        serviceAbsoluteFee,
      );
      await this.orderRepository.update(order.id, {
        clientPaymentStatus: CLIENT_PAYMENT_STATUSES.SERVICE_FEE_PAID,
      });
    } catch (e) {
      await this.orderRepository.update(order.id, {
        clientPaymentStatus: CLIENT_PAYMENT_STATUSES.SERVICE_FEE_FAILED,
      });
      await this.accountRepository.update(order.createdById, { paymentFailed: true });
      this.notificationService.create({
        type: CLIENT_NOTIFICATION_TYPES.ORDER_PAYMENT_FAILED,
        actions: [],
        title: `Order payment fails`,
        content: `Deposit fee for order #${order.uuid} FAILED, reason ${e && e.message ? e.message : e}`,
        additionalInfo: order.uuid,
        targetUserId: order.createdById,
      });
      throw new BadRequestException(e && e.message ? e.message : e);
    }
  }

  async chargeOrdersFailed(createdById: number): Promise<void> {
    const orders = await this.orderRepository.getOrdersWithTransactions({
      createdById,
      clientPaymentStatus: In([CLIENT_PAYMENT_STATUSES.SERVICE_FEE_FAILED]),
    });
    orders.forEach(async (order) => {
      try {
        const { transactions } = order;
        const transaction = transactions[0];
        await this.chargeServiceFee(order, transaction.companyId);
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
}
