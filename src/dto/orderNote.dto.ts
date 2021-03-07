import { ApiModelProperty } from '@nestjs/swagger';
import { IsDate, IsNumber, IsString } from 'class-validator';

import { AccountDTO } from './account.dto';
import { OrderDTO } from './order.dto';

export class OrderNoteDTO {
    @ApiModelProperty()
    @IsNumber()
    id: number;

    @ApiModelProperty()
    @IsNumber()
    orderId: number;

    @ApiModelProperty()
    order: OrderDTO;

    @ApiModelProperty()
    @IsNumber()
    accountId: number;

    @ApiModelProperty()
    account: AccountDTO;

    @ApiModelProperty()
    @IsDate()
    createdAt: Date;

    @ApiModelProperty()
    @IsString()
    note: string;

    @ApiModelProperty()
    @IsString()
    eventKey: string;
}
