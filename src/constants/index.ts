import { CLIENT_NOTIFICATION_TYPES, DRIVER_NOTIFICATION_TYPES } from '../dto/notification.dto';

export const SELECT_ACCOUNT = [
    'account.id',
    'account.email',
    'account.firstName',
    'account.lastName',
    'account.roleId',
    'account.address',
    'account.city',
    'account.state',
    'account.zip',
    'account.dlNumber',
    'account.companyId',
    'account.avatarUrl',
    'account.blocked',
    'account.birthday',
    'account.approved',
    'account.phoneNumber',
    'account.genderId',
    'account.dispatcherId',
];

export const CLIENT_PUSH_NOTIFICATIONS = [
    CLIENT_NOTIFICATION_TYPES.ORDER_BOOKED.toString(),
    CLIENT_NOTIFICATION_TYPES.ON_PICK_UP.toString(),
    CLIENT_NOTIFICATION_TYPES.ON_DELIVERY.toString(),
    CLIENT_NOTIFICATION_TYPES.ORDER_PAYMENT_FAILED.toString(),
    CLIENT_NOTIFICATION_TYPES.ORDER_SIGNATURE_REQUESTED.toString(),
    CLIENT_NOTIFICATION_TYPES.ARRIVED_AT_YOUR_PICK_UP.toString(),
    CLIENT_NOTIFICATION_TYPES.ARRIVED_AT_YOUR_DELIVERY.toString(),
    CLIENT_NOTIFICATION_TYPES.ORDER_PICKED_UP.toString(),
    CLIENT_NOTIFICATION_TYPES.QUOTE_DISCOUNT.toString(),
];

export const DRIVER_PUSH_NOTIFICATIONS = [
    DRIVER_NOTIFICATION_TYPES.JOIN_REQUEST_ACCEPTED.toString(),
    DRIVER_NOTIFICATION_TYPES.ORDER_SIGNED.toString(),
    DRIVER_NOTIFICATION_TYPES.CLIENT_CANCEL_ORDER.toString(),
    DRIVER_NOTIFICATION_TYPES.TRIP_TO_UPCOMING.toString(),
    DRIVER_NOTIFICATION_TYPES.TRIP_TO_ACTIVE.toString(),
    DRIVER_NOTIFICATION_TYPES.ORDER_REMOVED.toString(),
    DRIVER_NOTIFICATION_TYPES.TRIP_UNASSIGNED.toString(),
    DRIVER_NOTIFICATION_TYPES.TRIP_ASSIGNED.toString(),
];
