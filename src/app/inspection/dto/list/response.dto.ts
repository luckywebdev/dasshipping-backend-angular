import { ApiModelProperty } from '@nestjs/swagger';
import { IsArray, IsNumber } from 'class-validator';
import {InspectionDTO} from '../../../../dto/inspection.dto';

export class GetInspectionListResponse {
    @ApiModelProperty()
    @IsNumber()
    count: number;

    @ApiModelProperty({ isArray: true, type: InspectionDTO })
    @IsArray()
    data: InspectionDTO[];
}
