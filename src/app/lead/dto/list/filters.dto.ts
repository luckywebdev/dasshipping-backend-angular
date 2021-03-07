import { ApiModelProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

import { LocationPointDTO } from '../../../../dto/locationPoint.dto';
import { GetLeadsRequest } from './request.dto';

export class FiltersLeadsRequest extends GetLeadsRequest {
  @ApiModelProperty({ required: false })
  @IsOptional()
  originPoint?: { point: LocationPointDTO; radius: number; unit: string };

  @ApiModelProperty({ required: false })
  @IsOptional()
  destinationPoint?: { point: LocationPointDTO; radius: number; unit: string };
}
