import { ApiModelProperty } from '@nestjs/swagger';
import {IsNumber, IsOptional, IsString} from 'class-validator';

import { GetList } from '../../../dto/requestList.dto';
import {Transform} from 'class-transformer';

export class GetTripsRequest extends GetList {
    @ApiModelProperty({ required: false })
    @IsNumber()
    @Transform(value => parseInt(value, 10))
    @IsOptional()
    id?: number;

    @ApiModelProperty({ required: false })
    @IsNumber()
    @Transform(value => parseInt(value, 10))
    @IsOptional()
    driverId?: number;

    @ApiModelProperty({ required: false })
    @IsNumber()
    @Transform(value => parseInt(value, 10))
    @IsOptional()
    dispatcherId?: number;

    @ApiModelProperty({ required: false })
    @IsString()
    @IsOptional()
    status?: string;
}
