import { ApiModelProperty } from '@nestjs/swagger';
import { IsDate, IsNumber, IsString } from 'class-validator';

import { OrderDTO } from '../dto/order.dto';
import { AccountDTO } from './account.dto';

export class OrderTimelineDTO {
    @ApiModelProperty()
    @IsNumber()
    id: number;

    @ApiModelProperty()
    @IsString()
    description: string;

    @ApiModelProperty()
    @IsDate()
    createdAt: Date;

    @ApiModelProperty()
    @IsNumber()
    orderId: number;

    @ApiModelProperty()
    order: OrderDTO;

    @ApiModelProperty()
    @IsNumber()
    actionAccountId: number;

    @ApiModelProperty()
    actionAccount: AccountDTO;
}
