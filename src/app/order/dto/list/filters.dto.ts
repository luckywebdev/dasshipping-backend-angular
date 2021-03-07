import { ApiModelProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

import { GetOrdersRequest } from './request.dto';
import {LocationPointDTO} from '../../../../dto/locationPoint.dto';

export class FiltersOrdersRequest extends GetOrdersRequest {
    @ApiModelProperty({ required: false })
    @IsString()
    @IsOptional()
    dispatchStatus?: string;

    @ApiModelProperty({ required: false })
    @IsNumber()
    @IsOptional()
    noDispatchForCompany?: number;

    @ApiModelProperty({ required: false })
    @IsNumber()
    @IsOptional()
    dispatchForCompany?: number;

    @ApiModelProperty({ required: false })
    @IsBoolean()
    @IsOptional()
    dispatched?: boolean;

    @ApiModelProperty({ required: false })
    @IsNumber()
    @IsOptional()
    dispatcherId?: number;

    @ApiModelProperty({ required: false })
    @IsBoolean()
    @IsOptional()
    published?: boolean;

    @ApiModelProperty({ required: false })
    @IsOptional()
    originPoint?: {point: LocationPointDTO, radius: number, unit: string};

    @ApiModelProperty({ required: false })
    @IsOptional()
    destinationPoint?: {point: LocationPointDTO, radius: number, unit: string};

    @ApiModelProperty({ required: false })
    @IsString()
    @IsOptional()
    shipperCompanyName?: string;
}
