import { ApiModelProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class OrderTimelineTypeDTO {
    @ApiModelProperty()
    @IsNumber()
    id: number;

    @ApiModelProperty()
    @IsString()
    name: string;
}
