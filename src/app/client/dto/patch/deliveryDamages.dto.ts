import { ApiModelProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsString, ValidateNested } from 'class-validator';

import { InspectionImagesDTO } from '../../../../dto/inspectionImages.dto';
import { CreateInspectionDetailsDTO } from '../../../inspection/dto/create/createInspectionDetails.dto';

export class DeliveryDamagesRequest {
  @ApiModelProperty({ isArray: true, type: CreateInspectionDetailsDTO })
  @ValidateNested({ each: true })
  @Type(() => CreateInspectionDetailsDTO)
  @IsOptional()
  details?: CreateInspectionDetailsDTO[];

  @ApiModelProperty({ isArray: true, type: InspectionImagesDTO })
  @ValidateNested({ each: true })
  @Type(() => InspectionImagesDTO)
  @IsOptional()
  images?: InspectionImagesDTO[];

  @ApiModelProperty()
  @IsString()
  @IsOptional()
  notes: string;
}
