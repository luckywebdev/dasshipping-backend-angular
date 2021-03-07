import { ApiModelProperty } from '@nestjs/swagger';
import { IsDateString } from 'class-validator';

export class DispatchUpdateDTO {

    @ApiModelProperty()
    @IsDateString()
    pickDate: Date;

    @ApiModelProperty()
    @IsDateString()
    deliveryDate: Date;
}
