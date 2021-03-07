import { ApiModelProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

import { PolicyDTO } from './policy.dto';

export class CarDTO {
  @ApiModelProperty({ required: false })
  @IsNumber()
  @IsOptional()
  id?: number;

  @ApiModelProperty({ required: false })
  @IsNumber()
  @IsOptional()
  orderId?: number;

  @ApiModelProperty({ required: false })
  @IsNumber()
  @IsOptional()
  quoteId?: number;

  @ApiModelProperty({ required: false })
  @IsNumber()
  @IsOptional()
  pricePerMile?: number;

  @ApiModelProperty({ required: false })
  @IsString()
  @IsOptional()
  height?: string;

  @ApiModelProperty({ required: false })
  @IsString()
  @IsOptional()
  length?: string;

  @ApiModelProperty()
  @IsString()
  make: string;

  @ApiModelProperty()
  @IsString()
  model: string;

  @ApiModelProperty()
  @IsString()
  type?: string | PolicyDTO;

  @ApiModelProperty({ required: false })
  @IsString()
  @IsOptional()
  weight?: string;

  @ApiModelProperty()
  @IsString()
  year: string;

  @ApiModelProperty()
  @IsString()
  @IsOptional()
  vin?: string;

  @ApiModelProperty({ required: false })
  @IsString()
  @IsOptional()
  urlVin?: string;

  @ApiModelProperty()
  @IsBoolean()
  inop?: boolean;

  @ApiModelProperty({ required: false })
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiModelProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  lifted?: boolean;

  @ApiModelProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  headRack?: boolean;

  @ApiModelProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  handicap?: boolean;

  @ApiModelProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  utilityBed?: boolean;
}
