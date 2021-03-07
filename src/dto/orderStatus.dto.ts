import { ApiModelProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class OrderStatusDTO {
    @ApiModelProperty()
    @IsNumber()
    id: number;

    @ApiModelProperty()
    @IsString()
    name: string;
}
