import { ApiModelProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    ArrayMaxSize,
    ArrayMinSize,
    IsIn,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    Length,
    ValidateNested,
} from 'class-validator';

import { CarDTO } from '../../../../dto/car.dto';
import { LocationDTO } from '../../../../dto/location.dto';
import { TRAILER_TYPE } from '../../../../entities/orderBase.entity';

export class CalculatePriceRequest {
    @ApiModelProperty({ isArray: true, type: CarDTO })
    @ValidateNested({ each: true })
    @Type(() => CarDTO)
    @ArrayMinSize(1)
    @ArrayMaxSize(100)
    @IsOptional()
    cars?: CarDTO[];

    @ApiModelProperty({ type: LocationDTO })
    @Type(() => LocationDTO)
    @IsOptional()
    deliveryLocation: LocationDTO;

    @ApiModelProperty({ type: LocationDTO })
    @Type(() => LocationDTO)
    @IsOptional()
    pickLocation: LocationDTO;

    @ApiModelProperty({ required: true })
    @IsString()
    @Length(1, 255)
    @IsIn([TRAILER_TYPE.ENCLOSED, TRAILER_TYPE.OPEN])
    @IsOptional()
    trailerType: string;

    @ApiModelProperty({ required: true })
    @IsNumber()
    @IsNotEmpty()
    orderId: number;
}
