import { ApiModelProperty } from '@nestjs/swagger';
import {IsNumber, IsOptional, IsString} from 'class-validator';
import {DamageDTO} from '../../../../dto/damage.dto';

export class CreateInspectionDetailsDTO {
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
    @IsNumber()
    @IsOptional()
    inspectionId: number;

    @ApiModelProperty()
    @IsOptional()
    damages: DamageDTO[];
}
