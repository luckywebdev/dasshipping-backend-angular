import { ApiModelProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class TimelineRequestDTO {
    @ApiModelProperty()
    @IsNumber()
    orderId: number;

    @ApiModelProperty()
    @IsNumber()
    actionAccountId: number;

    @ApiModelProperty()
    @IsString()
    description: string;
}
