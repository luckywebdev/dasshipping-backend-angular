import { ApiModelProperty } from '@nestjs/swagger';
import { IsIn, IsNumber, IsString, Length } from 'class-validator';
import { Transform } from 'class-transformer';
import { ROLES } from '../../../../constants/roles.constant';

export class RegisterRedirect {
  @ApiModelProperty()
  @IsString()
  @Length(1, 255)
  hash: string;

  @ApiModelProperty()
  @IsNumber()
  @Transform(value => parseInt(value, 10))
  @IsIn([ROLES.DRIVER, ROLES.CLIENT])
  role: ROLES.DRIVER;
}
