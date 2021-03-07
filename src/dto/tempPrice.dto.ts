import { ApiModelProperty } from '@nestjs/swagger';
import {IsDateString, IsNumber, IsString} from 'class-validator';

export class TempPriceDTO {
    @ApiModelProperty()
    @IsNumber()
    id: number;

    @ApiModelProperty()
    @IsNumber()
    price: number;

    @ApiModelProperty()
    @IsString()
    hash: string;

    @ApiModelProperty()
    @IsDateString()
    createdAt: Date;
}
