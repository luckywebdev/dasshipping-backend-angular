import { ApiModelPropertyOptional } from '@nestjs/swagger';
import {IsNumber, IsOptional, IsString, Length} from 'class-validator';
import {GetList} from '../../../dto/requestList.dto';
import {Transform} from 'class-transformer';

export class DispatchListRequest extends GetList {

    @ApiModelPropertyOptional()
    @IsString()
    @Length(1, 255)
    @IsOptional()
    status: string;

    @ApiModelPropertyOptional()
    @IsNumber()
    @Transform(value => parseInt(value, 10))
    @IsOptional()
    orderId: number;
}
