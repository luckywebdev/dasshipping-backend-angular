import { ApiModelProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString } from 'class-validator';

import { ShipperDTO } from '../../../../dto/shipper.dto';
import { PatchOrderRequestDTO } from '../patch/patchRequest.dto';


export class EditOrderRequestDTO extends PatchOrderRequestDTO {
    @ApiModelProperty({ required: false })
    @IsString()
    @IsOptional()
    paymentNote?: string;

    @ApiModelProperty({ required: false })
    @IsString()
    @IsOptional()
    paymentMethods?: string;

    @ApiModelProperty({ required: false })
    @IsNumber()
    @IsOptional()
    salePrice?: number;

    @ApiModelProperty({ required: false })
    @IsNumber()
    @IsOptional()
    brokerFee?: number;

    @ApiModelProperty({ required: false })
    @Type(() => ShipperDTO)
    @IsOptional()
    shipper?: ShipperDTO;

    @ApiModelProperty({ required: false })
    @IsNumber()
    @IsOptional()
    shipperId?: number;

    @ApiModelProperty({ required: false })
    @IsString()
    @IsOptional()
    externalId?: string;
}
