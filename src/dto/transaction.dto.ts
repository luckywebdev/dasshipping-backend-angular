import { ApiModelProperty } from '@nestjs/swagger';
import { IsDate, IsNumber, IsOptional, IsString } from 'class-validator';

import { AccountEntity } from '../entities/account.entity';
import { OrderEntity } from '../entities/order.entity';
import { CompanyEntity } from '../entities/company.entity';

export class TransactionDTO {
    @ApiModelProperty()
    @IsNumber()
    @IsOptional()
    id?: number;

    @ApiModelProperty()
    @IsOptional()
    client?: AccountEntity;

    @ApiModelProperty()
    @IsNumber()
    @IsOptional()
    clientId?: number;

    @ApiModelProperty()
    @IsOptional()
    order?: OrderEntity;

    @ApiModelProperty()
    @IsNumber()
    @IsOptional()
    orderId?: number;

    @ApiModelProperty()
    @IsOptional()
    company?: CompanyEntity;

    @ApiModelProperty()
    @IsNumber()
    @IsOptional()
    companyId?: number;

    @ApiModelProperty()
    @IsString()
    provider: string;

    @ApiModelProperty()
    @IsString()
    status: string;

    @ApiModelProperty()
    @IsString()
    externalId: string;

    @ApiModelProperty()
    @IsString()
    amount: string;

    @ApiModelProperty()
    @IsString()
    paymentMethod: string;

    @ApiModelProperty()
    @IsDate()
    @IsOptional()
    createdAt?: Date;

    @ApiModelProperty()
    @IsString()
    @IsOptional()
    secret?: string;

    @ApiModelProperty()
    @IsString()
    @IsOptional()
    uuid?: string;
}
