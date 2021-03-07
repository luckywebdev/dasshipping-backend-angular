import { ApiModelProperty, ApiModelPropertyOptional } from '@nestjs/swagger';
import { IsNumberString} from 'class-validator';
import {TripEntity} from '../entities/trip.entity';
import {OrderEntity} from '../entities/order.entity';

export class OrderToTripDTO {

    @ApiModelProperty()
    @IsNumberString()
    id: number;

    @ApiModelPropertyOptional()
    tripId: number;

    @ApiModelPropertyOptional()
    orderId: number;

    @ApiModelProperty()
    trip: TripEntity;

    @ApiModelProperty()
    order: OrderEntity;
}
