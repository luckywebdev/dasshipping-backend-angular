import {ApiModelProperty, ApiModelPropertyOptional} from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {IsBoolean, IsNumber, IsOptional, IsString, Length} from 'class-validator';

import { GetList } from '../../../dto/requestList.dto';
import {stringToBoolean} from '../../../../transformers/stringToBoolean.transformer';

export class SearchOrdersRequestDTO extends GetList {
    @ApiModelPropertyOptional()
    @IsString()
    @Length(1, 255)
    @IsOptional()
    searchText?: string;

    @ApiModelPropertyOptional()
    @IsNumber()
    @IsOptional()
    @Transform(value => parseInt(value, 10))
    dispatcherId?: number;

    @ApiModelPropertyOptional()
    @IsNumber()
    @IsOptional()
    @Transform(value => parseInt(value, 10))
    driverId?: number;

    @ApiModelPropertyOptional()
    @IsString()
    @IsOptional()
    status?: string;

    @ApiModelPropertyOptional()
    @IsString()
    @IsOptional()
    shipperCompanyName?: string;

    @ApiModelProperty({ required: false })
    @IsBoolean()
    @Transform(stringToBoolean)
    @IsOptional()
    grouped?: boolean;
}
