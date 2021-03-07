import { ApiModelProperty } from '@nestjs/swagger';
import {IsNumber, IsOptional, IsString} from 'class-validator';

import {InspectionDTO} from './inspection.dto';
import {DamageDTO} from './damage.dto';

export class InspectionDetailsDTO {
    @ApiModelProperty({ required: true })
    @IsNumber()
    @IsOptional()
    id: number;

    @ApiModelProperty()
    @IsString()
    face: string;

    @ApiModelProperty()
    @IsString()
    sourceSchemeVersion: string;

    @ApiModelProperty()
    @IsNumber()
    @IsOptional()
    sourceSchemeRatio: number;

    @ApiModelProperty()
    @IsOptional()
    damages: DamageDTO[];

    @ApiModelProperty({ type: InspectionDTO })
    @IsOptional()
    inspection: InspectionDTO;

    @ApiModelProperty()
    @IsNumber()
    @IsOptional()
    inspectionId: number;
}
