import { ApiModelProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsNotEmpty, IsNumber, IsOptional, IsString, Length, ValidateNested } from 'class-validator';

import { IsValidId } from '../../../../validators/id.validator';

export class TripCreateRequest {
  @ApiModelProperty()
  @IsString()
  @Length(1, 255)
  @IsOptional()
  name?: string;

  @ApiModelProperty({ isArray: true })
  @ValidateNested({ each: true })
  @IsNotEmpty()
  @ArrayMinSize(1)
  orderIds: number[];

  @ApiModelProperty({ required: false })
  @IsNumber()
  @IsOptional()
  @IsValidId('account', { message: 'Invalid Driver' })
  driverId: number;

  @ApiModelProperty({ required: false })
  @IsNumber()
  @IsValidId('account', { message: 'Invalid Dispatcher' })
  @IsOptional()
  dispatcherId: number;

  @ApiModelProperty({ required: false })
  @IsNumber()
  @IsOptional()
  tripId: number;

  companyId: number;
  createdById: number;
}
