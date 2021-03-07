import { ApiModelProperty } from '@nestjs/swagger';
import { IsArray, IsDate, IsIn, IsNumber, IsOptional, IsString } from 'class-validator';

import { NotificationStatus } from '../entities/notification.entity';
import { AccountDTO } from './account.dto';
import { CompanyDTO } from './company.dto';
import { InviteDTO } from './invite.dto';
import { OrderDTO } from './order.dto';
import { QuoteDTO } from './quote.dto';

export enum DRIVER_NOTIFICATION_TYPES {
  KICK_OFF = 'kick_out_company',
  LINKED_TO_DISPATCHER = 'driver_linked_to_dispatcher',
  JOIN_REQUEST_ACCEPTED = 'join_request_accepted',
  JOIN_REQUEST_DECLINED = 'join_request_declined',
  TRIP_ASSIGNED = 'trip_assigned',
  TRIP_UNASSIGNED = 'trip_unassigned',
  TRIP_TO_ACTIVE = 'trip_moved_to_active',
  TRIP_TO_UPCOMING = 'trip_moved_to_upcoming',
  TRIP_TO_DRAFT = 'trip_moved_to_draft',
  ORDER_REMOVED = 'order_removed',
  ORDER_SIGNED = 'order_signed',
  ORDER_AUTOMATICALLY_SIGNED = 'order_automatically_signed',
  ORDER_INSPECTIONS = 'order_inspections',
  CLIENT_CANCEL_ORDER = 'order_cancel',
}

export enum CLIENT_NOTIFICATION_TYPES {
  ORDER_BOOKED = 'order_booked',
  ON_ROUTE_TO_PICK_UP = 'on_route_to_pick_up',
  ON_PICK_UP = 'on_pick_up',
  ON_DELIVERY = 'on_delivery',
  QUOTE_DISCOUNT = 'quote_discount',
  ARRIVED_AT_YOUR_PICK_UP = 'arrived_at_your_pick_up',
  ARRIVED_AT_YOUR_DELIVERY = 'arrived_at_your_delivery',
  ORDER_SIGNATURE_REQUESTED = 'order_signature_requested',
  ORDER_SIGNED = 'order_signed',
  ORDER_PICKED_UP = 'order_picked_up',
  ORDER_AUTOMATICALLY_SIGNED = 'order_automatically_signed',
  ORDER_PAYMENT_FAILED = 'order_payment_failed',
  ORDER_PAYMENT_SUCCES = 'order_payment_succes',
  ORDER_INSPECTIONS = 'order_inspections',
}
export enum DRIVER_NOTIFICATION_ACTIONS {
  GO_TO_PROFILE = 'go_to_profile',
  GO_TO_CARRIER_CONNECT = 'go_to_carrier_connect',
}
export enum CLIENT_NOTIFICATION_ACTIONS {
  CLOSE_NOTIFICATION = 'close_notification',
  SHOW_MAP_WITH_DRIVER = 'show_map_with_driver',
  SHOW_ORDER_CAR_LIST = 'show_order_car_list',
  SHOW_QOUTE_LIST = 'show_quote_list',
}

export enum WEB_NOTIFICATION {
  ORDER = 'order',
  LEAD = 'lead',
  USER = 'user',
  QUOTE = 'quote',
  TRIP = 'trip',
  CARRIER = 'carrier',
  LOADBORD = 'loadbord',
  LOCATION = 'location',
}

export class NotificationDTO {
  @ApiModelProperty()
  @IsNumber()
  @IsOptional()
  id: number;

  @ApiModelProperty()
  @IsString()
  type: string;

  @ApiModelProperty({ isArray: true })
  @IsArray()
  @IsOptional()
  actions: string[];

  @ApiModelProperty()
  @IsString()
  title: string;

  @ApiModelProperty()
  @IsString()
  content: string;

  @ApiModelProperty()
  @IsString()
  @IsIn([NotificationStatus.ACTIVE, NotificationStatus.EXPIRED])
  status: string;

  @ApiModelProperty()
  @IsNumber()
  targetUserId: number;

  @ApiModelProperty()
  targetUser: AccountDTO;

  @ApiModelProperty()
  @IsDate()
  @IsOptional()
  createdAt: Date;

  @ApiModelProperty()
  @IsDate()
  @IsOptional()
  viewedAt: Date;

  @ApiModelProperty()
  order?: OrderDTO;

  @ApiModelProperty()
  @IsNumber()
  @IsOptional()
  orderId?: number;

  @ApiModelProperty()
  company?: CompanyDTO;

  @ApiModelProperty()
  @IsNumber()
  @IsOptional()
  companyId: number;

  @ApiModelProperty()
  invite?: InviteDTO;

  @ApiModelProperty()
  @IsNumber()
  @IsOptional()
  inviteId: number;

  @ApiModelProperty()
  account?: AccountDTO;

  @ApiModelProperty()
  @IsNumber()
  @IsOptional()
  accountId: number;

  @ApiModelProperty()
  @IsString()
  @IsOptional()
  additionalInfo: string;

  @ApiModelProperty()
  quote?: QuoteDTO;

  @ApiModelProperty()
  @IsNumber()
  @IsOptional()
  quoteId: number;
}
