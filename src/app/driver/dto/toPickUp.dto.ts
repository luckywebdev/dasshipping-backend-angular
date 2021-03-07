import { ApiModelProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class DriverToPickUpRequestDTO {

    @ApiModelProperty()
    @IsNumber()
    tripId: number;

    @ApiModelProperty()
    @IsNumber()
    orderId: number;
}
