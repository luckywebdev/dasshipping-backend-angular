import {ApiModelProperty} from '@nestjs/swagger';
import {IsArray, IsNumber, } from 'class-validator';

export abstract class ResponseListDTO {

    @ApiModelProperty()
    @IsNumber()
    count: number;

    @ApiModelProperty({ isArray: true})
    @IsArray()
    data: any[];
}
