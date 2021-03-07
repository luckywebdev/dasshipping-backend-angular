import { ApiModelProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, ValidateNested } from 'class-validator';

import { CalculateTripDTO } from './calculateTrip.dto';

export class CalculateTripRequestDTO {
    @ApiModelProperty({ isArray: true, type: CalculateTripDTO })
    @ValidateNested({ each: true })
    @Type(() => CalculateTripDTO)
    locations: CalculateTripDTO[];

    @ApiModelProperty()
    @IsBoolean()
    optimize: boolean;
}
