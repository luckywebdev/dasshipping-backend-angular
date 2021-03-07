import { ApiModelProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNumber, IsOptional, IsString } from 'class-validator';

import { stringToNumber } from '../../../../transformers/stringToNumber.transformer';

const GEOCODE_DEFAULT_RESULTS_NUMBER = 5;

export class GeocodeRequest {
    @ApiModelProperty({ description: 'Number of results to be returned', default: GEOCODE_DEFAULT_RESULTS_NUMBER })
    @Transform(stringToNumber)
    @IsNumber()
    @Transform(value => value ? value : GEOCODE_DEFAULT_RESULTS_NUMBER)
    @IsOptional()
    maxresults: number;

    @ApiModelProperty()
    @IsString()
    searchtext: string;
}
