import { ApiModelProperty } from '@nestjs/swagger';
import { IsBoolean, IsString } from 'class-validator';

export class CreateCarDTO {
  @ApiModelProperty({ required: true })
  @IsString()
  make: string;

  @ApiModelProperty({ required: true })
  @IsString()
  type: string;

  @ApiModelProperty({ required: true })
  @IsString()
  model: string;

  @ApiModelProperty({ required: true })
  @IsString()
  year: string;

  @ApiModelProperty({ required: true })
  @IsBoolean()
  inop: boolean;
}
