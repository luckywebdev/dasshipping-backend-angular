import { ApiModelProperty } from '@nestjs/swagger';
import { IsArray } from 'class-validator';

import { DriverLocationDTO } from '../../../dto/driverLocation.dto';
import { ResponseListDTO } from '../../dto/responseList.dto';

export class GetLocationsListResponse extends ResponseListDTO {
    @ApiModelProperty({ isArray: true, type: DriverLocationDTO })
    @IsArray()
    data: DriverLocationDTO[];
}
