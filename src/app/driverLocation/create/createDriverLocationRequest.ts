import { ApiModelProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class CreateDriverLocationRequestDTO {

    @ApiModelProperty()
    @IsNumber()
    lat: number;

    @ApiModelProperty()
    @IsNumber()
    lon: number;
}
