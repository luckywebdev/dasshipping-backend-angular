import { ApiModelProperty } from '@nestjs/swagger';
import { IsDate, IsNumber, IsOptional, IsString } from 'class-validator';

import { AccountEntity } from '../entities/account.entity';
import { DetailsWalletDTO } from './detailsWallet.dto';

export class WalletDTO {
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
    @IsString()
    type: string;

    @ApiModelProperty()
    @IsString()
    status: string;

    @ApiModelProperty()
    @IsString()
    @IsOptional()
    customerId?: string;

    @ApiModelProperty()
    @IsString()
    @IsOptional()
    token?: string;

    @ApiModelProperty()
    details: DetailsWalletDTO;

    @ApiModelProperty()
    @IsDate()
    @IsOptional()
    createdAt?: Date;
}
