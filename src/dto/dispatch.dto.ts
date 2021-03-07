import { ApiModelProperty, ApiModelPropertyOptional } from '@nestjs/swagger';
import { IsDate, IsNumberString, IsString } from 'class-validator';

import { AccountDTO } from './account.dto';
import { CompanyDTO } from './company.dto';
import { OrderDTO } from './order.dto';

export class DispatchDTO {

    @ApiModelProperty()
    @IsNumberString()
    id: number;

    @ApiModelPropertyOptional()
    company: CompanyDTO;

    @ApiModelProperty()
    account: AccountDTO;

    @ApiModelProperty()
    order: OrderDTO;

    @ApiModelProperty()
    @IsString()
    status: string;

    @ApiModelProperty()
    @IsDate()
    pickDate: Date;

    @ApiModelProperty()
    @IsDate()
    deliveryDate: Date;

    @ApiModelProperty()
    @IsDate()
    createdAt: Date;

    @ApiModelProperty()
    @IsDate()
    updatedAt: Date;
}
