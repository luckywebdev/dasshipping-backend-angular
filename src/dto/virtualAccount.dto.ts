import { ApiModelProperty } from '@nestjs/swagger';
import {IsDate, IsNumber, IsOptional, IsString, Length} from 'class-validator';

export class VirtualAccountDTO {
  @ApiModelProperty()
  @IsNumber()
  id?: number;

  @ApiModelProperty()
  @IsString()
  @IsOptional()
  email?: string;

  @ApiModelProperty()
  @IsString()
  @Length(1, 255)
  firstName: string;

  @ApiModelProperty()
  @IsString()
  @Length(1, 255)
  lastName: string;

  @ApiModelProperty()
  @IsString()
  @Length(1, 255)
  phoneNumber?: string;

  @ApiModelProperty()
  @IsDate()
  createdAt?: Date;
}
