import { ApiModelProperty } from '@nestjs/swagger';
import { IsDateString, IsNumber } from 'class-validator';

export class DispatchRequestDTO {

    @ApiModelProperty()
    @IsNumber()
    orderId: number;

    @ApiModelProperty()
    @IsDateString()
    pickDate: Date;

    @ApiModelProperty()
    @IsDateString()
    deliveryDate: Date;
}
