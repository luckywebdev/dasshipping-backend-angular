import { ApiModelProperty } from '@nestjs/swagger';
import { IsString, IsNumber } from 'class-validator';

export class LocationTripDTO {
    @ApiModelProperty()
    @IsString()
    origin: string;

    @ApiModelProperty()
    @IsString()
    point: string;

    @ApiModelProperty()
    @IsNumber()
    key: number;
}
