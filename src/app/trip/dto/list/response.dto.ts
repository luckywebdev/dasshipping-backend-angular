import { ApiModelProperty } from '@nestjs/swagger';
import { IsArray, IsNumber } from 'class-validator';

import { TripDTO } from '../../../../dto/trip.dto';
import {ResponseListDTO} from '../../../dto/responseList.dto';

export class GetTripsListResponse extends ResponseListDTO {

    @ApiModelProperty({ isArray: true, type: TripDTO })
    @IsArray()
    data: TripDTO[];
}
