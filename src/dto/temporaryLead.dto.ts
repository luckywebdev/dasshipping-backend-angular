import { ApiModelProperty } from '@nestjs/swagger';
import { IsString, IsDate, IsNumber, IsOptional } from 'class-validator';
import { LocationDTO } from './location.dto';
import {CreateCarDTO} from '../app/temporaryLead/dto/requests/car.dto';

export class TemporaryLeadDTO {
  @ApiModelProperty({ required: true })
  @IsNumber()
  @IsOptional()
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

  @ApiModelProperty({ required: false })
  @IsNumber()
  @IsOptional()
  discount?: number;

  @ApiModelProperty()
  @IsString()
  status: string;

  @ApiModelProperty()
  @IsNumber()
  @IsOptional()
  initialPrice?: number;

  @ApiModelProperty()
  @IsNumber()
  @IsOptional()
  priceWithDiscount?: number;

  @ApiModelProperty()
  cars: CreateCarDTO[];

  @ApiModelProperty()
  @IsNumber()
  @IsOptional()
  distance?: number;

  @ApiModelProperty()
  @IsNumber()
  @IsOptional()
  salePrice?: number;

  @ApiModelProperty()
  @IsNumber()
  @IsOptional()
  loadPrice?: number;

  @ApiModelProperty()
  customer: { firstName: string, lastName: string, email: string };

  @ApiModelProperty()
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiModelProperty()
  @IsNumber()
  @IsOptional()
  sentCount?: number;

  @ApiModelProperty()
  @IsString()
  ipAddress: string;

  @ApiModelProperty()
  @IsDate()
  expirationDate: Date;

  @ApiModelProperty()
  @IsNumber()
  @IsOptional()
  leadId?: number;
}
