import { ApiModelProperty } from '@nestjs/swagger';
import {IsArray, IsDate, IsNumber, IsString} from 'class-validator';
import {ResponseListDTO} from '../../../dto/responseList.dto';
import {DispatchDTO} from '../../../../dto/dispatch.dto';

export class DispatchListResponseDTO extends ResponseListDTO {

    @ApiModelProperty({ isArray: true, type: DispatchDTO})
    @IsArray()
    data: DispatchDTO[];
}
