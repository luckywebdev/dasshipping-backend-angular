import { ApiModelProperty } from '@nestjs/swagger';
import { IsDate, IsNumber, IsOptional, IsString, Length } from 'class-validator';

export class ShipperDTO {
  @ApiModelProperty()
  @IsNumber()
  @IsOptional()
  id?: number;

  @ApiModelProperty()
  @IsString()
  @Length(1, 255)
  @IsOptional()
  email?: string;

  @ApiModelProperty()
  @IsString()
  @Length(1, 255)
  @IsOptional()
  billingEmail?: string;

  @ApiModelProperty()
  @IsString()
  @Length(1, 255)
  @IsOptional()
  companyName?: string;

  @ApiModelProperty()
  @IsString()
  @Length(1, 255)
  @IsOptional()
  fullName?: string;

  @ApiModelProperty()
  @IsString()
  @Length(1, 255)
  @IsOptional()
  phone?: string;

  @ApiModelProperty()
  @IsString()
  @Length(1, 255)
  @IsOptional()
  state?: string;

  @ApiModelProperty()
  @IsString()
  @Length(1, 255)
  @IsOptional()
  city?: string;

  @ApiModelProperty()
  @IsString()
  @Length(1, 255)
  @IsOptional()
  zipCode?: string;

  @ApiModelProperty()
  @IsString()
  @Length(1, 255)
  @IsOptional()
  address?: string;

  @ApiModelProperty()
  @IsDate()
  @IsOptional()
  createdAt?: Date;
}
