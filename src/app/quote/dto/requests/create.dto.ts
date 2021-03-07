import { ApiModelProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsBoolean, IsNotEmpty, ValidateNested } from 'class-validator';

import { CarDTO } from '../../../../dto/car.dto';
import { LocationDTO } from '../../../../dto/location.dto';

export class QuoteCreateRequest {
    @ApiModelProperty({ isArray: true, type: CarDTO })
    @ValidateNested({ each: true })
    @Type(() => CarDTO)
    @IsNotEmpty()
    @ArrayMinSize(1)
    @ArrayMaxSize(5)
    cars: CarDTO[];

    @ApiModelProperty()
    @ValidateNested()
    @Type(() => LocationDTO)
    @IsNotEmpty()
    pickLocation: LocationDTO;

    @ApiModelProperty()
    @ValidateNested()
    @Type(() => LocationDTO)
    @IsNotEmpty()
    deliveryLocation: LocationDTO;

    @ApiModelProperty()
    @IsBoolean()
    enclosed: boolean;
}
