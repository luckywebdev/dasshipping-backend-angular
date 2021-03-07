import { ApiModelProperty } from '@nestjs/swagger';
import { IsDate, IsNumber, IsString } from 'class-validator';

import { AccountEntity } from '../entities/account.entity';
import { CompanyEntity } from '../entities/company.entity';
import { OrderEntity } from '../entities/order.entity';
import {OrderToTripDTO} from './tripToOrder.dto';

export class TripDTO {
    @ApiModelProperty()
    @IsNumber()
    id: number;

    @ApiModelProperty()
    createdBy: AccountEntity;

    @ApiModelProperty()
    @IsNumber()
    createdById: number;

    @ApiModelProperty()
    company: CompanyEntity;

    @ApiModelProperty()
    @IsNumber()
    companyId: number;

    @ApiModelProperty()
    dispatcher: AccountEntity;

    @ApiModelProperty()
    @IsNumber()
    dispatcherId: number;

    @ApiModelProperty()
    driver: AccountEntity;

    @ApiModelProperty()
    @IsNumber()
    driverId: number;

    @ApiModelProperty()
    orderTrips: OrderToTripDTO[];

    @ApiModelProperty()
    @IsString()
    name: string;

    @ApiModelProperty()
    @IsString()
    status: string;

    @ApiModelProperty()
    @IsDate()
    createdAt: Date;

    @ApiModelProperty()
    @IsDate()
    updatedAt: Date;
}
