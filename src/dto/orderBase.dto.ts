import { ApiModelProperty, ApiModelPropertyOptional } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayMinSize, IsDate, IsNumber, IsOptional, IsString } from 'class-validator';

import { AccountDTO } from './account.dto';
import { CarDTO } from './car.dto';
import { LocationDTO } from './location.dto';
import { NotificationDTO } from './notification.dto';

export class OrderBaseDTO {
  @ApiModelProperty({ required: true })
  @IsNumber()
  id?: number;

  @ApiModelProperty({ required: false })
  @IsString()
  @IsOptional()
  trailerType: string;

  @ApiModelProperty({ type: LocationDTO })
  pickLocation: LocationDTO;

  @ApiModelProperty({ type: LocationDTO })
  deliveryLocation: LocationDTO;

  @ApiModelProperty()
  @IsDate()
  createdAt?: Date;

  @ApiModelProperty()
  @IsDate()
  updatedAt?: Date;

  @ApiModelProperty()
  @IsDate()
  createdBy?: AccountDTO;

  @ApiModelProperty()
  @IsNumber()
  createdById?: number;

  @ApiModelProperty({ required: false })
  @IsNumber()
  @IsOptional()
  discount?: number;

  @ApiModelProperty()
  @IsString()
  status: string;

  @ApiModelProperty()
  @IsNumber()
  initialPrice?: number;

  @ApiModelProperty()
  @IsNumber()
  priceWithDiscount?: number;

  @ApiModelProperty({ type: CarDTO, isArray: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  cars: CarDTO[];

  @ApiModelProperty()
  @IsNumber()
  distance?: number;

  @ApiModelProperty()
  @IsNumber()
  salePrice?: number;

  @ApiModelProperty()
  @IsNumber()
  loadPrice?: number;

  @ApiModelProperty()
  @IsString()
  uuid?: string;

  @ApiModelPropertyOptional()
  notifications?: NotificationDTO[];
}
