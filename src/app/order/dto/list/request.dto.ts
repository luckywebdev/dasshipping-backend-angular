import { ApiModelProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {IsBoolean, IsIn, IsNumber, IsOptional, IsString} from 'class-validator';

import { TRAILER_TYPE } from '../../../../entities/orderBase.entity';
import { stringToBoolean } from '../../../../transformers/stringToBoolean.transformer';
import { GetList } from '../../../dto/requestList.dto';

export class GetOrdersRequest extends GetList {
    @ApiModelProperty({ required: false })
    @Transform(stringToBoolean)
    @IsBoolean()
    @IsOptional()
    isVirtual?: boolean;

    @ApiModelProperty({ required: false })
    @IsString()
    @IsOptional()
    status?: string;

    @ApiModelProperty({ required: false })
    @IsString()
    @IsOptional()
    make?: string;

    @ApiModelProperty({ required: false })
    @IsString()
    @IsOptional()
    carType?: string;

    @ApiModelProperty({ required: false })
    @IsString()
    @IsOptional()
    model?: string;

    @ApiModelProperty({ required: false })
    @IsNumber()
    @IsOptional()
    companyId?: number;

    @ApiModelProperty({ required: false })
    @IsNumber()
    @IsOptional()
    createdById?: number;

    @ApiModelProperty({ required: false })
    @IsString()
    @IsOptional()
    origin?: string;

    @ApiModelProperty({ required: false })
    @IsString()
    @IsOptional()
    destination?: string;

    @ApiModelProperty({ required: false })
    @IsString()
    @IsOptional()
    vehicleType?: string;

    @ApiModelProperty({ required: false })
    @IsString()
    @IsOptional()
    minimumNumberOfVehiclesPerLoad?: string;

    @ApiModelProperty({ required: false })
    @IsString()
    @IsIn([TRAILER_TYPE.ENCLOSED, TRAILER_TYPE.OPEN])
    @IsOptional()
    trailerType?: string;

    @ApiModelProperty({ required: false })
    @IsBoolean()
    @Transform(value => !!JSON.parse(value))
    @IsOptional()
    condition?: string;

    @ApiModelProperty({ required: false })
    @IsString()
    @IsOptional()
    makeOrModel?: string;

    @ApiModelProperty({ required: false })
    @IsBoolean()
    @Transform(stringToBoolean)
    @IsOptional()
    grouped?: boolean;

    @ApiModelProperty({ required: false })
    @IsString()
    @IsOptional()
    shipperCompanyName?: string;
}
