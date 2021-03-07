import { ApiModelProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsString, ValidateNested } from 'class-validator';

import { LocationTripDTO } from './locationTrip.dto';

export class DistanceResponseDTO {
    @ApiModelProperty()
    @IsNumber()
    distance: number;

    @ApiModelProperty()
    @IsNumber()
    price: number;

    @ApiModelProperty()
    @IsString()
    costPerMile: string;

    @ApiModelProperty({ isArray: true, type: LocationTripDTO })
    @ValidateNested({ each: true })
    @Type(() => LocationTripDTO)
    locations: LocationTripDTO[];
}
