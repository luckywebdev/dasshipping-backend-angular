import { EventEmitter } from 'events';
import { StrictEventEmitter } from 'nest-emitter';

import { NotificationRequestDTO } from '../notification/dto/create/notificationRequest.dto';
import { TimelineRequestDTO } from '../orderTimeline/dto/create/request.dto';

interface AppEvents {
    notification: NotificationRequestDTO;
    order_timeline: TimelineRequestDTO;
    order_delivered: { orderId: number, tripId?: number };
    notification_admin: { orderId?: number, companyId?: number, inviteId?: number };
    notification_carrier: { orderId: number };
    notification_account: { companyId: number, accountId?: number, inviteId?: number };
    order_charge: number;
}

export type AppEventEmitter = StrictEventEmitter<EventEmitter, AppEvents>;
