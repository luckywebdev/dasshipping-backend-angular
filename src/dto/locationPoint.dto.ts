import {ApiModelProperty} from '@nestjs/swagger';
import {IsNumber, IsOptional} from 'class-validator';

export class LocationPointDTO {

    @ApiModelProperty()
    @IsOptional()
    @IsNumber()
    lat: number;

    @ApiModelProperty()
    @IsOptional()
    @IsNumber()
    lon: number;
}
