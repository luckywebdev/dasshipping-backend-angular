import {ApiModelProperty} from '@nestjs/swagger';
import {IsDate, IsNumber, IsOptional} from 'class-validator';
import {AccountDTO} from './account.dto';

export class DriverLocationDTO {

    @ApiModelProperty()
    @IsOptional()
    @IsNumber()
    id: number;

    @ApiModelProperty()
    @IsDate()
    @IsOptional()
    createdAt: Date;

    @ApiModelProperty()
    @IsNumber()
    lat: number;

    @ApiModelProperty()
    @IsNumber()
    lon: number;

    @ApiModelProperty()
    driver: AccountDTO;

    @ApiModelProperty()
    @IsNumber()
    driverId: number;
}
