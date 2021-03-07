import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectEventEmitter } from 'nest-emitter';
import { NotificationByDeviceBuilder, OneSignalAppClient } from 'onesignal-api-client-core';
import { In, IsNull, Repository } from 'typeorm';

import { ConfigService } from '../../config/config.service';
import { CLIENT_PUSH_NOTIFICATIONS, DRIVER_PUSH_NOTIFICATIONS } from '../../constants';
import { ROLES } from '../../constants/roles.constant';
import { WEB_NOTIFICATION } from '../../dto/notification.dto';
import { SuccessDTO } from '../../dto/success.dto';
import { AccountEntity } from '../../entities/account.entity';
import { DeviceEntity } from '../../entities/device.entity';
import { NotificationEntity, NotificationStatus } from '../../entities/notification.entity';
import { AccountRepository } from '../../repositories/account.repository';
import { NotificationRepository } from '../../repositories/notification.repository';
import { OrderRepository } from '../../repositories/order.repository';
import { GetList } from '../dto/requestList.dto';
import { AppEventEmitter } from '../event/app.events';
import { EventsGateway } from '../events/events.gateway';
import { NotificationRequestDTO } from './dto/create/notificationRequest.dto';
import { GetNotificationListResponse } from './dto/get/listResponse.dto';

@Injectable()
export class NotificationService implements OnModuleInit {
    client;
    driver;

    constructor(
        @InjectEventEmitter() private readonly emitter: AppEventEmitter,
        @InjectRepository(NotificationRepository) private readonly notificationRepository: NotificationRepository,
        @InjectRepository(AccountRepository) private readonly accountRepository: AccountRepository,
        @InjectRepository(OrderRepository) private readonly orderRepository: OrderRepository,
        @InjectRepository(DeviceEntity)
        private readonly deviceEntity: Repository<DeviceEntity>,
        private readonly eventsGateway: EventsGateway,
        private readonly configService: ConfigService,
    ) { }

    onModuleInit(): any {
        this.emitter.on('notification', message => this.onNotification(message));
        this.emitter.on('notification_admin', data => this.createNotificationAdmin(data));
        this.emitter.on('notification_carrier', data => this.createNotificationCarriers(data.orderId));
        this.emitter.on('notification_account', data => this.createNotificationCarrier(data));

        const clientOneSignal = this.configService.oneSignalClient;
        this.client = new OneSignalAppClient(clientOneSignal.appId, clientOneSignal.restApiKey);
        const driverOneSignal = this.configService.oneSignalDriver;
        this.driver = new OneSignalAppClient(driverOneSignal.appId, driverOneSignal.restApiKey);
    }

    public async create(
        notificationData: NotificationRequestDTO,
        notificationRepository: NotificationRepository = this.notificationRepository,
    ): Promise<NotificationEntity> {
        const notification = await notificationRepository.save({
            ...notificationData,
            status: NotificationStatus.ACTIVE,
        });

        this.emitter.emit('notification', notification);

        return notification;
    }

    public async getList(account: AccountEntity, query: GetList, status?: string): Promise<GetNotificationListResponse> {
        query.where = {
            targetUserId: account.id,
            status: status ? status : NotificationStatus.ACTIVE,
        };
        return await this.notificationRepository.getAll(query);
    }

    public async markAsViewed(account: AccountEntity, notificationId: number): Promise<any> {
        const notification = await this.notificationRepository.findOne({
            id: notificationId,
            targetUserId: account.id,
            status: NotificationStatus.ACTIVE,
            viewedAt: IsNull(),
        });

        if (!notification) {
            throw new NotFoundException(`No active notification found for id (${notificationId})`);
        }

        await this.notificationRepository.update(notification.id, {
            viewedAt: new Date(),
            status: NotificationStatus.EXPIRED,
        });

        return {
            status: 'success',
            message: `Notification (${notificationId}) marked as viewed successfully`,
        };
    }

    public async markAllAsRead(account: AccountEntity): Promise<any> {
        await this.notificationRepository.update({
            targetUserId: account.id,
            status: NotificationStatus.ACTIVE,
            viewedAt: IsNull(),
        }, {
            viewedAt: new Date(),
            status: NotificationStatus.EXPIRED,
        });

        return {
            status: 'success',
            message: `All notifications was marked as viewed successfully`,
        };
    }

    public async markAllAsReadByOrder(orderId: number): Promise<any> {
        const notifications = await this.notificationRepository.find({
            orderId,
            status: NotificationStatus.ACTIVE,
            viewedAt: IsNull(),
        });
        await this.notificationRepository.update({
            orderId,
            status: NotificationStatus.ACTIVE,
            viewedAt: IsNull(),
        }, {
            viewedAt: new Date(),
            status: NotificationStatus.EXPIRED,
        });

        notifications.forEach(item => {
            this.emitter.emit('notification', {
                type: WEB_NOTIFICATION.ORDER,
                actions: [],
                title: '',
                content: '',
                targetUserId: item.targetUserId,
            });
        });

        return {
            status: 'success',
        };
    }

    public async delete(account: AccountEntity, notificationId: number): Promise<SuccessDTO> {
        const notification = await this.notificationRepository.findOne({
            id: notificationId,
            targetUserId: account.id,
        });

        if (!notification) {
            throw new NotFoundException(`No notification found for id (${notificationId})`);
        }

        await this.notificationRepository.delete(notification.id);

        return {
            success: true,
        };
    }

    private onNotification(notification: NotificationRequestDTO): void {
        this.eventsGateway.sendMessage(notification.targetUserId, notification);
        this.sendPushNotification(notification);
    }

    public async createNotificationAdmin(data: any, additionalInfo = '') {
        const superAdmin = await this.accountRepository.findOne({ roleId: ROLES.SUPER_ADMIN });
        let notification: any = {
            actions: [],
            title: '',
            content: '',
            targetUserId: superAdmin.id,
            additionalInfo,
        };
        if (data.orderId) {
            notification = {
                ...notification,
                type: WEB_NOTIFICATION.ORDER,
                orderId: data.orderId,
            };
        }
        if (data.companyId) {
            notification = {
                ...notification,
                type: WEB_NOTIFICATION.CARRIER,
                companyId: data.companyId,
            };
        }
        if (data.inviteId) {
            notification = {
                ...notification,
                type: WEB_NOTIFICATION.CARRIER,
                inviteId: data.inviteId,
            };
        }

        if (data.quoteId) {
            notification = {
                ...notification,
                type: WEB_NOTIFICATION.QUOTE,
                quoteId: data.quoteId,
            };
        }

        if (notification && notification.type) {
            this.create(notification);
        }
    }

    public async createNotificationCarriers(orderId: number, account?: AccountEntity, additionalInfo = '') {
        let companyId = account && account.companyId;
        if (!companyId) {
            const order = await this.orderRepository.findOne(orderId);
            companyId = order.companyId;
        }
        const accounts = await this.accountRepository.find({
            companyId,
            roleId: In([ROLES.COMPANY_ADMIN, ROLES.DISPATCHER]),
        });

        accounts.forEach(item => {
            this.create({
                type: WEB_NOTIFICATION.ORDER,
                actions: [],
                title: '',
                content: '',
                orderId,
                targetUserId: item.id,
                additionalInfo,
            });
        });
    }

    public async createNotificationCarrier(data) {
        const accounts = await this.accountRepository.find({
            companyId: data.companyId,
            roleId: ROLES.COMPANY_ADMIN,
        });

        accounts.forEach(item => {
            let notification: any = {
                type: WEB_NOTIFICATION.USER,
                actions: [],
                title: '',
                content: '',
                targetUserId: item.id,
            };
            if (data.accountId) {
                notification = {
                    ...notification,
                    accountId: data.accountId,
                };
            }
            if (data.inviteId) {
                notification = {
                    ...notification,
                    inviteId: data.inviteId,
                };
            }
            if (notification && notification.type) {
                this.create(notification);
            }
        });
    }

    private async sendPushNotification(notification: NotificationRequestDTO) {
        const { type, title, content, targetUserId } = notification;
        if (CLIENT_PUSH_NOTIFICATIONS.includes(type)) {
            const deviceId = await this.deviceEntity.findOne({ accountId: targetUserId });
            const notify = this.createPushNotification(deviceId.deviceId, title, content);
            await this.client.createNotification(notify);
        }
        if (DRIVER_PUSH_NOTIFICATIONS.includes(type)) {
            const deviceId = await this.deviceEntity.findOne({ accountId: targetUserId });
            const notify = this.createPushNotification(deviceId.deviceId, title, content);
            await this.driver.createNotification(notify);
        }
    }

    private createPushNotification(deviceId: string, title: string, message: string) {
        return new NotificationByDeviceBuilder()
            .setIncludePlayerIds([deviceId])
            .notification()
            .setHeadings({ en: title })
            .setContents({ en: message })
            .build();
    }
}
