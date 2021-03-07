import { ApiModelProperty } from '@nestjs/swagger';
import { IsDate, IsNumber, IsOptional, IsString } from 'class-validator';

export class LocationDTO {
  @ApiModelProperty()
  @IsOptional()
  @IsNumber()
  id?: number;

  @ApiModelProperty()
  @IsString()
  zipCode: string;

  @ApiModelProperty({ required: false })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiModelProperty()
  @IsString()
  state: string;

  @ApiModelProperty()
  @IsString()
  city: string;

  @ApiModelProperty({ required: false })
  @IsString()
  @IsOptional()
  addressType?: string;

  @ApiModelProperty({ required: false })
  @IsString()
  @IsOptional()
  instructions?: string;

  @ApiModelProperty({ required: false })
  @IsOptional()
  point?: any; // any to be changed into a type.

  @ApiModelProperty({ required: false })
  @IsDate()
  @IsOptional()
  createdAt?: Date;

  @ApiModelProperty()
  @IsNumber()
  lat?: number;

  @ApiModelProperty()
  @IsNumber()
  lon?: number;

  @ApiModelProperty({ required: false })
  @IsDate()
  @IsOptional()
  updatedAt?: Date;
}
