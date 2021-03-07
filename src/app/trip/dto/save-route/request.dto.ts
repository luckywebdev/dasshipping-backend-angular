import { ApiModelProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';

import { LocationTripDTO } from '../../../here/dto/calculateTrip/locationTrip.dto';

export class CalculateRouteTripRequestDTO {
  @ApiModelProperty({ isArray: true, type: LocationTripDTO })
  @ValidateNested({ each: true })
  @Type(() => LocationTripDTO)
  locations: LocationTripDTO[];
}
