import { ApiModelProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class CarEditDTO {
  @ApiModelProperty()
  @IsString()
  @IsOptional()
  make?: string;

  @ApiModelProperty()
  @IsString()
  @IsOptional()
  model?: string;

  @ApiModelProperty()
  @IsString()
  @IsOptional()
  type?: string;

  @ApiModelProperty()
  @IsString()
  @IsOptional()
  year?: string;

  @ApiModelProperty()
  @IsBoolean()
  @IsOptional()
  inop?: boolean;
}
